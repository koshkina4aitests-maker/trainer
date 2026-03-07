import { useState } from "react";
import { getAnalysis } from "../api";

export default function ProgressAnalyticsPage({ userId }) {
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    if (!userId) {
      setError("Set user ID first.");
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
    <section>
      <h2>Progress analytics</h2>
      <button onClick={load}>Load progress data</button>
      {error && <p className="error">{error}</p>}

      {analysis && (
        <>
          <div className="card">
            <h3>Progression suggestions</h3>
            <ul>
              {analysis.progression.map((item) => (
                <li key={item.exercise}>
                  <strong>{item.exercise}</strong>: {item.reason}
                  {item.should_increase_weight ? ` (+${item.suggested_increment_kg} kg)` : ""}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3>Deload status</h3>
            <p>{analysis.deload.reason}</p>
            {analysis.deload.should_deload && (
              <p>
                Recommended: {analysis.deload.weight_adjustment_pct}% weight,{" "}
                {analysis.deload.volume_adjustment_pct}% volume.
              </p>
            )}
          </div>

          <div className="card">
            <h3>Load imbalances</h3>
            {analysis.imbalances.length === 0 && <p>No major imbalances found.</p>}
            <ul>
              {analysis.imbalances.map((item, index) => (
                <li key={`${item.pair?.join("-") ?? "imbalance"}-${index}`}>{item.message}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3>Exercise progress snapshot</h3>
            <pre>{JSON.stringify(analysis.progress_snapshot.exercise_progress, null, 2)}</pre>
          </div>
        </>
      )}
    </section>
  );
}
