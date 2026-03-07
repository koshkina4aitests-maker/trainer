from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Literal, Optional, Sequence, Tuple

Sex = Literal["male", "female", "neutral"]
TrainingLevel = Literal["beginner", "intermediate", "advanced"]
TrainingStyle = Literal["full_body", "split", "custom"]
Goal = Literal["strength", "hypertrophy", "endurance", "health"]


@dataclass(slots=True)
class UserProfile:
    age: int
    sex: Sex
    height_cm: float
    weight_kg: float
    training_level: TrainingLevel
    training_style: TrainingStyle
    goals: Sequence[Goal]
    custom_focus_rotation: Optional[List[List[str]]] = None


@dataclass(slots=True)
class ExerciseSetSample:
    reps: int
    rir: float
    heart_rate_after_set: Optional[int] = None
    heart_rate_recovery: Optional[int] = None


@dataclass(slots=True)
class ExercisePerformance:
    exercise: str
    weight: float
    sets: List[ExerciseSetSample]
    rest_time_sec: int
    rep_target_range: Optional[Tuple[int, int]] = None

    def rep_list(self) -> List[int]:
        return [sample.reps for sample in self.sets]

    def rir_list(self) -> List[float]:
        return [sample.rir for sample in self.sets]

    def heart_rate_after(self) -> List[int]:
        return [value for value in (s.heart_rate_after_set for s in self.sets) if value is not None]

    def heart_rate_recovery(self) -> List[int]:
        return [value for value in (s.heart_rate_recovery for s in self.sets) if value is not None]


@dataclass(slots=True)
class WorkoutSession:
    performed_at: datetime
    exercises: List[ExercisePerformance]


@dataclass(slots=True)
class MuscleFatigueState:
    score: float = 0.0
    last_updated: Optional[datetime] = None


@dataclass(slots=True)
class WorkoutRecommendation:
    focus_muscles: List[str]
    exercises: List[str]
    notes: List[str] = field(default_factory=list)


@dataclass(slots=True)
class ProgressionRecommendation:
    exercise: str
    should_increase_weight: bool
    suggested_increment_kg: float = 0.0
    reason: str = ""


@dataclass(slots=True)
class DeloadRecommendation:
    should_deload: bool
    reason: str
    weight_adjustment_pct: float = 0.0
    volume_adjustment_pct: float = 0.0


@dataclass(slots=True)
class HeartRateGuidance:
    target_zone: Tuple[int, int]
    recommended_rest_sec: int
    status: str
    note: str


@dataclass(slots=True)
class WorkoutAnalysis:
    positives: List[str]
    warnings: List[str]
    next_session_hint: str


@dataclass(slots=True)
class ImbalanceInsight:
    pair: Tuple[str, str]
    load_a: float
    load_b: float
    ratio: float
    message: str


MuscleMap = Dict[str, float]
WorkoutLoad = Dict[str, float]
