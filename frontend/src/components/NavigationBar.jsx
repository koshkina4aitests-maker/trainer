import { NavLink } from "react-router-dom";
import { ClipboardList, History, Dumbbell, LogOut, UserRound, ShieldCheck } from "lucide-react";

import { Button } from "./ui/button";

const baseLinks = [
  {
    to: "/profile",
    label: "Личный кабинет",
    icon: UserRound,
  },
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

export default function NavigationBar({ currentUser, onLogout }) {
  const links = currentUser?.is_admin
    ? [...baseLinks, { to: "/admin", label: "Админка", icon: ShieldCheck }]
    : baseLinks;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">Тренировочный модуль</p>
              <p className="truncate text-xs text-slate-500">Планирование, выполнение и история</p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={onLogout} className="shrink-0">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <nav className="flex min-w-max items-center gap-2">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 sm:text-sm md:w-fit">
          <UserRound className="h-4 w-4 shrink-0" />
          <span className="truncate">{currentUser?.email}</span>
        </div>
      </div>
    </header>
  );
}
