"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, type HTMLMotionProps, type TargetAndTransition, type Transition } from "motion/react";

type AutoHeightProps = Omit<HTMLMotionProps<"div">, "animate"> & {
  deps?: React.DependencyList;
  transition?: Transition;
  animate?: TargetAndTransition;
  children: React.ReactNode;
};

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  bounce: 0,
  restDelta: 0.01,
};

export function AutoHeight({
  deps = [],
  transition = DEFAULT_TRANSITION,
  animate,
  children,
  className = "",
  ...props
}: AutoHeightProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const dependencySignature = useMemo(
    () => deps.map((dependency) => String(dependency)).join("|"),
    [deps],
  );

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    let frame = requestAnimationFrame(() => {
      setHeight(element.scrollHeight);
    });

    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setHeight(entry.contentRect.height);
      });
    });

    observer.observe(element);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [dependencySignature]);

  return (
    <motion.div
      {...props}
      className={`overflow-hidden ${className}`}
      initial={false}
      animate={{ height, ...animate }}
      transition={transition}
    >
      <div ref={contentRef}>{children}</div>
    </motion.div>
  );
}
