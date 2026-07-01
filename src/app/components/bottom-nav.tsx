"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { useAuth } from "@/lib/auth-context"
import { navItems } from "@/app/components/navigation-items"

export function BottomNav() {
    const pathname = usePathname()
    const { user } = useAuth()
    const visibleItems = navItems.filter(
        (item) => !item.adminOnly || user?.role === "administrator",
    )

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[max(env(safe-area-inset-bottom),1rem)] lg:hidden">
            <nav className="pointer-events-auto mx-3 w-full max-w-md">
                <div className="relative flex items-stretch justify-around rounded-full bg-white/90 border border-taupe-200 px-2 py-2 shadow-sm backdrop-blur-xl backdrop-saturate-150">
                    {visibleItems.map((item) => {
                        const isActive =
                            pathname === item.href || pathname.startsWith(`${item.href}/`)

                        const Icon = isActive ? item.solidIcon : item.outlineIcon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                id={`nav-${item.label.toLowerCase()}`}
                                className="relative flex min-w-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1"
                            >
                                <div className="relative flex h-9 w-9 items-center justify-center">
                                    {isActive && (
                                        <motion.div
                                            layoutId="bottom-nav-indicator"
                                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                            className="absolute inset-0 rounded-full bg-primary-50"
                                        />
                                    )}
                                    <Icon
                                        className={`relative size-[22px] transition-colors ${isActive ? "text-primary" : "text-taupe-400"}`}
                                    />
                                </div>
                                <span
                                    className={`text-[10px] font-medium leading-none transition-colors ${isActive ? "text-primary" : "text-taupe-400"}`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
