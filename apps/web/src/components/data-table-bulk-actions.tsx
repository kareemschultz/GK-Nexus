/**
 * Bulk Actions Component for Data Tables
 * Provides bulk operations for selected rows in tables
 */

import {
  Archive,
  ChevronDown,
  Download,
  Mail,
  Printer,
  Trash,
} from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type BulkAction = {
  id: string;
  label: string;
  icon: typeof Download;
  variant?: "default" | "destructive";
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
};

type BulkActionsProps = {
  selectedCount: number;
  onAction: (actionId: string) => void | Promise<void>;
  actions?: BulkAction[];
  entityName?: string;
  className?: string;
};

const defaultActions: BulkAction[] = [
  { id: "export", label: "Export Selected", icon: Download },
  { id: "email", label: "Send Email", icon: Mail },
  { id: "print", label: "Print", icon: Printer },
  { id: "archive", label: "Archive", icon: Archive },
  {
    id: "delete",
    label: "Delete",
    icon: Trash,
    variant: "destructive",
    requiresConfirmation: true,
    confirmationMessage:
      "This action cannot be undone. The selected items will be permanently deleted.",
  },
];

export function BulkActions({
  selectedCount,
  onAction,
  actions = defaultActions,
  entityName = "item",
  className,
}: BulkActionsProps) {
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const handleAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmAction(action);
      return;
    }
    await executeAction(action.id);
  };

  const executeAction = async (actionId: string) => {
    setIsProcessing(true);
    try {
      await onAction(actionId);
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  const pluralizedEntity = selectedCount === 1 ? entityName : `${entityName}s`;

  return (
    <>
      <div
        className={cn(
          "slide-in-from-top-2 flex animate-in items-center gap-3 rounded-lg border bg-muted/50 p-3",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
            <span className="font-bold text-primary-foreground text-xs">
              {selectedCount}
            </span>
          </div>
          <span className="font-medium text-sm">
            {selectedCount} {pluralizedEntity} selected
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Quick action buttons for common actions */}
          {actions.slice(0, 2).map((action) => (
            <Button
              className={cn(
                action.variant === "destructive" &&
                  "text-destructive hover:text-destructive"
              )}
              disabled={isProcessing}
              key={action.id}
              onClick={() => handleAction(action)}
              size="sm"
              variant="outline"
            >
              <action.icon className="mr-1.5 h-4 w-4" />
              {action.label}
            </Button>
          ))}

          {/* More actions dropdown */}
          {actions.length > 2 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={isProcessing} size="sm" variant="outline">
                  More <ChevronDown className="ml-1.5 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {actions.slice(2).map((action, _index) => (
                  <DropdownMenuItem
                    className={cn(
                      action.variant === "destructive" &&
                        "text-destructive focus:text-destructive"
                    )}
                    key={action.id}
                    onClick={() => handleAction(action)}
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog
        onOpenChange={() => setConfirmAction(null)}
        open={!!confirmAction}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.label} {selectedCount} {pluralizedEntity}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmationMessage ||
                `Are you sure you want to ${confirmAction?.label.toLowerCase()} the selected ${pluralizedEntity}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                confirmAction?.variant === "destructive" &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
              disabled={isProcessing}
              onClick={() => confirmAction && executeAction(confirmAction.id)}
            >
              {isProcessing ? "Processing..." : confirmAction?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Compact version for inline use
type BulkActionsCompactProps = {
  selectedCount: number;
  onAction: (actionId: string) => void;
  actions?: BulkAction[];
};

export function BulkActionsCompact({
  selectedCount,
  onAction,
  actions = defaultActions,
}: BulkActionsCompactProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          {selectedCount} selected <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => (
          <>
            {action.variant === "destructive" && index > 0 && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuItem
              className={cn(
                action.variant === "destructive" &&
                  "text-destructive focus:text-destructive"
              )}
              key={action.id}
              onClick={() => onAction(action.id)}
            >
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          </>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Preset action sets for different entity types
export const clientBulkActions: BulkAction[] = [
  { id: "export-csv", label: "Export to CSV", icon: Download },
  { id: "export-pdf", label: "Export to PDF", icon: Download },
  { id: "send-email", label: "Send Email", icon: Mail },
  { id: "archive", label: "Archive Clients", icon: Archive },
  {
    id: "delete",
    label: "Delete",
    icon: Trash,
    variant: "destructive",
    requiresConfirmation: true,
    confirmationMessage:
      "This will permanently delete the selected clients and all their associated data.",
  },
];

export const filingBulkActions: BulkAction[] = [
  { id: "export", label: "Export Selected", icon: Download },
  { id: "print", label: "Print Filings", icon: Printer },
  { id: "archive", label: "Archive", icon: Archive },
];

export const documentBulkActions: BulkAction[] = [
  { id: "download", label: "Download All", icon: Download },
  { id: "print", label: "Print Selected", icon: Printer },
  { id: "archive", label: "Archive", icon: Archive },
  {
    id: "delete",
    label: "Delete",
    icon: Trash,
    variant: "destructive",
    requiresConfirmation: true,
  },
];
