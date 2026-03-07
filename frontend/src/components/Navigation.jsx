import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/today", label: "Today's workout" },
  { to: "/session", label: "Workout session" },
  { to: "/progress", label: "Progress analytics" },
  { to: "/body", label: "Body muscle visualization" },
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
