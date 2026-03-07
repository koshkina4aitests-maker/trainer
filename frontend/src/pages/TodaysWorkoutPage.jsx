import { useState } from "react";
import { getRecommendedWorkout } from "../api";

export default function TodaysWorkoutPage({ userId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function loadRecommendation() {
    if (!userId) {
      setError("Set user ID first.");
      return;
    }
    setError("");
    setStatus("Loading recommendation...");
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
    <section>
      <h2>Today's workout</h2>
      <button onClick={loadRecommendation}>Get recommended workout</button>
      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      {data && (
        <div className="card">
          <h3>Focus muscles</h3>
          <ul>
            {data.focus_muscles.map((muscle) => (
              <li key={muscle}>{muscle}</li>
            ))}
          </ul>

          <h3>Suggested exercises</h3>
          <ul>
            {data.exercises.map((exercise) => (
              <li key={exercise}>{exercise}</li>
            ))}
          </ul>

          <h3>Notes</h3>
          <ul>
            {data.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
