import { useEffect, useState } from "react";
import { Activity, CalendarRange, Flame, Target, User } from "lucide-react";

import { getMyProfile, updateMyProfile } from "../api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

const styleOptions = [
  { value: "split", label: "split" },
  { value: "fullbody", label: "fullbody" },
  { value: "other", label: "other" },
];

const goalOptions = [
  { value: "strength", label: "Сила" },
  { value: "hypertrophy", label: "Гипертрофия" },
  { value: "endurance", label: "Выносливость" },
  { value: "health", label: "Здоровье" },
  { value: "weight_loss", label: "Снижение веса" },
];

const experienceOptions = [
  { value: "", label: "Не выбрано" },
  { value: "beginner", label: "Начальный" },
  { value: "intermediate", label: "Средний" },
  { value: "advanced", label: "Продвинутый" },
];

function toValue(value) {
  return value ?? "";
}

function toNumberOrNull(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function UserProfilePage({ authToken }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    age: "",
    training_style: "split",
    workouts_per_week: "3",
    goal: "hypertrophy",
    height_cm: "",
    weight_kg: "",
    target_weight_kg: "",
    body_fat_pct: "",
    experience_level: "",
    preferred_session_duration_min: "",
    notes: "",
    profile_completion_pct: 0,
    days_in_app: 1,
  });

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const data = await getMyProfile(authToken);
        if (!active) return;
        setForm({
          email: data.email,
          full_name: toValue(data.full_name),
          age: toValue(data.age),
          training_style: data.training_style ?? "split",
          workouts_per_week: String(data.workouts_per_week ?? 3),
          goal: data.goal ?? "hypertrophy",
          height_cm: toValue(data.height_cm),
          weight_kg: toValue(data.weight_kg),
          target_weight_kg: toValue(data.target_weight_kg),
          body_fat_pct: toValue(data.body_fat_pct),
          experience_level: toValue(data.experience_level),
          preferred_session_duration_min: toValue(data.preferred_session_duration_min),
          notes: toValue(data.notes),
          profile_completion_pct: data.profile_completion_pct ?? 0,
          days_in_app: data.days_in_app ?? 1,
        });
      } catch (err) {
        if (!active) return;
        setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, [authToken]);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const payload = {
        full_name: form.full_name || null,
        age: toNumberOrNull(form.age),
        training_style: form.training_style,
        workouts_per_week: Number(form.workouts_per_week || 3),
        goal: form.goal,
        height_cm: toNumberOrNull(form.height_cm),
        weight_kg: toNumberOrNull(form.weight_kg),
        target_weight_kg: toNumberOrNull(form.target_weight_kg),
        body_fat_pct: toNumberOrNull(form.body_fat_pct),
        experience_level: form.experience_level || null,
        preferred_session_duration_min: toNumberOrNull(form.preferred_session_duration_min),
        notes: form.notes || null,
      };
      const updated = await updateMyProfile(authToken, payload);
      setForm((prev) => ({
        ...prev,
        profile_completion_pct: updated.profile_completion_pct ?? prev.profile_completion_pct,
        days_in_app: updated.days_in_app ?? prev.days_in_app,
      }));
      setStatus("Профиль сохранён.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-3 py-4 md:px-6 md:py-6">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl text-slate-900">Личный кабинет</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">Профиль пользователя и персональные настройки тренировок.</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-slate-700">Email: {form.email || "—"}</Badge>
            <Badge variant="outline" className="text-slate-700">Заполненность: {form.profile_completion_pct}%</Badge>
            <Badge variant="outline" className="text-slate-700">Дней в приложении: {form.days_in_app}</Badge>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl border-slate-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-slate-500">Имя</p>
              <p className="text-lg font-semibold text-slate-900">{form.full_name || "Не указано"}</p>
            </div>
            <User className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-slate-500">Тренировок в неделю</p>
              <p className="text-lg font-semibold text-slate-900">{form.workouts_per_week || "—"}</p>
            </div>
            <CalendarRange className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-slate-500">Цель</p>
              <p className="text-lg font-semibold text-slate-900">
                {goalOptions.find((item) => item.value === form.goal)?.label ?? "—"}
              </p>
            </div>
            <Target className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-slate-500">Уровень</p>
              <p className="text-lg font-semibold text-slate-900">
                {experienceOptions.find((item) => item.value === form.experience_level)?.label ?? "Не указан"}
              </p>
            </div>
            <Flame className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">Параметры профиля</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Загрузка профиля...</p>
          ) : (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onSave}>
              <label className="space-y-1">
                <span className="text-sm text-slate-700">Имя</span>
                <Input value={form.full_name} onChange={(event) => setField("full_name", event.target.value)} />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Возраст</span>
                <Input type="number" value={form.age} onChange={(event) => setField("age", event.target.value)} />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Стиль тренировок</span>
                <select
                  value={form.training_style}
                  onChange={(event) => setField("training_style", event.target.value)}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                >
                  {styleOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Тренировок в неделю</span>
                <Input
                  type="number"
                  min="1"
                  max="14"
                  value={form.workouts_per_week}
                  onChange={(event) => setField("workouts_per_week", event.target.value)}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Цель</span>
                <select
                  value={form.goal}
                  onChange={(event) => setField("goal", event.target.value)}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                >
                  {goalOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Уровень подготовки</span>
                <select
                  value={form.experience_level}
                  onChange={(event) => setField("experience_level", event.target.value)}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                >
                  {experienceOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Рост (см)</span>
                <Input
                  type="number"
                  value={form.height_cm}
                  onChange={(event) => setField("height_cm", event.target.value)}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Вес (кг)</span>
                <Input
                  type="number"
                  step="0.1"
                  value={form.weight_kg}
                  onChange={(event) => setField("weight_kg", event.target.value)}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Целевой вес (кг)</span>
                <Input
                  type="number"
                  step="0.1"
                  value={form.target_weight_kg}
                  onChange={(event) => setField("target_weight_kg", event.target.value)}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Процент жира (%)</span>
                <Input
                  type="number"
                  step="0.1"
                  value={form.body_fat_pct}
                  onChange={(event) => setField("body_fat_pct", event.target.value)}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Предпочтительная длительность тренировки (мин)</span>
                <Input
                  type="number"
                  value={form.preferred_session_duration_min}
                  onChange={(event) => setField("preferred_session_duration_min", event.target.value)}
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm text-slate-700">Заметки / ограничения</span>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm"
                />
              </label>

              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Сохранение..." : "Сохранить профиль"}
                </Button>
                {status && <span className="text-sm font-medium text-emerald-700">{status}</span>}
                {error && <span className="text-sm font-medium text-red-600">{error}</span>}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-slate-900">Что обычно есть в хороших фитнес-трекерах</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p className="inline-flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            Цели по объёму и интенсивности
          </p>
          <p className="inline-flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            План тренировочной недели
          </p>
          <p className="inline-flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            Контроль прогрессии веса/повторов
          </p>
          <p className="inline-flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            Аналитика восстановления и усталости
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
