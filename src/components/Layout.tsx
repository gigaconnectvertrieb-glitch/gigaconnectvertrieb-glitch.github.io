import { Outlet, NavLink } from "react-router-dom";
import { ListChecks, BarChart3, Settings2, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Lauflisten", icon: ListChecks, end: true },
  { to: "/pitch", label: "Pitch", icon: Languages, end: false },
  { to: "/bericht", label: "Bericht", icon: BarChart3, end: false },
  { to: "/mehr", label: "Mehr", icon: Settings2, end: false },
];

export default function Layout() {
  return (
    <div className="flex h-[100dvh] flex-col bg-slate-100">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <nav className="shrink-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-3xl grid-cols-4 px-2 py-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition-colors",
                  isActive ? "text-blue-700" : "text-slate-500"
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
