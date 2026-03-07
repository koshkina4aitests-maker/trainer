from __future__ import annotations

from dataclasses import asdict
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db import models
from app.db.session import get_db
from app.schemas import (
    AnalysisResponse,
    RecommendedWorkoutResponse,
    UserCreate,
    UserRead,
    WorkoutCreate,
    WorkoutCreateResponse,
)
from app.services.ai_analysis import AIAnalysisService
from app.services.engine_service import build_engine_for_user, split_goals


router = APIRouter()


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
