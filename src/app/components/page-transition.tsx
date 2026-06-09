"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, ReactNode, useContext } from "react";
import { motion, AnimatePresence, Variants } from "motion/react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

const TAB_ROUTES = [
  "/dashboard",
  "/presence",
  "/office",
  "/employee",
  "/profile",
];

function getTabIndex(path: string): number {
  for (let i = 0; i < TAB_ROUTES.length; i++) {
    const route = TAB_ROUTES[i];
    if (path === route || path.startsWith(route + "/")) {
      return i;
    }
  }
  return -1;
}

export function FrozenRoute({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const [frozen] = useState(context);
  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  const [direction, setDirection] = useState<"left" | "right" | "none">(
    "none"
  );

  if (pathname !== prevPath) {
    const prevIndex = getTabIndex(prevPath);
    const currIndex = getTabIndex(pathname);

    let newDirection: "left" | "right" | "none" = "none";
    if (prevIndex !== -1 && currIndex !== -1 && prevIndex !== currIndex) {
      newDirection = currIndex > prevIndex ? "right" : "left";
    }

    setPrevPath(pathname);
    setDirection(newDirection);
  }

  useEffect(() => {
    const scrollContainer = document.querySelector("main");
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [pathname]);

  const slideVariants: Variants = {
    initial: (customDirection: "left" | "right" | "none") => {
      if (customDirection === "right") return { x: "100%", opacity: 0 };
      if (customDirection === "left") return { x: "-100%", opacity: 0 };
      return { x: 0, opacity: 0 };
    },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 380, damping: 35 },
        opacity: { duration: 0.15 },
      },
    },
    exit: (customDirection: "left" | "right" | "none") => {
      if (customDirection === "right") {
        return {
          x: "-100%",
          opacity: 0,
          transition: { duration: 0.2, ease: "easeIn" },
        };
      }
      if (customDirection === "left") {
        return {
          x: "100%",
          opacity: 0,
          transition: { duration: 0.2, ease: "easeIn" },
        };
      }
      return { x: 0, opacity: 0, transition: { duration: 0.15 } };
    },
  };

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={slideVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full flex-1 flex flex-col"
      >
        <FrozenRoute>{children}</FrozenRoute>
      </motion.div>
    </AnimatePresence>
  );
}
