import { useState } from "react";
import { getAnalysis } from "../api";
import { translateExercise, translateMuscle } from "../utils/trainingModel";
import { ruText } from "../utils/textRu";

export default function ProgressAnalyticsPage({ userId }) {
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    if (!userId) {
      setError("Введите ID пользователя.");
      return;
    }
    setError("");
    try {
      const result = await getAnalysis(userId);
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <h2>Прогресс и аналитика</h2>
        <p className="subtle">Динамика нагрузок, прогрессии, deload-сигналов и дисбалансов.</p>
      </div>
      <button onClick={load}>Загрузить аналитику</button>
      {error && <p className="error">{error}</p>}

      {analysis && (
        <>
          <div className="card">
            <h3>Прогрессия веса</h3>
            <ul>
              {analysis.progression.map((item) => (
                <li key={item.exercise}>
                  <strong>{translateExercise(item.exercise)}</strong>: {ruText(item.reason)}
                  {item.should_increase_weight ? ` (+${item.suggested_increment_kg} kg)` : ""}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3>Статус deload</h3>
            <p>{ruText(analysis.deload.reason)}</p>
            {analysis.deload.should_deload && (
              <p>
                Рекомендация: {analysis.deload.weight_adjustment_pct}% к весу и{" "}
                {analysis.deload.volume_adjustment_pct}% к объему.
              </p>
            )}
          </div>

          <div className="card">
            <h3>Мышечные дисбалансы</h3>
            {analysis.imbalances.length === 0 && <p>Критичных дисбалансов не обнаружено.</p>}
            <ul>
              {analysis.imbalances.map((item, index) => (
                <li key={`${item.pair?.join("-") ?? "imbalance"}-${index}`}>
                  {Array.isArray(item.pair) && item.pair.length === 2
                    ? `${translateMuscle(item.pair[0])} / ${translateMuscle(item.pair[1])}: x${item.ratio?.toFixed?.(2) ?? "—"}`
                    : ruText(item.message)}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3>Снимок прогресса упражнений</h3>
            <pre>{JSON.stringify(analysis.progress_snapshot.exercise_progress, null, 2)}</pre>
          </div>
        </>
      )}
    </section>
  );
}
