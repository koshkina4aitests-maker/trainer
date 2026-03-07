export const EXERCISE_OPTIONS = [
  { value: "barbell bench press", label: "Жим штанги лежа" },
  { value: "dumbbell bench press", label: "Жим гантелей лежа" },
  { value: "overhead press", label: "Жим над головой" },
  { value: "pull-up", label: "Подтягивания" },
  { value: "barbell row", label: "Тяга штанги в наклоне" },
  { value: "lat pulldown", label: "Тяга верхнего блока" },
  { value: "squat", label: "Приседания" },
  { value: "front squat", label: "Фронтальные приседания" },
  { value: "romanian deadlift", label: "Румынская тяга" },
  { value: "deadlift", label: "Становая тяга" },
  { value: "leg press", label: "Жим ногами" },
  { value: "hip thrust", label: "Ягодичный мост" },
  { value: "leg curl", label: "Сгибание ног" },
  { value: "biceps curl", label: "Сгибание на бицепс" },
  { value: "triceps pushdown", label: "Разгибание на блоке" },
  { value: "lateral raise", label: "Подъемы в стороны" },
  { value: "face pull", label: "Тяга к лицу" },
  { value: "calf raise", label: "Подъемы на икры" }
];

export const EXERCISE_LABELS = Object.fromEntries(EXERCISE_OPTIONS.map((item) => [item.value, item.label]));

export const MUSCLE_LABELS = {
  chest: "Грудь",
  upper_chest: "Верх груди",
  front_delts: "Передняя дельта",
  side_delts: "Средняя дельта",
  rear_delts: "Задняя дельта",
  triceps: "Трицепс",
  biceps: "Бицепс",
  forearms: "Предплечья",
  lats: "Широчайшие",
  mid_back: "Средняя спина",
  lower_back: "Низ спины",
  core: "Кор",
  rotator_cuff: "Ротаторная манжета",
  upper_traps: "Трапеции",
  quads: "Квадрицепс",
  hamstrings: "Задняя поверхность бедра",
  glutes: "Ягодицы",
  calves: "Икры"
};

export const EXERCISE_MUSCLE_MAP = {
  "dumbbell bench press": { chest: 1.0, front_delts: 0.5, triceps: 0.4 },
  "barbell bench press": { chest: 1.0, front_delts: 0.5, triceps: 0.5 },
  "overhead press": { front_delts: 1.0, triceps: 0.6, upper_chest: 0.3 },
  "pull-up": { lats: 1.0, biceps: 0.5, rear_delts: 0.3 },
  "barbell row": { mid_back: 1.0, lats: 0.6, biceps: 0.4, rear_delts: 0.4 },
  "lat pulldown": { lats: 1.0, biceps: 0.4, rear_delts: 0.3 },
  squat: { quads: 1.0, glutes: 0.7, hamstrings: 0.5, core: 0.4 },
  "front squat": { quads: 1.0, glutes: 0.5, core: 0.5 },
  "romanian deadlift": { hamstrings: 1.0, glutes: 0.8, lower_back: 0.5 },
  deadlift: { hamstrings: 0.9, glutes: 0.8, lower_back: 1.0, lats: 0.3 },
  "leg press": { quads: 1.0, glutes: 0.5, hamstrings: 0.4 },
  "hip thrust": { glutes: 1.0, hamstrings: 0.4, quads: 0.3 },
  "leg curl": { hamstrings: 1.0, calves: 0.3 },
  "biceps curl": { biceps: 1.0, forearms: 0.4 },
  "triceps pushdown": { triceps: 1.0, front_delts: 0.3 },
  "lateral raise": { side_delts: 1.0, upper_traps: 0.3 },
  "face pull": { rear_delts: 1.0, mid_back: 0.4, rotator_cuff: 0.5 },
  "calf raise": { calves: 1.0 }
};

export const ZONE_DEFINITIONS = [
  { id: "chest_zone", label: "Грудь", view: "front", x: 50, y: 27, muscles: ["chest", "upper_chest"] },
  { id: "shoulders_front_zone", label: "Плечи", view: "front", x: 50, y: 18, muscles: ["front_delts", "side_delts"] },
  { id: "arms_front_zone", label: "Руки", view: "front", x: 50, y: 41, muscles: ["biceps", "triceps", "forearms"] },
  { id: "core_zone", label: "Кор", view: "front", x: 50, y: 52, muscles: ["core"] },
  { id: "quads_zone", label: "Квадрицепсы", view: "front", x: 50, y: 70, muscles: ["quads"] },
  { id: "calves_zone", label: "Икры", view: "front", x: 50, y: 88, muscles: ["calves"] },
  { id: "back_zone", label: "Спина", view: "back", x: 50, y: 31, muscles: ["lats", "mid_back", "lower_back"] },
  { id: "shoulders_back_zone", label: "Задняя дельта", view: "back", x: 50, y: 18, muscles: ["rear_delts", "upper_traps"] },
  { id: "glutes_zone", label: "Ягодицы", view: "back", x: 50, y: 58, muscles: ["glutes"] },
  { id: "hamstrings_zone", label: "Бицепс бедра", view: "back", x: 50, y: 72, muscles: ["hamstrings"] },
  { id: "calves_back_zone", label: "Икры", view: "back", x: 50, y: 88, muscles: ["calves"] }
];

export function translateExercise(value) {
  return EXERCISE_LABELS[value] ?? value;
}

export function translateMuscle(value) {
  return MUSCLE_LABELS[value] ?? value;
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateSessionMuscleLoad(exercises) {
  const loads = {};
  for (const exercise of exercises) {
    const exerciseName = exercise.exercise?.toLowerCase?.() ?? "";
    const map = EXERCISE_MUSCLE_MAP[exerciseName];
    if (!map) continue;

    const weight = safeNumber(exercise.weight, 0);
    const totalReps = (exercise.sets ?? []).reduce((acc, setItem) => acc + safeNumber(setItem.reps, 0), 0);
    for (const [muscle, coefficient] of Object.entries(map)) {
      loads[muscle] = (loads[muscle] ?? 0) + weight * totalReps * coefficient;
    }
  }
  return loads;
}

function trafficByRatio(ratio) {
  if (ratio < 0.33) return "green";
  if (ratio < 0.66) return "yellow";
  return "red";
}

function trafficByFatigue(value) {
  if (value < 35) return "green";
  if (value < 70) return "yellow";
  return "red";
}

export function buildZonesFromMuscleLoad(muscleLoads) {
  const raw = {};
  for (const zone of ZONE_DEFINITIONS) {
    const score = zone.muscles.reduce((acc, muscle) => acc + (muscleLoads[muscle] ?? 0), 0);
    raw[zone.id] = score;
  }
  const maxValue = Math.max(...Object.values(raw), 0);

  const result = {};
  for (const zone of ZONE_DEFINITIONS) {
    const value = raw[zone.id];
    const ratio = maxValue > 0 ? value / maxValue : 0;
    result[zone.id] = {
      value,
      color: trafficByRatio(ratio),
      label: `${Math.round(value)}`
    };
  }
  return result;
}

export function buildZonesFromFatiguePayload(payload) {
  const result = {};
  for (const zone of ZONE_DEFINITIONS) {
    const samples = zone.muscles
      .map((muscle) => payload?.[muscle]?.fatigue)
      .filter((value) => typeof value === "number");
    const average = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
    result[zone.id] = {
      value: average,
      color: trafficByFatigue(average),
      label: `${Math.round(average)} / 100`
    };
  }
  return result;
}
