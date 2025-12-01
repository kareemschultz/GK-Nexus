import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MoreHorizontal,
  Percent,
  Plus,
  Users,
} from "lucide-react";
import { useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/local-content")({
  component: LocalContentPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

type LocalContentPlan = {
  id: string;
  planCode: string;
  companyName: string;
  sector: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "UNDER_REVIEW";
  employmentTarget: number;
  employmentActual: number;
  procurementTarget: number;
  procurementActual: number;
  submittedDate: string;
  reviewDate?: string;
};

type LocalSupplier = {
  id: string;
  supplierCode: string;
  name: string;
  sector: string;
  certification: "CERTIFIED" | "PENDING" | "EXPIRED";
  localOwnership: number;
  employeeCount: number;
  annualRevenue: string;
  registrationDate: string;
};

type ComplianceReport = {
  id: string;
  reportCode: string;
  companyName: string;
  reportingPeriod: string;
  overallScore: number;
  employmentScore: number;
  procurementScore: number;
  trainingScore: number;
  status: "COMPLIANT" | "NON_COMPLIANT" | "PARTIAL";
  submittedDate: string;
};

const mockPlans: LocalContentPlan[] = [
  {
    id: "1",
    planCode: "LCP-2024-001",
    companyName: "ExxonMobil Guyana",
    sector: "OIL_GAS",
    status: "APPROVED",
    employmentTarget: 75,
    employmentActual: 72,
    procurementTarget: 50,
    procurementActual: 48,
    submittedDate: "2024-01-15",
    reviewDate: "2024-02-15",
  },
  {
    id: "2",
    planCode: "LCP-2024-002",
    companyName: "CGX Energy Inc",
    sector: "OIL_GAS",
    status: "UNDER_REVIEW",
    employmentTarget: 70,
    employmentActual: 65,
    procurementTarget: 45,
    procurementActual: 40,
    submittedDate: "2024-03-01",
  },
  {
    id: "3",
    planCode: "LCP-2024-003",
    companyName: "Guyana Goldfields",
    sector: "MINING",
    status: "APPROVED",
    employmentTarget: 80,
    employmentActual: 85,
    procurementTarget: 60,
    procurementActual: 62,
    submittedDate: "2024-02-10",
    reviewDate: "2024-03-10",
  },
  {
    id: "4",
    planCode: "LCP-2024-004",
    companyName: "Tullow Oil Guyana",
    sector: "OIL_GAS",
    status: "SUBMITTED",
    employmentTarget: 72,
    employmentActual: 0,
    procurementTarget: 48,
    procurementActual: 0,
    submittedDate: "2024-11-20",
  },
  {
    id: "5",
    planCode: "LCP-2024-005",
    companyName: "Orinduik Development",
    sector: "OIL_GAS",
    status: "DRAFT",
    employmentTarget: 68,
    employmentActual: 0,
    procurementTarget: 42,
    procurementActual: 0,
    submittedDate: "-",
  },
];

const mockSuppliers: LocalSupplier[] = [
  {
    id: "1",
    supplierCode: "SUP-2024-001",
    name: "Guyana Shore Base Inc",
    sector: "LOGISTICS",
    certification: "CERTIFIED",
    localOwnership: 100,
    employeeCount: 250,
    annualRevenue: "GYD 500M",
    registrationDate: "2020-06-15",
  },
  {
    id: "2",
    supplierCode: "SUP-2024-002",
    name: "Demerara Contractors Ltd",
    sector: "CONSTRUCTION",
    certification: "CERTIFIED",
    localOwnership: 85,
    employeeCount: 180,
    annualRevenue: "GYD 350M",
    registrationDate: "2019-03-20",
  },
  {
    id: "3",
    supplierCode: "SUP-2024-003",
    name: "Georgetown Engineering Services",
    sector: "ENGINEERING",
    certification: "PENDING",
    localOwnership: 70,
    employeeCount: 45,
    annualRevenue: "GYD 120M",
    registrationDate: "2023-08-10",
  },
  {
    id: "4",
    supplierCode: "SUP-2024-004",
    name: "Atlantic Marine Services",
    sector: "MARINE",
    certification: "CERTIFIED",
    localOwnership: 100,
    employeeCount: 320,
    annualRevenue: "GYD 800M",
    registrationDate: "2018-11-05",
  },
  {
    id: "5",
    supplierCode: "SUP-2024-005",
    name: "Berbice Technical Supplies",
    sector: "EQUIPMENT",
    certification: "EXPIRED",
    localOwnership: 60,
    employeeCount: 28,
    annualRevenue: "GYD 75M",
    registrationDate: "2021-04-22",
  },
];

const mockReports: ComplianceReport[] = [
  {
    id: "1",
    reportCode: "RPT-2024-Q3-001",
    companyName: "ExxonMobil Guyana",
    reportingPeriod: "Q3 2024",
    overallScore: 92,
    employmentScore: 95,
    procurementScore: 88,
    trainingScore: 93,
    status: "COMPLIANT",
    submittedDate: "2024-10-15",
  },
  {
    id: "2",
    reportCode: "RPT-2024-Q3-002",
    companyName: "Guyana Goldfields",
    reportingPeriod: "Q3 2024",
    overallScore: 88,
    employmentScore: 90,
    procurementScore: 85,
    trainingScore: 89,
    status: "COMPLIANT",
    submittedDate: "2024-10-20",
  },
  {
    id: "3",
    reportCode: "RPT-2024-Q3-003",
    companyName: "CGX Energy Inc",
    reportingPeriod: "Q3 2024",
    overallScore: 72,
    employmentScore: 78,
    procurementScore: 65,
    trainingScore: 73,
    status: "PARTIAL",
    submittedDate: "2024-10-18",
  },
];

function LocalContentPage() {
  const [activeTab, setActiveTab] = useState("plans");

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      DRAFT: "outline",
      SUBMITTED: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
      UNDER_REVIEW: "outline",
      CERTIFIED: "default",
      PENDING: "outline",
      EXPIRED: "destructive",
      COMPLIANT: "default",
      NON_COMPLIANT: "destructive",
      PARTIAL: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getSectorBadge = (sector: string) => {
    const colors: Record<string, string> = {
      OIL_GAS: "bg-blue-100 text-blue-800",
      MINING: "bg-yellow-100 text-yellow-800",
      LOGISTICS: "bg-green-100 text-green-800",
      CONSTRUCTION: "bg-orange-100 text-orange-800",
      ENGINEERING: "bg-purple-100 text-purple-800",
      MARINE: "bg-cyan-100 text-cyan-800",
      EQUIPMENT: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[sector] || "bg-gray-100 text-gray-800"}`}
      >
        {sector.replace("_", " ")}
      </span>
    );
  };

  const totalPlans = mockPlans.length;
  const approvedPlans = mockPlans.filter((p) => p.status === "APPROVED").length;
  const certifiedSuppliers = mockSuppliers.filter(
    (s) => s.certification === "CERTIFIED"
  ).length;
  const avgComplianceScore = Math.round(
    mockReports.reduce((sum, r) => sum + r.overallScore, 0) / mockReports.length
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Local Content Compliance
            </h1>
            <p className="text-muted-foreground">
              Manage Local Content Act compliance, supplier registration, and
              reporting.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Total Plans
                </p>
                <p className="font-bold text-2xl">{totalPlans}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Approved Plans
                </p>
                <p className="font-bold text-2xl">{approvedPlans}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Certified Suppliers
                </p>
                <p className="font-bold text-2xl">{certifiedSuppliers}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Avg. Compliance
                </p>
                <p className="font-bold text-2xl">{avgComplianceScore}%</p>
              </div>
              <Percent className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Local Content Dashboard</CardTitle>
          <CardDescription>
            Manage local content plans, supplier registrations, and compliance
            reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="plans">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Content Plans
              </TabsTrigger>
              <TabsTrigger value="suppliers">
                <Building2 className="mr-2 h-4 w-4" />
                Suppliers
              </TabsTrigger>
              <TabsTrigger value="reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="workforce">
                <Users className="mr-2 h-4 w-4" />
                Workforce
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plans">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Code</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Employment</TableHead>
                    <TableHead>Procurement</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        {plan.planCode}
                      </TableCell>
                      <TableCell>{plan.companyName}</TableCell>
                      <TableCell>{getSectorBadge(plan.sector)}</TableCell>
                      <TableCell>{getStatusBadge(plan.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            className="w-16"
                            value={
                              plan.employmentActual
                                ? (plan.employmentActual /
                                    plan.employmentTarget) *
                                  100
                                : 0
                            }
                          />
                          <span className="text-sm">
                            {plan.employmentActual}/{plan.employmentTarget}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            className="w-16"
                            value={
                              plan.procurementActual
                                ? (plan.procurementActual /
                                    plan.procurementTarget) *
                                  100
                                : 0
                            }
                          />
                          <span className="text-sm">
                            {plan.procurementActual}/{plan.procurementTarget}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{plan.submittedDate}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Plan</DropdownMenuItem>
                            <DropdownMenuItem>Submit Report</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="suppliers">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Local Ownership</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Annual Revenue</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        {supplier.supplierCode}
                      </TableCell>
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>{getSectorBadge(supplier.sector)}</TableCell>
                      <TableCell>
                        {getStatusBadge(supplier.certification)}
                      </TableCell>
                      <TableCell>{supplier.localOwnership}%</TableCell>
                      <TableCell>{supplier.employeeCount}</TableCell>
                      <TableCell>{supplier.annualRevenue}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit Supplier</DropdownMenuItem>
                            <DropdownMenuItem>
                              Renew Certification
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="reports">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Code</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Overall Score</TableHead>
                    <TableHead>Employment</TableHead>
                    <TableHead>Procurement</TableHead>
                    <TableHead>Training</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.reportCode}
                      </TableCell>
                      <TableCell>{report.companyName}</TableCell>
                      <TableCell>{report.reportingPeriod}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            className="w-16"
                            value={report.overallScore}
                          />
                          <span className="font-medium">
                            {report.overallScore}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{report.employmentScore}%</TableCell>
                      <TableCell>{report.procurementScore}%</TableCell>
                      <TableCell>{report.trainingScore}%</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Report</DropdownMenuItem>
                            <DropdownMenuItem>Download PDF</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="workforce">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Workforce Analytics</h3>
                <p className="text-muted-foreground">
                  Track Guyanese employment metrics and skills development
                  across operators.
                </p>
                <Button className="mt-4" variant="outline">
                  View Workforce Data
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
