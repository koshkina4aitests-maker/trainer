from __future__ import annotations

from datetime import UTC, datetime, timedelta
import unittest

from trainer_ai import (
    ExercisePerformance,
    ExerciseSetSample,
    TrainingAIEngine,
    UserProfile,
    WorkoutSession,
)


def make_profile() -> UserProfile:
    return UserProfile(
        age=29,
        sex="male",
        height_cm=180,
        weight_kg=82,
        training_level="intermediate",
        training_style="split",
        goals=["strength", "hypertrophy"],
    )


def make_exercise(name: str, weight: float, reps: list[int], rir: list[float], rest: int = 90) -> ExercisePerformance:
    return ExercisePerformance(
        exercise=name,
        weight=weight,
        rest_time_sec=rest,
        sets=[
            ExerciseSetSample(reps=rep, rir=rir_value)
            for rep, rir_value in zip(reps, rir)
        ],
        rep_target_range=(8, 12),
    )


class TrainingAIEngineTest(unittest.TestCase):
    def test_load_formula_with_secondary_muscles(self) -> None:
        engine = TrainingAIEngine(make_profile())
        exercise = make_exercise("dumbbell bench press", weight=10, reps=[12, 12, 11], rir=[3, 2, 1])
        load = engine.calculate_exercise_load(exercise)

        self.assertEqual(load["chest"], 350.0)
        self.assertEqual(load["front_delts"], 175.0)
        self.assertEqual(load["triceps"], 140.0)

    def test_fatigue_recovery_after_24_hours(self) -> None:
        engine = TrainingAIEngine(make_profile())
        t0 = datetime(2026, 3, 1, 10, 0, 0)
        workout = WorkoutSession(
            performed_at=t0,
            exercises=[make_exercise("dumbbell bench press", weight=30, reps=[10, 10, 10], rir=[1, 1, 1])],
        )
        engine.ingest_workout(workout)
        before = engine.get_fatigue_snapshot(t0)["chest"]
        after_24h = engine.get_fatigue_snapshot(t0 + timedelta(hours=24))["chest"]
        self.assertAlmostEqual(after_24h, before * 0.8, delta=0.5)

    def test_progression_after_three_top_bound_sessions(self) -> None:
        engine = TrainingAIEngine(make_profile())
        start = datetime(2026, 3, 1, 8, 0, 0)
        for day in range(3):
            workout = WorkoutSession(
                performed_at=start + timedelta(days=day),
                exercises=[
                    make_exercise("pull-up", weight=0, reps=[12, 12, 12], rir=[2, 2, 2]),
                ],
            )
            engine.ingest_workout(workout)

        result = engine.evaluate_progression("pull-up", rep_upper_bound=12, increment_kg=2)
        self.assertTrue(result.should_increase_weight)
        self.assertEqual(result.suggested_increment_kg, 2)

    def test_autoregulation_flags_failure(self) -> None:
        engine = TrainingAIEngine(make_profile())
        result = engine.autoregulate_from_rir(current_weight=100, rir_value=0, current_rest_sec=120)
        self.assertEqual(result["intensity_label"], "failure")
        self.assertLess(result["weight_adjustment_kg"], 0)
        self.assertGreater(result["rest_adjustment_sec"], 0)

    def test_deload_detection(self) -> None:
        engine = TrainingAIEngine(make_profile())
        t0 = datetime.now(UTC) - timedelta(days=1)

        reps_sequence = [[12, 12, 12], [10, 10, 10], [9, 9, 9], [8, 8, 8]]
        for idx, reps in enumerate(reps_sequence):
            workout = WorkoutSession(
                performed_at=t0 + timedelta(hours=idx * 6),
                exercises=[
                    make_exercise("barbell bench press", weight=120, reps=reps, rir=[0, 0, 0]),
                    make_exercise("squat", weight=160, reps=[10, 10, 10], rir=[0, 0, 0]),
                    make_exercise("barbell row", weight=110, reps=[10, 10, 10], rir=[0, 0, 0]),
                ],
            )
            engine.ingest_workout(workout)

        result = engine.evaluate_deload()
        self.assertTrue(result.should_deload)
        self.assertEqual(result.weight_adjustment_pct, -20.0)
        self.assertEqual(result.volume_adjustment_pct, -30.0)

    def test_heart_rate_guidance(self) -> None:
        engine = TrainingAIEngine(make_profile())
        guidance = engine.analyze_heart_rate(
            heart_rate_after_set=118,
            heart_rate_recovery=105,
            current_rest_sec=45,
            target_zone=(90, 100),
        )
        self.assertEqual(guidance.recommended_rest_sec, 75)
        self.assertEqual(guidance.status, "under_recovered")


if __name__ == "__main__":
    unittest.main()
