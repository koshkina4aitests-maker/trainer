import { useState } from "react";
import { createUser, getAnalysis } from "../api";

const defaultUser = {
  age: 28,
  sex: "male",
  height_cm: 178,
  weight_kg: 78,
  training_level: "intermediate",
  training_style: "split",
  goals: ["strength", "hypertrophy"],
};

export default function DashboardPage({ userId, setUserId }) {
  const [form, setForm] = useState(defaultUser);
  const [status, setStatus] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  async function handleCreateUser(event) {
    event.preventDefault();
    setError("");
    setStatus("Creating user...");
    try {
      const created = await createUser({
        ...form,
        age: Number(form.age),
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
      });
      setUserId(String(created.id));
      setStatus(`Created user #${created.id}`);
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }

  async function handleLoadAnalysis() {
    if (!userId) {
      setError("Enter or create a user first.");
      return;
    }
    setError("");
    setStatus("Loading analysis...");
    try {
      const data = await getAnalysis(userId);
      setAnalysis(data);
      setStatus("Analysis loaded.");
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }

  return (
    <section>
      <h2>Dashboard</h2>
      <p className="subtle">Create a profile, then use other pages to log sessions and review AI insights.</p>

      <form className="card form-grid" onSubmit={handleCreateUser}>
        <h3>Create user profile</h3>
        <label>
          Age
          <input type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} />
        </label>
        <label>
          Sex
          <select value={form.sex} onChange={(e) => updateField("sex", e.target.value)}>
            <option value="male">male</option>
            <option value="female">female</option>
            <option value="neutral">neutral</option>
          </select>
        </label>
        <label>
          Height (cm)
          <input
            type="number"
            value={form.height_cm}
            onChange={(e) => updateField("height_cm", e.target.value)}
          />
        </label>
        <label>
          Weight (kg)
          <input
            type="number"
            value={form.weight_kg}
            onChange={(e) => updateField("weight_kg", e.target.value)}
          />
        </label>
        <label>
          Level
          <select value={form.training_level} onChange={(e) => updateField("training_level", e.target.value)}>
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </label>
        <label>
          Style
          <select value={form.training_style} onChange={(e) => updateField("training_style", e.target.value)}>
            <option value="full_body">full_body</option>
            <option value="split">split</option>
            <option value="custom">custom</option>
          </select>
        </label>

        <div className="row">
          <button type="submit">Create user</button>
          <button type="button" onClick={handleLoadAnalysis}>
            Load latest analysis
          </button>
        </div>
      </form>

      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      {analysis && (
        <div className="card">
          <h3>AI summary</h3>
          <pre>{analysis.textual_analysis}</pre>
        </div>
      )}
    </section>
  );
}
