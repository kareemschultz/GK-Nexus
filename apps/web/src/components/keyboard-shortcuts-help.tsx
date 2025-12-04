/**
 * Keyboard Shortcuts Help Dialog
 * Displays available keyboard shortcuts in a modal
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getShortcutsByCategory } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/utils";

type KeyboardShortcutsHelpProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  const shortcutsByCategory = getShortcutsByCategory();

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and perform actions quickly.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6">
            {Array.from(shortcutsByCategory.entries()).map(
              ([category, shortcuts]) => (
                <div key={category}>
                  <h4 className="mb-3 font-semibold text-muted-foreground text-sm">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut, index) => (
                      <div
                        className="flex items-center justify-between py-1.5"
                        key={index}
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex}>
                              <kbd
                                className={cn(
                                  "inline-flex h-6 min-w-[24px] items-center justify-center",
                                  "rounded border bg-muted px-1.5",
                                  "font-medium font-mono text-xs"
                                )}
                              >
                                {key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="mx-0.5 text-muted-foreground">
                                  +
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </ScrollArea>

        <div className="border-t pt-4 text-center text-muted-foreground text-xs">
          Press <kbd className="rounded bg-muted px-1 py-0.5 font-mono">?</kbd>{" "}
          to toggle this help
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Inline key display component
type KeyBadgeProps = {
  children: string;
  className?: string;
};

export function KeyBadge({ children, className }: KeyBadgeProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center",
        "rounded border bg-muted px-1",
        "font-medium font-mono text-[10px]",
        className
      )}
    >
      {children}
    </kbd>
  );
}

// Shortcut indicator for buttons/menus
type ShortcutIndicatorProps = {
  keys: string[];
  className?: string;
};

export function ShortcutIndicator({ keys, className }: ShortcutIndicatorProps) {
  return (
    <span className={cn("ml-auto flex items-center gap-0.5", className)}>
      {keys.map((key, index) => (
        <span key={index}>
          <KeyBadge>{key}</KeyBadge>
          {index < keys.length - 1 && (
            <span className="mx-0.5 text-[10px] text-muted-foreground">+</span>
          )}
        </span>
      ))}
    </span>
  );
}
