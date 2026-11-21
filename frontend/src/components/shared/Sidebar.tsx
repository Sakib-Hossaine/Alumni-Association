import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  ChartNoAxesCombined,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Users,
  UserRound,
  Layers,
  Sun,
  Moon,
  Images,
  ContactRound,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { UserAvatar } from "./UserAvatar";
import { useQueryClient } from "@tanstack/react-query";
const menus = {
  ADMIN: [
    ["Dashboard", "/admin/dashboard", LayoutDashboard],
    ["Users", "/admin/users", Users],
    ["Alumni", "/admin/alumni", UserRound],
    ["Batches", "/admin/batches", Layers],
    ["Events", "/admin/events", CalendarDays],
    ["Donations", "/admin/donations", HeartHandshake],
    ["Reports", "/admin/reports", ChartNoAxesCombined],
    ["Directory", "/directory", ContactRound],
    ["Gallery", "/gallery", Images],
  ],
  MANAGEMENT: [
    ["Dashboard", "/management/dashboard", LayoutDashboard],
    ["Alumni", "/management/alumni", UserRound],
    ["Events", "/management/events", CalendarDays],
    ["Donations", "/management/donations", HeartHandshake],
    ["Reports", "/management/reports", ChartNoAxesCombined],
    ["Directory", "/directory", ContactRound],
    ["Gallery", "/gallery", Images],
  ],
  ALUMNI: [
    ["Dashboard", "/alumni/dashboard", LayoutDashboard],
    ["My Profile", "/alumni/profile", UserRound],
    ["Events", "/alumni/events", CalendarDays],
    ["My Donations", "/alumni/my-donations", HeartHandshake],
    ["Directory", "/directory", ContactRound],
    ["Gallery", "/gallery", Images],
  ],
} as const;
export function Sidebar({ close }: { close?: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [glow, setGlow] = useState(
    document.documentElement.classList.contains("glow-mode"),
  );
  if (!user) return null;
  return (
    <aside className="app-sidebar flex h-full min-h-screen w-[264px] flex-col border-r px-4 py-5">
      <div className="mb-9 flex items-center gap-3 px-2">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_28px_rgba(124,107,255,.3)]">
          <img
            src="/logo.jpg"
            alt="Alumni Association logo"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <div className="font-extrabold tracking-tight text-ink">
            Alumni<span className="text-teal">Association</span>
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-[.2em] text-slate-400">
            Your people, in orbit
          </div>
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">
        <span>Community</span>
        <span className="h-px w-9 bg-gradient-to-r from-cyan-300/50 to-transparent" />
      </div>
      <nav className="flex-1 space-y-1.5">
        {menus[user.role].map(([name, to, Icon]) => (
          <NavLink
            key={to}
            to={to}
            onClick={close}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-semibold transition ${isActive ? "bg-gradient-to-r from-cyan-300/15 via-violet-400/10 to-transparent text-cyan-200 shadow-[inset_2px_0_0_#5ee1ff]" : "text-slate-400 hover:bg-white/[.045] hover:text-white"}`
            }
          >
            <Icon size={18} className="transition group-hover:scale-110" />
            {name}
            <span className="ml-auto text-[10px] text-violet-300 opacity-0 transition group-hover:opacity-100">
              ✦
            </span>
          </NavLink>
        ))}
      </nav>
      <div className="mb-4 rounded-2xl border border-white/[.07] bg-gradient-to-br from-white/[.055] to-white/[.02] p-3.5">
        <div className="flex items-center gap-3">
          <NavLink to="/account/profile" onClick={close}>
            <UserAvatar user={user} className="h-10 w-10 text-xs" />
          </NavLink>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-white">
              {user.name}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[.12em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              {user.role.toLowerCase()}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            aria-label="Toggle glow theme"
            className="btn btn-light flex-1 !px-2 !py-2 text-xs"
            onClick={() => {
              document.documentElement.classList.toggle("glow-mode");
              setGlow(!glow);
            }}
          >
            {glow ? <Sun size={15} /> : <Moon size={15} />}{" "}
            {glow ? "Soft glow" : "Glow mode"}
          </button>
          <button
            aria-label="Sign out"
            className="btn btn-light !px-3 !py-2"
            onClick={() => {
              void queryClient.cancelQueries();
              queryClient.clear();
              logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
      <div className="px-2 text-[10px] text-slate-500">
        A constellation of shared stories <span className="text-pink">✦</span>
      </div>
    </aside>
  );
}
