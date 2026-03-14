const STORAGE_KEY_PREFIX = "saved_workouts_history_v2";

function storageKey(accountId) {
  return `${STORAGE_KEY_PREFIX}:${accountId ?? "anonymous"}`;
}

export function loadSavedWorkouts(accountId) {
  if (typeof window === "undefined") return [];
  try {
    if (!accountId) return [];
    const raw = localStorage.getItem(storageKey(accountId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedWorkouts(accountId, items) {
  if (typeof window === "undefined") return;
  if (!accountId) return;
  localStorage.setItem(storageKey(accountId), JSON.stringify(items));
}
