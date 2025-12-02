import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  Download,
  FileText,
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

export const Route = createFileRoute("/payroll/reports")({
  component: PayrollReportsPage,
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

interface ReportType {
  id: string;
  name: string;
  description: string;
  frequency: string;
  lastGenerated: string;
  icon: typeof FileText;
}

const reportTypes: ReportType[] = [
  {
    id: "payroll-summary",
    name: "Payroll Summary Report",
    description: "Comprehensive overview of payroll for the selected period",
    frequency: "Monthly",
    lastGenerated: "2024-12-01",
    icon: FileText,
  },
  {
    id: "paye-report",
    name: "PAYE Tax Report",
    description: "Pay As You Earn tax calculations and submissions",
    frequency: "Monthly",
    lastGenerated: "2024-12-01",
    icon: BarChart3,
  },
  {
    id: "nis-report",
    name: "NIS Contributions Report",
    description:
      "National Insurance Scheme employee and employer contributions",
    frequency: "Monthly",
    lastGenerated: "2024-12-01",
    icon: TrendingUp,
  },
  {
    id: "ytd-summary",
    name: "Year-to-Date Summary",
    description: "Cumulative payroll data for the current fiscal year",
    frequency: "On Demand",
    lastGenerated: "2024-12-15",
    icon: Calendar,
  },
];

function PayrollReportsPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">Payroll Reports</h1>
        <p className="mt-2 text-muted-foreground">
          Generate and download payroll reports for compliance and analysis
        </p>
      </header>

      <div className="mb-6 flex items-center gap-4">
        <Select defaultValue="2024-12">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-12">December 2024</SelectItem>
            <SelectItem value="2024-11">November 2024</SelectItem>
            <SelectItem value="2024-10">October 2024</SelectItem>
            <SelectItem value="2024-09">September 2024</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Custom Range
        </Button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$1,245,000</div>
            <p className="text-muted-foreground text-xs">December 2024</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">PAYE Withheld</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$186,750</div>
            <p className="text-muted-foreground text-xs">15% of gross</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">NIS Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$69,720</div>
            <p className="text-muted-foreground text-xs">Employee + Employer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$988,530</div>
            <p className="text-muted-foreground text-xs">After deductions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>
            Select a report type to generate and download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportTypes.map((report) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                key={report.id}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <report.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{report.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant="secondary">{report.frequency}</Badge>
                    <p className="mt-1 text-muted-foreground text-xs">
                      Last: {report.lastGenerated}
                    </p>
                  </div>
                  <Button size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>GRA Form 7B Export</CardTitle>
          <CardDescription>
            Generate official GRA Form 7B for PAYE submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">
                Export payroll data in GRA-compliant CSV format for direct
                upload to the GRA e-Services portal.
              </p>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Form 7B
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
