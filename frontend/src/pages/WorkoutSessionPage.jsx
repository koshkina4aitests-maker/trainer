import { useMemo, useState } from "react";
import { createWorkout } from "../api";

const sampleTemplate = {
  performed_at: new Date().toISOString(),
  exercises: [
    {
      exercise: "dumbbell bench press",
      weight: 10,
      rest_time_sec: 90,
      rep_target_range: [10, 12],
      sets: [
        { reps: 12, rir: 3, heart_rate_after_set: 118, heart_rate_recovery: 95, heart_rate_source: "manual" },
        { reps: 12, rir: 2, heart_rate_after_set: 115, heart_rate_recovery: 92, heart_rate_source: "manual" },
        { reps: 11, rir: 1, heart_rate_after_set: 110, heart_rate_recovery: 90, heart_rate_source: "manual" }
      ]
    }
  ]
};

export default function WorkoutSessionPage({ userId }) {
  const [jsonText, setJsonText] = useState(JSON.stringify(sampleTemplate, null, 2));
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [createdWorkoutId, setCreatedWorkoutId] = useState(null);

  const preview = useMemo(() => {
    try {
      return JSON.parse(jsonText);
    } catch {
      return null;
    }
  }, [jsonText]);

  async function submitWorkout() {
    if (!userId) {
      setError("Set user ID first.");
      return;
    }
    setError("");
    setStatus("Sending workout...");
    try {
      const payload = JSON.parse(jsonText);
      payload.user_id = Number(userId);
      const result = await createWorkout(payload);
      setCreatedWorkoutId(result.workout_id);
      setStatus(`Workout #${result.workout_id} saved.`);
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }

  return (
    <section>
      <h2>Workout session</h2>
      <p className="subtle">
        Paste workout JSON from your session logger. Heart-rate fields can come from manual input or wearable sync.
      </p>

      <div className="card">
        <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={20} />
        <div className="row">
          <button onClick={submitWorkout}>Save workout</button>
        </div>
      </div>

      {preview === null && <p className="error">JSON is invalid.</p>}
      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}
      {createdWorkoutId && <p className="status">Created workout id: {createdWorkoutId}</p>}
    </section>
  );
}
