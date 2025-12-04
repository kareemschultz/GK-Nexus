/**
 * Activity Timeline Component
 * Displays a timeline of activities for entities like clients, filings, documents
 */

import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Archive,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  Key,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Trash,
  Upload,
  User,
  XCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type Activity = {
  id: string;
  action: string;
  description: string;
  entityType: string;
  entityId?: string;
  userName?: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
  severity?: "info" | "warning" | "error" | "critical";
};

type ActivityTimelineProps = {
  activities: Activity[];
  maxHeight?: string;
  emptyMessage?: string;
  groupByDate?: boolean;
};

// Map actions to icons
const actionIcons: Record<string, typeof Plus> = {
  // CRUD actions
  create: Plus,
  created: Plus,
  read: Eye,
  update: Edit,
  updated: Edit,
  delete: Trash,
  deleted: Trash,

  // Submission actions
  submit: Send,
  submitted: Send,
  upload: Upload,
  uploaded: Upload,
  download: Download,
  downloaded: Download,

  // Approval workflow
  approve: CheckCircle,
  approved: CheckCircle,
  reject: XCircle,
  rejected: XCircle,
  cancel: XCircle,
  cancelled: XCircle,

  // Archive/Restore
  archive: Archive,
  archived: Archive,
  restore: RefreshCw,
  restored: RefreshCw,

  // Auth actions
  login: Key,
  logout: Key,
  password_change: Key,
  permission_change: Settings,

  // Default
  default: Clock,
};

// Map entity types to icons
const entityIcons: Record<string, typeof User> = {
  user: User,
  client: User,
  document: FileText,
  compliance_requirement: FileText,
  compliance_filing: FileText,
  tax_calculation: DollarSign,
  filing: FileText,
  invoice: DollarSign,
  session: Key,
  system: Settings,
  report: FileText,
  setting: Settings,
  permission: Key,
  role: Settings,
};

// Get action color based on action type
function getActionColor(action: string, severity?: string): string {
  if (severity === "error" || severity === "critical") {
    return "text-red-500 bg-red-500/10";
  }
  if (severity === "warning") {
    return "text-yellow-500 bg-yellow-500/10";
  }

  switch (action.toLowerCase()) {
    case "create":
    case "created":
      return "text-green-500 bg-green-500/10";
    case "update":
    case "updated":
    case "edit":
      return "text-blue-500 bg-blue-500/10";
    case "delete":
    case "deleted":
      return "text-red-500 bg-red-500/10";
    case "approve":
    case "approved":
      return "text-green-600 bg-green-600/10";
    case "reject":
    case "rejected":
    case "cancel":
    case "cancelled":
      return "text-red-500 bg-red-500/10";
    case "submit":
    case "submitted":
    case "upload":
    case "uploaded":
      return "text-purple-500 bg-purple-500/10";
    case "archive":
    case "archived":
      return "text-gray-500 bg-gray-500/10";
    case "login":
      return "text-emerald-500 bg-emerald-500/10";
    case "logout":
      return "text-gray-500 bg-gray-500/10";
    default:
      return "text-muted-foreground bg-muted";
  }
}

// Severity badge classes
const severityBadgeClasses: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  error: "bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400",
  warning:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/10 dark:text-yellow-400",
};

// Group activities by date
function groupActivitiesByDate(
  activities: Activity[]
): Map<string, Activity[]> {
  const grouped = new Map<string, Activity[]>();

  for (const activity of activities) {
    const date = new Date(activity.createdAt);
    const dateKey = format(date, "yyyy-MM-dd");
    const existing = grouped.get(dateKey) ?? [];
    grouped.set(dateKey, [...existing, activity]);
  }

  return grouped;
}

// Format date header
function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
    return "Today";
  }
  if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
    return "Yesterday";
  }

  return format(date, "EEEE, MMMM d, yyyy");
}

export function ActivityTimeline({
  activities,
  maxHeight = "400px",
  emptyMessage = "No recent activity",
  groupByDate = true,
}: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const renderActivityItem = (activity: Activity) => {
    const Icon =
      actionIcons[activity.action.toLowerCase()] || actionIcons.default;
    const EntityIcon = entityIcons[activity.entityType] || FileText;
    const colorClasses = getActionColor(activity.action, activity.severity);
    const createdAt = new Date(activity.createdAt);

    return (
      <div className="group flex gap-3 py-3" key={activity.id}>
        {/* Icon */}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              colorClasses
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          {/* Connector line */}
          <div className="-translate-x-1/2 absolute top-8 left-1/2 h-full w-px bg-border group-last:hidden" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm leading-tight">
                {activity.description}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {activity.userName && (
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    <User className="h-3 w-3" />
                    {activity.userName}
                  </span>
                )}
                {activity.entityType && (
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    <EntityIcon className="h-3 w-3" />
                    {activity.entityType.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="whitespace-nowrap text-muted-foreground text-xs">
                    {formatDistanceToNow(createdAt, { addSuffix: true })}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{format(createdAt, "PPpp")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Severity badge for warnings/errors */}
          {activity.severity && severityBadgeClasses[activity.severity] && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                severityBadgeClasses[activity.severity]
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {activity.severity}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (groupByDate) {
    const groupedActivities = groupActivitiesByDate(activities);
    const sortedDates = Array.from(groupedActivities.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    return (
      <ScrollArea className="pr-4" style={{ maxHeight }}>
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const dateActivities = groupedActivities.get(dateKey) ?? [];
            return (
              <div key={dateKey}>
                <h4 className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  {formatDateHeader(dateKey)}
                </h4>
                <div className="space-y-0">
                  {dateActivities.map(renderActivityItem)}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="pr-4" style={{ maxHeight }}>
      <div className="space-y-0">{activities.map(renderActivityItem)}</div>
    </ScrollArea>
  );
}

// Compact variant for sidebars and cards
export function ActivityTimelineCompact({
  activities,
  limit = 5,
}: {
  activities: Activity[];
  limit?: number;
}) {
  const displayActivities = activities.slice(0, limit);

  if (displayActivities.length === 0) {
    return (
      <p className="py-4 text-center text-muted-foreground text-sm">
        No recent activity
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => {
        const Icon =
          actionIcons[activity.action.toLowerCase()] || actionIcons.default;
        const colorClasses = getActionColor(activity.action, activity.severity);
        const createdAt = new Date(activity.createdAt);

        return (
          <div className="flex items-start gap-2" key={activity.id}>
            <div
              className={cn(
                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full",
                colorClasses
              )}
            >
              <Icon className="h-3 w-3" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{activity.description}</p>
              <p className="text-muted-foreground text-xs">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
