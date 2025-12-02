import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Globe,
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
import { Progress } from "@/components/ui/progress";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/compliance/gra-filing")({
  component: GRAFilingPage,
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

interface FilingRequirement {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: "pending" | "submitted" | "accepted" | "rejected";
  progress: number;
}

const filingRequirements: FilingRequirement[] = [
  {
    id: "1",
    name: "Monthly PAYE Return",
    description: "Employee tax deductions for December 2024",
    dueDate: "2025-01-14",
    status: "pending",
    progress: 75,
  },
  {
    id: "2",
    name: "Q4 VAT Return",
    description: "Quarterly VAT submission Oct-Dec 2024",
    dueDate: "2025-01-15",
    status: "pending",
    progress: 50,
  },
  {
    id: "3",
    name: "November PAYE Return",
    description: "Employee tax deductions for November 2024",
    dueDate: "2024-12-14",
    status: "accepted",
    progress: 100,
  },
  {
    id: "4",
    name: "NIS Monthly Contribution",
    description: "National Insurance contributions for December 2024",
    dueDate: "2025-01-15",
    status: "submitted",
    progress: 100,
  },
];

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
  submitted: { label: "Submitted", variant: "default" as const, icon: Upload },
  accepted: {
    label: "Accepted",
    variant: "outline" as const,
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
    icon: AlertTriangle,
  },
};

function GRAFilingPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">GRA Filing</h1>
        <p className="mt-2 text-muted-foreground">
          Manage tax filings with the Guyana Revenue Authority
        </p>
      </header>

      <Card className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">GRA e-Services Portal</CardTitle>
            </div>
            <Button size="sm" variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Portal
            </Button>
          </div>
          <CardDescription>
            Access the official GRA e-Services portal for tax submissions and
            inquiries
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
              {filingRequirements.filter((f) => f.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-blue-600">
              {
                filingRequirements.filter((f) => f.status === "submitted")
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-600">
              {filingRequirements.filter((f) => f.status === "accepted").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">100%</div>
            <p className="text-muted-foreground text-xs">Last 12 months</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filing Requirements</CardTitle>
              <CardDescription>
                Track and manage your GRA filing obligations
              </CardDescription>
            </div>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              New Filing
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filingRequirements.map((filing) => {
              const StatusIcon = statusConfig[filing.status].icon;
              return (
                <div className="rounded-lg border p-4" key={filing.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{filing.name}</h3>
                        <p className="text-muted-foreground text-sm">
                          {filing.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-sm">{filing.dueDate}</p>
                        <p className="text-muted-foreground text-xs">
                          Due Date
                        </p>
                      </div>
                      <Badge variant={statusConfig[filing.status].variant}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig[filing.status].label}
                      </Badge>
                    </div>
                  </div>
                  {filing.status === "pending" && (
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{filing.progress}%</span>
                      </div>
                      <Progress value={filing.progress} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
