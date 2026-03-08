import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import NavigationBar from "./components/NavigationBar";
import AuthPage from "./pages/AuthPage";
import WorkoutDiaryPage from "./pages/WorkoutDiaryPage";
import WorkoutHistoryPage from "./pages/WorkoutHistoryPage";
import { loadAuthSession, persistAuthSession } from "./utils/authStorage";
import { loadSavedWorkouts, persistSavedWorkouts } from "./utils/workoutStorage";

export default function App() {
  const [authSession, setAuthSession] = useState(() => loadAuthSession());
  const [savedWorkouts, setSavedWorkouts] = useState(() => loadSavedWorkouts());

  useEffect(() => {
    persistSavedWorkouts(savedWorkouts);
  }, [savedWorkouts]);

  useEffect(() => {
    persistAuthSession(authSession);
  }, [authSession]);

  function handleSaveWorkout(snapshot) {
    setSavedWorkouts((prev) => [snapshot, ...prev]);
  }

  function handleAuthenticated(session) {
    setAuthSession(session);
  }

  function handleLogout() {
    setAuthSession(null);
  }

  if (!authSession) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <NavigationBar currentUser={authSession.user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Navigate to="/workout" replace />} />
        <Route path="/workout" element={<WorkoutDiaryPage onSaveWorkout={handleSaveWorkout} />} />
        <Route path="/history" element={<WorkoutHistoryPage savedWorkouts={savedWorkouts} />} />
      </Routes>
    </div>
  );
}
