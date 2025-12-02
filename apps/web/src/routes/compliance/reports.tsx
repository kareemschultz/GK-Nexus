import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  Download,
  FileText,
  PieChart,
  TrendingUp,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/compliance/reports")({
  component: ComplianceReportsPage,
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

interface AuditReport {
  id: string;
  name: string;
  description: string;
  type: "internal" | "external" | "regulatory";
  date: string;
  status: "draft" | "final" | "archived";
}

const auditReports: AuditReport[] = [
  {
    id: "1",
    name: "Q4 2024 Compliance Summary",
    description: "Quarterly compliance overview and risk assessment",
    type: "internal",
    date: "2024-12-31",
    status: "draft",
  },
  {
    id: "2",
    name: "GRA Audit Response Report",
    description: "Response documentation for GRA audit findings",
    type: "regulatory",
    date: "2024-11-15",
    status: "final",
  },
  {
    id: "3",
    name: "Annual Tax Compliance Review",
    description: "Comprehensive annual tax compliance analysis",
    type: "external",
    date: "2024-12-01",
    status: "final",
  },
  {
    id: "4",
    name: "NIS Compliance Audit",
    description: "National Insurance Scheme compliance verification",
    type: "regulatory",
    date: "2024-10-20",
    status: "archived",
  },
];

const typeConfig = {
  internal: { label: "Internal", variant: "secondary" as const },
  external: { label: "External", variant: "default" as const },
  regulatory: { label: "Regulatory", variant: "outline" as const },
};

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const },
  final: { label: "Final", variant: "default" as const },
  archived: { label: "Archived", variant: "outline" as const },
};

function ComplianceReportsPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">Audit Reports</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage compliance audit reports and documentation
        </p>
      </header>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{auditReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {auditReports.filter((r) => r.status === "draft").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Regulatory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {auditReports.filter((r) => r.type === "regulatory").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">This Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{auditReports.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="external">External</SelectItem>
            <SelectItem value="regulatory">Regulatory</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="final">Final</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button className="ml-auto">
          <FileText className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Reports</CardTitle>
          <CardDescription>
            Compliance and audit documentation library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditReports.map((report) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                key={report.id}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{report.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={typeConfig[report.type].variant}>
                    {typeConfig[report.type].label}
                  </Badge>
                  <Badge variant={statusConfig[report.status].variant}>
                    {statusConfig[report.status].label}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{report.date}</span>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="font-bold text-5xl text-green-600">98%</div>
                <p className="mt-2 text-muted-foreground">
                  Overall Compliance Score
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Compliance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Tax Compliance</span>
                <span className="font-medium text-green-600">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Document Compliance</span>
                <span className="font-medium text-green-600">95%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Regulatory Filings</span>
                <span className="font-medium text-green-600">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Audit Readiness</span>
                <span className="font-medium text-amber-600">92%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
