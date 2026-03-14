from __future__ import annotations

import csv
import io
import json
import re
from dataclasses import asdict
from datetime import UTC, datetime
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
    AdminChangePasswordRequest,
    AdminExerciseCreateRequest,
    AdminImportCsvRequest,
    AdminImportCsvResponse,
    AuthTokenResponse,
    AuthUserRead,
    ExerciseCatalogItem,
    ExerciseCatalogResponse,
    GoogleLoginRequest,
    LoginRequest,
    ProfileResponse,
    ProfileUpdateRequest,
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
_EXERCISE_ID_CLEAN_RE = re.compile(r"[^a-z0-9_]+")


def _normalize_exercise_id(value: str) -> str:
    normalized = value.strip().lower().replace("-", "_").replace(" ", "_")
    normalized = _EXERCISE_ID_CLEAN_RE.sub("_", normalized)
    return re.sub(r"_+", "_", normalized).strip("_")


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _is_admin_account(account: models.Account) -> bool:
    return _normalize_email(account.email) == "admin"


def _require_admin(account: models.Account) -> None:
    if not _is_admin_account(account):
        raise HTTPException(status_code=403, detail="Admin access required")


def _parse_muscles_dict(raw: object) -> Dict[str, float]:
    if not isinstance(raw, dict):
        raise ValueError("Muscles must be an object")
    result: Dict[str, float] = {}
    for key, value in raw.items():
        muscle = str(key or "").strip().lower()
        coeff = float(value)
        if not muscle:
            raise ValueError("Muscle id cannot be empty")
        if coeff <= 0:
            raise ValueError(f"Invalid coefficient for '{muscle}', must be > 0")
        result[muscle] = coeff
    if not result:
        raise ValueError("At least one muscle coefficient is required")
    return result


def _parse_muscles_csv_value(raw: str) -> Dict[str, float]:
    value = (raw or "").strip()
    if not value:
        raise ValueError("Muscles field is required")

    if value.startswith("{"):
        parsed = json.loads(value)
        return _parse_muscles_dict(parsed)

    result: Dict[str, float] = {}
    for chunk in re.split(r"[;,]", value):
        part = chunk.strip()
        if not part:
            continue
        if ":" not in part:
            raise ValueError(f"Invalid muscles pair '{part}', expected muscle:coeff")
        muscle, coeff_raw = part.split(":", 1)
        muscle_id = _normalize_exercise_id(muscle)
        coeff = float(coeff_raw.strip())
        if coeff <= 0:
            raise ValueError(f"Invalid coefficient for '{muscle_id}', must be > 0")
        result[muscle_id] = coeff
    if not result:
        raise ValueError("Muscles field is empty")
    return result


def _custom_exercise_to_read(item: models.CustomExercise) -> ExerciseCatalogItem:
    try:
        muscles = _parse_muscles_dict(json.loads(item.muscle_coefficients_json))
    except Exception:
        muscles = {}
    return ExerciseCatalogItem(
        id=item.exercise_id,
        name=item.name,
        muscles=muscles,
        technique_tip=item.technique_tip,
        source="custom",
    )


def _account_to_read(account: models.Account) -> AuthUserRead:
    return AuthUserRead(
        id=account.id,
        email=account.email,
        full_name=account.full_name,
        auth_provider=account.auth_provider,
        is_admin=_is_admin_account(account),
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


def _get_or_create_profile(db: Session, account: models.Account) -> models.AccountProfile:
    profile = db.scalar(select(models.AccountProfile).where(models.AccountProfile.account_id == account.id))
    if profile is None:
        profile = models.AccountProfile(account_id=account.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def _profile_completion_pct(profile: models.AccountProfile, account: models.Account) -> int:
    fields = [
        bool(account.full_name),
        profile.age is not None,
        bool(profile.training_style),
        profile.workouts_per_week is not None,
        bool(profile.goal),
        profile.height_cm is not None,
        profile.weight_kg is not None,
        profile.target_weight_kg is not None,
        profile.body_fat_pct is not None,
        bool(profile.experience_level),
        profile.preferred_session_duration_min is not None,
        bool(profile.notes),
    ]
    completed = sum(1 for item in fields if item)
    return round(completed / len(fields) * 100)


def _days_since_account_created(created_at: datetime) -> int:
    reference = created_at.replace(tzinfo=UTC) if created_at.tzinfo is None else created_at.astimezone(UTC)
    return max(1, (datetime.now(UTC) - reference).days + 1)


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
    identifier = _normalize_email(payload.email)
    account = db.scalar(select(models.Account).where(models.Account.email == identifier))
    if account is None or not account.password_hash:
        raise HTTPException(status_code=401, detail="Invalid login or password")
    if not verify_password(payload.password, account.password_hash):
        raise HTTPException(status_code=401, detail="Invalid login or password")
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


@router.get("/profile/me", response_model=ProfileResponse, tags=["profile"])
def get_profile_me(
    db: Session = Depends(get_db),
    current_account: models.Account = Depends(get_current_account),
) -> ProfileResponse:
    profile = _get_or_create_profile(db, current_account)
    days_in_app = _days_since_account_created(current_account.created_at)
    return ProfileResponse(
        account_id=current_account.id,
        email=current_account.email,
        full_name=current_account.full_name,
        age=profile.age,
        training_style=profile.training_style,  # type: ignore[arg-type]
        workouts_per_week=profile.workouts_per_week,
        goal=profile.goal,  # type: ignore[arg-type]
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        target_weight_kg=profile.target_weight_kg,
        body_fat_pct=profile.body_fat_pct,
        experience_level=profile.experience_level,  # type: ignore[arg-type]
        preferred_session_duration_min=profile.preferred_session_duration_min,
        notes=profile.notes,
        profile_completion_pct=_profile_completion_pct(profile, current_account),
        days_in_app=days_in_app,
    )


@router.put("/profile/me", response_model=ProfileResponse, tags=["profile"])
def update_profile_me(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_account: models.Account = Depends(get_current_account),
) -> ProfileResponse:
    profile = _get_or_create_profile(db, current_account)
    current_account.full_name = (payload.full_name or "").strip() or None
    profile.age = payload.age
    profile.training_style = payload.training_style
    profile.workouts_per_week = payload.workouts_per_week
    profile.goal = payload.goal
    profile.height_cm = payload.height_cm
    profile.weight_kg = payload.weight_kg
    profile.target_weight_kg = payload.target_weight_kg
    profile.body_fat_pct = payload.body_fat_pct
    profile.experience_level = payload.experience_level
    profile.preferred_session_duration_min = payload.preferred_session_duration_min
    profile.notes = (payload.notes or "").strip() or None
    db.commit()
    db.refresh(current_account)
    db.refresh(profile)
    days_in_app = _days_since_account_created(current_account.created_at)
    return ProfileResponse(
        account_id=current_account.id,
        email=current_account.email,
        full_name=current_account.full_name,
        age=profile.age,
        training_style=profile.training_style,  # type: ignore[arg-type]
        workouts_per_week=profile.workouts_per_week,
        goal=profile.goal,  # type: ignore[arg-type]
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        target_weight_kg=profile.target_weight_kg,
        body_fat_pct=profile.body_fat_pct,
        experience_level=profile.experience_level,  # type: ignore[arg-type]
        preferred_session_duration_min=profile.preferred_session_duration_min,
        notes=profile.notes,
        profile_completion_pct=_profile_completion_pct(profile, current_account),
        days_in_app=days_in_app,
    )


@router.get("/exercise-catalog", response_model=ExerciseCatalogResponse, tags=["exercise-catalog"])
def get_exercise_catalog(db: Session = Depends(get_db)) -> ExerciseCatalogResponse:
    custom_items = db.scalars(select(models.CustomExercise).order_by(models.CustomExercise.created_at.desc())).all()
    return ExerciseCatalogResponse(items=[_custom_exercise_to_read(item) for item in custom_items])


@router.post("/admin/exercises", response_model=ExerciseCatalogItem, tags=["admin"])
def admin_create_exercise(
    payload: AdminExerciseCreateRequest,
    db: Session = Depends(get_db),
    current_account: models.Account = Depends(get_current_account),
) -> ExerciseCatalogItem:
    _require_admin(current_account)
    exercise_id = _normalize_exercise_id(payload.id)
    if not exercise_id:
        raise HTTPException(status_code=400, detail="Exercise id is empty")

    try:
        muscles = _parse_muscles_dict(dict(payload.muscles))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    existing = db.scalar(select(models.CustomExercise).where(models.CustomExercise.exercise_id == exercise_id))
    if existing is None:
        existing = models.CustomExercise(
            exercise_id=exercise_id,
            name=payload.name.strip(),
            muscle_coefficients_json=json.dumps(muscles, ensure_ascii=False),
            technique_tip=(payload.technique_tip or "").strip() or None,
        )
        db.add(existing)
    else:
        existing.name = payload.name.strip()
        existing.muscle_coefficients_json = json.dumps(muscles, ensure_ascii=False)
        existing.technique_tip = (payload.technique_tip or "").strip() or None
    db.commit()
    db.refresh(existing)
    return _custom_exercise_to_read(existing)


@router.post("/admin/exercises/import-csv", response_model=AdminImportCsvResponse, tags=["admin"])
def admin_import_exercises_csv(
    payload: AdminImportCsvRequest,
    db: Session = Depends(get_db),
    current_account: models.Account = Depends(get_current_account),
) -> AdminImportCsvResponse:
    _require_admin(current_account)
    reader = csv.DictReader(io.StringIO(payload.csv_text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV is empty")

    required_cols = {"id", "name", "muscles"}
    missing = [name for name in required_cols if name not in reader.fieldnames]
    if missing:
        raise HTTPException(status_code=400, detail=f"CSV is missing columns: {', '.join(missing)}")

    imported = 0
    skipped = 0
    errors: List[str] = []

    for idx, row in enumerate(reader, start=2):
        try:
            raw_id = str(row.get("id") or "")
            raw_name = str(row.get("name") or "")
            raw_muscles = str(row.get("muscles") or "")
            raw_tip = str(row.get("technique_tip") or "").strip() or None

            exercise_id = _normalize_exercise_id(raw_id)
            if not exercise_id:
                raise ValueError("id is empty")
            if not raw_name.strip():
                raise ValueError("name is empty")
            muscles = _parse_muscles_csv_value(raw_muscles)

            existing = db.scalar(select(models.CustomExercise).where(models.CustomExercise.exercise_id == exercise_id))
            if existing is None:
                existing = models.CustomExercise(
                    exercise_id=exercise_id,
                    name=raw_name.strip(),
                    muscle_coefficients_json=json.dumps(muscles, ensure_ascii=False),
                    technique_tip=raw_tip,
                )
                db.add(existing)
            else:
                existing.name = raw_name.strip()
                existing.muscle_coefficients_json = json.dumps(muscles, ensure_ascii=False)
                existing.technique_tip = raw_tip
            imported += 1
        except Exception as exc:  # noqa: BLE001
            skipped += 1
            errors.append(f"Line {idx}: {exc}")
    db.commit()

    return AdminImportCsvResponse(imported=imported, skipped=skipped, errors=errors[:20])


@router.post("/admin/change-password", tags=["admin"])
def admin_change_password(
    payload: AdminChangePasswordRequest,
    db: Session = Depends(get_db),
    current_account: models.Account = Depends(get_current_account),
) -> Dict[str, str]:
    _require_admin(current_account)
    if not current_account.password_hash or not verify_password(payload.current_password, current_account.password_hash):
        raise HTTPException(status_code=401, detail="Current password is invalid")
    current_account.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {"status": "ok"}


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
