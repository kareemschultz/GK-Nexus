import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
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
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/compliance/")({
  component: CompliancePage,
});

function CompliancePage() {
  const getComplianceIcon = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "MEDIUM":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "LOW":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "destructive" as const;
      case "MEDIUM":
        return "default" as const;
      case "LOW":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Compliance Management
            </h1>
            <p className="text-muted-foreground">
              Monitor regulatory compliance and manage deadlines
            </p>
          </div>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </header>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Compliance Score
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">98.4%</div>
            <Progress className="mt-2" value={98.4} />
            <p className="text-muted-foreground text-xs">Overall rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">2</div>
            <p className="text-muted-foreground text-xs">Urgent items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Due This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">5</div>
            <p className="text-muted-foreground text-xs">Upcoming deadlines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">47</div>
            <p className="text-muted-foreground text-xs">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Categories</CardTitle>
            <CardDescription>Status across different areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Tax Compliance", score: 99.2, status: "excellent" },
              { name: "Payroll Compliance", score: 98.8, status: "excellent" },
              { name: "Financial Reporting", score: 97.1, status: "good" },
              { name: "Data Protection", score: 95.5, status: "good" },
              { name: "Employment Law", score: 93.2, status: "adequate" },
            ].map((category) => (
              <div className="space-y-2" key={category.name}>
                <div className="flex justify-between">
                  <span className="font-medium text-sm">{category.name}</span>
                  <span className="text-sm">{category.score}%</span>
                </div>
                <Progress value={category.score} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Critical compliance dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  id: "1",
                  title: "Q4 Tax Returns",
                  date: "2024-01-31",
                  daysLeft: 7,
                  severity: "HIGH",
                },
                {
                  id: "2",
                  title: "Annual Audit Preparation",
                  date: "2024-02-15",
                  daysLeft: 22,
                  severity: "MEDIUM",
                },
                {
                  id: "3",
                  title: "Employment Records Review",
                  date: "2024-02-28",
                  daysLeft: 35,
                  severity: "LOW",
                },
              ].map((deadline) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-3"
                  key={deadline.id}
                >
                  <div className="flex items-center space-x-3">
                    {getComplianceIcon(deadline.severity)}
                    <div>
                      <p className="font-medium text-sm">{deadline.title}</p>
                      <p className="text-muted-foreground text-xs">
                        Due: {deadline.date} ({deadline.daysLeft} days left)
                      </p>
                    </div>
                  </div>
                  <Badge variant={getSeverityBadgeVariant(deadline.severity)}>
                    {deadline.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Compliance Alerts</CardTitle>
          <CardDescription>Items requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: "1",
                type: "TAX_FILING",
                severity: "HIGH",
                title: "Q4 Tax Returns Due",
                description:
                  "Corporate tax returns must be filed by January 31st",
                dueDate: "2024-01-31",
                clientId: "client1",
                client: "Acme Corp",
              },
              {
                id: "2",
                type: "AUDIT_PREPARATION",
                severity: "MEDIUM",
                title: "Annual Audit Preparation",
                description: "Prepare documentation for upcoming annual audit",
                dueDate: "2024-02-15",
                clientId: "client2",
                client: "TechStart Inc",
              },
              {
                id: "3",
                type: "PAYROLL_COMPLIANCE",
                severity: "LOW",
                title: "Payroll Tax Update",
                description: "Update payroll tax rates for new fiscal year",
                dueDate: "2024-03-01",
                clientId: "client3",
                client: "Local Business Ltd",
              },
            ].map((alert) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4"
                key={alert.id}
              >
                <div className="flex items-center space-x-4">
                  {getComplianceIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{alert.title}</p>
                      <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {alert.description}
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      Client: {alert.client} • Due: {alert.dueDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                  <Button size="sm">Take Action</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
