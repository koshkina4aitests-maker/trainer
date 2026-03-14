import { useEffect, useState } from "react";
import { Upload, ShieldCheck } from "lucide-react";

import {
  adminChangePassword,
  adminCreateExercise,
  adminImportExercisesCsv,
  getExerciseCatalog,
} from "../api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

function parseMusclesInput(value) {
  const result = {};
  for (const chunk of value.split(/[;,]/)) {
    const part = chunk.trim();
    if (!part) continue;
    const [rawMuscle, rawCoeff] = part.split(":");
    if (!rawMuscle || rawCoeff == null) {
      throw new Error(`Неверный формат пары: "${part}". Используйте muscle:coeff.`);
    }
    const muscle = rawMuscle.trim().toLowerCase();
    const coeff = Number(rawCoeff.trim());
    if (!Number.isFinite(coeff) || coeff <= 0) {
      throw new Error(`Неверный коэффициент в "${part}"`);
    }
    result[muscle] = coeff;
  }
  if (Object.keys(result).length === 0) {
    throw new Error("Укажите минимум одну мышцу и коэффициент.");
  }
  return result;
}

export default function AdminPage({ authToken }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualForm, setManualForm] = useState({
    id: "",
    name: "",
    musclesText: "chest:1.0, triceps:0.5",
    techniqueTip: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function refreshCatalog() {
    const data = await getExerciseCatalog();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getExerciseCatalog();
        if (!active) return;
        setItems(data.items ?? []);
      } catch (err) {
        if (!active) return;
        setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  async function submitManual(event) {
    event.preventDefault();
    setStatus("");
    setError("");
    try {
      const payload = {
        id: manualForm.id,
        name: manualForm.name,
        muscles: parseMusclesInput(manualForm.musclesText),
        technique_tip: manualForm.techniqueTip || null,
      };
      await adminCreateExercise(authToken, payload);
      await refreshCatalog();
      setStatus("Упражнение сохранено.");
      setManualForm((prev) => ({ ...prev, id: "", name: "", techniqueTip: "" }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function onCsvFileSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus("");
    setError("");
    try {
      const csvText = await file.text();
      const result = await adminImportExercisesCsv(authToken, csvText);
      await refreshCatalog();
      setStatus(`CSV обработан: импортировано ${result.imported}, пропущено ${result.skipped}.`);
      if (Array.isArray(result.errors) && result.errors.length > 0) {
        setError(result.errors.join("\n"));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      event.target.value = "";
    }
  }

  async function submitPassword(event) {
    event.preventDefault();
    setStatus("");
    setError("");
    try {
      await adminChangePassword(authToken, {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      setStatus("Пароль администратора обновлён.");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-3 py-4 md:px-6 md:py-6">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="inline-flex items-center gap-2 text-2xl text-slate-900">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            Админка упражнений
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Управление пользовательскими упражнениями: ручное добавление, импорт CSV и смена пароля Admin.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Логин администратора: Admin</Badge>
            <Badge variant="outline">Пароль по умолчанию: admin</Badge>
          </div>
          {status && <p className="text-sm font-medium text-emerald-700 whitespace-pre-line">{status}</p>}
          {error && <p className="text-sm font-medium text-red-600 whitespace-pre-line">{error}</p>}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Добавить упражнение вручную</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitManual} className="space-y-3">
              <label className="space-y-1">
                <span className="text-sm text-slate-700">ID упражнения (например: t_bar_row)</span>
                <Input
                  value={manualForm.id}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, id: event.target.value }))}
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-slate-700">Название</span>
                <Input
                  value={manualForm.name}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-slate-700">Мышцы и коэффициенты</span>
                <Input
                  value={manualForm.musclesText}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, musclesText: event.target.value }))}
                  placeholder="lats:1.0, biceps:0.5"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-slate-700">Подсказка по технике (опционально)</span>
                <textarea
                  rows={3}
                  value={manualForm.techniqueTip}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, techniqueTip: event.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm"
                />
              </label>
              <Button type="submit">Сохранить упражнение</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Импорт упражнений из CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Формат CSV: <code>id,name,muscles,technique_tip</code>. Поле <code>muscles</code> — JSON или строка вида
              <code> chest:1.0;triceps:0.5</code>.
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              Загрузить CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={onCsvFileSelected} />
            </label>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Смена пароля администратора</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitPassword} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              placeholder="Текущий пароль"
              required
            />
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              placeholder="Новый пароль"
              minLength={4}
              required
            />
            <Button type="submit">Обновить пароль</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">Список загруженных упражнений</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Загрузка...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-600">Пока нет загруженных пользовательских упражнений.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">ID: {item.id}</p>
                  <p className="text-sm text-slate-700">
                    Мышцы:{" "}
                    {Object.entries(item.muscles ?? {})
                      .map(([muscle, coeff]) => `${muscle}:${coeff}`)
                      .join(", ")}
                  </p>
                  {item.technique_tip && <p className="text-sm text-slate-600">Техника: {item.technique_tip}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
