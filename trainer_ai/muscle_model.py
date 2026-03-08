from __future__ import annotations

from typing import Dict, List


MUSCLE_DEFINITIONS: Dict[str, str] = {
    "chest": "Грудные мышцы",
    "triceps": "Трицепсы",
    "biceps": "Бицепсы",
    "front_delts": "Передняя дельта",
    "side_delts": "Средняя дельта",
    "rear_delts": "Задняя дельта",
    "lats": "Широчайшие мышцы спины",
    "mid_back": "Средняя часть спины",
    "traps": "Трапеции",
    "spinal_erectors": "Разгибатели спины",
    "quads": "Квадрицепсы",
    "glutes": "Ягодичные мышцы",
    "hamstrings": "Бицепс бедра",
    "calves": "Икроножные мышцы",
    "abs": "Мышцы пресса",
}

MUSCLE_DEFINITIONS_LIST: List[Dict[str, str]] = [
    {"id": muscle_id, "name": muscle_name}
    for muscle_id, muscle_name in MUSCLE_DEFINITIONS.items()
]


EXERCISE_DEFINITIONS: Dict[str, Dict[str, object]] = {
    "bench_press": {
        "id": "bench_press",
        "name": "Жим штанги лёжа",
        "muscles": {"chest": 1.0, "triceps": 0.5, "front_delts": 0.5},
    },
    "incline_bench_press": {
        "id": "incline_bench_press",
        "name": "Жим на наклонной скамье",
        "muscles": {"chest": 1.0, "front_delts": 0.6, "triceps": 0.5},
    },
    "dumbbell_press": {
        "id": "dumbbell_press",
        "name": "Жим гантелей",
        "muscles": {"chest": 1.0, "triceps": 0.4, "front_delts": 0.5},
    },
    "pushups": {
        "id": "pushups",
        "name": "Отжимания",
        "muscles": {"chest": 1.0, "triceps": 0.5, "front_delts": 0.4},
    },
    "dips": {
        "id": "dips",
        "name": "Брусья",
        "muscles": {"chest": 0.8, "triceps": 1.0, "front_delts": 0.4},
    },
    "overhead_press": {
        "id": "overhead_press",
        "name": "Жим над головой",
        "muscles": {"front_delts": 1.0, "triceps": 0.7, "side_delts": 0.4},
    },
    "pullups": {
        "id": "pullups",
        "name": "Подтягивания",
        "muscles": {"lats": 1.0, "biceps": 0.6, "mid_back": 0.5},
    },
    "lat_pulldown": {
        "id": "lat_pulldown",
        "name": "Тяга верхнего блока",
        "muscles": {"lats": 1.0, "biceps": 0.5, "mid_back": 0.4},
    },
    "barbell_row": {
        "id": "barbell_row",
        "name": "Тяга штанги в наклоне",
        "muscles": {"mid_back": 1.0, "lats": 0.7, "biceps": 0.5, "spinal_erectors": 0.3},
    },
    "dumbbell_row": {
        "id": "dumbbell_row",
        "name": "Тяга гантели в наклоне",
        "muscles": {"lats": 1.0, "mid_back": 0.6, "biceps": 0.5},
    },
    "seated_row": {
        "id": "seated_row",
        "name": "Горизонтальная тяга блока",
        "muscles": {"mid_back": 1.0, "lats": 0.7, "biceps": 0.5},
    },
    "face_pull": {
        "id": "face_pull",
        "name": "Тяга к лицу",
        "muscles": {"rear_delts": 1.0, "mid_back": 0.5, "traps": 0.4},
    },
    "back_squat": {
        "id": "back_squat",
        "name": "Приседания со штангой",
        "muscles": {"quads": 1.0, "glutes": 0.7, "hamstrings": 0.3, "spinal_erectors": 0.3},
    },
    "front_squat": {
        "id": "front_squat",
        "name": "Фронтальные приседания",
        "muscles": {"quads": 1.0, "glutes": 0.5, "abs": 0.4, "spinal_erectors": 0.3},
    },
    "leg_press": {
        "id": "leg_press",
        "name": "Жим ногами",
        "muscles": {"quads": 1.0, "glutes": 0.6, "hamstrings": 0.4},
    },
    "romanian_deadlift": {
        "id": "romanian_deadlift",
        "name": "Румынская тяга",
        "muscles": {"hamstrings": 1.0, "glutes": 0.8, "spinal_erectors": 0.6},
    },
    "lunges": {
        "id": "lunges",
        "name": "Выпады",
        "muscles": {"quads": 1.0, "glutes": 0.8, "hamstrings": 0.4},
    },
    "leg_extension": {
        "id": "leg_extension",
        "name": "Разгибания ног",
        "muscles": {"quads": 1.0},
    },
    "leg_curl": {
        "id": "leg_curl",
        "name": "Сгибания ног",
        "muscles": {"hamstrings": 1.0},
    },
    "calf_raise": {
        "id": "calf_raise",
        "name": "Подъёмы на икры",
        "muscles": {"calves": 1.0},
    },
    "lateral_raise": {
        "id": "lateral_raise",
        "name": "Махи в стороны",
        "muscles": {"side_delts": 1.0, "traps": 0.3},
    },
    "rear_delt_fly": {
        "id": "rear_delt_fly",
        "name": "Разведения на заднюю дельту",
        "muscles": {"rear_delts": 1.0, "mid_back": 0.4, "traps": 0.3},
    },
    "plank": {
        "id": "plank",
        "name": "Планка",
        "muscles": {"abs": 1.0, "spinal_erectors": 0.5},
    },
    "hanging_leg_raise": {
        "id": "hanging_leg_raise",
        "name": "Подъёмы ног в висе",
        "muscles": {"abs": 1.0, "hip_flexors": 0.6},
    },
    "cable_crunch": {
        "id": "cable_crunch",
        "name": "Скручивания на блоке",
        "muscles": {"abs": 1.0},
    },
}

# Remove unsupported muscle ids and keep only required groups.
for _exercise in EXERCISE_DEFINITIONS.values():
    _exercise["muscles"] = {
        muscle_id: coefficient
        for muscle_id, coefficient in dict(_exercise["muscles"]).items()
        if muscle_id in MUSCLE_DEFINITIONS
    }

MUSCLE_COEFFICIENTS: Dict[str, Dict[str, float]] = {
    exercise_id: dict(data["muscles"]) for exercise_id, data in EXERCISE_DEFINITIONS.items()
}

# CamelCase aliases for integrations expecting frontend-like naming.
muscleDefinitions = MUSCLE_DEFINITIONS_LIST
muscleCoefficients = MUSCLE_COEFFICIENTS

EXERCISE_ALIASES: Dict[str, str] = {
    "barbell bench press": "bench_press",
    "bench press": "bench_press",
    "incline bench press": "incline_bench_press",
    "dumbbell bench press": "dumbbell_press",
    "dumbbell press": "dumbbell_press",
    "push-up": "pushups",
    "pull-up": "pullups",
    "lat pulldown": "lat_pulldown",
    "barbell row": "barbell_row",
    "dumbbell row": "dumbbell_row",
    "seated cable row": "seated_row",
    "face pull": "face_pull",
    "squat": "back_squat",
    "back squat": "back_squat",
    "front squat": "front_squat",
    "romanian deadlift": "romanian_deadlift",
    "leg press": "leg_press",
    "leg extension": "leg_extension",
    "leg curl": "leg_curl",
    "calf raise": "calf_raise",
    "overhead press": "overhead_press",
    "lateral raise": "lateral_raise",
    "rear delt fly": "rear_delt_fly",
    "hanging leg raise": "hanging_leg_raise",
    "cable crunch": "cable_crunch",
}


def normalize_exercise_id(exercise_id: str) -> str:
    normalized = exercise_id.strip().lower()
    return EXERCISE_ALIASES.get(normalized, normalized)


def get_muscle_coefficients(exercise_id: str) -> Dict[str, float]:
    normalized_id = normalize_exercise_id(exercise_id)
    return dict(MUSCLE_COEFFICIENTS.get(normalized_id, {}))


def getMuscleCoefficients(exerciseId: str) -> Dict[str, float]:
    return get_muscle_coefficients(exerciseId)
