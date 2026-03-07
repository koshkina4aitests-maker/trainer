import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Профиль и AI-сводка", icon: "🏠" },
  { to: "/today", label: "Тренировка на сегодня", icon: "💡" },
  { to: "/session", label: "Запись тренировки", icon: "📝" },
  { to: "/progress", label: "Прогресс и аналитика", icon: "📈" },
  { to: "/body", label: "Карта мышц", icon: "🧠" },
];

export default function Navigation() {
  return (
    <nav className="nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
