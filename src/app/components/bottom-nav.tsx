"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon as HomeOutline,
  DatabaseIcon as DatabaseOutline,
  EnterpriseIcon as EnterpriseOutline,
  CommunityIcon as CommunityOutline,
  UserIcon as UserOutline,
} from "@/components/icons/outline";
import {
  HomeIcon as HomeSolid,
  DatabaseIcon as DatabaseSolid,
  EnterpriseIcon as EnterpriseSolid,
  CommunityIcon as CommunitySolid,
  UserIcon as UserSolid,
} from "@/components/icons/solid";

type NavItem = {
  href: string;
  label: string;
  outlineIcon: React.ComponentType<{ className?: string }>;
  solidIcon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    outlineIcon: HomeOutline,
    solidIcon: HomeSolid,
  },
  {
    href: "/presence",
    label: "Presence",
    outlineIcon: DatabaseOutline,
    solidIcon: DatabaseSolid,
  },
  {
    href: "/office",
    label: "Office",
    outlineIcon: EnterpriseOutline,
    solidIcon: EnterpriseSolid,
  },
  {
    href: "/employee",
    label: "Employee",
    outlineIcon: CommunityOutline,
    solidIcon: CommunitySolid,
  },
  {
    href: "/profile",
    label: "Profile",
    outlineIcon: UserOutline,
    solidIcon: UserSolid,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-2 pb-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          const Icon = isActive ? item.solidIcon : item.outlineIcon;

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-1 min-w-[56px] rounded-xl py-1.5 px-2 transition-colors ${
                isActive
                  ? "text-accent"
                  : "text-muted active:text-accent-soft"
              }`}
            >
              <Icon className="size-[22px]" />
              <span
                className={`text-[10px] font-medium leading-none ${
                  isActive ? "text-accent" : "text-muted"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="mt-0.5 h-[3px] w-5 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
