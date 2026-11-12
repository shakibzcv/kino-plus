import { useCallback } from "react";

/**
 * useScrollTabBar hook
 * Returns a stable no-op handleScroll function so the bottom tab bar
 * remains permanently visible and docked at the bottom without hiding on scroll.
 */
export function useScrollTabBar() {
  const handleScroll = useCallback(() => {}, []);
  return { handleScroll };
}
