import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
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

export const Route = createFileRoute("/tax/filing")({
  component: TaxFilingPage,
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

interface FilingDeadline {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: "upcoming" | "due-soon" | "overdue" | "completed";
  filingType: string;
}

const mockDeadlines: FilingDeadline[] = [
  {
    id: "1",
    name: "Q4 2024 VAT Return",
    description: "Quarterly VAT submission to GRA",
    dueDate: "2025-01-15",
    status: "due-soon",
    filingType: "VAT",
  },
  {
    id: "2",
    name: "December 2024 PAYE",
    description: "Monthly PAYE submission",
    dueDate: "2025-01-14",
    status: "due-soon",
    filingType: "PAYE",
  },
  {
    id: "3",
    name: "Annual Corporate Tax Return",
    description: "2024 Corporate tax filing",
    dueDate: "2025-04-30",
    status: "upcoming",
    filingType: "Corporate",
  },
  {
    id: "4",
    name: "November 2024 NIS",
    description: "NIS contributions submission",
    dueDate: "2024-12-15",
    status: "completed",
    filingType: "NIS",
  },
];

const statusConfig = {
  upcoming: {
    label: "Upcoming",
    variant: "secondary" as const,
    icon: Calendar,
  },
  "due-soon": {
    label: "Due Soon",
    variant: "default" as const,
    icon: Clock,
  },
  overdue: {
    label: "Overdue",
    variant: "destructive" as const,
    icon: AlertTriangle,
  },
  completed: {
    label: "Completed",
    variant: "outline" as const,
    icon: CheckCircle2,
  },
};

function TaxFilingPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">Tax Filing</h1>
        <p className="mt-2 text-muted-foreground">
          Manage tax submissions and track filing deadlines with GRA
        </p>
      </header>

      <Card className="mb-8 border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">GRA Integration Status</CardTitle>
          </div>
          <CardDescription>
            Direct GRA e-filing integration requires API credentials. Contact
            your administrator to configure GRA e-services connection. You can
            currently track deadlines and prepare filings offline.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Filings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {mockDeadlines.filter((d) => d.status !== "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-amber-500">
              {mockDeadlines.filter((d) => d.status === "due-soon").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-destructive">
              {mockDeadlines.filter((d) => d.status === "overdue").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-600">
              {mockDeadlines.filter((d) => d.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filing Deadlines</CardTitle>
              <CardDescription>
                Track upcoming tax submission deadlines
              </CardDescription>
            </div>
            <Button disabled>
              <Upload className="mr-2 h-4 w-4" />
              New Filing
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDeadlines.map((deadline) => {
              const StatusIcon = statusConfig[deadline.status].icon;
              return (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={deadline.id}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{deadline.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {deadline.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-sm">{deadline.dueDate}</p>
                      <p className="text-muted-foreground text-xs">Due Date</p>
                    </div>
                    <Badge variant={statusConfig[deadline.status].variant}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusConfig[deadline.status].label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GRA e-Services Integration</CardTitle>
          <CardDescription>
            Features planned for the GRA integration module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Direct Submission</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Submit tax returns directly to GRA&apos;s e-Services portal
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Payment Integration</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Process tax payments through integrated payment gateways
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Status Tracking</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Real-time status updates on filing submissions
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Document Generation</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Auto-generate GRA-compliant forms and reports
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
