from __future__ import annotations

from collections import defaultdict
from dataclasses import asdict
from datetime import UTC, datetime
from statistics import mean
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from .models import (
    DeloadRecommendation,
    ExercisePerformance,
    HeartRateGuidance,
    ImbalanceInsight,
    MuscleFatigueState,
    MuscleMap,
    ProgressionRecommendation,
    UserProfile,
    WorkoutAnalysis,
    WorkoutLoad,
    WorkoutRecommendation,
    WorkoutSession,
)


DEFAULT_EXERCISE_MUSCLE_MAP: Dict[str, MuscleMap] = {
    "dumbbell bench press": {"chest": 1.0, "front_delts": 0.5, "triceps": 0.4},
    "barbell bench press": {"chest": 1.0, "front_delts": 0.5, "triceps": 0.5},
    "overhead press": {"front_delts": 1.0, "triceps": 0.6, "upper_chest": 0.3},
    "pull-up": {"lats": 1.0, "biceps": 0.5, "rear_delts": 0.3},
    "barbell row": {"mid_back": 1.0, "lats": 0.6, "biceps": 0.4, "rear_delts": 0.4},
    "lat pulldown": {"lats": 1.0, "biceps": 0.4, "rear_delts": 0.3},
    "squat": {"quads": 1.0, "glutes": 0.7, "hamstrings": 0.5, "core": 0.4},
    "front squat": {"quads": 1.0, "glutes": 0.5, "core": 0.5},
    "romanian deadlift": {"hamstrings": 1.0, "glutes": 0.8, "lower_back": 0.5},
    "deadlift": {"hamstrings": 0.9, "glutes": 0.8, "lower_back": 1.0, "lats": 0.3},
    "leg press": {"quads": 1.0, "glutes": 0.5, "hamstrings": 0.4},
    "hip thrust": {"glutes": 1.0, "hamstrings": 0.4, "quads": 0.3},
    "leg curl": {"hamstrings": 1.0, "calves": 0.3},
    "biceps curl": {"biceps": 1.0, "forearms": 0.4},
    "triceps pushdown": {"triceps": 1.0, "front_delts": 0.3},
    "lateral raise": {"side_delts": 1.0, "upper_traps": 0.3},
    "face pull": {"rear_delts": 1.0, "mid_back": 0.4, "rotator_cuff": 0.5},
    "calf raise": {"calves": 1.0},
}


SPLIT_BLOCKS: Dict[str, List[str]] = {
    "push": ["chest", "front_delts", "triceps", "side_delts"],
    "pull": ["lats", "mid_back", "rear_delts", "biceps"],
    "legs": ["quads", "hamstrings", "glutes", "calves"],
}


class TrainingAIEngine:
    """
    Recommendation engine for strength training applications.

    Core capabilities:
      - muscle-level load accounting with primary/secondary coefficients
      - fatigue index tracking (0..100) with time-based recovery
      - next workout suggestion considering style and recovery
      - progression, autoregulation (RIR), deload, HR analysis
      - post-session summary, imbalance checks, body-map payload
    """

    def __init__(
        self,
        user_profile: UserProfile,
        exercise_muscle_map: Optional[Dict[str, MuscleMap]] = None,
    ) -> None:
        self.user_profile = user_profile
        self.exercise_muscle_map = {
            key.lower(): value.copy()
            for key, value in (exercise_muscle_map or DEFAULT_EXERCISE_MUSCLE_MAP).items()
        }
        self.fatigue_state: Dict[str, MuscleFatigueState] = defaultdict(MuscleFatigueState)
        self.workout_history: List[WorkoutSession] = []

    def register_exercise(self, exercise_name: str, muscle_map: MuscleMap) -> None:
        self.exercise_muscle_map[exercise_name.lower()] = muscle_map

    def calculate_exercise_load(self, performance: ExercisePerformance) -> WorkoutLoad:
        """
        Per-muscle load:
          load = weight * total_reps * muscle_coefficient
        """
        total_reps = sum(performance.rep_list())
        muscle_map = self.exercise_muscle_map.get(performance.exercise.lower(), {})
        per_muscle: WorkoutLoad = {}
        for muscle, coefficient in muscle_map.items():
            per_muscle[muscle] = performance.weight * total_reps * coefficient
        return per_muscle

    def calculate_workout_load(self, workout: WorkoutSession) -> WorkoutLoad:
        per_muscle_load: WorkoutLoad = defaultdict(float)
        for exercise in workout.exercises:
            load = self.calculate_exercise_load(exercise)
            for muscle, value in load.items():
                per_muscle_load[muscle] += value
        return dict(per_muscle_load)

    def _fatigue_decay_fraction(self, hours_since_stimulus: float) -> float:
        """
        Piecewise linear approximation based on requirement examples:
            24h -> -20%
            48h -> -40%
            72h -> -70%
        """
        points = [
            (0.0, 0.0),
            (24.0, 0.20),
            (48.0, 0.40),
            (72.0, 0.70),
            (96.0, 0.82),
            (120.0, 0.92),
            (168.0, 1.00),
        ]
        if hours_since_stimulus <= 0:
            return 0.0
        if hours_since_stimulus >= points[-1][0]:
            return 1.0

        for idx in range(1, len(points)):
            left_h, left_v = points[idx - 1]
            right_h, right_v = points[idx]
            if left_h <= hours_since_stimulus <= right_h:
                scale = (hours_since_stimulus - left_h) / (right_h - left_h)
                return left_v + (right_v - left_v) * scale
        return 1.0

    def _apply_recovery_to_state(self, now: datetime) -> None:
        now = self._normalize_datetime(now)
        for state in self.fatigue_state.values():
            if state.last_updated is None:
                state.last_updated = now
                continue
            elapsed_hours = max(0.0, (now - state.last_updated).total_seconds() / 3600.0)
            decay = self._fatigue_decay_fraction(elapsed_hours)
            state.score = max(0.0, state.score * (1.0 - decay))
            state.last_updated = now

    def _fatigue_gain(self, load: float, avg_rir: float) -> float:
        # Lower RIR means higher intensity and fatigue cost.
        rir_multiplier = 1.0 + max(0.0, 3.0 - avg_rir) * 0.12
        base_gain = load * 0.012
        return min(55.0, base_gain * rir_multiplier)

    def ingest_workout(self, workout: WorkoutSession) -> WorkoutLoad:
        performed_at = self._normalize_datetime(workout.performed_at)
        workout.performed_at = performed_at
        self._apply_recovery_to_state(performed_at)
        per_muscle_load = self.calculate_workout_load(workout)

        for exercise in workout.exercises:
            muscle_map = self.exercise_muscle_map.get(exercise.exercise.lower(), {})
            if not muscle_map:
                continue
            avg_rir = mean(exercise.rir_list()) if exercise.rir_list() else 3.0
            total_reps = sum(exercise.rep_list())
            for muscle, coefficient in muscle_map.items():
                load = exercise.weight * total_reps * coefficient
                state = self.fatigue_state[muscle]
                state.score = min(100.0, state.score + self._fatigue_gain(load, avg_rir))
                state.last_updated = performed_at

        self.workout_history.append(workout)
        self.workout_history.sort(key=lambda item: item.performed_at)
        return per_muscle_load

    def get_fatigue_snapshot(self, at_time: Optional[datetime] = None) -> Dict[str, float]:
        now = self._normalize_datetime(at_time or datetime.now(UTC))
        self._apply_recovery_to_state(now)
        return {muscle: round(state.score, 2) for muscle, state in self.fatigue_state.items()}

    @staticmethod
    def _normalize_datetime(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)

    def _muscle_priority_scores(self) -> Dict[str, float]:
        fatigue = self.get_fatigue_snapshot()
        all_muscles = set()
        for mapping in self.exercise_muscle_map.values():
            all_muscles.update(mapping.keys())
        return {muscle: 100.0 - fatigue.get(muscle, 0.0) for muscle in all_muscles}

    def _recent_muscle_loads(self, lookback_days: int = 14) -> WorkoutLoad:
        if not self.workout_history:
            return {}
        latest = self.workout_history[-1].performed_at
        threshold = latest.timestamp() - lookback_days * 24 * 3600
        loads: WorkoutLoad = defaultdict(float)
        for workout in self.workout_history:
            if workout.performed_at.timestamp() < threshold:
                continue
            for muscle, value in self.calculate_workout_load(workout).items():
                loads[muscle] += value
        return dict(loads)

    def _style_focus(self) -> List[str]:
        style = self.user_profile.training_style
        fatigue = self.get_fatigue_snapshot()
        priority = self._muscle_priority_scores()

        if style == "full_body":
            major = ["quads", "hamstrings", "glutes", "chest", "lats", "mid_back", "delts", "triceps", "biceps"]
            major_sorted = sorted(major, key=lambda m: priority.get(m, 0.0), reverse=True)
            return [muscle for muscle in major_sorted if fatigue.get(muscle, 0.0) < 80.0][:6]

        if style == "split":
            if not self.workout_history:
                return SPLIT_BLOCKS["push"]
            idx = len(self.workout_history) % 3
            order = ["push", "pull", "legs"]
            for shift in range(3):
                block = order[(idx + shift) % 3]
                block_muscles = SPLIT_BLOCKS[block]
                if all(fatigue.get(muscle, 0.0) < 82.0 for muscle in block_muscles):
                    return block_muscles
            return SPLIT_BLOCKS["push"]

        # custom style
        custom = self.user_profile.custom_focus_rotation or []
        if custom:
            pointer = len(self.workout_history) % len(custom)
            return custom[pointer]
        # fallback if custom plan is absent
        return ["chest", "lats", "quads", "glutes"]

    def suggest_next_workout(self, max_exercises: int = 6) -> WorkoutRecommendation:
        fatigue = self.get_fatigue_snapshot()
        focus = self._style_focus()
        overloaded = {muscle for muscle, score in fatigue.items() if score >= 85.0}
        focus_filtered = [muscle for muscle in focus if muscle not in overloaded]
        if not focus_filtered:
            focus_filtered = sorted(fatigue, key=lambda m: fatigue[m])[:4]

        candidate_exercises: List[str] = []
        for exercise, muscle_map in self.exercise_muscle_map.items():
            primary_muscle = max(muscle_map.items(), key=lambda kv: kv[1])[0]
            if primary_muscle not in focus_filtered:
                continue
            # Discard exercises with heavily fatigued secondaries.
            secondary_overloaded = any(
                coeff < 1.0 and fatigue.get(muscle, 0.0) > 88.0 for muscle, coeff in muscle_map.items()
            )
            if not secondary_overloaded:
                candidate_exercises.append(exercise)
            if len(candidate_exercises) >= max_exercises:
                break

        notes: List[str] = []
        if overloaded:
            notes.append(f"High fatigue muscles excluded: {', '.join(sorted(overloaded))}.")

        recent = self._recent_muscle_loads()
        if recent:
            low_load = sorted(recent.items(), key=lambda kv: kv[1])[:3]
            undertrained = [muscle for muscle, _ in low_load]
            notes.append(f"Undertrained recently: {', '.join(undertrained)}.")

        return WorkoutRecommendation(
            focus_muscles=focus_filtered,
            exercises=candidate_exercises,
            notes=notes,
        )

    def evaluate_progression(
        self,
        exercise_name: str,
        rep_upper_bound: int,
        increment_kg: float = 2.0,
    ) -> ProgressionRecommendation:
        matching: List[ExercisePerformance] = []
        for workout in sorted(self.workout_history, key=lambda item: item.performed_at, reverse=True):
            for exercise in workout.exercises:
                if exercise.exercise.lower() == exercise_name.lower():
                    matching.append(exercise)
                    break
            if len(matching) == 3:
                break

        if len(matching) < 3:
            return ProgressionRecommendation(
                exercise=exercise_name,
                should_increase_weight=False,
                reason="Not enough consecutive sessions for progression check.",
            )

        all_hit_top = all(min(exercise.rep_list()) >= rep_upper_bound for exercise in matching)
        if all_hit_top:
            return ProgressionRecommendation(
                exercise=exercise_name,
                should_increase_weight=True,
                suggested_increment_kg=increment_kg,
                reason=f"Top rep bound ({rep_upper_bound}) reached in 3 consecutive sessions.",
            )

        return ProgressionRecommendation(
            exercise=exercise_name,
            should_increase_weight=False,
            reason="Rep target not consistently reached yet.",
        )

    def autoregulate_from_rir(
        self,
        current_weight: float,
        rir_value: float,
        current_rest_sec: int,
    ) -> Dict[str, float | str | int]:
        if rir_value >= 4:
            return {
                "weight_adjustment_kg": round(max(1.0, current_weight * 0.03), 2),
                "rep_adjustment": 0,
                "rest_adjustment_sec": -10,
                "intensity_label": "too_easy",
            }
        if rir_value >= 2:
            return {
                "weight_adjustment_kg": 0.0,
                "rep_adjustment": 0,
                "rest_adjustment_sec": 0,
                "intensity_label": "target_intensity",
            }
        if rir_value == 1:
            return {
                "weight_adjustment_kg": -round(max(1.0, current_weight * 0.02), 2),
                "rep_adjustment": -1,
                "rest_adjustment_sec": 15,
                "intensity_label": "hard",
            }
        # RIR <= 0 (failure)
        return {
            "weight_adjustment_kg": -round(max(1.5, current_weight * 0.05), 2),
            "rep_adjustment": -2,
            "rest_adjustment_sec": max(20, int(current_rest_sec * 0.25)),
            "intensity_label": "failure",
        }

    def evaluate_deload(self) -> DeloadRecommendation:
        if len(self.workout_history) < 4:
            return DeloadRecommendation(False, "Insufficient training history for deload detection.")

        fatigue = self.get_fatigue_snapshot()
        high_fatigue_count = sum(1 for value in fatigue.values() if value >= 75.0)
        fatigue_trigger = high_fatigue_count >= 4

        # Detect repeated rep performance drop for same exercise.
        rep_drop_trigger = False
        by_exercise: Dict[str, List[float]] = defaultdict(list)
        for workout in self.workout_history[-8:]:
            for exercise in workout.exercises:
                by_exercise[exercise.exercise.lower()].append(mean(exercise.rep_list()))
        for values in by_exercise.values():
            if len(values) >= 3 and values[-1] < values[-2] < values[-3] and values[-1] <= values[-3] * 0.9:
                rep_drop_trigger = True
                break

        if fatigue_trigger and rep_drop_trigger:
            return DeloadRecommendation(
                should_deload=True,
                reason="Accumulated fatigue + performance drop detected.",
                weight_adjustment_pct=-20.0,
                volume_adjustment_pct=-30.0,
            )
        if fatigue_trigger:
            return DeloadRecommendation(
                should_deload=False,
                reason="Fatigue is high; monitor one more session before deload.",
            )
        return DeloadRecommendation(False, "No strong deload signals.")

    def analyze_heart_rate(
        self,
        heart_rate_after_set: int,
        heart_rate_recovery: int,
        current_rest_sec: int,
        target_zone: Tuple[int, int] = (90, 100),
    ) -> HeartRateGuidance:
        low, high = target_zone
        if heart_rate_recovery > high:
            return HeartRateGuidance(
                target_zone=target_zone,
                recommended_rest_sec=current_rest_sec + 30,
                status="under_recovered",
                note="Recovery HR is above target; extend rest before next set.",
            )
        if heart_rate_recovery < low and heart_rate_after_set < high + 20:
            return HeartRateGuidance(
                target_zone=target_zone,
                recommended_rest_sec=max(30, current_rest_sec - 15),
                status="ready",
                note="Cardio recovery is good; you can shorten rest slightly.",
            )
        return HeartRateGuidance(
            target_zone=target_zone,
            recommended_rest_sec=current_rest_sec,
            status="normal",
            note="Current rest duration is appropriate.",
        )

    def analyze_workout(self, workout: WorkoutSession) -> WorkoutAnalysis:
        load = self.calculate_workout_load(workout)
        positives: List[str] = []
        warnings: List[str] = []

        if load:
            top_muscle, top_load = max(load.items(), key=lambda kv: kv[1])
            positives.append(f"Strong session for {top_muscle} ({top_load:.0f} load units).")

        progression_hits = []
        for exercise in workout.exercises:
            if exercise.rep_target_range:
                _, upper = exercise.rep_target_range
                if min(exercise.rep_list()) >= upper:
                    progression_hits.append(exercise.exercise)
        if progression_hits:
            positives.append(f"Rep targets reached in: {', '.join(progression_hits)}.")

        fatigue = self.get_fatigue_snapshot(workout.performed_at)
        high_fatigue = [muscle for muscle, score in fatigue.items() if score >= 80.0]
        if high_fatigue:
            warnings.append(f"High fatigue warning for: {', '.join(sorted(high_fatigue))}.")

        suggestion = self.suggest_next_workout()
        if suggestion.focus_muscles:
            next_hint = f"Next session focus: {', '.join(suggestion.focus_muscles[:4])}."
        else:
            next_hint = "Next session: recovery or low-intensity full body."
        return WorkoutAnalysis(positives=positives, warnings=warnings, next_session_hint=next_hint)

    def analyze_imbalance(self, lookback_days: int = 28) -> List[ImbalanceInsight]:
        loads = self._recent_muscle_loads(lookback_days=lookback_days)
        pairs = [
            ("quads", "glutes"),
            ("chest", "mid_back"),
            ("biceps", "triceps"),
            ("front_delts", "rear_delts"),
        ]
        insights: List[ImbalanceInsight] = []
        for a, b in pairs:
            load_a = loads.get(a, 0.0)
            load_b = loads.get(b, 0.0)
            min_nonzero = max(1.0, min(v for v in [load_a, load_b] if v > 0.0) if (load_a > 0.0 or load_b > 0.0) else 1.0)
            ratio = max(load_a, load_b) / min_nonzero
            if ratio >= 1.8 and max(load_a, load_b) > 0:
                dominant = a if load_a > load_b else b
                weaker = b if dominant == a else a
                message = f"{dominant} receives significantly more load than {weaker} (x{ratio:.2f})."
                insights.append(ImbalanceInsight((a, b), load_a, load_b, ratio, message))
        return insights

    def build_progress_snapshot(self) -> Dict[str, object]:
        exercise_progress: Dict[str, Dict[str, float]] = {}
        per_exercise_samples: Dict[str, List[Tuple[float, float]]] = defaultdict(list)
        for workout in self.workout_history:
            for exercise in workout.exercises:
                per_exercise_samples[exercise.exercise.lower()].append((exercise.weight, mean(exercise.rep_list())))
        for exercise, samples in per_exercise_samples.items():
            weights = [sample[0] for sample in samples]
            avg_reps = [sample[1] for sample in samples]
            exercise_progress[exercise] = {
                "start_weight": weights[0],
                "current_weight": weights[-1],
                "weight_delta": weights[-1] - weights[0],
                "start_avg_reps": round(avg_reps[0], 2),
                "current_avg_reps": round(avg_reps[-1], 2),
                "avg_reps_delta": round(avg_reps[-1] - avg_reps[0], 2),
            }

        return {
            "exercise_progress": exercise_progress,
            "muscle_fatigue": self.get_fatigue_snapshot(),
            "muscle_load_14d": self._recent_muscle_loads(14),
        }

    @staticmethod
    def fatigue_to_color(score: float) -> str:
        if score < 30:
            return "green"
        if score < 60:
            return "yellow"
        if score < 80:
            return "orange"
        return "red"

    def body_visualization_payload(self) -> Dict[str, Dict[str, object]]:
        fatigue = self.get_fatigue_snapshot()
        payload: Dict[str, Dict[str, object]] = {}
        for muscle, score in fatigue.items():
            linked_exercises = [
                exercise
                for exercise, map_ in self.exercise_muscle_map.items()
                if muscle in map_
            ][:6]
            payload[muscle] = {
                "fatigue": round(score, 2),
                "color": self.fatigue_to_color(score),
                "related_exercises": linked_exercises,
            }
        return payload

    def build_live_workout_view(self, workout: WorkoutSession) -> Dict[str, object]:
        exercises_payload = []
        for exercise in workout.exercises:
            sets_payload = []
            for idx, sample in enumerate(exercise.sets, start=1):
                sets_payload.append(
                    {
                        "set_number": idx,
                        "weight": exercise.weight,
                        "reps": sample.reps,
                        "rir": sample.rir,
                        "heart_rate_after_set": sample.heart_rate_after_set,
                        "heart_rate_recovery": sample.heart_rate_recovery,
                    }
                )
            exercises_payload.append(
                {
                    "exercise": exercise.exercise,
                    "rest_time_sec": exercise.rest_time_sec,
                    "sets": sets_payload,
                }
            )

        return {
            "performed_at": workout.performed_at.isoformat(),
            "exercises": exercises_payload,
            "body_visualization": self.body_visualization_payload(),
        }

    def export_state(self) -> Dict[str, object]:
        return {
            "user_profile": asdict(self.user_profile),
            "fatigue_state": {
                muscle: {
                    "score": round(state.score, 2),
                    "last_updated": state.last_updated.isoformat() if state.last_updated else None,
                }
                for muscle, state in self.fatigue_state.items()
            },
            "workouts_count": len(self.workout_history),
        }
