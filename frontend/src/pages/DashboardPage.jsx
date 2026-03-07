import { useState } from "react";
import { createUser, getAnalysis } from "../api";
import { ruText } from "../utils/textRu";

const defaultUser = {
  age: 28,
  sex: "male",
  height_cm: 178,
  weight_kg: 78,
  training_level: "intermediate",
  training_style: "split",
  goals: ["strength", "hypertrophy"],
};

const goalOptions = [
  { value: "strength", label: "Сила" },
  { value: "hypertrophy", label: "Гипертрофия" },
  { value: "endurance", label: "Выносливость" },
  { value: "health", label: "Здоровье" },
];

export default function DashboardPage({ userId, setUserId }) {
  const [form, setForm] = useState(defaultUser);
  const [status, setStatus] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const toggleGoal = (goal) =>
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter((item) => item !== goal) : [...prev.goals, goal],
    }));

  async function handleCreateUser(event) {
    event.preventDefault();
    setError("");
    setStatus("Создание профиля...");
    try {
      const created = await createUser({
        ...form,
        age: Number(form.age),
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
      });
      setUserId(String(created.id));
      setStatus(`Профиль создан: #${created.id}`);
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }

  async function handleLoadAnalysis() {
    if (!userId) {
      setError("Введите ID или создайте профиль.");
      return;
    }
    setError("");
    setStatus("Загрузка AI-анализа...");
    try {
      const data = await getAnalysis(userId);
      setAnalysis(data);
      setStatus("AI-анализ загружен.");
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <h2>Профиль и AI-сводка</h2>
        <p className="subtle">Создайте профиль, сохраняйте тренировки и получайте персональные рекомендации.</p>
      </div>

      <form className="card form-grid" onSubmit={handleCreateUser}>
        <h3>Профиль пользователя</h3>
        <label>
          Возраст
          <input type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} />
        </label>
        <label>
          Пол
          <select value={form.sex} onChange={(e) => updateField("sex", e.target.value)}>
            <option value="male">мужской</option>
            <option value="female">женский</option>
            <option value="neutral">нейтральный</option>
          </select>
        </label>
        <label>
          Рост (см)
          <input
            type="number"
            value={form.height_cm}
            onChange={(e) => updateField("height_cm", e.target.value)}
          />
        </label>
        <label>
          Вес (кг)
          <input
            type="number"
            value={form.weight_kg}
            onChange={(e) => updateField("weight_kg", e.target.value)}
          />
        </label>
        <label>
          Уровень
          <select value={form.training_level} onChange={(e) => updateField("training_level", e.target.value)}>
            <option value="beginner">начальный</option>
            <option value="intermediate">средний</option>
            <option value="advanced">продвинутый</option>
          </select>
        </label>
        <label>
          Стиль
          <select value={form.training_style} onChange={(e) => updateField("training_style", e.target.value)}>
            <option value="full_body">full body</option>
            <option value="split">split</option>
            <option value="custom">кастомный</option>
          </select>
        </label>

        <div className="goal-picker">
          <p>Цели</p>
          <div className="chip-row">
            {goalOptions.map((goal) => (
              <button
                key={goal.value}
                type="button"
                className={`chip ${form.goals.includes(goal.value) ? "active" : ""}`}
                onClick={() => toggleGoal(goal.value)}
              >
                {goal.label}
              </button>
            ))}
          </div>
        </div>

        <div className="row">
          <button type="submit">Создать профиль</button>
          <button type="button" onClick={handleLoadAnalysis}>
            Обновить AI-сводку
          </button>
        </div>
      </form>

      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      {analysis && (
        <div className="card">
          <h3>AI-сводка по последней тренировке</h3>
          <pre>{analysis.textual_analysis.split("\n").map((line) => ruText(line)).join("\n")}</pre>
        </div>
      )}
    </section>
  );
}
