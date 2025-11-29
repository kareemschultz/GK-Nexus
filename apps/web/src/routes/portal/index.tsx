import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/portal/")({
  component: PortalDashboard,
});

const quickStats = [
  {
    title: "Documents",
    value: "24",
    description: "Available files",
    icon: FileText,
    change: "+3 this month",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    title: "Upcoming Appointments",
    value: "2",
    description: "Next 30 days",
    icon: Calendar,
    change: "Next: Dec 5th",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  {
    title: "Compliance Status",
    value: "92%",
    description: "Current quarter",
    icon: CheckCircle2,
    change: "On track",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950",
  },
  {
    title: "Outstanding Balance",
    value: "$2,450",
    description: "Due this month",
    icon: DollarSign,
    change: "Due Dec 15th",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950",
  },
];

const recentActivity = [
  {
    id: 1,
    type: "document",
    title: "Tax Return Filed",
    description:
      "Your Q3 2024 tax return has been successfully submitted to GRA",
    time: "2 hours ago",
    status: "completed",
    icon: FileText,
  },
  {
    id: 2,
    type: "appointment",
    title: "Meeting Scheduled",
    description: "Compliance review meeting scheduled for December 5th, 2024",
    time: "1 day ago",
    status: "scheduled",
    icon: Calendar,
  },
  {
    id: 3,
    type: "payment",
    title: "Invoice Generated",
    description: "November services invoice #INV-2024-011 is ready for payment",
    time: "3 days ago",
    status: "pending",
    icon: CreditCard,
  },
  {
    id: 4,
    type: "compliance",
    title: "Deadline Reminder",
    description: "GIT filing deadline approaching - Due December 15th, 2024",
    time: "1 week ago",
    status: "reminder",
    icon: AlertCircle,
  },
];

const upcomingDeadlines = [
  {
    id: 1,
    title: "GIT Monthly Return",
    date: "Dec 15, 2024",
    daysUntil: 17,
    priority: "high",
    description: "Goods and Services Tax monthly filing",
  },
  {
    id: 2,
    title: "PAYE Submissions",
    date: "Dec 31, 2024",
    daysUntil: 33,
    priority: "medium",
    description: "Employee payroll tax submissions",
  },
  {
    id: 3,
    title: "Annual Returns",
    date: "Mar 31, 2025",
    daysUntil: 123,
    priority: "low",
    description: "Company annual tax return filing",
  },
];

function PortalDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-bold text-3xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, John. Here's your account overview.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              className="transition-shadow hover:shadow-md"
              key={stat.title}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-muted-foreground text-sm">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon
                    aria-hidden="true"
                    className={`h-4 w-4 ${stat.color}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-foreground">
                  {stat.value}
                </div>
                <p className="text-muted-foreground text-xs">
                  {stat.description}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-semibold text-lg">
              Recent Activity
            </CardTitle>
            <Button aria-label="View all activity" size="sm" variant="ghost">
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    className="flex items-start space-x-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                    key={activity.id}
                  >
                    <div className="mt-1">
                      <div
                        className={`rounded-full p-2 ${
                          activity.status === "completed"
                            ? "bg-green-50 dark:bg-green-950"
                            : activity.status === "pending"
                              ? "bg-amber-50 dark:bg-amber-950"
                              : activity.status === "reminder"
                                ? "bg-red-50 dark:bg-red-950"
                                : "bg-blue-50 dark:bg-blue-950"
                        }`}
                      >
                        <Icon
                          aria-hidden="true"
                          className={`h-4 w-4 ${
                            activity.status === "completed"
                              ? "text-green-600"
                              : activity.status === "pending"
                                ? "text-amber-600"
                                : activity.status === "reminder"
                                  ? "text-red-600"
                                  : "text-blue-600"
                          }`}
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground text-sm">
                          {activity.title}
                        </p>
                        <Badge
                          className="ml-2"
                          variant={
                            activity.status === "completed"
                              ? "default"
                              : activity.status === "pending"
                                ? "secondary"
                                : activity.status === "reminder"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground text-sm">
                        {activity.description}
                      </p>
                      <p className="mt-2 text-muted-foreground text-xs">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-semibold text-lg">
              Upcoming Deadlines
            </CardTitle>
            <Bell
              aria-hidden="true"
              className="h-5 w-5 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline) => (
                <div className="space-y-2" key={deadline.id}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">
                        {deadline.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {deadline.description}
                      </p>
                    </div>
                    <Badge
                      variant={
                        deadline.priority === "high"
                          ? "destructive"
                          : deadline.priority === "medium"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {deadline.daysUntil} days
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground text-xs">
                      Due: {deadline.date}
                    </p>
                  </div>
                  {deadline !==
                    upcomingDeadlines[upcomingDeadlines.length - 1] && (
                    <hr className="border-border" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              aria-label="Schedule appointment"
              className="h-auto flex-col space-y-2 p-6"
              variant="outline"
            >
              <Calendar
                aria-hidden="true"
                className="h-6 w-6 text-muted-foreground"
              />
              <span className="font-medium text-sm">Schedule Meeting</span>
            </Button>

            <Button
              aria-label="Upload document"
              className="h-auto flex-col space-y-2 p-6"
              variant="outline"
            >
              <FileText
                aria-hidden="true"
                className="h-6 w-6 text-muted-foreground"
              />
              <span className="font-medium text-sm">Upload Document</span>
            </Button>

            <Button
              aria-label="Make payment"
              className="h-auto flex-col space-y-2 p-6"
              variant="outline"
            >
              <CreditCard
                aria-hidden="true"
                className="h-6 w-6 text-muted-foreground"
              />
              <span className="font-medium text-sm">Make Payment</span>
            </Button>

            <Button
              aria-label="Contact support"
              className="h-auto flex-col space-y-2 p-6"
              variant="outline"
            >
              <Users
                aria-hidden="true"
                className="h-6 w-6 text-muted-foreground"
              />
              <span className="font-medium text-sm">Contact Support</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold text-lg">
            Quarterly Compliance Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium text-foreground">92%</span>
              </div>
              <Progress
                aria-label="Overall compliance progress: 92%"
                className="h-2"
                value={92}
              />
              <p className="text-muted-foreground text-xs">
                23 of 25 required filings completed this quarter
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GIT Returns</span>
                  <span className="font-medium text-foreground">100%</span>
                </div>
                <Progress
                  aria-label="GIT returns progress: 100%"
                  className="h-2"
                  value={100}
                />
                <p className="text-muted-foreground text-xs">3/3 completed</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    PAYE Submissions
                  </span>
                  <span className="font-medium text-foreground">100%</span>
                </div>
                <Progress
                  aria-label="PAYE submissions progress: 100%"
                  className="h-2"
                  value={100}
                />
                <p className="text-muted-foreground text-xs">3/3 completed</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">WHT Returns</span>
                  <span className="font-medium text-foreground">67%</span>
                </div>
                <Progress
                  aria-label="WHT returns progress: 67%"
                  className="h-2"
                  value={67}
                />
                <p className="text-muted-foreground text-xs">2/3 completed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
