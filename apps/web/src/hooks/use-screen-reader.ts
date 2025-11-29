import React, { useEffect, useRef } from "react";

/**
 * Hook for making screen reader announcements
 * Uses a live region to announce messages to screen readers
 */
export function useScreenReader() {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement("div");
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.setAttribute("id", "screen-reader-announcements");
      liveRegion.style.position = "absolute";
      liveRegion.style.left = "-10000px";
      liveRegion.style.width = "1px";
      liveRegion.style.height = "1px";
      liveRegion.style.overflow = "hidden";

      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      // Clean up when component unmounts
      if (
        liveRegionRef.current &&
        document.body.contains(liveRegionRef.current)
      ) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  const announce = (
    message: string,
    priority: "polite" | "assertive" = "polite"
  ) => {
    if (!liveRegionRef.current) {
      return;
    }

    liveRegionRef.current.setAttribute("aria-live", priority);
    liveRegionRef.current.textContent = message;

    // Clear the announcement after a brief delay to allow for repeated announcements
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = "";
      }
    }, 1000);
  };

  const announceImmediate = (message: string) => {
    announce(message, "assertive");
  };

  return { announce, announceImmediate };
}

/**
 * Component that provides a global live region for announcements
 */
export function ScreenReaderAnnouncements() {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Store reference for global access
    if (liveRegionRef.current) {
      (window as any).__screenReaderAnnouncements = liveRegionRef.current;
    }

    return () => {
      (window as any).__screenReaderAnnouncements = undefined;
    };
  }, []);

  // Create props object to avoid linter issues
  const divProps = {
    ref: liveRegionRef,
    "aria-live": "polite" as const,
    "aria-atomic": "true",
    id: "global-screen-reader-announcements",
    className: "sr-only",
  };

  return React.createElement("div", divProps);
}

/**
 * Global function to make announcements from anywhere in the app
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
) {
  const liveRegion = (window as any)
    .__screenReaderAnnouncements as HTMLDivElement;
  if (liveRegion) {
    liveRegion.setAttribute("aria-live", priority);
    liveRegion.textContent = message;

    setTimeout(() => {
      liveRegion.textContent = "";
    }, 1000);
  }
}
