const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Ошибка запроса: ${response.status}`);
  }
  return response.json();
}

export async function createUser(payload) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createWorkout(payload) {
  return request("/workouts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRecommendedWorkout(userId) {
  return request(`/recommended-workout?user_id=${userId}`);
}

export async function getAnalysis(userId, workoutId) {
  const suffix = workoutId ? `&workout_id=${workoutId}` : "";
  return request(`/analysis?user_id=${userId}${suffix}`);
}

export { API_URL };
