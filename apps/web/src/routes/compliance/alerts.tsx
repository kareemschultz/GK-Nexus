import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
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
import { authClient } from "@/lib/auth-client";

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

interface ComplianceAlert {
  id: string;
  title: string;
  description: string;
  type: "warning" | "error" | "info" | "success";
  category: "deadline" | "document" | "filing" | "audit";
  date: string;
  isRead: boolean;
}

const alerts: ComplianceAlert[] = [
  {
    id: "1",
    title: "PAYE Filing Deadline Approaching",
    description:
      "Monthly PAYE return for December 2024 is due in 3 days. Ensure all employee data is up to date.",
    type: "warning",
    category: "deadline",
    date: "2025-01-11",
    isRead: false,
  },
  {
    id: "2",
    title: "VAT Return Due Soon",
    description:
      "Q4 2024 VAT return must be submitted by January 15, 2025. Review your VAT calculations.",
    type: "warning",
    category: "deadline",
    date: "2025-01-10",
    isRead: false,
  },
  {
    id: "3",
    title: "Missing Client Documents",
    description:
      "3 clients have incomplete tax documentation. Review and request missing items.",
    type: "error",
    category: "document",
    date: "2025-01-09",
    isRead: false,
  },
  {
    id: "4",
    title: "November PAYE Accepted",
    description:
      "Your November 2024 PAYE return has been accepted by GRA. No further action required.",
    type: "success",
    category: "filing",
    date: "2024-12-20",
    isRead: true,
  },
  {
    id: "5",
    title: "New GRA Regulation Update",
    description:
      "GRA has issued new guidelines for 2025 tax filings. Review the updated requirements.",
    type: "info",
    category: "audit",
    date: "2024-12-15",
    isRead: true,
  },
];

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
  const unreadCount = alerts.filter((a) => !a.isRead).length;

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
            <CardTitle className="text-sm">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-amber-500">
              {alerts.filter((a) => a.type === "warning").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-red-500">
              {alerts.filter((a) => a.type === "error").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{alerts.length}</div>
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
                      <AlertIcon className={`mt-0.5 h-5 w-5 ${config.color}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{alert.title}</h3>
                          {!alert.isRead && (
                            <Badge variant="default">New</Badge>
                          )}
                        </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
