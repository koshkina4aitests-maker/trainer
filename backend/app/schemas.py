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


class AuthUserRead(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    auth_provider: str
    is_admin: bool = False
    created_at: datetime


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(default=None, max_length=255)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(..., min_length=20)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AuthUserRead


TrainingStyleProfile = Literal["split", "fullbody", "other"]
GoalProfile = Literal["strength", "hypertrophy", "endurance", "health", "weight_loss"]
ExperienceLevel = Literal["beginner", "intermediate", "advanced"]
SexProfile = Literal["female", "male"]


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=255)
    age: Optional[int] = Field(default=None, ge=13, le=100)
    sex: SexProfile = "female"
    training_style: TrainingStyleProfile = "split"
    workouts_per_week: int = Field(default=3, ge=1, le=14)
    goal: GoalProfile = "hypertrophy"
    height_cm: Optional[float] = Field(default=None, ge=120, le=250)
    weight_kg: Optional[float] = Field(default=None, ge=30, le=400)
    target_weight_kg: Optional[float] = Field(default=None, ge=30, le=400)
    body_fat_pct: Optional[float] = Field(default=None, ge=2, le=70)
    experience_level: Optional[ExperienceLevel] = None
    preferred_session_duration_min: Optional[int] = Field(default=None, ge=20, le=240)
    notes: Optional[str] = Field(default=None, max_length=2000)


class ProfileResponse(BaseModel):
    account_id: int
    email: str
    full_name: Optional[str] = None
    age: Optional[int] = None
    sex: SexProfile = "female"
    training_style: TrainingStyleProfile
    workouts_per_week: int
    goal: GoalProfile
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    target_weight_kg: Optional[float] = None
    body_fat_pct: Optional[float] = None
    experience_level: Optional[ExperienceLevel] = None
    preferred_session_duration_min: Optional[int] = None
    notes: Optional[str] = None
    profile_completion_pct: int
    days_in_app: int


class ExerciseCatalogItem(BaseModel):
    id: str
    name: str
    muscles: Dict[str, float] = Field(default_factory=dict)
    technique_tip: Optional[str] = None
    source: Literal["custom"] = "custom"


class ExerciseCatalogResponse(BaseModel):
    items: List[ExerciseCatalogItem]


class AdminExerciseCreateRequest(BaseModel):
    id: str = Field(..., min_length=1, max_length=128)
    name: str = Field(..., min_length=1, max_length=255)
    muscles: Dict[str, float] = Field(default_factory=dict)
    technique_tip: Optional[str] = Field(default=None, max_length=2000)


class AdminImportCsvRequest(BaseModel):
    csv_text: str = Field(..., min_length=1)


class AdminImportCsvResponse(BaseModel):
    imported: int
    skipped: int
    errors: List[str] = Field(default_factory=list)


class AdminChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=4, max_length=128)
