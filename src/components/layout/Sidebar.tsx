"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BookOpen,
  TrendingUp,
  ClipboardList,
  Banknote,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Главная", href: "/", icon: LayoutDashboard },
  { name: "Ученики", href: "/clients", icon: Users },
  { name: "Расписание", href: "/schedule", icon: Calendar },
  { name: "Речевые карты", href: "/speech-cards", icon: FileText },
  { name: "Упражнения", href: "/exercises", icon: BookOpen },
  { name: "Домашние задания", href: "/homework", icon: ClipboardList },
  { name: "Прогресс", href: "/progress", icon: TrendingUp },
  { name: "Финансы", href: "/finance", icon: Banknote },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex h-full flex-col pt-14 pb-[env(safe-area-inset-bottom)] lg:pt-0 lg:pb-0">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl font-bold text-white">
          Л
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">ЛогоПро</h1>
          <p className="text-xs text-sidebar-text/60">Система логопеда</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-active text-white shadow-lg shadow-black/10"
                  : "text-sidebar-text/80 hover:bg-sidebar-hover hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        {session?.user && (
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="min-w-0 flex-1 rounded-lg px-2 py-1.5 -mx-2 hover:bg-white/10 transition-colors"
            >
              <p className="text-sm font-medium text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-sidebar-text/50 truncate">
                {session.user.email}
              </p>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex-shrink-0 rounded-lg p-2 text-sidebar-text/60 hover:bg-white/10 hover:text-white transition-colors"
              title="Выйти"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-[60] rounded-xl bg-sidebar-bg p-2 text-white shadow-lg lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[50] bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[55] w-64 bg-sidebar-bg transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 bg-sidebar-bg lg:block">
        {navContent}
      </aside>
    </>
  );
}
