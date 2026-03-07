import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Navigation from "./components/Navigation";
import DashboardPage from "./pages/DashboardPage";
import TodaysWorkoutPage from "./pages/TodaysWorkoutPage";
import WorkoutSessionPage from "./pages/WorkoutSessionPage";
import ProgressAnalyticsPage from "./pages/ProgressAnalyticsPage";
import BodyVisualizationPage from "./pages/BodyVisualizationPage";

export default function App() {
  const [userId, setUserId] = useState(localStorage.getItem("trainer_user_id") || "");

  useEffect(() => {
    if (userId) {
      localStorage.setItem("trainer_user_id", userId);
    }
  }, [userId]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Тренер AI</h1>
        <p className="sidebar-subtitle">Персональные силовые тренировки</p>
        <div className="user-id-box">
          <label htmlFor="user-id">ID пользователя</label>
          <input
            id="user-id"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Сначала создайте профиль"
          />
        </div>
        <Navigation />
      </aside>

      <main className="main-content">
        <div className="main-topbar card">
          <div>
            <p className="topbar-label">Smart Workout Diary style</p>
            <h2>AI-дневник тренировок</h2>
          </div>
          <div className="topbar-meta">
            <span>{new Date().toLocaleDateString("ru-RU")}</span>
            <span>ID: {userId || "—"}</span>
          </div>
        </div>

        <div className="page-container">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage userId={userId} setUserId={setUserId} />} />
            <Route path="/today" element={<TodaysWorkoutPage userId={userId} />} />
            <Route path="/session" element={<WorkoutSessionPage userId={userId} />} />
            <Route path="/progress" element={<ProgressAnalyticsPage userId={userId} />} />
            <Route path="/body" element={<BodyVisualizationPage userId={userId} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
