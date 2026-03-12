export const muscleDefinitions = [
  { id: "chest", name: "Грудные мышцы" },
  { id: "triceps", name: "Трицепсы" },
  { id: "biceps", name: "Бицепсы" },
  { id: "front_delts", name: "Передняя дельта" },
  { id: "side_delts", name: "Средняя дельта" },
  { id: "rear_delts", name: "Задняя дельта" },
  { id: "lats", name: "Широчайшие мышцы спины" },
  { id: "mid_back", name: "Средняя часть спины" },
  { id: "traps", name: "Трапеции" },
  { id: "spinal_erectors", name: "Разгибатели спины" },
  { id: "quads", name: "Квадрицепсы" },
  { id: "glutes", name: "Ягодичные мышцы" },
  { id: "hamstrings", name: "Бицепс бедра" },
  { id: "calves", name: "Икроножные мышцы" },
  { id: "abs", name: "Мышцы пресса" },
];

export const muscleDefinitionsMap = Object.fromEntries(
  muscleDefinitions.map((muscle) => [muscle.id, muscle.name]),
);

export const muscleCoefficients = {
  bench_press: { chest: 1.0, triceps: 0.5, front_delts: 0.5 },
  incline_bench_press: { chest: 1.0, front_delts: 0.6, triceps: 0.5 },
  dumbbell_press: { chest: 1.0, triceps: 0.4, front_delts: 0.5 },
  pushups: { chest: 1.0, triceps: 0.5, front_delts: 0.4 },
  dips: { chest: 0.8, triceps: 1.0, front_delts: 0.4 },
  overhead_press: { front_delts: 1.0, triceps: 0.7, side_delts: 0.4 },
  pullups: { lats: 1.0, biceps: 0.6, mid_back: 0.5 },
  lat_pulldown: { lats: 1.0, biceps: 0.5, mid_back: 0.4 },
  barbell_row: { mid_back: 1.0, lats: 0.7, biceps: 0.5, spinal_erectors: 0.3 },
  dumbbell_row: { lats: 1.0, mid_back: 0.6, biceps: 0.5 },
  seated_row: { mid_back: 1.0, lats: 0.7, biceps: 0.5 },
  face_pull: { rear_delts: 1.0, mid_back: 0.5, traps: 0.4 },
  back_squat: { quads: 1.0, glutes: 0.7, hamstrings: 0.3, spinal_erectors: 0.3 },
  front_squat: { quads: 1.0, glutes: 0.5, abs: 0.4, spinal_erectors: 0.3 },
  leg_press: { quads: 1.0, glutes: 0.6, hamstrings: 0.4 },
  romanian_deadlift: { hamstrings: 1.0, glutes: 0.8, spinal_erectors: 0.6 },
  lunges: { quads: 1.0, glutes: 0.8, hamstrings: 0.4 },
  leg_extension: { quads: 1.0 },
  leg_curl: { hamstrings: 1.0 },
  calf_raise: { calves: 1.0 },
  lateral_raise: { side_delts: 1.0, traps: 0.3 },
  rear_delt_fly: { rear_delts: 1.0, mid_back: 0.4, traps: 0.3 },
  plank: { abs: 1.0, spinal_erectors: 0.5 },
  hanging_leg_raise: { abs: 1.0 },
  cable_crunch: { abs: 1.0 },
};

export const exerciseDefinitions = {
  bench_press: { id: "bench_press", name: "Жим штанги лёжа" },
  incline_bench_press: { id: "incline_bench_press", name: "Жим на наклонной скамье" },
  dumbbell_press: { id: "dumbbell_press", name: "Жим гантелей" },
  pushups: { id: "pushups", name: "Отжимания" },
  dips: { id: "dips", name: "Брусья" },
  overhead_press: { id: "overhead_press", name: "Жим над головой" },
  pullups: { id: "pullups", name: "Подтягивания" },
  lat_pulldown: { id: "lat_pulldown", name: "Тяга верхнего блока" },
  barbell_row: { id: "barbell_row", name: "Тяга штанги в наклоне" },
  dumbbell_row: { id: "dumbbell_row", name: "Тяга гантели в наклоне" },
  seated_row: { id: "seated_row", name: "Горизонтальная тяга блока" },
  face_pull: { id: "face_pull", name: "Тяга к лицу" },
  back_squat: { id: "back_squat", name: "Приседания со штангой" },
  front_squat: { id: "front_squat", name: "Фронтальные приседания" },
  leg_press: { id: "leg_press", name: "Жим ногами" },
  romanian_deadlift: { id: "romanian_deadlift", name: "Румынская тяга" },
  lunges: { id: "lunges", name: "Выпады" },
  leg_extension: { id: "leg_extension", name: "Разгибания ног" },
  leg_curl: { id: "leg_curl", name: "Сгибания ног" },
  calf_raise: { id: "calf_raise", name: "Подъёмы на икры" },
  lateral_raise: { id: "lateral_raise", name: "Махи в стороны" },
  rear_delt_fly: { id: "rear_delt_fly", name: "Разведения на заднюю дельту" },
  plank: { id: "plank", name: "Планка" },
  hanging_leg_raise: { id: "hanging_leg_raise", name: "Подъёмы ног в висе" },
  cable_crunch: { id: "cable_crunch", name: "Скручивания на блоке" },
};

export const exerciseTechniqueTips = {
  bench_press: "Сведите лопатки, упирайтесь ногами в пол, контролируйте опускание штанги к середине груди.",
  incline_bench_press: "Сохраняйте стабильный прогиб и не поднимайте плечи к ушам в верхней точке.",
  dumbbell_press: "Держите нейтральные запястья и опускайте гантели до комфортной глубины без рывка.",
  pushups: "Сохраняйте прямую линию корпуса и контролируйте движение лопаток.",
  dips: "Опускайтесь до комфортной глубины, держите локти под контролем, без провала плеч.",
  overhead_press: "Сожмите ягодицы и пресс, чтобы не переразгибать поясницу.",
  pullups: "Начинайте движение со сведения лопаток, избегайте рывков корпусом.",
  lat_pulldown: "Тяните локтями вниз и назад, не заваливайте корпус сильно назад.",
  barbell_row: "Держите спину нейтральной, тяните к нижней части живота.",
  dumbbell_row: "Фиксируйте корпус, поднимайте локоть по дуге к тазу.",
  seated_row: "Сохраняйте грудь раскрытой и не округляйте поясницу.",
  face_pull: "Тяните к верхней части лица, локти ведите в стороны.",
  back_squat: "Следите за нейтральной спиной и траекторией коленей по линии носков.",
  front_squat: "Локти держите высоко, корпус — максимально вертикально.",
  leg_press: "Не отрывайте таз от спинки и не запирайте колени вверху.",
  romanian_deadlift: "Двигайтесь от таза назад, сохраняйте лёгкий сгиб коленей.",
  lunges: "Ставьте шаг достаточной длины, чтобы колено не заваливалось внутрь.",
  leg_extension: "Контролируйте эксцентрику и не бросайте вес внизу.",
  leg_curl: "Не поднимайте таз, концентрируйтесь на сгибании за счёт бицепса бедра.",
  calf_raise: "Делайте паузу внизу и вверху для полного диапазона.",
  lateral_raise: "Поднимайте руки в плоскости лопатки, без раскачки корпусом.",
  rear_delt_fly: "Держите локти слегка согнутыми и двигайтесь от плеча, не от кисти.",
  plank: "Держите таз нейтрально и сохраняйте постоянное напряжение пресса.",
  hanging_leg_raise: "Подкручивайте таз в верхней точке, а не просто поднимайте ноги.",
  cable_crunch: "Скручивайтесь за счёт пресса, не тяните вес руками.",
};

const exerciseAliases = {
  "barbell bench press": "bench_press",
  "bench press": "bench_press",
  "incline bench press": "incline_bench_press",
  "dumbbell bench press": "dumbbell_press",
  "dumbbell press": "dumbbell_press",
  "overhead press": "overhead_press",
  "pull-up": "pullups",
  "lat pulldown": "lat_pulldown",
  "barbell row": "barbell_row",
  "dumbbell row": "dumbbell_row",
  "seated cable row": "seated_row",
  "face pull": "face_pull",
  squat: "back_squat",
  "back squat": "back_squat",
  "front squat": "front_squat",
  "leg press": "leg_press",
  "romanian deadlift": "romanian_deadlift",
  "leg extension": "leg_extension",
  "leg curl": "leg_curl",
  "calf raise": "calf_raise",
  "lateral raise": "lateral_raise",
  "rear delt fly": "rear_delt_fly",
  plank: "plank",
  "hanging leg raise": "hanging_leg_raise",
  "cable crunch": "cable_crunch",
};

export function normalizeExerciseId(exerciseId) {
  const normalized = String(exerciseId ?? "").trim().toLowerCase();
  return exerciseAliases[normalized] ?? normalized;
}

export function getMuscleCoefficients(exerciseId) {
  const normalized = normalizeExerciseId(exerciseId);
  return { ...(muscleCoefficients[normalized] ?? {}) };
}

export function getTechniqueTip(exerciseId) {
  const normalized = normalizeExerciseId(exerciseId);
  return exerciseTechniqueTips[normalized] ?? "Сохраняйте контроль техники и работайте в полном комфортном диапазоне.";
}

export const EXERCISE_OPTIONS = Object.values(exerciseDefinitions).map((exercise) => ({
  value: exercise.id,
  label: exercise.name,
}));

export const EXERCISE_LABELS = Object.fromEntries(
  Object.values(exerciseDefinitions).map((item) => [item.id, item.name]),
);

export const ZONE_DEFINITIONS = [
  { id: "chest_zone", label: "Грудь", view: "front", x: 50, y: 27, muscles: ["chest"] },
  { id: "shoulders_front_zone", label: "Плечи", view: "front", x: 50, y: 18, muscles: ["front_delts", "side_delts"] },
  { id: "arms_front_zone", label: "Руки", view: "front", x: 50, y: 41, muscles: ["biceps", "triceps"] },
  { id: "core_zone", label: "Пресс", view: "front", x: 50, y: 52, muscles: ["abs"] },
  { id: "quads_zone", label: "Квадрицепсы", view: "front", x: 50, y: 70, muscles: ["quads"] },
  { id: "calves_zone", label: "Икры", view: "front", x: 50, y: 88, muscles: ["calves"] },
  {
    id: "back_zone",
    label: "Спина",
    view: "back",
    x: 50,
    y: 31,
    muscles: ["lats", "mid_back", "traps", "spinal_erectors"],
  },
  { id: "shoulders_back_zone", label: "Задняя дельта", view: "back", x: 50, y: 18, muscles: ["rear_delts"] },
  { id: "glutes_zone", label: "Ягодицы", view: "back", x: 50, y: 58, muscles: ["glutes"] },
  { id: "hamstrings_zone", label: "Бицепс бедра", view: "back", x: 50, y: 72, muscles: ["hamstrings"] },
  { id: "calves_back_zone", label: "Икры", view: "back", x: 50, y: 88, muscles: ["calves"] },
];

export function translateExercise(value) {
  const normalized = normalizeExerciseId(value);
  return EXERCISE_LABELS[normalized] ?? value;
}

export function translateMuscle(value) {
  return muscleDefinitionsMap[value] ?? value;
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateSessionMuscleLoad(exercises) {
  const loads = {};
  for (const exercise of exercises) {
    const map = getMuscleCoefficients(exercise.exercise);
    if (Object.keys(map).length === 0) continue;

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
