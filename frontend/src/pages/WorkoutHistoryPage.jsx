import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Trash2 } from "lucide-react";

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function WorkoutHistoryPage({ savedWorkouts, onDeleteWorkout }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-3 py-4 md:px-6 md:py-6">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl text-slate-900">История сохранённых тренировок</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Здесь отображаются все тренировки, сохранённые из экрана выполнения.
          </p>
        </CardContent>
      </Card>

      {savedWorkouts.length === 0 && (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <p className="text-slate-600">Пока нет сохранённых тренировок. Сохраните первую тренировку на странице выполнения.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {savedWorkouts.map((workout) => (
          <Card key={workout.id} className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl text-slate-900">{workout.title}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(workout.savedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Длительность: {workout.durationMinutes} мин</Badge>
                  <Badge variant="outline">Упражнений: {workout.exercises.length}</Badge>
                  <Badge variant="outline">Нагрузка: {workout.totalLoad}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onDeleteWorkout?.(workout.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Зафиксированные упражнения</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {workout.exercises.map((exercise) => (
                    <div key={exercise.exerciseId} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="font-medium text-slate-800">{exercise.name}</p>
                      <p className="text-sm text-slate-600">
                        Подходов: {exercise.setsCount} · Выполнено: {exercise.completedSets} · Нагрузка: {exercise.load}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Нагрузка по мышечным группам</p>
                <div className="flex flex-wrap gap-2">
                  {workout.muscleLoads.slice(0, 8).map((item) => (
                    <Badge key={item.muscle} variant="secondary" className="bg-slate-100 text-slate-700">
                      {item.muscle}: {item.load}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
