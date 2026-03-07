# trainer

AI recommendation core for a strength-training app.

## What is implemented

`trainer_ai` contains a production-ready algorithmic core that supports:

1. User profile model (age, sex, anthropometry, level, style, goals)
2. Workout model (exercise, sets/reps, weight, RIR, rest, HR)
3. Muscle model with primary/secondary coefficients
4. Muscle load calculation:
   - `load = weight * total_reps * coefficient`
5. Fatigue Index (0..100) with time-based recovery (24/48/72h behavior)
6. Smart next-workout recommendation:
   - style-aware (`full_body`, `split`, `custom`)
   - excludes overloaded muscles
   - includes undertrained hints
7. Auto progression (+weight after 3 consecutive top-bound sessions)
8. RIR autoregulation (weight/reps/rest adjustment)
9. Deload detection (`-20%` weight, `-30%` volume recommendation)
10. Heart-rate driven rest guidance
11. Body visualization payload with muscle colors
12. Post-workout AI analysis
13. Load imbalance analysis
14. Progress history snapshot
15. Live workout view payload for the training screen

## Package structure

```text
trainer_ai/
  __init__.py
  models.py
  engine.py
tests/
  test_engine.py
```

## Quick example

```python
from datetime import datetime
from trainer_ai import (
    ExercisePerformance,
    ExerciseSetSample,
    TrainingAIEngine,
    UserProfile,
    WorkoutSession,
)

profile = UserProfile(
    age=27,
    sex="female",
    height_cm=168,
    weight_kg=62,
    training_level="intermediate",
    training_style="split",
    goals=["hypertrophy", "health"],
)

engine = TrainingAIEngine(profile)

workout = WorkoutSession(
    performed_at=datetime.utcnow(),
    exercises=[
        ExercisePerformance(
            exercise="dumbbell bench press",
            weight=10,
            rest_time_sec=90,
            sets=[
                ExerciseSetSample(reps=12, rir=3, heart_rate_after_set=118, heart_rate_recovery=95),
                ExerciseSetSample(reps=12, rir=2, heart_rate_after_set=115, heart_rate_recovery=92),
                ExerciseSetSample(reps=11, rir=1, heart_rate_after_set=110, heart_rate_recovery=90),
            ],
            rep_target_range=(10, 12),
        )
    ],
)

engine.ingest_workout(workout)

print(engine.get_fatigue_snapshot())
print(engine.suggest_next_workout())
print(engine.evaluate_progression("dumbbell bench press", rep_upper_bound=12))
print(engine.evaluate_deload())
```

## Run tests

```bash
python -m unittest discover -s tests -p "test_*.py"
```