from __future__ import annotations

from dataclasses import asdict
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, get_current_account, get_password_hash, verify_password
from app.db import models
from app.db.session import get_db
from app.schemas import (
    AnalysisResponse,
    AuthTokenResponse,
    AuthUserRead,
    GoogleLoginRequest,
    LoginRequest,
    RegisterRequest,
    RecommendedWorkoutResponse,
    UserCreate,
    UserRead,
    WorkoutCreate,
    WorkoutCreateResponse,
)
from app.services.ai_analysis import AIAnalysisService
from app.services.engine_service import build_engine_for_user, split_goals
from app.services.google_oauth import verify_google_id_token


router = APIRouter()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _account_to_read(account: models.Account) -> AuthUserRead:
    return AuthUserRead(
        id=account.id,
        email=account.email,
        full_name=account.full_name,
        auth_provider=account.auth_provider,
        created_at=account.created_at,
    )


def _token_response_for_account(account: models.Account) -> AuthTokenResponse:
    settings = get_settings()
    token = create_access_token(str(account.id))
    return AuthTokenResponse(
        access_token=token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=_account_to_read(account),
    )


@router.post("/auth/register", response_model=AuthTokenResponse, tags=["auth"])
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    email = _normalize_email(payload.email)
    existing = db.scalar(select(models.Account).where(models.Account.email == email))
    if existing is not None:
        raise HTTPException(status_code=400, detail="Account with this email already exists")

    account = models.Account(
        email=email,
        password_hash=get_password_hash(payload.password),
        full_name=(payload.full_name or "").strip() or None,
        auth_provider="local",
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _token_response_for_account(account)


@router.post("/auth/login", response_model=AuthTokenResponse, tags=["auth"])
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    email = _normalize_email(payload.email)
    account = db.scalar(select(models.Account).where(models.Account.email == email))
    if account is None or not account.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, account.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _token_response_for_account(account)


@router.post("/auth/google", response_model=AuthTokenResponse, tags=["auth"])
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured on backend")

    try:
        claims = verify_google_id_token(payload.id_token, settings.google_client_id)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid Google token") from exc

    google_sub = str(claims.get("sub") or "").strip()
    email = _normalize_email(str(claims.get("email") or ""))
    full_name = str(claims.get("name") or "").strip() or None
    if not google_sub or not email:
        raise HTTPException(status_code=400, detail="Google token does not contain required claims")

    account = db.scalar(select(models.Account).where(models.Account.google_sub == google_sub))
    if account is None:
        account = db.scalar(select(models.Account).where(models.Account.email == email))

    if account is None:
        account = models.Account(
            email=email,
            full_name=full_name,
            google_sub=google_sub,
            auth_provider="google",
        )
        db.add(account)
    else:
        account.google_sub = google_sub
        if not account.full_name and full_name:
            account.full_name = full_name
        if account.auth_provider == "local":
            account.auth_provider = "google"

    db.commit()
    db.refresh(account)
    return _token_response_for_account(account)


@router.get("/auth/me", response_model=AuthUserRead, tags=["auth"])
def me(current_account: models.Account = Depends(get_current_account)) -> AuthUserRead:
    return _account_to_read(current_account)


@router.post("/users", response_model=UserRead, tags=["users"])
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    user = models.User(
        age=payload.age,
        sex=payload.sex,
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        training_level=payload.training_level,
        training_style=payload.training_style,
        goals_csv=",".join(payload.goals),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead(
        id=user.id,
        age=user.age,
        sex=user.sex,  # type: ignore[arg-type]
        height_cm=user.height_cm,
        weight_kg=user.weight_kg,
        training_level=user.training_level,  # type: ignore[arg-type]
        training_style=user.training_style,  # type: ignore[arg-type]
        goals=split_goals(user.goals_csv),  # type: ignore[arg-type]
    )


@router.post("/workouts", response_model=WorkoutCreateResponse, tags=["workouts"])
def create_workout(payload: WorkoutCreate, db: Session = Depends(get_db)) -> WorkoutCreateResponse:
    user = db.get(models.User, payload.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    workout = models.Workout(user_id=payload.user_id, performed_at=payload.performed_at)
    db.add(workout)
    db.flush()

    for exercise_payload in payload.exercises:
        rep_target_min = None
        rep_target_max = None
        if exercise_payload.rep_target_range and len(exercise_payload.rep_target_range) == 2:
            rep_target_min = int(exercise_payload.rep_target_range[0])
            rep_target_max = int(exercise_payload.rep_target_range[1])
        exercise = models.Exercise(
            workout_id=workout.id,
            name=exercise_payload.exercise,
            weight=exercise_payload.weight,
            rest_time_sec=exercise_payload.rest_time_sec,
            rep_target_min=rep_target_min,
            rep_target_max=rep_target_max,
        )
        db.add(exercise)
        db.flush()

        for idx, set_payload in enumerate(exercise_payload.sets, start=1):
            db.add(
                models.ExerciseSet(
                    exercise_id=exercise.id,
                    set_index=idx,
                    reps=set_payload.reps,
                    rir=set_payload.rir,
                    heart_rate_after_set=set_payload.heart_rate_after_set,
                    heart_rate_recovery=set_payload.heart_rate_recovery,
                    heart_rate_source=set_payload.heart_rate_source,
                )
            )

    db.commit()
    db.refresh(workout)
    return WorkoutCreateResponse(
        workout_id=workout.id,
        user_id=workout.user_id,
        performed_at=workout.performed_at,
        exercises_count=len(payload.exercises),
    )


@router.get("/recommended-workout", response_model=RecommendedWorkoutResponse, tags=["recommendations"])
def get_recommended_workout(
    user_id: int = Query(..., ge=1),
    db: Session = Depends(get_db),
) -> RecommendedWorkoutResponse:
    engine, user, _ = build_engine_for_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    recommendation = engine.suggest_next_workout()
    return RecommendedWorkoutResponse(
        user_id=user_id,
        focus_muscles=recommendation.focus_muscles,
        exercises=recommendation.exercises,
        notes=recommendation.notes,
        fatigue_snapshot=engine.get_fatigue_snapshot(),
    )


@router.get("/analysis", response_model=AnalysisResponse, tags=["analysis"])
async def get_analysis(
    user_id: int = Query(..., ge=1),
    workout_id: Optional[int] = Query(default=None, ge=1),
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    engine, user, sessions_by_workout_id = build_engine_for_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if not sessions_by_workout_id:
        raise HTTPException(status_code=404, detail="No workouts found for this user")

    sorted_workout_ids = sorted(sessions_by_workout_id.keys())
    effective_workout_id = workout_id or sorted_workout_ids[-1]
    target_session = sessions_by_workout_id.get(effective_workout_id)
    if target_session is None:
        raise HTTPException(status_code=404, detail="Workout not found")

    structured_analysis_obj = engine.analyze_workout(target_session)
    recommendation_obj = engine.suggest_next_workout()
    deload_obj = engine.evaluate_deload()
    imbalance_objects = engine.analyze_imbalance()
    progress_snapshot = engine.build_progress_snapshot()
    body_visualization = engine.body_visualization_payload()

    progression: List[Dict[str, object]] = []
    for exercise in target_session.exercises:
        rep_upper = max(exercise.rep_list()) if not exercise.rep_target_range else exercise.rep_target_range[1]
        progression.append(
            asdict(engine.evaluate_progression(exercise.exercise, rep_upper_bound=rep_upper, increment_kg=2))
        )

    structured_analysis = asdict(structured_analysis_obj)
    recommendation = asdict(recommendation_obj)

    settings = get_settings()
    ai_service = AIAnalysisService(settings)
    textual_analysis = await ai_service.analyze_workout(
        user_context={
            "user_id": user.id,
            "age": user.age,
            "sex": user.sex,
            "training_level": user.training_level,
            "training_style": user.training_style,
            "goals": split_goals(user.goals_csv),
            "workout_id": effective_workout_id,
        },
        structured_analysis=structured_analysis,
        recommendation=recommendation,
        progress_snapshot=progress_snapshot,
    )

    return AnalysisResponse(
        user_id=user_id,
        workout_id=effective_workout_id,
        textual_analysis=textual_analysis,
        structured_analysis=structured_analysis,
        progression=progression,
        deload=asdict(deload_obj),
        imbalances=[asdict(item) for item in imbalance_objects],
        progress_snapshot=progress_snapshot,
        body_visualization=body_visualization,
    )
