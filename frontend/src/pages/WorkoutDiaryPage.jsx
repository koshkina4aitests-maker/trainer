import { useMemo, useState } from "react";
import { CalendarDays, Check, Circle, Dumbbell, Plus, Trash2 } from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

const EXERCISE_LIBRARY = {
  bench: {
    name: "Жим штанги лёжа",
    primary: ["Грудь"],
    secondary: ["Трицепс", "Плечи"],
    muscleCoefficients: {
      Грудь: 1,
      Трицепс: 0.5,
      Плечи: 0.5,
    },
  },
  pullup: {
    name: "Подтягивания",
    primary: ["Спина"],
    secondary: ["Бицепс", "Плечи"],
    muscleCoefficients: {
      Спина: 1,
      Бицепс: 0.5,
      Плечи: 0.5,
    },
  },
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

function initialExercises() {
  return [
    {
      id: crypto.randomUUID(),
      kind: "bench",
      targetSets: 2,
      sets: [createSet(20, 10, 2, true), createSet(20, 10, 2, true)],
    },
    {
      id: crypto.randomUUID(),
      kind: "pullup",
      targetSets: 2,
      sets: [createSet(1, 10, 2, false), createSet(1, 10, 2, false)],
    },
  ];
}

function setLoad(setItem) {
  return Math.round(Number(setItem.weight) * Number(setItem.reps) * 0.8);
}

function loadColorClass(ratio) {
  if (ratio < 0.55) return "bg-red-400";
  if (ratio < 0.8) return "bg-red-500";
  return "bg-red-700";
}

function dotColorClass(ratio) {
  if (ratio < 0.55) return "bg-red-400";
  if (ratio < 0.8) return "bg-red-500";
  return "bg-red-700";
}

function ExerciseCard({ exercise, canDelete, onToggleSet, onChangeSet, onAddSet, onDeleteExercise }) {
  const meta = EXERCISE_LIBRARY[exercise.kind];
  const completedCount = exercise.sets.filter((setItem) => setItem.completed).length;

  return (
    <Card className="rounded-2xl shadow-lg shadow-black/40">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-[34px] leading-none tracking-tight md:text-2xl">{meta.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">
                Основные: {meta.primary.join(", ")}
              </Badge>
              <Badge variant="secondary">
                Вторичные: {meta.secondary.join(", ")}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm font-semibold text-zinc-300">
              {completedCount}/{exercise.targetSets}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="text-red-300 hover:bg-red-950/40 hover:text-red-200"
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
            <TableRow className="border-zinc-800">
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
                className={setItem.completed ? "border-transparent bg-red-950/35" : "bg-zinc-900/40"}
              >
                <TableCell>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-zinc-200"
                    onClick={() => onToggleSet(index)}
                  >
                    {setItem.completed ? (
                      <Check className="h-4 w-4 text-red-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-zinc-500" />
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
                    className="h-9 rounded-lg border-zinc-700 bg-zinc-900 text-center font-semibold"
                  />
                </TableCell>

                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={setItem.reps}
                    onChange={(event) => onChangeSet(index, "reps", event.target.value)}
                    className="h-9 rounded-lg border-zinc-700 bg-zinc-900 text-center font-semibold"
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
                    className="h-9 rounded-lg border-zinc-700 bg-zinc-900 text-center font-semibold"
                  />
                </TableCell>

                <TableCell className="text-right text-lg font-bold text-red-300">
                  {setLoad(setItem)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button
          variant="outline"
          className="h-11 w-full rounded-xl border-zinc-700 bg-zinc-900 text-base font-semibold text-zinc-100"
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
    const map = EXERCISE_LIBRARY[exercise.kind].muscleCoefficients;
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

export default function WorkoutDiaryPage() {
  const [exercises, setExercises] = useState(initialExercises);

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

  return (
    <div className="min-h-screen bg-transparent p-3 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex items-start justify-between rounded-2xl border border-zinc-800 bg-zinc-950/90 px-5 py-4 shadow-lg shadow-black/40">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-red-950 p-2 text-red-300">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Умный дневник тренировок</h1>
              <p className="text-sm text-zinc-400">Отслеживайте прогресс и нагрузку</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 text-sm font-medium text-zinc-400">
            <CalendarDays className="h-4 w-4" />
            {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Упражнений</p>
              <p className="mt-1 text-4xl font-bold leading-none text-red-300">{totals.exercisesCount}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Подходов выполнено</p>
              <p className="mt-1 text-4xl font-bold leading-none text-red-300">
                {totals.completedSets} / {totals.totalPlannedSets}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-zinc-400">Прогресс</p>
                <span className="text-2xl font-bold text-red-300">{totals.progressPercent}%</span>
              </div>
              <Progress value={totals.progressPercent} className="h-3 bg-zinc-800" />
            </CardContent>
          </Card>
        </section>

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
              <CardTitle className="text-2xl text-zinc-100">Нагрузка на мышечные группы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {muscleLoads.map(([muscle, load]) => {
                const ratio = load / maxLoad;
                const width = Math.max(4, Math.round(ratio * 100));
                return (
                  <div key={muscle} className="space-y-2">
                    <div className="flex items-center justify-between text-base">
                      <span className="font-medium text-zinc-200">{muscle}</span>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <span className="font-semibold">{load}</span>
                        <span className={`h-2.5 w-2.5 rounded-full ${dotColorClass(ratio)}`} />
                      </div>
                    </div>
                    <Progress
                      value={width}
                      className="h-2 bg-zinc-800"
                      indicatorClassName={loadColorClass(ratio)}
                    />
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center gap-6 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  Низкая
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Средняя
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-700" />
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
