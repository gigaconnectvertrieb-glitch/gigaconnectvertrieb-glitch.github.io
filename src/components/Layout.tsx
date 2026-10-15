import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/gebiete",
    label: "Gebiete",
    icon: Map,
  },
  {
    to: "/tagesbericht",
    label: "Tagesbericht",
    icon: BarChart3,
  },
  {
    to: "/einstellungen",
    label: "Einstellungen",
    icon: Settings,
  },
];

export default function Layout() {
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900 md:text-xl">
              E1 Gebietstracker
            </h1>
            <span className="hidden rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 md:block">
              E1 Direktvertrieb
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      <nav className="border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)] md:px-4">
        <div className="mx-auto grid max-w-4xl grid-cols-4 gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors md:px-4 md:py-3 md:text-sm",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                )
              }
            >
              <Icon className="h-5 w-5 md:h-6 md:w-6" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}