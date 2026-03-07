from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db import models

try:
    from training_engine import (
        ExercisePerformance,
        ExerciseSetSample,
        TrainingAIEngine,
        UserProfile,
        WorkoutSession,
    )
except ModuleNotFoundError:
    # Allows running backend directly from /backend while engine lives at repo root.
    import sys

    project_root = Path(__file__).resolve().parents[3]
    if str(project_root) not in sys.path:
        sys.path.append(str(project_root))
    from training_engine import (  # type: ignore[no-redef]
        ExercisePerformance,
        ExerciseSetSample,
        TrainingAIEngine,
        UserProfile,
        WorkoutSession,
    )


def split_goals(goals_csv: str) -> List[str]:
    if not goals_csv:
        return []
    return [goal.strip() for goal in goals_csv.split(",") if goal.strip()]


def user_to_profile(user: models.User) -> UserProfile:
    return UserProfile(
        age=user.age,
        sex=user.sex,  # type: ignore[arg-type]
        height_cm=user.height_cm,
        weight_kg=user.weight_kg,
        training_level=user.training_level,  # type: ignore[arg-type]
        training_style=user.training_style,  # type: ignore[arg-type]
        goals=split_goals(user.goals_csv),  # type: ignore[arg-type]
    )


def workout_to_session(workout: models.Workout) -> WorkoutSession:
    exercises: List[ExercisePerformance] = []
    for exercise in workout.exercises:
        sets = [
            ExerciseSetSample(
                reps=set_item.reps,
                rir=set_item.rir,
                heart_rate_after_set=set_item.heart_rate_after_set,
                heart_rate_recovery=set_item.heart_rate_recovery,
            )
            for set_item in exercise.sets
        ]
        rep_target_range = None
        if exercise.rep_target_min is not None and exercise.rep_target_max is not None:
            rep_target_range = (exercise.rep_target_min, exercise.rep_target_max)
        exercises.append(
            ExercisePerformance(
                exercise=exercise.name,
                weight=exercise.weight,
                sets=sets,
                rest_time_sec=exercise.rest_time_sec,
                rep_target_range=rep_target_range,
            )
        )
    return WorkoutSession(performed_at=workout.performed_at, exercises=exercises)


def load_user_and_workouts(
    db: Session,
    user_id: int,
) -> Tuple[models.User | None, List[models.Workout]]:
    user = db.get(models.User, user_id)
    if user is None:
        return None, []

    stmt = (
        select(models.Workout)
        .where(models.Workout.user_id == user_id)
        .options(selectinload(models.Workout.exercises).selectinload(models.Exercise.sets))
        .order_by(models.Workout.performed_at.asc(), models.Workout.id.asc())
    )
    workouts = list(db.scalars(stmt))
    return user, workouts


def build_engine_for_user(
    db: Session,
    user_id: int,
) -> Tuple[TrainingAIEngine, models.User | None, Dict[int, WorkoutSession]]:
    user, workouts = load_user_and_workouts(db, user_id)
    if user is None:
        fallback_profile = UserProfile(
            age=25,
            sex="neutral",
            height_cm=170,
            weight_kg=70,
            training_level="beginner",
            training_style="full_body",
            goals=["health"],
        )
        return TrainingAIEngine(fallback_profile), None, {}

    engine = TrainingAIEngine(user_to_profile(user))
    by_id: Dict[int, WorkoutSession] = {}
    for workout in workouts:
        session = workout_to_session(workout)
        by_id[workout.id] = session
        engine.ingest_workout(session)
    return engine, user, by_id
