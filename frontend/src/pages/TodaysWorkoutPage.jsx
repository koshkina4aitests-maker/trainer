import { useState } from "react";
import { getRecommendedWorkout } from "../api";
import { translateExercise, translateMuscle } from "../utils/trainingModel";
import { ruText } from "../utils/textRu";

export default function TodaysWorkoutPage({ userId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

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
          <label className="search-field">
            <span>Поиск упражнения</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Например: жим, тяга, присед"
            />
          </label>

          <h3>Фокус по мышцам</h3>
          <ul className="tag-list">
            {data.focus_muscles.map((muscle) => (
              <li key={muscle} className="tag-item">
                {translateMuscle(muscle)}
              </li>
            ))}
          </ul>

          <h3>Рекомендованные упражнения</h3>
          <ul className="exercise-list">
            {data.exercises
              .filter((exercise) =>
                translateExercise(exercise).toLowerCase().includes(search.trim().toLowerCase())
              )
              .map((exercise) => (
              <li key={exercise} className="exercise-list-item">
                <strong>{translateExercise(exercise)}</strong>
                <span>Готово к выполнению</span>
              </li>
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
