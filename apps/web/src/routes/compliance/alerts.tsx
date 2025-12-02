import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-states";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/compliance/alerts")({
  component: ComplianceAlertsPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-500",
  },
  error: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-500",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-500",
  },
  success: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-green-500",
  },
};

const categoryConfig = {
  deadline: { label: "Deadline", variant: "destructive" as const },
  document: { label: "Document", variant: "secondary" as const },
  filing: { label: "Filing", variant: "default" as const },
  audit: { label: "Audit", variant: "outline" as const },
};

function ComplianceAlertsPage() {
  // Fetch compliance alerts from API
  const { data: alertsData, isLoading } = useQuery(
    orpc.compliance.getAlerts.queryOptions({
      daysAhead: 30,
      limit: 50,
    })
  );

  // Transform API data to display format
  const alerts = [
    ...(alertsData?.overdue || []).map((alert) => ({
      id: alert.id,
      title: alert.requirement?.title || "Overdue Filing",
      description: `${alert.filingPeriod} - Due: ${alert.dueDate}. Status: ${alert.percentComplete || 0}% complete.`,
      type: "error" as const,
      category: "deadline" as const,
      date: alert.dueDate,
      isRead: false,
      client: alert.client?.businessName,
    })),
    ...(alertsData?.urgent || []).map((alert) => ({
      id: alert.id,
      title: alert.requirement?.title || "Urgent Filing",
      description: `${alert.filingPeriod} - Due: ${alert.dueDate}. Status: ${alert.percentComplete || 0}% complete.`,
      type: "warning" as const,
      category: "deadline" as const,
      date: alert.dueDate,
      isRead: false,
      client: alert.client?.businessName,
    })),
    ...(alertsData?.upcoming || []).map((alert) => ({
      id: alert.id,
      title: alert.requirement?.title || "Upcoming Filing",
      description: `${alert.filingPeriod} - Due: ${alert.dueDate}. Status: ${alert.percentComplete || 0}% complete.`,
      type: "info" as const,
      category: "filing" as const,
      date: alert.dueDate,
      isRead: true,
      client: alert.client?.businessName,
    })),
  ];

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const overdueCount = alertsData?.overdue?.length || 0;
  const urgentCount = alertsData?.urgent?.length || 0;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Compliance Alerts
            </h1>
            <p className="mt-2 text-muted-foreground">
              Stay informed about compliance deadlines and important updates
            </p>
          </div>
          <Button variant="outline">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </header>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Unread Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-destructive">
              {unreadCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-red-500">
              {overdueCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-amber-500">
              {urgentCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{alertsData?.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Recent Alerts</CardTitle>
          </div>
          <CardDescription>
            Compliance notifications and deadline reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <EmptyState
              description="No compliance alerts or deadlines at this time."
              icon={<CheckCircle2 className="h-12 w-12" />}
              title="All caught up!"
            />
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const config = typeConfig[alert.type];
                const AlertIcon = config.icon;
                return (
                  <div
                    className={`rounded-lg border p-4 ${config.bg} ${config.border} ${
                      alert.isRead ? "" : "ring-2 ring-primary/20"
                    }`}
                    key={alert.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <AlertIcon
                          className={`mt-0.5 h-5 w-5 ${config.color}`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{alert.title}</h3>
                            {!alert.isRead && (
                              <Badge variant="default">New</Badge>
                            )}
                          </div>
                          {alert.client && (
                            <p className="text-muted-foreground text-sm">
                              Client: {alert.client}
                            </p>
                          )}
                          <p className="mt-1 text-muted-foreground text-sm">
                            {alert.description}
                          </p>
                          <div className="mt-2 flex items-center gap-4">
                            <Badge
                              variant={categoryConfig[alert.category].variant}
                            >
                              {categoryConfig[alert.category].label}
                            </Badge>
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Calendar className="h-3 w-3" />
                              <span>{alert.date}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
