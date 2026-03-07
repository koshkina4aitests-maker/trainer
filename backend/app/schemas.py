from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


Sex = Literal["male", "female", "neutral"]
TrainingLevel = Literal["beginner", "intermediate", "advanced"]
TrainingStyle = Literal["full_body", "split", "custom"]
Goal = Literal["strength", "hypertrophy", "endurance", "health"]
HeartRateSource = Literal["manual", "healthkit", "google_fit", "fitbit"]


class UserCreate(BaseModel):
    age: int = Field(..., ge=13, le=100)
    sex: Sex
    height_cm: float = Field(..., gt=100, lt=250)
    weight_kg: float = Field(..., gt=30, lt=400)
    training_level: TrainingLevel
    training_style: TrainingStyle
    goals: List[Goal]


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    age: int
    sex: Sex
    height_cm: float
    weight_kg: float
    training_level: TrainingLevel
    training_style: TrainingStyle
    goals: List[Goal]


class ExerciseSetCreate(BaseModel):
    reps: int = Field(..., ge=1, le=100)
    rir: float = Field(..., ge=0, le=10)
    heart_rate_after_set: Optional[int] = Field(default=None, ge=40, le=230)
    heart_rate_recovery: Optional[int] = Field(default=None, ge=35, le=220)
    heart_rate_source: Optional[HeartRateSource] = None


class ExerciseCreate(BaseModel):
    exercise: str = Field(..., min_length=1, max_length=128)
    weight: float = Field(..., ge=0)
    rest_time_sec: int = Field(..., ge=15, le=900)
    rep_target_range: Optional[List[int]] = None
    sets: List[ExerciseSetCreate] = Field(..., min_length=1)

    @field_validator("rep_target_range")
    @classmethod
    def validate_rep_target_range(cls, value: Optional[List[int]]) -> Optional[List[int]]:
        if value is None:
            return None
        if len(value) != 2:
            raise ValueError("rep_target_range must contain exactly 2 numbers")
        lower, upper = value
        if lower < 1 or upper < 1:
            raise ValueError("rep_target_range values must be positive")
        if lower > upper:
            raise ValueError("rep_target_range lower bound must be <= upper bound")
        return value


class WorkoutCreate(BaseModel):
    user_id: int
    performed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    exercises: List[ExerciseCreate] = Field(..., min_length=1)


class WorkoutCreateResponse(BaseModel):
    workout_id: int
    user_id: int
    performed_at: datetime
    exercises_count: int


class RecommendedWorkoutResponse(BaseModel):
    user_id: int
    focus_muscles: List[str]
    exercises: List[str]
    notes: List[str]
    fatigue_snapshot: Dict[str, float]


class AnalysisResponse(BaseModel):
    user_id: int
    workout_id: int
    textual_analysis: str
    structured_analysis: Dict[str, Any]
    progression: List[Dict[str, Any]]
    deload: Dict[str, Any]
    imbalances: List[Dict[str, Any]]
    progress_snapshot: Dict[str, Any]
    body_visualization: Dict[str, Dict[str, Any]]
