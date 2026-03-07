import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Профиль и AI-сводка" },
  { to: "/today", label: "Тренировка на сегодня" },
  { to: "/session", label: "Запись тренировки" },
  { to: "/progress", label: "Прогресс и аналитика" },
  { to: "/body", label: "Карта мышц" },
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
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
