import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Circle, Dumbbell, Info, Plus, Trash2 } from "lucide-react";

import { getExerciseCatalog, getMyProfile } from "../api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  exerciseDefinitions,
  getMuscleCoefficients,
  getTechniqueTip,
  translateExercise,
  translateMuscle,
} from "../utils/trainingModel";
import { assessCurrentWorkoutHeaviness, suggestWorkoutFromHistory } from "../utils/trainingPlanner";

const DEFAULT_SET_PRESETS = {
  bench_press: { weight: 20, reps: 10, rir: 2 },
  pullups: { weight: 1, reps: 10, rir: 2 },
};

function createSet(weight = 20, reps = 10, rir = 2, completed = false) {
  return {
    id: crypto.randomUUID(),
    weight,
    reps,
    rir,
    completed,
  };
}

function createExercise(kind, targetSets = 2) {
  const preset = DEFAULT_SET_PRESETS[kind] ?? { weight: 20, reps: 10, rir: 2 };
  return {
    id: crypto.randomUUID(),
    kind,
    targetSets,
    sets: Array.from({ length: targetSets }, () =>
      createSet(preset.weight, preset.reps, preset.rir, false),
    ),
  };
}

function initialExercises() {
  return [];
}

function setLoad(setItem) {
  return Math.round(Number(setItem.weight) * Number(setItem.reps) * 0.8);
}

function normalizeSex(value) {
  return value === "male" ? "male" : "female";
}

function colorByTargetRatio(ratio, hasTarget) {
  if (!hasTarget) return "#cbd5e1";
  if (ratio < 0.7) return "#f59e0b";
  if (ratio <= 1.1) return "#10b981";
  if (ratio <= 1.3) return "#f97316";
  return "#ef4444";
}

function ExerciseCard({
  exercise,
  resolveExerciseName,
  resolveMuscleCoefficients,
  resolveTechniqueTip,
  onToggleSet,
  onChangeSet,
  onAddSet,
  onDeleteExercise,
}) {
  const coefficients = resolveMuscleCoefficients(exercise.kind);
  const sortedMuscles = Object.entries(coefficients).sort((a, b) => b[1] - a[1]);
  const primary = sortedMuscles
    .filter(([, coefficient]) => coefficient >= 0.9)
    .map(([muscleId]) => translateMuscle(muscleId));
  const secondary = sortedMuscles
    .filter(([, coefficient]) => coefficient < 0.9)
    .slice(0, 3)
    .map(([muscleId]) => translateMuscle(muscleId));
  const techniqueTip = resolveTechniqueTip(exercise.kind);
  const completedCount = exercise.sets.filter((setItem) => setItem.completed).length;
  const setLoadHint = "Нагрузка подхода = вес × повторы × 0.8";

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-[34px] leading-none tracking-tight md:text-2xl">
              <span className="inline-flex cursor-help items-center gap-2" title={techniqueTip}>
                {resolveExerciseName(exercise.kind)}
                <Info className="h-4 w-4 text-slate-400" />
              </span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">
                Основные: {(primary.length > 0 ? primary : [secondary[0] ?? "—"]).join(", ")}
              </Badge>
              <Badge variant="secondary">
                Вторичные: {(secondary.length > 0 ? secondary : ["—"]).join(", ")}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm font-semibold text-slate-600">
              {completedCount}/{exercise.targetSets}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={onDeleteExercise}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200">
              <TableHead>Статус</TableHead>
              <TableHead>Вес (кг)</TableHead>
              <TableHead>Повторы</TableHead>
              <TableHead>RIR</TableHead>
              <TableHead className="text-right">
                <span className="inline-flex items-center justify-end gap-1" title={setLoadHint}>
                  Нагрузка
                  <Info className="h-3.5 w-3.5 text-slate-500" />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercise.sets.map((setItem, index) => (
              <TableRow
                key={setItem.id}
                className={setItem.completed ? "border-transparent bg-emerald-50/90" : "bg-slate-50/90"}
              >
                <TableCell>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-slate-700"
                    onClick={() => onToggleSet(index)}
                  >
                    {setItem.completed ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-400" />
                    )}
                    <span>Подход {index + 1}</span>
                  </button>
                </TableCell>

                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={setItem.weight}
                    onChange={(event) => onChangeSet(index, "weight", event.target.value)}
                    className="h-9 rounded-lg border-slate-200 bg-white text-center font-semibold"
                  />
                </TableCell>

                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={setItem.reps}
                    onChange={(event) => onChangeSet(index, "reps", event.target.value)}
                    className="h-9 rounded-lg border-slate-200 bg-white text-center font-semibold"
                  />
                </TableCell>

                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={setItem.rir}
                    onChange={(event) => onChangeSet(index, "rir", event.target.value)}
                    className="h-9 rounded-lg border-slate-200 bg-white text-center font-semibold"
                  />
                </TableCell>

                <TableCell className="text-right text-lg font-bold text-slate-600">
                  {setLoad(setItem)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button
          variant="outline"
          className="h-11 w-full rounded-xl border-slate-300 bg-white text-base font-semibold text-slate-700"
          onClick={onAddSet}
        >
          <Plus className="h-4 w-4" />
          Добавить подход
        </Button>
      </CardContent>
    </Card>
  );
}

function buildMuscleProgress(exercises, resolveMuscleCoefficients) {
  const loads = {};
  for (const exercise of exercises) {
    const map = resolveMuscleCoefficients(exercise.kind);
    for (const setItem of exercise.sets) {
      const exerciseLoad = setLoad(setItem);
      for (const [muscle, coefficient] of Object.entries(map)) {
        const weighted = exerciseLoad * coefficient;
        loads[muscle] = loads[muscle] || { planned: 0, completed: 0 };
        loads[muscle].planned += weighted;
        if (setItem.completed) {
          loads[muscle].completed += weighted;
        }
      }
    }
  }
  return Object.fromEntries(
    Object.entries(loads).map(([muscle, row]) => [
      muscle,
      {
        planned: Math.round(row.planned),
        completed: Math.round(row.completed),
        ratio: row.planned > 0 ? row.completed / row.planned : 0,
      },
    ]),
  );
}

function mirroredPair(cxLeft, cxRight, cy, rx, ry) {
  return [
    { cx: cxLeft, cy, rx, ry },
    { cx: cxRight, cy, rx, ry },
  ];
}

const MUSCLE_LAYOUTS = {
  female: {
    front: {
      front_delts: mirroredPair(88, 172, 95, 16, 12),
      side_delts: mirroredPair(73, 187, 105, 10, 15),
      chest: mirroredPair(95, 165, 132, 18, 14),
      biceps: mirroredPair(70, 190, 152, 11, 16),
      triceps: mirroredPair(64, 196, 170, 9, 16),
      abs: [
        { cx: 130, cy: 175, rx: 16, ry: 34 },
        { cx: 130, cy: 220, rx: 14, ry: 26 },
      ],
      quads: mirroredPair(105, 155, 298, 17, 48),
      calves: mirroredPair(106, 154, 410, 12, 34),
    },
    back: {
      rear_delts: mirroredPair(86, 174, 101, 14, 12),
      traps: [{ cx: 130, cy: 112, rx: 24, ry: 16 }],
      triceps: mirroredPair(66, 194, 162, 10, 16),
      lats: mirroredPair(93, 167, 170, 17, 34),
      mid_back: [{ cx: 130, cy: 176, rx: 18, ry: 30 }],
      spinal_erectors: [{ cx: 130, cy: 210, rx: 10, ry: 38 }],
      glutes: mirroredPair(108, 152, 267, 20, 18),
      hamstrings: mirroredPair(108, 152, 332, 16, 44),
      calves: mirroredPair(106, 154, 410, 12, 34),
    },
  },
  male: {
    front: {
      front_delts: mirroredPair(84, 176, 92, 18, 13),
      side_delts: mirroredPair(69, 191, 104, 11, 16),
      chest: mirroredPair(96, 164, 132, 22, 16),
      biceps: mirroredPair(66, 194, 155, 12, 18),
      triceps: mirroredPair(60, 200, 175, 10, 17),
      abs: [
        { cx: 130, cy: 179, rx: 18, ry: 36 },
        { cx: 130, cy: 225, rx: 16, ry: 28 },
      ],
      quads: mirroredPair(104, 156, 302, 19, 50),
      calves: mirroredPair(104, 156, 412, 13, 35),
    },
    back: {
      rear_delts: mirroredPair(84, 176, 98, 16, 12),
      traps: [{ cx: 130, cy: 111, rx: 26, ry: 17 }],
      triceps: mirroredPair(62, 198, 165, 11, 17),
      lats: mirroredPair(92, 168, 172, 19, 36),
      mid_back: [{ cx: 130, cy: 180, rx: 20, ry: 32 }],
      spinal_erectors: [{ cx: 130, cy: 215, rx: 11, ry: 40 }],
      glutes: mirroredPair(107, 153, 270, 21, 19),
      hamstrings: mirroredPair(107, 153, 336, 17, 45),
      calves: mirroredPair(104, 156, 412, 13, 35),
    },
  },
};

function FigureBackground({ sex }) {
  const isMale = sex === "male";
  return (
    <>
      <circle cx="130" cy="46" r={isMale ? 24 : 22} fill="#e2e8f0" />
      <rect x={isMale ? 93 : 98} y="72" width={isMale ? 74 : 64} height={isMale ? 176 : 170} rx="30" fill="#e2e8f0" />
      <rect x={isMale ? 70 : 74} y="86" width={isMale ? 22 : 20} height={isMale ? 170 : 164} rx="10" fill="#e2e8f0" />
      <rect x={isMale ? 168 : 166} y="86" width={isMale ? 22 : 20} height={isMale ? 170 : 164} rx="10" fill="#e2e8f0" />
      <rect x={isMale ? 98 : 102} y="248" width={isMale ? 24 : 22} height="210" rx="12" fill="#e2e8f0" />
      <rect x={isMale ? 138 : 136} y="248" width={isMale ? 24 : 22} height="210" rx="12" fill="#e2e8f0" />
    </>
  );
}

function HumanMuscleFigure({ sex = "female", view = "front", muscleProgress = {} }) {
  const safeSex = normalizeSex(sex);
  const shapes = MUSCLE_LAYOUTS[safeSex][view];

  return (
    <svg viewBox="0 0 260 480" className="h-[480px] w-full rounded-xl border border-slate-200 bg-slate-50">
      <FigureBackground sex={safeSex} />
      {Object.entries(shapes).map(([muscleId, ellipses]) => {
        const progress = muscleProgress[muscleId] || { planned: 0, completed: 0, ratio: 0 };
        const fill = colorByTargetRatio(progress.ratio, progress.planned > 0);
        const ratioPct = progress.planned > 0 ? Math.round(progress.ratio * 100) : 0;
        return (
          <g key={`${view}-${muscleId}`}>
            <title>
              {translateMuscle(muscleId)}: {progress.completed} / {progress.planned} ({ratioPct}% от цели)
            </title>
            {ellipses.map((shape, idx) => (
              <ellipse
                key={`${view}-${muscleId}-${idx}`}
                cx={shape.cx}
                cy={shape.cy}
                rx={shape.rx}
                ry={shape.ry}
                fill={fill}
                fillOpacity="0.9"
                stroke="#334155"
                strokeOpacity="0.2"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export default function WorkoutDiaryPage({ authToken, onSaveWorkout, savedWorkouts = [] }) {
  const [exercises, setExercises] = useState(initialExercises);
  const [exerciseCatalogItems, setExerciseCatalogItems] = useState([]);
  const [userSex, setUserSex] = useState("female");
  const [exerciseToAdd, setExerciseToAdd] = useState("bench_press");
  const [suggestedType, setSuggestedType] = useState("fullbody");
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [suggestMessage, setSuggestMessage] = useState("");
  const muscleLoadHint =
    "Целевая нагрузка мышцы = сумма по всем запланированным подходам: (вес × повторы × 0.8 × коэффициент мышцы). Текущая нагрузка считается только по выполненным подходам.";

  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      try {
        const response = await getExerciseCatalog();
        if (!active) return;
        setExerciseCatalogItems(Array.isArray(response?.items) ? response.items : []);
      } catch {
        if (!active) return;
        setExerciseCatalogItems([]);
      }
    }
    loadCatalog();
    return () => {
      active = false;
    };
  }, [authToken]);

  useEffect(() => {
    let active = true;
    async function loadProfileSex() {
      try {
        const profile = await getMyProfile(authToken);
        if (!active) return;
        setUserSex(normalizeSex(profile?.sex));
      } catch {
        if (!active) return;
        setUserSex("female");
      }
    }
    loadProfileSex();
    return () => {
      active = false;
    };
  }, [authToken]);

  const mergedCatalog = useMemo(() => {
    const merged = {};
    for (const item of Object.values(exerciseDefinitions)) {
      merged[item.id] = {
        id: item.id,
        name: item.name,
        muscles: getMuscleCoefficients(item.id),
        technique_tip: getTechniqueTip(item.id),
      };
    }
    for (const item of exerciseCatalogItems) {
      merged[item.id] = {
        id: item.id,
        name: item.name,
        muscles: item.muscles ?? {},
        technique_tip: item.technique_tip ?? null,
      };
    }
    return merged;
  }, [exerciseCatalogItems]);

  const exerciseOptions = useMemo(
    () =>
      Object.values(mergedCatalog).sort((a, b) =>
        String(a.name || a.id).localeCompare(String(b.name || b.id), "ru-RU"),
      ),
    [mergedCatalog],
  );

  useEffect(() => {
    if (exerciseOptions.length === 0) return;
    if (!exerciseToAdd || !mergedCatalog[exerciseToAdd]) {
      setExerciseToAdd(exerciseOptions[0].id);
    }
  }, [exerciseOptions, exerciseToAdd, mergedCatalog]);

  const resolveExerciseName = useMemo(
    () => (exerciseId) => mergedCatalog[exerciseId]?.name ?? translateExercise(exerciseId),
    [mergedCatalog],
  );

  const resolveMuscleCoefficients = useMemo(
    () => (exerciseId) => ({ ...(mergedCatalog[exerciseId]?.muscles ?? getMuscleCoefficients(exerciseId)) }),
    [mergedCatalog],
  );

  const resolveTechniqueTip = useMemo(
    () =>
      (exerciseId) =>
        mergedCatalog[exerciseId]?.technique_tip ??
        getTechniqueTip(exerciseId) ??
        "Сохраняйте контроль техники в каждом повторении.",
    [mergedCatalog],
  );

  const totals = useMemo(() => {
    const totalPlannedSets = exercises.reduce((acc, exercise) => acc + exercise.targetSets, 0);
    const completedSets = exercises.reduce(
      (acc, exercise) => acc + exercise.sets.filter((setItem) => setItem.completed).length,
      0,
    );
    const progressPercent = totalPlannedSets > 0 ? Math.round((completedSets / totalPlannedSets) * 100) : 0;
    return {
      exercisesCount: exercises.length,
      totalPlannedSets,
      completedSets,
      progressPercent,
    };
  }, [exercises]);

  const muscleProgress = useMemo(
    () => buildMuscleProgress(exercises, resolveMuscleCoefficients),
    [exercises, resolveMuscleCoefficients],
  );
  const muscleProgressRows = useMemo(
    () =>
      Object.entries(muscleProgress)
        .sort((a, b) => b[1].planned - a[1].planned)
        .slice(0, 12),
    [muscleProgress],
  );
  const suggestedWorkout = useMemo(
    () => suggestWorkoutFromHistory(savedWorkouts, suggestedType, { exerciseCatalog: mergedCatalog }),
    [savedWorkouts, suggestedType, mergedCatalog],
  );
  const heavinessAssessment = useMemo(
    () => assessCurrentWorkoutHeaviness(exercises, savedWorkouts, { exerciseCatalog: mergedCatalog }),
    [exercises, savedWorkouts, mergedCatalog],
  );

  function toggleSetCompleted(exerciseId, setIndex) {
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((setItem, idx) =>
                idx === setIndex ? { ...setItem, completed: !setItem.completed } : setItem,
              ),
            }
          : exercise,
      ),
    );
  }

  function changeSet(exerciseId, setIndex, field, value) {
    const numericValue = Number(value);
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((setItem, idx) =>
                idx === setIndex
                  ? {
                      ...setItem,
                      [field]: Number.isFinite(numericValue) ? numericValue : 0,
                    }
                  : setItem,
              ),
            }
          : exercise,
      ),
    );
  }

  function addSet(exerciseId) {
    setExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const last = exercise.sets[exercise.sets.length - 1] || createSet();
        return {
          ...exercise,
          targetSets: exercise.targetSets + 1,
          sets: [...exercise.sets, createSet(last.weight, last.reps, last.rir, false)],
        };
      }),
    );
  }

  function deleteExercise(exerciseId) {
    setExercises((prev) => prev.filter((exercise) => exercise.id !== exerciseId));
  }

  function addExercise() {
    if (!exerciseToAdd) return;
    setExercises((prev) => [...prev, createExercise(exerciseToAdd, 2)]);
    setSaveError("");
  }

  function applySuggestedWorkout() {
    const nextExercises = suggestedWorkout.suggestedExercises.map((item) => ({
      id: crypto.randomUUID(),
      kind: item.exerciseId,
      targetSets: item.sets,
      sets: Array.from({ length: item.sets }, () =>
        createSet(item.targetWeight, item.reps, item.targetRir, false),
      ),
    }));
    setExercises(nextExercises);
    setWorkoutTitle(suggestedWorkout.title);
    setSuggestMessage(suggestedWorkout.sourceLabel);
    setSaveError("");
  }

  function createWorkoutSnapshot() {
    const totalLoad = exercises.reduce(
      (acc, exercise) =>
        acc + exercise.sets.reduce((setAcc, setItem) => setAcc + setLoad(setItem), 0),
      0,
    );

    return {
      id: crypto.randomUUID(),
      title: workoutTitle.trim() || "Тренировка",
      savedAt: new Date().toISOString(),
      durationMinutes: Math.max(20, totals.totalPlannedSets * 2),
      totalLoad: Math.round(totalLoad),
      exercises: exercises.map((exercise) => ({
        exerciseId: exercise.id,
        kind: exercise.kind,
        name: resolveExerciseName(exercise.kind),
        setsCount: exercise.sets.length,
        completedSets: exercise.sets.filter((setItem) => setItem.completed).length,
        load: Math.round(exercise.sets.reduce((acc, setItem) => acc + setLoad(setItem), 0)),
        muscleCoefficients: resolveMuscleCoefficients(exercise.kind),
        sets: exercise.sets.map((setItem) => ({
          weight: Number(setItem.weight),
          reps: Number(setItem.reps),
          rir: Number(setItem.rir),
          completed: Boolean(setItem.completed),
        })),
      })),
      muscleLoads: Object.entries(muscleProgress).map(([muscle, row]) => ({
        muscle: translateMuscle(muscle),
        load: row.completed,
        targetLoad: row.planned,
        targetRatio: row.ratio,
      })),
    };
  }

  function handleSaveWorkout() {
    if (exercises.length === 0) {
      setSaveError("Тренировка пустая. Добавьте хотя бы одно упражнение перед сохранением.");
      setSaveMessage("");
      return;
    }
    const snapshot = createWorkoutSnapshot();
    onSaveWorkout?.(snapshot);
    setSaveMessage(`Тренировка «${snapshot.title}» сохранена.`);
    setSaveError("");
  }

  return (
    <div className="min-h-screen bg-slate-100 p-3 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Умный дневник тренировок</h1>
              <p className="text-sm text-slate-500">Отслеживайте прогресс и нагрузку</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 text-sm font-medium text-slate-600">
            <CalendarDays className="h-4 w-4" />
            {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Упражнений</p>
              <p className="mt-1 text-4xl font-bold leading-none text-slate-900">{totals.exercisesCount}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Подходов выполнено</p>
              <p className="mt-1 text-4xl font-bold leading-none text-slate-900">
                {totals.completedSets} / {totals.totalPlannedSets}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-slate-500">Прогресс</p>
                <span className="text-2xl font-bold text-slate-900">{totals.progressPercent}%</span>
              </div>
              <Progress value={totals.progressPercent} className="h-3 bg-slate-200" />
            </CardContent>
          </Card>
        </section>

        <Card className="rounded-2xl">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Управление тренировкой</p>
              <p className="text-base font-semibold text-slate-900">Добавьте новое упражнение в текущую сессию</p>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <Input
                value={workoutTitle}
                onChange={(event) => setWorkoutTitle(event.target.value)}
                placeholder="Название тренировки"
                className="h-10 min-w-[220px]"
              />
              <select
                value={exerciseToAdd}
                onChange={(event) => setExerciseToAdd(event.target.value)}
                className="h-10 min-w-[240px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {exerciseOptions.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <Button className="h-10" onClick={addExercise}>
                <Plus className="h-4 w-4" />
                Добавить упражнение
              </Button>
              <Button className="h-10 inline-flex items-center gap-1" onClick={handleSaveWorkout} title="В историю сохраняются все подходы, веса и RIR">
                Сохранить тренировку
              </Button>
              <select
                value={suggestedType}
                onChange={(event) => setSuggestedType(event.target.value)}
                className="h-10 min-w-[180px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="split_upper">split верх</option>
                <option value="split_lower">split низ</option>
                <option value="fullbody">fullbody</option>
              </select>
              <Button variant="outline" className="h-10" onClick={applySuggestedWorkout}>
                Предложить следующую
              </Button>
            </div>
          </CardContent>
        </Card>

        {suggestMessage && (
          <Card className="rounded-2xl border-blue-200 bg-blue-50">
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-semibold text-blue-900">{suggestMessage}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-blue-800">
                {suggestedWorkout.principles.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {heavinessAssessment.warnings.length > 0 && (
          <Card className="rounded-2xl border-amber-200 bg-amber-50">
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-semibold text-amber-800">
                Обнаружены признаки слишком тяжёлой программы
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
                {heavinessAssessment.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              <p className="text-sm font-medium text-amber-900">{heavinessAssessment.recommendation}</p>
            </CardContent>
          </Card>
        )}

        {saveMessage && (
          <Card className="rounded-2xl border-emerald-200 bg-emerald-50">
            <CardContent className="p-3 text-sm font-medium text-emerald-700">{saveMessage}</CardContent>
          </Card>
        )}
        {saveError && (
          <Card className="rounded-2xl border-red-200 bg-red-50">
            <CardContent className="p-3 text-sm font-medium text-red-700">{saveError}</CardContent>
          </Card>
        )}

        {exercises.length === 0 && (
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6 text-sm text-slate-600">
              Текущая тренировка пустая. Добавьте упражнение вручную или нажмите «Предложить следующую».
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4 lg:grid-cols-[1.85fr_1fr]">
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                resolveExerciseName={resolveExerciseName}
                resolveMuscleCoefficients={resolveMuscleCoefficients}
                resolveTechniqueTip={resolveTechniqueTip}
                onToggleSet={(setIndex) => toggleSetCompleted(exercise.id, setIndex)}
                onChangeSet={(setIndex, field, value) => changeSet(exercise.id, setIndex, field, value)}
                onAddSet={() => addSet(exercise.id)}
                onDeleteExercise={() => deleteExercise(exercise.id)}
              />
            ))}
          </div>

          <Card className="h-fit rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl text-slate-900">
                <span className="inline-flex items-center gap-2" title={muscleLoadHint}>
                  Нагрузка на мышечные группы
                  <Info className="h-4 w-4 text-slate-500" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {muscleProgressRows.length === 0 && (
                <p className="text-sm text-slate-500">Пока нет нагрузки: добавьте упражнения и подходы.</p>
              )}
              <div className="grid gap-3 xl:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Вид спереди</p>
                  <HumanMuscleFigure sex={userSex} view="front" muscleProgress={muscleProgress} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Вид сзади</p>
                  <HumanMuscleFigure sex={userSex} view="back" muscleProgress={muscleProgress} />
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-3">
                {muscleProgressRows.map(([muscle, row]) => (
                  <div key={muscle} className="flex items-center justify-between text-sm text-slate-700">
                    <span>{translateMuscle(muscle)}</span>
                    <span className="font-medium">
                      {row.completed} / {row.planned} ({Math.round(row.ratio * 100)}%)
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-6 border-t border-slate-200 pt-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  &lt; 70% цели (недобор)
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  70–110% (целевая зона)
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  110–130% (выше цели)
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  &gt; 130% (перегруз)
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
