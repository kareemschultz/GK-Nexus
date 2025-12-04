import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileText,
  PieChart,
  Play,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/payroll")({
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

type PayrollSummary = {
  totalEmployees: number;
  grossPayroll: number;
  netPayroll: number;
  totalPAYE: number;
  totalNIS: number;
  payrollRuns: number;
  lastRunDate: string;
  nextRunDate: string;
  complianceScore: number;
};

type PayrollRun = {
  id: string;
  payPeriod: string;
  runDate: string;
  status: "draft" | "calculated" | "approved" | "paid" | "submitted";
  employeeCount: number;
  grossAmount: number;
  netAmount: number;
  payeAmount: number;
  nisAmount: number;
};

function RouteComponent() {
  const navigate = useNavigate();

  // Mock payroll data
  const payrollSummary: PayrollSummary = {
    totalEmployees: 127,
    grossPayroll: 1_850_000,
    netPayroll: 1_425_350,
    totalPAYE: 285_200,
    totalNIS: 139_450,
    payrollRuns: 12,
    lastRunDate: "2024-11-15",
    nextRunDate: "2024-11-30",
    complianceScore: 96,
  };

  const recentPayrollRuns: PayrollRun[] = [
    {
      id: "pr-2024-11",
      payPeriod: "November 2024",
      runDate: "2024-11-15",
      status: "submitted",
      employeeCount: 127,
      grossAmount: 1_850_000,
      netAmount: 1_425_350,
      payeAmount: 285_200,
      nisAmount: 139_450,
    },
    {
      id: "pr-2024-10",
      payPeriod: "October 2024",
      runDate: "2024-10-15",
      status: "paid",
      employeeCount: 125,
      grossAmount: 1_820_000,
      netAmount: 1_402_300,
      payeAmount: 280_100,
      nisAmount: 137_600,
    },
    {
      id: "pr-2024-09",
      payPeriod: "September 2024",
      runDate: "2024-09-15",
      status: "paid",
      employeeCount: 123,
      grossAmount: 1_795_000,
      netAmount: 1_383_650,
      payeAmount: 276_800,
      nisAmount: 134_550,
    },
  ];

  const payrollTrends = [
    {
      month: "Jun",
      gross: 1_750_000,
      net: 1_350_000,
      paye: 270_000,
      nis: 130_000,
    },
    {
      month: "Jul",
      gross: 1_780_000,
      net: 1_372_000,
      paye: 275_000,
      nis: 133_000,
    },
    {
      month: "Aug",
      gross: 1_785_000,
      net: 1_378_000,
      paye: 276_000,
      nis: 131_000,
    },
    {
      month: "Sep",
      gross: 1_795_000,
      net: 1_384_000,
      paye: 277_000,
      nis: 134_000,
    },
    {
      month: "Oct",
      gross: 1_820_000,
      net: 1_402_000,
      paye: 280_000,
      nis: 138_000,
    },
    {
      month: "Nov",
      gross: 1_850_000,
      net: 1_425_000,
      paye: 285_000,
      nis: 140_000,
    },
  ];

  const departmentPayroll = [
    { name: "Engineering", value: 35, amount: 647_500, color: "#0088fe" },
    { name: "Sales", value: 25, amount: 462_500, color: "#00c49f" },
    { name: "Operations", value: 20, amount: 370_000, color: "#ffbb28" },
    { name: "Administration", value: 12, amount: 222_000, color: "#ff8042" },
    { name: "HR", value: 8, amount: 148_000, color: "#8884d8" },
  ];

  const complianceItems = [
    { name: "PAYE Calculations", status: "compliant", score: 98 },
    { name: "NIS Contributions", status: "compliant", score: 97 },
    { name: "Form 7B Submission", status: "warning", score: 85 },
    { name: "Payment Records", status: "compliant", score: 99 },
  ];

  const upcomingDeadlines = [
    {
      id: "1",
      title: "PAYE Payment Due",
      date: "2024-12-15",
      amount: 285_200,
      type: "payment",
      status: "pending",
    },
    {
      id: "2",
      title: "NIS Contribution Due",
      date: "2024-12-15",
      amount: 139_450,
      type: "payment",
      status: "pending",
    },
    {
      id: "3",
      title: "Form 7B Submission",
      date: "2024-12-31",
      amount: 0,
      type: "filing",
      status: "upcoming",
    },
    {
      id: "4",
      title: "December Payroll Run",
      date: "2024-12-30",
      amount: 0,
      type: "payroll",
      status: "scheduled",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "non-compliant":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRunStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "calculated":
        return <Badge variant="outline">Calculated</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "paid":
        return <Badge variant="default">Paid</Badge>;
      case "submitted":
        return <Badge variant="default">Submitted</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Payroll Management
            </h1>
            <p className="text-muted-foreground">
              Comprehensive payroll processing with PAYE and NIS compliance for
              Guyana tax regulations.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate({ to: "/payroll/employees" })}
              variant="outline"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Employees
            </Button>
            <Button onClick={() => navigate({ to: "/payroll/run" })}>
              <Play className="mr-2 h-4 w-4" />
              Run Payroll
            </Button>
          </div>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section aria-labelledby="payroll-kpi-heading" className="mb-8">
        <h2 className="sr-only" id="payroll-kpi-heading">
          Payroll Key Performance Indicators
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Total Employees
              </CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {payrollSummary.totalEmployees}
              </div>
              <Badge className="mt-2" variant="default">
                +2 from last month
              </Badge>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Monthly Gross
              </CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {formatCurrency(payrollSummary.grossPayroll)}
              </div>
              <Badge className="mt-2" variant="default">
                +3.2% from last month
              </Badge>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">PAYE Tax</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {formatCurrency(payrollSummary.totalPAYE)}
              </div>
              <Badge className="mt-2" variant="default">
                {(
                  (payrollSummary.totalPAYE / payrollSummary.grossPayroll) *
                  100
                ).toFixed(1)}
                % of gross
              </Badge>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                NIS Contributions
              </CardTitle>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {formatCurrency(payrollSummary.totalNIS)}
              </div>
              <Badge className="mt-2" variant="default">
                {(
                  (payrollSummary.totalNIS / payrollSummary.grossPayroll) *
                  100
                ).toFixed(1)}
                % of gross
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Compliance Status */}
      <section aria-labelledby="compliance-heading" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2"
              id="compliance-heading"
            >
              <CheckCircle2 className="h-5 w-5" />
              Payroll Compliance Status
            </CardTitle>
            <CardDescription>
              Real-time compliance monitoring for PAYE and NIS requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {complianceItems.map((item) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={item.name}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.score}% compliant
                      </p>
                    </div>
                  </div>
                  <Progress className="w-16" value={item.score} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Analytics Dashboard */}
      <section aria-labelledby="analytics-heading" className="mb-8">
        <Tabs className="w-full" defaultValue="trends">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger className="flex items-center gap-2" value="trends">
              <TrendingUp className="h-4 w-4" />
              Payroll Trends
            </TabsTrigger>
            <TabsTrigger
              className="flex items-center gap-2"
              value="departments"
            >
              <PieChart className="h-4 w-4" />
              Department Breakdown
            </TabsTrigger>
            <TabsTrigger className="flex items-center gap-2" value="deadlines">
              <Calendar className="h-4 w-4" />
              Upcoming Deadlines
            </TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-4" value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Trends</CardTitle>
                <CardDescription>
                  Monthly payroll, PAYE, and NIS trends over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer height={350} width="100%">
                  <LineChart data={payrollTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === "gross"
                          ? "Gross Pay"
                          : name === "net"
                            ? "Net Pay"
                            : name === "paye"
                              ? "PAYE Tax"
                              : "NIS Contributions",
                      ]}
                    />
                    <Line
                      dataKey="gross"
                      name="gross"
                      stroke="#2563eb"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Line
                      dataKey="net"
                      name="net"
                      stroke="#16a34a"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Line
                      dataKey="paye"
                      name="paye"
                      stroke="#dc2626"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Line
                      dataKey="nis"
                      name="nis"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-4" value="departments">
            <Card>
              <CardHeader>
                <CardTitle>Payroll by Department</CardTitle>
                <CardDescription>
                  Distribution of payroll costs across departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer height={350} width="100%">
                  <RechartsPieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={departmentPayroll}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={120}
                    >
                      {departmentPayroll.map((entry, index) => (
                        <Cell fill={entry.color} key={`cell-${index}`} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value}% (${formatCurrency(props.payload.amount)})`,
                        "Percentage",
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
                  {departmentPayroll.map((entry) => (
                    <div className="flex items-center gap-2" key={entry.name}>
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{entry.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {entry.value}% • {formatCurrency(entry.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-4" value="deadlines">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>
                  Important payroll, tax, and compliance deadlines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingDeadlines.map((deadline) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-4"
                      key={deadline.id}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          {deadline.type === "payment" && (
                            <DollarSign className="h-4 w-4 text-primary" />
                          )}
                          {deadline.type === "filing" && (
                            <FileText className="h-4 w-4 text-primary" />
                          )}
                          {deadline.type === "payroll" && (
                            <Calendar className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {deadline.title}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Due: {formatDate(deadline.date)}
                            {deadline.amount > 0 &&
                              ` • ${formatCurrency(deadline.amount)}`}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          deadline.status === "pending"
                            ? "destructive"
                            : deadline.status === "upcoming"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {deadline.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Recent Payroll Runs and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="recent-runs-heading">
          <Card>
            <CardHeader>
              <CardTitle id="recent-runs-heading">
                Recent Payroll Runs
              </CardTitle>
              <CardDescription>
                Latest payroll processing activities and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayrollRuns.map((run) => (
                  <div
                    className="flex items-start justify-between rounded-lg border p-4"
                    key={run.id}
                  >
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="font-medium text-sm">{run.payPeriod}</p>
                        {getRunStatusBadge(run.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground text-xs">
                        <span>{run.employeeCount} employees</span>
                        <span>{formatDate(run.runDate)}</span>
                        <span>Gross: {formatCurrency(run.grossAmount)}</span>
                        <span>Net: {formatCurrency(run.netAmount)}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="quick-actions-heading">
          <Card>
            <CardHeader>
              <CardTitle id="quick-actions-heading">Quick Actions</CardTitle>
              <CardDescription>
                Common payroll tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="justify-start"
                    onClick={() => navigate({ to: "/payroll/run" })}
                    size="sm"
                    variant="outline"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Payroll Run
                  </Button>
                  <Button
                    className="justify-start"
                    onClick={() => navigate({ to: "/payroll/employees" })}
                    size="sm"
                    variant="outline"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Employees
                  </Button>
                  <Button className="justify-start" size="sm" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Form 7B
                  </Button>
                  <Button className="justify-start" size="sm" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Payroll
                  </Button>
                </div>
                <Button
                  className="mt-2 w-full"
                  onClick={() => navigate({ to: "/payroll?tab=compliance" })}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  View Full Compliance Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
