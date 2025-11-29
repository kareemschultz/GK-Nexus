"use client";

import { AlertTriangle, Calendar, CheckCircle, Clock } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TaxDeadline {
  id: string;
  type: "PAYE" | "VAT" | "CIT" | "WHT" | "NIS";
  title: string;
  dueDate: string;
  status: "upcoming" | "due_soon" | "overdue" | "completed";
  description?: string;
  clientCount?: number;
  priority: "low" | "medium" | "high";
}

interface TaxDeadlineWidgetsProps {
  deadlines?: TaxDeadline[];
  onViewDeadline?: (deadline: TaxDeadline) => void;
  onMarkComplete?: (deadlineId: string) => void;
  isLoading?: boolean;
}

export function TaxDeadlineWidgets({
  deadlines = [],
  onViewDeadline,
  onMarkComplete,
  isLoading = false,
}: TaxDeadlineWidgetsProps) {
  // Mock data for demonstration when no deadlines provided
  const mockDeadlines: TaxDeadline[] = [
    {
      id: "1",
      type: "PAYE",
      title: "PAYE Monthly Returns",
      dueDate: "2025-01-15",
      status: "due_soon",
      description: "Submit monthly PAYE deductions for December 2024",
      clientCount: 45,
      priority: "high",
    },
    {
      id: "2",
      type: "VAT",
      title: "VAT Quarterly Return",
      dueDate: "2025-01-31",
      status: "upcoming",
      description: "Q4 2024 VAT return submission",
      clientCount: 32,
      priority: "medium",
    },
    {
      id: "3",
      type: "CIT",
      title: "Corporation Tax Filing",
      dueDate: "2025-03-31",
      status: "upcoming",
      description: "Annual corporation tax returns",
      clientCount: 18,
      priority: "medium",
    },
    {
      id: "4",
      type: "NIS",
      title: "NIS Contributions",
      dueDate: "2025-01-07",
      status: "overdue",
      description: "Monthly NIS contributions submission",
      clientCount: 67,
      priority: "high",
    },
  ];

  const displayDeadlines = deadlines.length > 0 ? deadlines : mockDeadlines;

  const deadlineStats = useMemo(() => {
    const stats = {
      total: displayDeadlines.length,
      overdue: 0,
      dueSoon: 0,
      upcoming: 0,
      completed: 0,
    };

    displayDeadlines.forEach((deadline) => {
      stats[deadline.status === "due_soon" ? "dueSoon" : deadline.status]++;
    });

    return stats;
  }, [displayDeadlines]);

  const getStatusIcon = (status: TaxDeadline["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "due_soon":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "upcoming":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TaxDeadline["status"]) => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50 dark:bg-green-950/20";
      case "overdue":
        return "border-red-200 bg-red-50 dark:bg-red-950/20";
      case "due_soon":
        return "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20";
      case "upcoming":
        return "border-blue-200 bg-blue-50 dark:bg-blue-950/20";
      default:
        return "border-gray-200 bg-gray-50 dark:bg-gray-950/20";
    }
  };

  const getStatusBadgeVariant = (status: TaxDeadline["status"]) => {
    switch (status) {
      case "completed":
        return "default" as const;
      case "overdue":
        return "destructive" as const;
      case "due_soon":
        return "default" as const;
      case "upcoming":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const getPriorityColor = (priority: TaxDeadline["priority"]) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    }
    if (diffDays === 0) {
      return "Due today";
    }
    if (diffDays === 1) {
      return "Due tomorrow";
    }
    if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    }
    return date.toLocaleDateString("en-GY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tax Deadlines
          </CardTitle>
          <CardDescription>Loading tax deadline information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                className="h-16 animate-pulse rounded-lg bg-muted/50"
                key={i}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Tax Deadlines</CardTitle>
          </div>
          <Badge className="text-xs" variant="outline">
            {deadlineStats.total} deadlines
          </Badge>
        </div>
        <CardDescription>
          Upcoming tax filing deadlines and compliance requirements
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="font-bold text-lg text-red-600">
              {deadlineStats.overdue}
            </div>
            <div className="text-muted-foreground text-xs">Overdue</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-yellow-600">
              {deadlineStats.dueSoon}
            </div>
            <div className="text-muted-foreground text-xs">Due Soon</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-blue-600 text-lg">
              {deadlineStats.upcoming}
            </div>
            <div className="text-muted-foreground text-xs">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-600 text-lg">
              {deadlineStats.completed}
            </div>
            <div className="text-muted-foreground text-xs">Completed</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Completion Progress</span>
            <span>
              {deadlineStats.total > 0
                ? Math.round(
                    (deadlineStats.completed / deadlineStats.total) * 100
                  )
                : 0}
              %
            </span>
          </div>
          <Progress
            className="h-2"
            value={
              deadlineStats.total > 0
                ? (deadlineStats.completed / deadlineStats.total) * 100
                : 0
            }
          />
        </div>

        {/* Deadline List */}
        <div className="space-y-3">
          {displayDeadlines.slice(0, 4).map((deadline) => (
            <div
              className={`rounded-lg border p-3 transition-colors hover:shadow-md ${getStatusColor(deadline.status)}`}
              key={deadline.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  {getStatusIcon(deadline.status)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{deadline.title}</p>
                      <Badge className="text-xs" variant="outline">
                        {deadline.type}
                      </Badge>
                      <span
                        className={`text-xs ${getPriorityColor(deadline.priority)}`}
                      >
                        •
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {deadline.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {formatDueDate(deadline.dueDate)}
                      </span>
                      {deadline.clientCount && (
                        <>
                          <span className="text-muted-foreground text-xs">
                            •
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {deadline.clientCount} clients
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-xs"
                    variant={getStatusBadgeVariant(deadline.status)}
                  >
                    {deadline.status.replace("_", " ")}
                  </Badge>
                  <div className="flex flex-col gap-1">
                    <Button
                      className="h-6 px-2 text-xs"
                      onClick={() => onViewDeadline?.(deadline)}
                      size="sm"
                      variant="ghost"
                    >
                      View
                    </Button>
                    {deadline.status !== "completed" && onMarkComplete && (
                      <Button
                        className="h-6 px-2 text-xs"
                        onClick={() => onMarkComplete(deadline.id)}
                        size="sm"
                        variant="ghost"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayDeadlines.length > 4 && (
          <Button className="w-full" variant="outline">
            View All Deadlines ({displayDeadlines.length})
          </Button>
        )}

        {displayDeadlines.length === 0 && (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto mb-2 h-12 w-12 text-green-500" />
            <p className="font-medium text-sm">All deadlines are up to date</p>
            <p className="text-muted-foreground text-xs">
              No immediate compliance actions required
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
