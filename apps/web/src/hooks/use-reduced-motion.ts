import { useEffect, useState } from "react";

/**
 * Hook to detect if the user prefers reduced motion
 * Returns true if user has indicated they prefer reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to get safe animation configuration based on user preferences
 */
export function useAnimation() {
  const prefersReducedMotion = useReducedMotion();

  return {
    duration: prefersReducedMotion ? 0 : undefined,
    transition: prefersReducedMotion ? "none" : undefined,
    shouldAnimate: !prefersReducedMotion,
  };
}

/**
 * Hook to apply reduced motion classes to body element
 */
export function useReducedMotionClass() {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      document.body.classList.add("reduce-motion");
    } else {
      document.body.classList.remove("reduce-motion");
    }

    return () => {
      document.body.classList.remove("reduce-motion");
    };
  }, [prefersReducedMotion]);

  return prefersReducedMotion;
}
