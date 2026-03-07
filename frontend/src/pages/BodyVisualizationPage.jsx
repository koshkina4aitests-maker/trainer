import { useState } from "react";
import { getAnalysis } from "../api";
import BodyTrafficVisualizer from "../components/BodyTrafficVisualizer";
import { buildZonesFromFatiguePayload, translateExercise, translateMuscle } from "../utils/trainingModel";

export default function BodyVisualizationPage({ userId }) {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    if (!userId) {
      setError("Введите ID пользователя.");
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
    <section className="page-stack">
      <div className="page-header">
        <h2>Карта мышц</h2>
        <p className="subtle">Отображение накопленной усталости мышц по данным последних тренировок.</p>
      </div>
      <button onClick={load}>Показать карту тела</button>
      {error && <p className="error">{error}</p>}

      {payload && (
        <>
          <BodyTrafficVisualizer
            zones={buildZonesFromFatiguePayload(payload)}
            subtitle="Светофор усталости: зеленый — свежо, желтый — умеренно, красный — высокая усталость."
          />
          <div className="muscle-grid">
            {Object.entries(payload).map(([muscle, data]) => (
              <details className="muscle-card" key={muscle}>
                <summary>
                  {translateMuscle(muscle)} — усталость {Math.round(data.fatigue)}
                </summary>
                <p>Связанные упражнения:</p>
                <ul>
                  {data.related_exercises.map((exercise) => (
                    <li key={exercise}>{translateExercise(exercise)}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
