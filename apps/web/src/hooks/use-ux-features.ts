import { useCallback, useEffect, useRef, useState } from "react";

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [
        event.metaKey && "meta",
        event.ctrlKey && "ctrl",
        event.altKey && "alt",
        event.shiftKey && "shift",
        event.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+");

      const callback = shortcuts[key];
      if (callback) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

// Hook for managing focus within a component
export function useFocusManagement() {
  const containerRef = useRef<HTMLDivElement>(null);

  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;

    const focusable = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusable[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  }, []);

  const focusLast = useCallback(() => {
    if (!containerRef.current) return;

    const focusable = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const lastElement = focusable[focusable.length - 1] as HTMLElement;
    if (lastElement) {
      lastElement.focus();
    }
  }, []);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (event.key !== "Tab" || !containerRef.current) return;

    const focusable = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusable[0] as HTMLElement;
    const lastElement = focusable[focusable.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
    trapFocus,
  };
}

// Hook for tracking user activity and idle state
export function useUserActivity(timeoutMs = 300_000) {
  // 5 minutes default
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(new Date());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsIdle(false);
    setLastActivity(new Date());

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetTimeout();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timeout
    resetTimeout();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimeout]);

  return {
    isIdle,
    lastActivity,
    resetActivity: resetTimeout,
  };
}

// Hook for managing theme preference
export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    const saved = localStorage.getItem("gk-nexus-theme");
    return (saved as "light" | "dark" | "system") || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const updateTheme = () => {
      let resolved: "light" | "dark" = "light";

      if (theme === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } else {
        resolved = theme;
      }

      setResolvedTheme(resolved);

      // Update document class
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(resolved);
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateTheme);

    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [theme]);

  const setThemePreference = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("gk-nexus-theme", newTheme);
  };

  return {
    theme,
    resolvedTheme,
    setTheme: setThemePreference,
  };
}

// Hook for managing recent actions/history
export function useRecentActions<T = any>(key: string, maxItems = 10) {
  const [recentActions, setRecentActions] = useState<T[]>(() => {
    const saved = localStorage.getItem(`gk-nexus-recent-${key}`);
    return saved ? JSON.parse(saved) : [];
  });

  const addRecentAction = useCallback(
    (action: T) => {
      setRecentActions((prev) => {
        const updated = [
          action,
          ...prev.filter(
            (item) => JSON.stringify(item) !== JSON.stringify(action)
          ),
        ].slice(0, maxItems);

        localStorage.setItem(`gk-nexus-recent-${key}`, JSON.stringify(updated));
        return updated;
      });
    },
    [key, maxItems]
  );

  const removeRecentAction = useCallback(
    (action: T) => {
      setRecentActions((prev) => {
        const updated = prev.filter(
          (item) => JSON.stringify(item) !== JSON.stringify(action)
        );

        localStorage.setItem(`gk-nexus-recent-${key}`, JSON.stringify(updated));
        return updated;
      });
    },
    [key]
  );

  const clearRecentActions = useCallback(() => {
    setRecentActions([]);
    localStorage.removeItem(`gk-nexus-recent-${key}`);
  }, [key]);

  return {
    recentActions,
    addRecentAction,
    removeRecentAction,
    clearRecentActions,
  };
}

// Hook for managing favorites
export function useFavorites<T extends { id: string }>(key: string) {
  const [favorites, setFavorites] = useState<T[]>(() => {
    const saved = localStorage.getItem(`gk-nexus-favorites-${key}`);
    return saved ? JSON.parse(saved) : [];
  });

  const addFavorite = useCallback(
    (item: T) => {
      setFavorites((prev) => {
        if (prev.some((fav) => fav.id === item.id)) return prev;

        const updated = [...prev, item];
        localStorage.setItem(
          `gk-nexus-favorites-${key}`,
          JSON.stringify(updated)
        );
        return updated;
      });
    },
    [key]
  );

  const removeFavorite = useCallback(
    (itemId: string) => {
      setFavorites((prev) => {
        const updated = prev.filter((item) => item.id !== itemId);
        localStorage.setItem(
          `gk-nexus-favorites-${key}`,
          JSON.stringify(updated)
        );
        return updated;
      });
    },
    [key]
  );

  const isFavorite = useCallback(
    (itemId: string) => favorites.some((item) => item.id === itemId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (item: T) => {
      if (isFavorite(item.id)) {
        removeFavorite(item.id);
      } else {
        addFavorite(item);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}

// Hook for managing user preferences
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem("gk-nexus-user-preferences");
    return saved ? JSON.parse(saved) : {};
  });

  const setPreference = useCallback((key: string, value: any) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(
        "gk-nexus-user-preferences",
        JSON.stringify(updated)
      );
      return updated;
    });
  }, []);

  const getPreference = useCallback(
    (key: string, defaultValue?: any) => preferences[key] ?? defaultValue,
    [preferences]
  );

  const removePreference = useCallback((key: string) => {
    setPreferences((prev) => {
      const updated = { ...prev };
      delete updated[key];
      localStorage.setItem(
        "gk-nexus-user-preferences",
        JSON.stringify(updated)
      );
      return updated;
    });
  }, []);

  return {
    preferences,
    setPreference,
    getPreference,
    removePreference,
  };
}

// Hook for managing step-by-step wizards
export function useWizard<T = any>(steps: T[], initialStep = 0) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepData, setStepData] = useState<Record<number, any>>({});

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canGoNext = completedSteps.has(currentStep) || currentStep === 0;
  const canGoPrevious = currentStep > 0;

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < steps.length) {
        setCurrentStep(step);
      }
    },
    [steps.length]
  );

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep]);

  const previousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirstStep]);

  const completeStep = useCallback(
    (step?: number) => {
      const stepToComplete = step ?? currentStep;
      setCompletedSteps((prev) => new Set([...prev, stepToComplete]));
    },
    [currentStep]
  );

  const setStepDataValue = useCallback((step: number, data: any) => {
    setStepData((prev) => ({
      ...prev,
      [step]: data,
    }));
  }, []);

  const getStepData = useCallback((step: number) => stepData[step], [stepData]);

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
    setCompletedSteps(new Set());
    setStepData({});
  }, [initialStep]);

  return {
    currentStep,
    completedSteps: Array.from(completedSteps),
    stepData,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious,
    goToStep,
    nextStep,
    previousStep,
    completeStep,
    setStepData: setStepDataValue,
    getStepData,
    reset,
    progress: (completedSteps.size / steps.length) * 100,
  };
}

// Hook for tracking feature usage analytics
export function useFeatureTracking() {
  const trackFeatureUsage = useCallback(
    (feature: string, action: string, metadata?: Record<string, any>) => {
      const event = {
        feature,
        action,
        metadata,
        timestamp: new Date().toISOString(),
        userId: "current-user", // Replace with actual user ID
        sessionId: sessionStorage.getItem("session-id") || "anonymous",
      };

      // In a real app, you would send this to your analytics service
      console.log("Feature usage tracked:", event);

      // Store locally for development/debugging
      const existing = JSON.parse(
        localStorage.getItem("gk-nexus-feature-usage") || "[]"
      );
      existing.push(event);

      // Keep only last 100 events
      const trimmed = existing.slice(-100);
      localStorage.setItem("gk-nexus-feature-usage", JSON.stringify(trimmed));
    },
    []
  );

  const getFeatureUsage = useCallback((feature?: string) => {
    const usage = JSON.parse(
      localStorage.getItem("gk-nexus-feature-usage") || "[]"
    );

    if (feature) {
      return usage.filter((event: any) => event.feature === feature);
    }

    return usage;
  }, []);

  return {
    trackFeatureUsage,
    getFeatureUsage,
  };
}

// Hook for managing loading states
export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const isLoading = useCallback(
    (key: string) => loadingStates[key],
    [loadingStates]
  );

  const isAnyLoading = useCallback(
    () => Object.values(loadingStates).some((loading) => loading),
    [loadingStates]
  );

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates,
  };
}

// Hook for managing form auto-save
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  options: {
    delay?: number;
    enabled?: boolean;
    key?: string;
  } = {}
) {
  const { delay = 2000, enabled = true, key = "autosave" } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        setError(null);

        await saveFunction(data);

        setLastSaved(new Date());
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Auto-save failed"));
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFunction, delay, enabled]);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      setIsSaving(true);
      setError(null);

      await saveFunction(data);

      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Save failed"));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [data, saveFunction]);

  return {
    isSaving,
    lastSaved,
    error,
    saveNow,
  };
}

// Hook for managing scroll position and restoration
export function useScrollRestoration(key: string) {
  const saveScrollPosition = useCallback(() => {
    const position = {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(`scroll-${key}`, JSON.stringify(position));
  }, [key]);

  const restoreScrollPosition = useCallback(() => {
    const saved = sessionStorage.getItem(`scroll-${key}`);

    if (saved) {
      try {
        const position = JSON.parse(saved);

        // Only restore if saved recently (within 5 minutes)
        if (Date.now() - position.timestamp < 300_000) {
          window.scrollTo(position.x, position.y);
        }
      } catch (err) {
        console.error("Failed to restore scroll position:", err);
      }
    }
  }, [key]);

  useEffect(() => {
    // Save scroll position when component unmounts or page unloads
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Restore scroll position on mount
    restoreScrollPosition();

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      saveScrollPosition();
    };
  }, [saveScrollPosition, restoreScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
  };
}
