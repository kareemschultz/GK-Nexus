import { BarChart3, Clock, Pause, Play, TrendingUp, Zap } from "lucide-react";
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

export function AutomationDashboard() {
  const automations = [
    {
      id: "1",
      name: "Daily Client Reports",
      status: "active",
      lastRun: "2 hours ago",
      nextRun: "In 22 hours",
      success: 98,
      runs: 156,
    },
    {
      id: "2",
      name: "Invoice Processing",
      status: "paused",
      lastRun: "1 day ago",
      nextRun: "Paused",
      success: 95,
      runs: 89,
    },
    {
      id: "3",
      name: "Tax Compliance Check",
      status: "active",
      lastRun: "30 minutes ago",
      nextRun: "In 3 hours",
      success: 100,
      runs: 67,
    },
  ];

  const stats = [
    {
      title: "Active Automations",
      value: "12",
      icon: Zap,
      change: "+2 this month",
    },
    {
      title: "Total Executions",
      value: "1,247",
      icon: BarChart3,
      change: "+15% from last month",
    },
    {
      title: "Success Rate",
      value: "97.8%",
      icon: TrendingUp,
      change: "+0.5% improvement",
    },
    {
      title: "Time Saved",
      value: "142h",
      icon: Clock,
      change: "This month",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl">Automation Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and monitor your automated workflows and processes.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{stat.value}</div>
              <p className="text-muted-foreground text-xs">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Automations */}
      <Card>
        <CardHeader>
          <CardTitle>Active Automations</CardTitle>
          <CardDescription>
            Current automation workflows and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automations.map((automation) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4"
                key={automation.id}
              >
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-medium">{automation.name}</h3>
                    <Badge
                      variant={
                        automation.status === "active" ? "default" : "secondary"
                      }
                    >
                      {automation.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-muted-foreground text-sm">
                    <div>Last run: {automation.lastRun}</div>
                    <div>Next run: {automation.nextRun}</div>
                    <div>Total runs: {automation.runs}</div>
                    <div className="flex items-center gap-2">
                      Success rate: {automation.success}%
                      <Progress
                        className="h-2 w-16"
                        value={automation.success}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    {automation.status === "active" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common automation tasks and workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Zap className="h-6 w-6" />
              Create New Automation
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <BarChart3 className="h-6 w-6" />
              View Analytics
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Clock className="h-6 w-6" />
              Schedule Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
