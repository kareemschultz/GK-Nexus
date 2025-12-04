/**
 * Empty State Component
 * Displays helpful messages when data is empty with optional actions
 */

import type { LucideIcon } from "lucide-react";
import { FileText, FolderOpen, Inbox, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-8 px-4",
      iconContainer: "h-10 w-10",
      icon: "h-5 w-5",
      title: "text-base",
      description: "text-sm",
    },
    md: {
      container: "py-12 px-4",
      iconContainer: "h-12 w-12",
      icon: "h-6 w-6",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "py-16 px-6",
      iconContainer: "h-16 w-16",
      icon: "h-8 w-8",
      title: "text-xl",
      description: "text-base",
    },
  };

  const s = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        s.container,
        className
      )}
    >
      <div
        className={cn(
          "mb-4 flex items-center justify-center rounded-full bg-muted",
          s.iconContainer
        )}
      >
        <Icon className={cn("text-muted-foreground", s.icon)} />
      </div>
      <h3 className={cn("mb-1 font-semibold", s.title)}>{title}</h3>
      <p className={cn("mb-4 max-w-md text-muted-foreground", s.description)}>
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant ?? "default"}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases

type PresetEmptyStateProps = {
  onAction?: () => void;
  actionLabel?: string;
};

export function EmptyClients({
  onAction,
  actionLabel = "Add Client",
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
      description="Get started by adding your first client to GK-Nexus. You can onboard individual or business clients."
      icon={Users}
      title="No clients yet"
    />
  );
}

export function EmptyFilings({
  onAction,
  actionLabel = "Create Filing",
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
      description="Create your first filing to track tax submissions, compliance documents, and deadlines."
      icon={FileText}
      title="No filings found"
    />
  );
}

export function EmptyDocuments({
  onAction,
  actionLabel = "Upload Document",
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
      description="Upload documents to keep client records organized. Supported formats include PDF, images, and Office files."
      icon={FolderOpen}
      title="No documents"
    />
  );
}

export function EmptySearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      description={
        query
          ? `We couldn't find anything matching "${query}". Try adjusting your search or filters.`
          : "Try adjusting your search or filters to find what you're looking for."
      }
      icon={Search}
      size="sm"
      title="No results found"
    />
  );
}

export function EmptyActivity() {
  return (
    <EmptyState
      description="Activity will appear here as you and your team work with clients and filings."
      icon={Inbox}
      size="sm"
      title="No recent activity"
    />
  );
}

// Table-specific empty state
type EmptyTableProps = {
  entityName: string;
  onAdd?: () => void;
  addLabel?: string;
};

export function EmptyTable({ entityName, onAdd, addLabel }: EmptyTableProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-12">
      <Inbox className="mb-4 h-10 w-10 text-muted-foreground" />
      <h3 className="mb-1 font-semibold text-lg">No {entityName} found</h3>
      <p className="mb-4 text-muted-foreground text-sm">
        Get started by creating your first {entityName.toLowerCase()}.
      </p>
      {onAdd && (
        <Button onClick={onAdd}>{addLabel ?? `Add ${entityName}`}</Button>
      )}
    </div>
  );
}

// Error state
type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an error while loading the data. Please try again.",
  onRetry,
  retryLabel = "Try Again",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <svg
          className="h-6 w-6 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </div>
      <h3 className="mb-1 font-semibold text-lg">{title}</h3>
      <p className="mb-4 max-w-md text-muted-foreground text-sm">
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
