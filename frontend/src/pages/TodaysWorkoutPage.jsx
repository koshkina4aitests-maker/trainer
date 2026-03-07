import { useState } from "react";
import { getRecommendedWorkout } from "../api";
import { translateExercise, translateMuscle } from "../utils/trainingModel";
import { ruText } from "../utils/textRu";

export default function TodaysWorkoutPage({ userId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function loadRecommendation() {
    if (!userId) {
      setError("Введите ID пользователя.");
      return;
    }
    setError("");
    setStatus("Подбор тренировки...");
    try {
      const result = await getRecommendedWorkout(userId);
      setData(result);
      setStatus("");
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <h2>Тренировка на сегодня</h2>
        <p className="subtle">AI подбирает упражнения с учетом усталости мышц и восстановления.</p>
      </div>
      <button onClick={loadRecommendation}>Показать рекомендацию</button>
      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      {data && (
        <div className="card split-card">
          <h3>Фокус по мышцам</h3>
          <ul>
            {data.focus_muscles.map((muscle) => (
              <li key={muscle}>{translateMuscle(muscle)}</li>
            ))}
          </ul>

          <h3>Рекомендованные упражнения</h3>
          <ul>
            {data.exercises.map((exercise) => (
              <li key={exercise}>{translateExercise(exercise)}</li>
            ))}
          </ul>

          <h3>Комментарии AI</h3>
          <ul>
            {data.notes.map((note) => (
              <li key={note}>{ruText(note)}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
