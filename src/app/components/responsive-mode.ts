export type LayoutMode = "mobile" | "tablet" | "desktop";

export const RESPONSIVE_BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;

export function getLayoutMode(width: number): LayoutMode {
  if (width >= RESPONSIVE_BREAKPOINTS.desktop) {
    return "desktop";
  }

  if (width >= RESPONSIVE_BREAKPOINTS.tablet) {
    return "tablet";
  }

  return "mobile";
}
