import {
  exerciseDefinitions,
  getMuscleCoefficients,
  getTechniqueTip,
  normalizeExerciseId,
  translateExercise,
} from "./trainingModel";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundToStep(value, step = 0.5) {
  return Math.round(value / step) * step;
}

export function estimateOneRepMax(weight, reps) {
  const w = toNumber(weight, 0);
  const r = toNumber(reps, 0);
  if (w <= 0 || r <= 0) return 0;
  return w * (1 + r / 30);
}

function buildExerciseHistory(savedWorkouts) {
  const sorted = [...savedWorkouts].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  const byExercise = {};
  for (const workout of sorted) {
    for (const exercise of workout.exercises ?? []) {
      const exerciseId = normalizeExerciseId(exercise.kind ?? exercise.exerciseId ?? exercise.name ?? "");
      const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
      if (sets.length === 0) continue;
      const avgWeight = sets.reduce((acc, setItem) => acc + toNumber(setItem.weight, 0), 0) / sets.length;
      const avgReps = sets.reduce((acc, setItem) => acc + toNumber(setItem.reps, 0), 0) / sets.length;
      const avgRir = sets.reduce((acc, setItem) => acc + toNumber(setItem.rir, 2), 0) / sets.length;
      const best1rm = Math.max(...sets.map((setItem) => estimateOneRepMax(setItem.weight, setItem.reps)), 0);

      byExercise[exerciseId] = byExercise[exerciseId] ?? [];
      byExercise[exerciseId].push({
        savedAt: workout.savedAt,
        avgWeight,
        avgReps,
        avgRir,
        best1rm,
      });
    }
  }
  return byExercise;
}

function defaultPresetForExercise(exerciseId) {
  const presets = {
    bench_press: { sets: 4, reps: 6, rir: 2, fallbackWeight: 20 },
    incline_bench_press: { sets: 4, reps: 8, rir: 2, fallbackWeight: 16 },
    dumbbell_press: { sets: 4, reps: 8, rir: 2, fallbackWeight: 14 },
    overhead_press: { sets: 4, reps: 6, rir: 2, fallbackWeight: 12 },
    pullups: { sets: 4, reps: 6, rir: 2, fallbackWeight: 1 },
    lat_pulldown: { sets: 4, reps: 8, rir: 2, fallbackWeight: 35 },
    barbell_row: { sets: 4, reps: 8, rir: 2, fallbackWeight: 30 },
    dumbbell_row: { sets: 4, reps: 10, rir: 2, fallbackWeight: 16 },
    seated_row: { sets: 3, reps: 10, rir: 2, fallbackWeight: 30 },
    face_pull: { sets: 3, reps: 12, rir: 2, fallbackWeight: 15 },
    back_squat: { sets: 4, reps: 6, rir: 2, fallbackWeight: 40 },
    front_squat: { sets: 4, reps: 6, rir: 2, fallbackWeight: 30 },
    leg_press: { sets: 4, reps: 10, rir: 2, fallbackWeight: 80 },
    romanian_deadlift: { sets: 4, reps: 8, rir: 2, fallbackWeight: 40 },
    lunges: { sets: 3, reps: 10, rir: 2, fallbackWeight: 14 },
    leg_extension: { sets: 3, reps: 12, rir: 2, fallbackWeight: 25 },
    leg_curl: { sets: 3, reps: 12, rir: 2, fallbackWeight: 25 },
    calf_raise: { sets: 4, reps: 12, rir: 2, fallbackWeight: 30 },
    lateral_raise: { sets: 3, reps: 12, rir: 2, fallbackWeight: 8 },
    rear_delt_fly: { sets: 3, reps: 12, rir: 2, fallbackWeight: 7 },
    plank: { sets: 3, reps: 1, rir: 2, fallbackWeight: 1 },
    hanging_leg_raise: { sets: 3, reps: 10, rir: 2, fallbackWeight: 1 },
    cable_crunch: { sets: 3, reps: 12, rir: 2, fallbackWeight: 20 },
  };
  return presets[exerciseId] ?? { sets: 3, reps: 10, rir: 2, fallbackWeight: 20 };
}

function targetWeightFrom1RM(oneRepMax, reps, rir) {
  if (!oneRepMax) return 0;
  const repsToFailure = reps + rir;
  return oneRepMax / (1 + repsToFailure / 30);
}

function determineExerciseList(workoutType) {
  if (workoutType === "split_upper") {
    return ["bench_press", "pullups", "overhead_press", "barbell_row", "lateral_raise", "face_pull"];
  }
  if (workoutType === "split_lower") {
    return ["back_squat", "romanian_deadlift", "leg_press", "leg_curl", "calf_raise", "cable_crunch"];
  }
  return ["back_squat", "bench_press", "barbell_row", "romanian_deadlift", "overhead_press", "cable_crunch"];
}

function calculateConservativeWeight(exerciseId, historyRows, preset) {
  const last = historyRows?.[0];
  const oneRepMax = Math.max(...(historyRows ?? []).map((row) => row.best1rm), 0);
  const from1RM = targetWeightFrom1RM(oneRepMax, preset.reps, preset.rir);

  if (!last && !from1RM) {
    return {
      weight: preset.fallbackWeight,
      estimatedOneRepMax: 0,
      note: "Базовый стартовый вес: начните консервативно и отслеживайте RIR 1–3.",
    };
  }

  if (!last) {
    return {
      weight: roundToStep(from1RM),
      estimatedOneRepMax: oneRepMax,
      note: "Вес рассчитан от ориентировочного 1ПМ с запасом по RIR 1–3.",
    };
  }

  let progressionWeight = last.avgWeight;
  let note = "Сохранён консервативный шаг прогрессии.";
  if (last.avgRir >= 3) {
    progressionWeight = last.avgWeight * 1.03;
    note = "Последняя тренировка была лёгкой — добавлено ~3% к весу.";
  } else if (last.avgRir >= 2) {
    progressionWeight = last.avgWeight * 1.02;
    note = "Добавлено ~2% к весу при комфортном RIR.";
  } else if (last.avgRir < 1) {
    progressionWeight = last.avgWeight * 0.95;
    note = "Прошлая нагрузка была тяжёлой — рекомендовано снизить вес на ~5%.";
  } else if (last.avgRir < 1.5) {
    progressionWeight = last.avgWeight * 0.98;
    note = "Слишком высокий стресс — небольшое снижение веса для восстановления.";
  }

  let candidate = progressionWeight;
  if (from1RM > 0) {
    const lower = from1RM * 0.9;
    const upper = from1RM * 1.05;
    candidate = Math.min(upper, Math.max(lower, progressionWeight));
  }

  candidate = Math.min(candidate, last.avgWeight * 1.05);
  candidate = Math.max(candidate, last.avgWeight * 0.9);

  return {
    weight: roundToStep(candidate),
    estimatedOneRepMax: oneRepMax || estimateOneRepMax(last.avgWeight, Math.max(1, Math.round(last.avgReps))),
    note,
  };
}

export function suggestWorkoutFromHistory(savedWorkouts, workoutType = "fullbody") {
  const byExercise = buildExerciseHistory(savedWorkouts ?? []);
  const targetExerciseIds = determineExerciseList(workoutType);

  const suggestedExercises = targetExerciseIds.map((exerciseId) => {
    const preset = defaultPresetForExercise(exerciseId);
    const history = byExercise[exerciseId] ?? [];
    const progression = calculateConservativeWeight(exerciseId, history, preset);

    return {
      exerciseId,
      name: translateExercise(exerciseId),
      sets: preset.sets,
      reps: preset.reps,
      targetRir: preset.rir,
      targetWeight: progression.weight,
      estimatedOneRepMax: roundToStep(progression.estimatedOneRepMax, 0.5),
      progressionNote: progression.note,
      techniqueTip: getTechniqueTip(exerciseId),
      muscleCoefficients: getMuscleCoefficients(exerciseId),
    };
  });

  return {
    workoutType,
    title:
      workoutType === "split_upper"
        ? "Рекомендация: split верх"
        : workoutType === "split_lower"
          ? "Рекомендация: split низ"
          : "Рекомендация: fullbody",
    principles: [
      "Постепенная прогрессия нагрузки без резких скачков веса и объёма.",
      "Консервативный шаг, который можно поддерживать месяцами.",
      "Целевой запас в большинстве подходов: RIR 1–3.",
    ],
    suggestedExercises,
  };
}

export function assessCurrentWorkoutHeaviness(currentExercises, savedWorkouts) {
  const byExercise = buildExerciseHistory(savedWorkouts ?? []);
  const warnings = [];

  for (const exercise of currentExercises ?? []) {
    const exerciseId = normalizeExerciseId(exercise.kind ?? exercise.exercise ?? "");
    const sets = exercise.sets ?? [];
    if (sets.length === 0) continue;

    const avgRir = sets.reduce((acc, setItem) => acc + toNumber(setItem.rir, 2), 0) / sets.length;
    const avgWeight = sets.reduce((acc, setItem) => acc + toNumber(setItem.weight, 0), 0) / sets.length;
    const last = byExercise[exerciseId]?.[0];

    if (avgRir < 1) {
      warnings.push(`${translateExercise(exerciseId)}: средний RIR ниже 1 — нагрузка вероятно чрезмерная.`);
    }
    if (last && avgWeight > last.avgWeight * 1.08) {
      warnings.push(
        `${translateExercise(exerciseId)}: вес >8% относительно последней сессии — лучше сохранить или снизить нагрузку.`,
      );
    }
  }

  const recommendation =
    warnings.length > 0
      ? "Программа выглядит тяжёлой. Рекомендуется сохранить текущий уровень или немного снизить нагрузку."
      : "Текущая программа в допустимом диапазоне. Поддерживайте RIR 1–3.";

  return { warnings, recommendation };
}
