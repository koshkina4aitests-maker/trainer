import { NavLink } from "react-router-dom";
import { ClipboardList, History, Dumbbell } from "lucide-react";

const links = [
  {
    to: "/workout",
    label: "Текущая тренировка",
    icon: Dumbbell,
  },
  {
    to: "/history",
    label: "История сохранённых тренировок",
    icon: History,
  },
];

export default function NavigationBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-blue-100 p-2 text-blue-600">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Тренировочный модуль</p>
            <p className="text-xs text-slate-500">Планирование, выполнение и история</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
