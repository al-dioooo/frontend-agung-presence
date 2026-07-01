"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { AgungPresenceLogoIcon } from "@/components/icons/agung-presence-logo";
import { navItems } from "@/app/components/navigation-items";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "administrator",
  );

  return (
    <aside className="hidden h-dvh w-72 shrink-0 flex-col border-r border-taupe-200 bg-white/88 px-4 py-5 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3 px-2">
        <div className="size-11 overflow-hidden rounded-2xl shadow-sm">
          <AgungPresenceLogoIcon variant="inverted" className="size-full" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">Agung Presence</p>
          <p className="text-xs text-taupe-400">Presence workspace</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1" aria-label="Navigasi utama">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = isActive ? item.solidIcon : item.outlineIcon;

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`sidebar-${item.label.toLowerCase()}`}
              className={`relative flex h-11 items-center gap-3 overflow-hidden rounded-2xl px-3 text-sm font-semibold transition-opacity active:opacity-80 ${
                isActive ? "text-primary" : "text-taupe-400 hover:opacity-80"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="desktop-sidebar-indicator"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-2xl bg-primary-50"
                />
              )}
              <Icon className="relative size-5 shrink-0 transition-colors" />
              <span className="relative transition-colors">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl bg-taupe-50 p-4 ring-1 ring-taupe-200">
        <p className="text-xs font-semibold uppercase text-taupe-400">
          Masuk sebagai
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {user?.name ?? "-"}
        </p>
        <p className="mt-0.5 text-xs capitalize text-taupe-500">
          {user?.role ?? "employee"}
        </p>
      </div>
    </aside>
  );
}
