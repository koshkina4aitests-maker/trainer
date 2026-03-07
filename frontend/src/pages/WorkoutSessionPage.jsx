import { useMemo, useState } from "react";
import { createWorkout } from "../api";

const EXERCISE_OPTIONS = [
  "barbell bench press",
  "dumbbell bench press",
  "overhead press",
  "pull-up",
  "barbell row",
  "lat pulldown",
  "squat",
  "front squat",
  "romanian deadlift",
  "deadlift",
  "leg press",
  "hip thrust",
  "leg curl",
  "biceps curl",
  "triceps pushdown",
  "lateral raise",
  "face pull",
  "calf raise"
];

function makeSet() {
  return {
    reps: 10,
    rir: 2
  };
}

function makeExercise() {
  return {
    exercise: EXERCISE_OPTIONS[0],
    weight: 20,
    rest_time_sec: 90,
    rep_target_min: 8,
    rep_target_max: 12,
    sets: [makeSet(), makeSet(), makeSet()]
  };
}

export default function WorkoutSessionPage({ userId }) {
  const [performedAtLocal, setPerformedAtLocal] = useState(new Date().toISOString().slice(0, 16));
  const [exercises, setExercises] = useState([makeExercise()]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [createdWorkoutId, setCreatedWorkoutId] = useState(null);

  const preview = useMemo(
    () => ({
      performed_at: new Date(performedAtLocal).toISOString(),
      exercises: exercises.map((exercise) => ({
        exercise: exercise.exercise,
        weight: Number(exercise.weight),
        rest_time_sec: Number(exercise.rest_time_sec),
        rep_target_range: [Number(exercise.rep_target_min), Number(exercise.rep_target_max)],
        sets: exercise.sets.map((setItem) => ({
          reps: Number(setItem.reps),
          rir: Number(setItem.rir)
        }))
      }))
    }),
    [performedAtLocal, exercises]
  );

  function updateExerciseField(exerciseIndex, field, value) {
    setExercises((prev) =>
      prev.map((exercise, idx) => (idx === exerciseIndex ? { ...exercise, [field]: value } : exercise))
    );
  }

  function updateSetField(exerciseIndex, setIndex, field, value) {
    setExercises((prev) =>
      prev.map((exercise, idx) => {
        if (idx !== exerciseIndex) {
          return exercise;
        }
        return {
          ...exercise,
          sets: exercise.sets.map((setItem, setItemIdx) =>
            setItemIdx === setIndex ? { ...setItem, [field]: value } : setItem
          )
        };
      })
    );
  }

  function addExercise() {
    setExercises((prev) => [...prev, makeExercise()]);
  }

  function removeExercise(exerciseIndex) {
    setExercises((prev) => prev.filter((_, idx) => idx !== exerciseIndex));
  }

  function addSet(exerciseIndex) {
    setExercises((prev) =>
      prev.map((exercise, idx) =>
        idx === exerciseIndex
          ? {
              ...exercise,
              sets: [...exercise.sets, makeSet()]
            }
          : exercise
      )
    );
  }

  function removeSet(exerciseIndex, setIndex) {
    setExercises((prev) =>
      prev.map((exercise, idx) => {
        if (idx !== exerciseIndex || exercise.sets.length === 1) {
          return exercise;
        }
        return {
          ...exercise,
          sets: exercise.sets.filter((_, currentSetIndex) => currentSetIndex !== setIndex)
        };
      })
    );
  }

  async function submitWorkout() {
    if (!userId) {
      setError("Set user ID first.");
      return;
    }
    if (!exercises.length) {
      setError("Add at least one exercise.");
      return;
    }
    setError("");
    setStatus("Sending workout...");
    try {
      const payload = {
        ...preview,
        user_id: Number(userId)
      };
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
        Записывайте тренировку в форме: выберите упражнение, укажите вес и количество повторений в каждом подходе.
      </p>

      <div className="card">
        <div className="row">
          <label className="compact-field">
            Дата и время
            <input
              type="datetime-local"
              value={performedAtLocal}
              onChange={(event) => setPerformedAtLocal(event.target.value)}
            />
          </label>
          <button type="button" onClick={addExercise}>
            + Добавить упражнение
          </button>
        </div>

        {exercises.map((exercise, exerciseIndex) => (
          <div className="exercise-card" key={`exercise-${exerciseIndex}`}>
            <div className="exercise-grid">
              <label>
                Упражнение
                <select
                  value={exercise.exercise}
                  onChange={(event) => updateExerciseField(exerciseIndex, "exercise", event.target.value)}
                >
                  {EXERCISE_OPTIONS.map((name) => (
                    <option value={name} key={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Вес отягощения (кг)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={exercise.weight}
                  onChange={(event) => updateExerciseField(exerciseIndex, "weight", event.target.value)}
                />
              </label>

              <label>
                Отдых (сек)
                <input
                  type="number"
                  min="15"
                  step="5"
                  value={exercise.rest_time_sec}
                  onChange={(event) => updateExerciseField(exerciseIndex, "rest_time_sec", event.target.value)}
                />
              </label>
            </div>

            <div className="row">
              <label className="compact-field">
                Мин. повторений
                <input
                  type="number"
                  min="1"
                  value={exercise.rep_target_min}
                  onChange={(event) => updateExerciseField(exerciseIndex, "rep_target_min", event.target.value)}
                />
              </label>
              <label className="compact-field">
                Макс. повторений
                <input
                  type="number"
                  min="1"
                  value={exercise.rep_target_max}
                  onChange={(event) => updateExerciseField(exerciseIndex, "rep_target_max", event.target.value)}
                />
              </label>
              <button type="button" onClick={() => addSet(exerciseIndex)}>
                + Подход
              </button>
              <button
                type="button"
                onClick={() => removeExercise(exerciseIndex)}
                disabled={exercises.length === 1}
              >
                Удалить упражнение
              </button>
            </div>

            <div className="sets-grid">
              {exercise.sets.map((setItem, setIndex) => (
                <div className="set-row" key={`set-${exerciseIndex}-${setIndex}`}>
                  <strong>Подход {setIndex + 1}</strong>
                  <label>
                    Повторения
                    <input
                      type="number"
                      min="1"
                      value={setItem.reps}
                      onChange={(event) => updateSetField(exerciseIndex, setIndex, "reps", event.target.value)}
                    />
                  </label>
                  <label>
                    RIR
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={setItem.rir}
                      onChange={(event) => updateSetField(exerciseIndex, setIndex, "rir", event.target.value)}
                    />
                  </label>
                  <button type="button" onClick={() => removeSet(exerciseIndex, setIndex)}>
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="row">
          <button onClick={submitWorkout}>Save workout</button>
        </div>
      </div>

      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}
      {createdWorkoutId && <p className="status">Created workout id: {createdWorkoutId}</p>}

      <details className="card">
        <summary>Предпросмотр JSON</summary>
        <pre>{JSON.stringify(preview, null, 2)}</pre>
      </details>
    </section>
  );
}
