import { useState } from "react";
import { getAnalysis } from "../api";

function colorClass(color) {
  if (color === "green") return "muscle-green";
  if (color === "yellow") return "muscle-yellow";
  if (color === "orange") return "muscle-orange";
  return "muscle-red";
}

export default function BodyVisualizationPage({ userId }) {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    if (!userId) {
      setError("Set user ID first.");
      return;
    }
    setError("");
    try {
      const analysis = await getAnalysis(userId);
      setPayload(analysis.body_visualization);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>Body muscle visualization</h2>
      <button onClick={load}>Load body map</button>
      {error && <p className="error">{error}</p>}

      {payload && (
        <div className="muscle-grid">
          {Object.entries(payload).map(([muscle, data]) => (
            <details className={`muscle-card ${colorClass(data.color)}`} key={muscle}>
              <summary>
                {muscle} — fatigue {data.fatigue}
              </summary>
              <p>Color zone: {data.color}</p>
              <p>Related exercises:</p>
              <ul>
                {data.related_exercises.map((exercise) => (
                  <li key={exercise}>{exercise}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
