import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Activity, Calendar, TrendingUp, Users } from "lucide-react";
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
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
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

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const privateData = useQuery(orpc.privateData.queryOptions());

  const stats = [
    { title: "Total Users", value: "2,847", change: "+12.5%", icon: Users },
    {
      title: "Active Sessions",
      value: "1,234",
      change: "+5.2%",
      icon: Activity,
    },
    {
      title: "Monthly Growth",
      value: "23.4%",
      change: "+2.1%",
      icon: TrendingUp,
    },
    { title: "Events Today", value: "156", change: "-3.2%", icon: Calendar },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.data?.user.name}! Here's what's happening.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  {stat.title}
                </CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stat.value}</div>
                <Badge
                  variant={
                    stat.change.startsWith("+") ? "default" : "destructive"
                  }
                >
                  {stat.change}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Profile updated</p>
                  <p className="text-muted-foreground text-xs">2 hours ago</p>
                </div>
                <Badge variant="secondary">Profile</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">New login detected</p>
                  <p className="text-muted-foreground text-xs">5 hours ago</p>
                </div>
                <Badge variant="default">Security</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Data exported</p>
                  <p className="text-muted-foreground text-xs">1 day ago</p>
                </div>
                <Badge variant="outline">Data</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Status</span>
                <Badge variant={privateData.data ? "default" : "destructive"}>
                  {privateData.isLoading
                    ? "Checking..."
                    : privateData.data
                      ? "Online"
                      : "Offline"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant="default">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication</span>
                <Badge variant="default">Active</Badge>
              </div>
              {privateData.data && (
                <div className="mt-4 rounded-lg bg-muted p-3">
                  <p className="font-medium text-sm">API Response:</p>
                  <p className="text-muted-foreground text-xs">
                    {privateData.data.message}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline">
              Export Data
            </Button>
            <Button size="sm" variant="outline">
              View Reports
            </Button>
            <Button size="sm" variant="outline">
              Manage Users
            </Button>
            <Button size="sm" variant="outline">
              System Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
