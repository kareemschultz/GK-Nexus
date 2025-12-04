/**
 * Keyboard Shortcuts Hook
 * Provides global keyboard shortcuts for navigation and actions
 */

import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

type ShortcutConfig = {
  key: string;
  modifiers?: Array<"ctrl" | "meta" | "alt" | "shift">;
  description: string;
  action: () => void;
  category?: string;
  global?: boolean; // If true, works even in input fields
};

export type ShortcutDefinition = {
  keys: string[];
  description: string;
  category?: string;
};

// Global shortcuts state
const registeredShortcuts = new Map<string, ShortcutConfig>();

// Check if event target is an input element
function isInputElement(target: EventTarget | null): boolean {
  if (!(target && target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

// Generate key for shortcut
function getShortcutKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey) {
    parts.push("meta");
  }
  if (e.ctrlKey) {
    parts.push("ctrl");
  }
  if (e.altKey) {
    parts.push("alt");
  }
  if (e.shiftKey) {
    parts.push("shift");
  }
  parts.push(e.key.toLowerCase());
  return parts.join("+");
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const pendingKeyRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Define navigation shortcuts with 'g' prefix (like GitHub)
  const handleGoShortcut = useCallback(
    (nextKey: string) => {
      switch (nextKey) {
        case "d":
          navigate({ to: "/dashboard" });
          break;
        case "c":
          navigate({ to: "/clients" });
          break;
        case "f":
          navigate({ to: "/filings" });
          break;
        case "o":
          navigate({ to: "/documents" });
          break;
        case "s":
          navigate({ to: "/settings" });
          break;
        case "n":
          navigate({ to: "/clients/new" });
          break;
        case "i":
          navigate({ to: "/immigration" });
          break;
        case "t":
          navigate({ to: "/training" });
          break;
      }
    },
    [navigate]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input unless it's a global shortcut
      if (isInputElement(e.target)) {
        // Only allow Escape and Cmd/Ctrl shortcuts in inputs
        if (!(e.key === "Escape" || e.metaKey || e.ctrlKey)) {
          return;
        }
      }

      // Handle Escape key
      if (e.key === "Escape") {
        if (pendingKeyRef.current) {
          pendingKeyRef.current = null;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
        return;
      }

      // Handle '?' for help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Handle 'g' prefix navigation
      if (pendingKeyRef.current === "g") {
        e.preventDefault();
        handleGoShortcut(e.key.toLowerCase());
        pendingKeyRef.current = null;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }

      // Start 'g' sequence
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        pendingKeyRef.current = "g";
        // Clear after 1 second if no second key
        timeoutRef.current = setTimeout(() => {
          pendingKeyRef.current = null;
        }, 1000);
        return;
      }

      // Check registered shortcuts
      const shortcutKey = getShortcutKey(e);
      const shortcut = registeredShortcuts.get(shortcutKey);
      if (shortcut && (shortcut.global || !isInputElement(e.target))) {
        e.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleGoShortcut]);

  return {
    showHelp,
    setShowHelp,
  };
}

// Register a custom shortcut
export function registerShortcut(config: ShortcutConfig): () => void {
  const parts: string[] = [];
  if (config.modifiers?.includes("meta")) {
    parts.push("meta");
  }
  if (config.modifiers?.includes("ctrl")) {
    parts.push("ctrl");
  }
  if (config.modifiers?.includes("alt")) {
    parts.push("alt");
  }
  if (config.modifiers?.includes("shift")) {
    parts.push("shift");
  }
  parts.push(config.key.toLowerCase());

  const key = parts.join("+");
  registeredShortcuts.set(key, config);

  // Return unregister function
  return () => {
    registeredShortcuts.delete(key);
  };
}

// Hook for component-level shortcuts
export function useShortcut(
  key: string,
  action: () => void,
  modifiers?: Array<"ctrl" | "meta" | "alt" | "shift">,
  options?: { global?: boolean }
): void {
  useEffect(() => {
    const unregister = registerShortcut({
      key,
      modifiers,
      action,
      description: "",
      global: options?.global,
    });

    return unregister;
  }, [key, action, modifiers, options?.global]);
}

// Get all shortcuts for help display
export function getAllShortcuts(): ShortcutDefinition[] {
  const shortcuts: ShortcutDefinition[] = [
    // Global
    { keys: ["⌘", "K"], description: "Open search", category: "Global" },
    { keys: ["?"], description: "Show keyboard shortcuts", category: "Global" },
    {
      keys: ["Esc"],
      description: "Close dialogs / Cancel",
      category: "Global",
    },

    // Navigation (g prefix)
    {
      keys: ["G", "D"],
      description: "Go to Dashboard",
      category: "Navigation",
    },
    { keys: ["G", "C"], description: "Go to Clients", category: "Navigation" },
    { keys: ["G", "F"], description: "Go to Filings", category: "Navigation" },
    {
      keys: ["G", "O"],
      description: "Go to Documents",
      category: "Navigation",
    },
    { keys: ["G", "S"], description: "Go to Settings", category: "Navigation" },
    { keys: ["G", "N"], description: "New Client", category: "Navigation" },
    {
      keys: ["G", "I"],
      description: "Go to Immigration",
      category: "Navigation",
    },
    { keys: ["G", "T"], description: "Go to Training", category: "Navigation" },

    // Actions
    {
      keys: ["⌘", "N"],
      description: "New item (context-aware)",
      category: "Actions",
    },
    { keys: ["⌘", "S"], description: "Save", category: "Actions" },
    { keys: ["⌘", "E"], description: "Edit", category: "Actions" },
    { keys: ["⌘", "P"], description: "Print", category: "Actions" },
  ];

  // Add registered shortcuts
  for (const [, config] of registeredShortcuts) {
    const keys: string[] = [];
    if (config.modifiers?.includes("meta")) {
      keys.push("⌘");
    }
    if (config.modifiers?.includes("ctrl")) {
      keys.push("Ctrl");
    }
    if (config.modifiers?.includes("alt")) {
      keys.push("Alt");
    }
    if (config.modifiers?.includes("shift")) {
      keys.push("Shift");
    }
    keys.push(config.key.toUpperCase());

    shortcuts.push({
      keys,
      description: config.description,
      category: config.category ?? "Custom",
    });
  }

  return shortcuts;
}

// Group shortcuts by category
export function getShortcutsByCategory(): Map<string, ShortcutDefinition[]> {
  const shortcuts = getAllShortcuts();
  const grouped = new Map<string, ShortcutDefinition[]>();

  for (const shortcut of shortcuts) {
    const category = shortcut.category ?? "Other";
    const existing = grouped.get(category) ?? [];
    grouped.set(category, [...existing, shortcut]);
  }

  return grouped;
}
