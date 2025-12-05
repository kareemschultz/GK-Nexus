import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AutomationHistory() {
  const automationRuns = [
    {
      id: "1",
      name: "Daily Client Email",
      status: "completed",
      startTime: "2025-01-01 09:00:00",
      duration: "2.3s",
      trigger: "Schedule",
    },
    {
      id: "2",
      name: "Invoice Generation",
      status: "failed",
      startTime: "2025-01-01 10:30:00",
      duration: "1.1s",
      trigger: "Manual",
    },
    {
      id: "3",
      name: "Tax Calculation Update",
      status: "running",
      startTime: "2025-01-01 11:15:00",
      duration: "30s",
      trigger: "API",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variantMap: Record<
      string,
      "default" | "destructive" | "secondary" | "outline"
    > = {
      completed: "default",
      failed: "destructive",
      running: "secondary",
    };
    const variant = variantMap[status] ?? "outline";

    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl">Automation History</h1>
        <p className="text-muted-foreground">
          View execution history and logs for all automation workflows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>
            Latest automation runs and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automationRuns.map((run) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4"
                key={run.id}
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(run.status)}
                  <div>
                    <p className="font-medium">{run.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Started at {run.startTime} • Duration: {run.duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{run.trigger}</Badge>
                  {getStatusBadge(run.status)}
                  <Button size="sm" variant="outline">
                    View Logs
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
