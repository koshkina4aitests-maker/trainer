import { useMemo, useState } from "react";
import { CalendarDays, Check, Circle, Dumbbell, Plus, Trash2 } from "lucide-react";

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
  return [
    {
      ...createExercise("bench_press", 2),
      sets: [createSet(20, 10, 2, true), createSet(20, 10, 2, true)],
    },
    createExercise("pullups", 2),
  ];
}

function setLoad(setItem) {
  return Math.round(Number(setItem.weight) * Number(setItem.reps) * 0.8);
}

function loadColorClass(ratio) {
  if (ratio < 0.55) return "bg-emerald-500";
  if (ratio < 0.8) return "bg-amber-500";
  return "bg-red-500";
}

function dotColorClass(ratio) {
  if (ratio < 0.55) return "bg-emerald-500";
  if (ratio < 0.8) return "bg-amber-500";
  return "bg-red-500";
}

function ExerciseCard({ exercise, canDelete, onToggleSet, onChangeSet, onAddSet, onDeleteExercise }) {
  const coefficients = getMuscleCoefficients(exercise.kind);
  const sortedMuscles = Object.entries(coefficients).sort((a, b) => b[1] - a[1]);
  const primary = sortedMuscles
    .filter(([, coefficient]) => coefficient >= 0.9)
    .map(([muscleId]) => translateMuscle(muscleId));
  const secondary = sortedMuscles
    .filter(([, coefficient]) => coefficient < 0.9)
    .slice(0, 3)
    .map(([muscleId]) => translateMuscle(muscleId));
  const techniqueTip = getTechniqueTip(exercise.kind);
  const completedCount = exercise.sets.filter((setItem) => setItem.completed).length;

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-[34px] leading-none tracking-tight md:text-2xl">
              {translateExercise(exercise.kind)}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">
                Основные: {(primary.length > 0 ? primary : [secondary[0] ?? "—"]).join(", ")}
              </Badge>
              <Badge variant="secondary">
                Вторичные: {(secondary.length > 0 ? secondary : ["—"]).join(", ")}
              </Badge>
            </div>
            <p className="max-w-3xl text-sm text-slate-600">
              <span className="font-semibold">Подсказка по технике:</span> {techniqueTip}
            </p>
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
              disabled={!canDelete}
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
              <TableHead className="text-right">Нагрузка</TableHead>
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

function buildMuscleLoads(exercises) {
  const loads = {};
  for (const exercise of exercises) {
    const map = getMuscleCoefficients(exercise.kind);
    for (const setItem of exercise.sets) {
      const exerciseLoad = setLoad(setItem);
      for (const [muscle, coefficient] of Object.entries(map)) {
        loads[muscle] = (loads[muscle] || 0) + exerciseLoad * coefficient;
      }
    }
  }
  return Object.entries(loads)
    .map(([muscle, load]) => [muscle, Math.round(load)])
    .sort((a, b) => b[1] - a[1]);
}

export default function WorkoutDiaryPage({ onSaveWorkout, savedWorkouts = [] }) {
  const [exercises, setExercises] = useState(initialExercises);
  const [exerciseToAdd, setExerciseToAdd] = useState("bench_press");
  const [suggestedType, setSuggestedType] = useState("fullbody");
  const [workoutTitle, setWorkoutTitle] = useState("Силовая тренировка");
  const [saveMessage, setSaveMessage] = useState("");

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

  const muscleLoads = useMemo(() => buildMuscleLoads(exercises), [exercises]);
  const maxLoad = muscleLoads[0]?.[1] || 1;
  const suggestedWorkout = useMemo(
    () => suggestWorkoutFromHistory(savedWorkouts, suggestedType),
    [savedWorkouts, suggestedType],
  );
  const heavinessAssessment = useMemo(
    () => assessCurrentWorkoutHeaviness(exercises, savedWorkouts),
    [exercises, savedWorkouts],
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
    setExercises((prev) => (prev.length > 1 ? prev.filter((exercise) => exercise.id !== exerciseId) : prev));
  }

  function addExercise() {
    setExercises((prev) => [...prev, createExercise(exerciseToAdd, 2)]);
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
        name: translateExercise(exercise.kind),
        setsCount: exercise.sets.length,
        completedSets: exercise.sets.filter((setItem) => setItem.completed).length,
        load: Math.round(exercise.sets.reduce((acc, setItem) => acc + setLoad(setItem), 0)),
        sets: exercise.sets.map((setItem) => ({
          weight: Number(setItem.weight),
          reps: Number(setItem.reps),
          rir: Number(setItem.rir),
          completed: Boolean(setItem.completed),
        })),
      })),
      muscleLoads: muscleLoads.map(([muscle, load]) => ({
        muscle: translateMuscle(muscle),
        load,
      })),
    };
  }

  function handleSaveWorkout() {
    const snapshot = createWorkoutSnapshot();
    onSaveWorkout?.(snapshot);
    setSaveMessage(`Тренировка «${snapshot.title}» сохранена.`);
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
                {Object.values(exerciseDefinitions).map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <Button className="h-10" onClick={addExercise}>
                <Plus className="h-4 w-4" />
                Добавить упражнение
              </Button>
              <Button className="h-10" onClick={handleSaveWorkout}>
                Сохранить тренировку
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-slate-900">Предложение тренировки на базе предыдущих</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <select
                value={suggestedType}
                onChange={(event) => setSuggestedType(event.target.value)}
                className="h-10 min-w-[220px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="split_upper">split верх</option>
                <option value="split_lower">split низ</option>
                <option value="fullbody">fullbody</option>
              </select>
              <Button variant="outline" className="h-10" onClick={applySuggestedWorkout}>
                Применить предложение
              </Button>
            </div>

            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              {suggestedWorkout.principles.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>

            <div className="grid gap-2 md:grid-cols-2">
              {suggestedWorkout.suggestedExercises.map((item) => (
                <div key={item.exerciseId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  <p className="text-sm text-slate-600">
                    {item.sets}×{item.reps} · вес {item.targetWeight} кг · целевой RIR {item.targetRir}
                  </p>
                  <p className="text-xs text-slate-500">Оценка 1ПМ: {item.estimatedOneRepMax} кг</p>
                  <p className="mt-1 text-xs text-slate-500">{item.progressionNote}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    <span className="font-medium">Техника:</span> {item.techniqueTip}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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

        <section className="grid gap-4 lg:grid-cols-[1.85fr_1fr]">
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                canDelete={exercises.length > 1}
                onToggleSet={(setIndex) => toggleSetCompleted(exercise.id, setIndex)}
                onChangeSet={(setIndex, field, value) => changeSet(exercise.id, setIndex, field, value)}
                onAddSet={() => addSet(exercise.id)}
                onDeleteExercise={() => deleteExercise(exercise.id)}
              />
            ))}
          </div>

          <Card className="h-fit rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl text-slate-900">Нагрузка на мышечные группы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {muscleLoads.map(([muscle, load]) => {
                const ratio = load / maxLoad;
                const width = Math.max(4, Math.round(ratio * 100));
                return (
                  <div key={muscle} className="space-y-2">
                    <div className="flex items-center justify-between text-base">
                      <span className="font-medium text-slate-700">{translateMuscle(muscle)}</span>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-semibold">{load}</span>
                        <span className={`h-2.5 w-2.5 rounded-full ${dotColorClass(ratio)}`} />
                      </div>
                    </div>
                    <Progress
                      value={width}
                      className="h-2 bg-slate-200"
                      indicatorClassName={loadColorClass(ratio)}
                    />
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center gap-6 border-t border-slate-200 pt-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Низкая
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Средняя
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Высокая
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
