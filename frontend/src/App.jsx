import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import NavigationBar from "./components/NavigationBar";
import WorkoutDiaryPage from "./pages/WorkoutDiaryPage";
import WorkoutHistoryPage from "./pages/WorkoutHistoryPage";
import { loadSavedWorkouts, persistSavedWorkouts } from "./utils/workoutStorage";

export default function App() {
  const [savedWorkouts, setSavedWorkouts] = useState(() => loadSavedWorkouts());

  useEffect(() => {
    persistSavedWorkouts(savedWorkouts);
  }, [savedWorkouts]);

  function handleSaveWorkout(snapshot) {
    setSavedWorkouts((prev) => [snapshot, ...prev]);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <NavigationBar />
      <Routes>
        <Route path="/" element={<Navigate to="/workout" replace />} />
        <Route path="/workout" element={<WorkoutDiaryPage onSaveWorkout={handleSaveWorkout} />} />
        <Route path="/history" element={<WorkoutHistoryPage savedWorkouts={savedWorkouts} />} />
      </Routes>
    </div>
  );
}
