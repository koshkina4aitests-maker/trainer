import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import NavigationBar from "./components/NavigationBar";
import AuthPage from "./pages/AuthPage";
import WorkoutDiaryPage from "./pages/WorkoutDiaryPage";
import WorkoutHistoryPage from "./pages/WorkoutHistoryPage";
import UserProfilePage from "./pages/UserProfilePage";
import AdminPage from "./pages/AdminPage";
import { loadAuthSession, persistAuthSession } from "./utils/authStorage";
import { loadSavedWorkouts, persistSavedWorkouts } from "./utils/workoutStorage";

export default function App() {
  const navigate = useNavigate();
  const [authSession, setAuthSession] = useState(() => loadAuthSession());
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const isAdmin = Boolean(authSession?.user?.is_admin);

  useEffect(() => {
    if (!authSession?.user?.id) {
      setSavedWorkouts([]);
      return;
    }
    setSavedWorkouts(loadSavedWorkouts(authSession.user.id));
  }, [authSession?.user?.id]);

  useEffect(() => {
    if (!authSession?.user?.id) return;
    persistSavedWorkouts(authSession.user.id, savedWorkouts);
  }, [authSession?.user?.id, savedWorkouts]);

  useEffect(() => {
    persistAuthSession(authSession);
  }, [authSession]);

  function handleSaveWorkout(snapshot) {
    setSavedWorkouts((prev) => [snapshot, ...prev]);
  }

  function handleDeleteWorkout(workoutId) {
    setSavedWorkouts((prev) => prev.filter((workout) => workout.id !== workoutId));
  }

  function handleAuthenticated(session) {
    setAuthSession(session);
    navigate("/profile", { replace: true });
  }

  function handleLogout() {
    setAuthSession(null);
    navigate("/", { replace: true });
  }

  if (!authSession) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <NavigationBar currentUser={authSession.user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="/profile" element={<UserProfilePage authToken={authSession.access_token} />} />
        <Route
          path="/workout"
          element={
            <WorkoutDiaryPage
              authToken={authSession.access_token}
              onSaveWorkout={handleSaveWorkout}
              savedWorkouts={savedWorkouts}
            />
          }
        />
        <Route
          path="/history"
          element={<WorkoutHistoryPage savedWorkouts={savedWorkouts} onDeleteWorkout={handleDeleteWorkout} />}
        />
        <Route
          path="/admin"
          element={
            isAdmin ? <AdminPage authToken={authSession.access_token} /> : <Navigate to="/profile" replace />
          }
        />
      </Routes>
    </div>
  );
}
