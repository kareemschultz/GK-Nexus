import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calculator,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Play,
  Printer,
  Send,
  Settings,
  Users,
  X,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/payroll/run")({
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

type PayrollRunStep =
  | "setup"
  | "review"
  | "calculate"
  | "approve"
  | "process"
  | "complete";

type PayrollEmployee = {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  basicSalary: number;
  allowances: number;
  overtimeHours: number;
  overtimeRate: number;
  grossPay: number;
  payeTax: number;
  nisContribution: number;
  otherDeductions: number;
  netPay: number;
  status: "included" | "excluded" | "modified";
  payeRate: number;
  notes?: string;
};

type PayrollSummary = {
  totalEmployees: number;
  includedEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalPayeTax: number;
  totalNisContributions: number;
  totalDeductions: number;
  payrollCosts: number;
  employerNisContributions: number;
};

type GRAForm7B = {
  companyName: string;
  tin: string;
  period: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalPayeTax: number;
  totalNisEmployee: number;
  totalNisEmployer: number;
  penaltiesInterest: number;
  totalDue: number;
};

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const _privateData = useQuery(orpc.privateData.queryOptions());

  const [currentStep, setCurrentStep] = useState<PayrollRunStep>("setup");
  const [payPeriod, setPayPeriod] = useState("2024-12");
  const [runNotes, setRunNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showGRAForm, setShowGRAForm] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock payroll employees data
  const [payrollEmployees, setPayrollEmployees] = useState<PayrollEmployee[]>([
    {
      id: "emp-001",
      employeeId: "GKN-001",
      name: "John Smith",
      department: "Engineering",
      position: "Senior Developer",
      basicSalary: 150_000,
      allowances: 30_000,
      overtimeHours: 8,
      overtimeRate: 1875, // 150,000 / 160 * 1.5
      grossPay: 195_000, // 150,000 + 30,000 + (8 * 1,875)
      payeTax: 24_500,
      nisContribution: 9750,
      otherDeductions: 2500,
      netPay: 158_250,
      status: "included",
      payeRate: 0.175,
    },
    {
      id: "emp-002",
      employeeId: "GKN-002",
      name: "Sarah Johnson",
      department: "Sales",
      position: "Marketing Manager",
      basicSalary: 135_000,
      allowances: 30_000,
      overtimeHours: 4,
      overtimeRate: 1688,
      grossPay: 171_750,
      payeTax: 20_563,
      nisContribution: 8588,
      otherDeductions: 2000,
      netPay: 140_599,
      status: "included",
      payeRate: 0.175,
    },
    {
      id: "emp-003",
      employeeId: "GKN-003",
      name: "Michael Chen",
      department: "Operations",
      position: "Operations Lead",
      basicSalary: 125_000,
      allowances: 30_000,
      overtimeHours: 6,
      overtimeRate: 1563,
      grossPay: 164_378,
      payeTax: 19_191,
      nisContribution: 8219,
      otherDeductions: 1500,
      netPay: 135_468,
      status: "included",
      payeRate: 0.175,
    },
    {
      id: "emp-004",
      employeeId: "GKN-004",
      name: "Emily Davis",
      department: "HR",
      position: "HR Specialist",
      basicSalary: 95_000,
      allowances: 25_000,
      overtimeHours: 2,
      overtimeRate: 1188,
      grossPay: 122_376,
      payeTax: 10_119,
      nisContribution: 6119,
      otherDeductions: 1000,
      netPay: 105_138,
      status: "excluded", // On leave
      payeRate: 0.15,
      notes: "Employee on maternity leave",
    },
    {
      id: "emp-005",
      employeeId: "GKN-005",
      name: "Robert Wilson",
      department: "Administration",
      position: "Finance Analyst",
      basicSalary: 115_000,
      allowances: 25_000,
      overtimeHours: 0,
      overtimeRate: 1438,
      grossPay: 140_000,
      payeTax: 14_875,
      nisContribution: 7000,
      otherDeductions: 1200,
      netPay: 116_925,
      status: "included",
      payeRate: 0.175,
    },
  ]);

  const includedEmployees = payrollEmployees.filter(
    (emp) => emp.status === "included"
  );

  const payrollSummary: PayrollSummary = {
    totalEmployees: payrollEmployees.length,
    includedEmployees: includedEmployees.length,
    totalGrossPay: includedEmployees.reduce(
      (sum, emp) => sum + emp.grossPay,
      0
    ),
    totalNetPay: includedEmployees.reduce((sum, emp) => sum + emp.netPay, 0),
    totalPayeTax: includedEmployees.reduce((sum, emp) => sum + emp.payeTax, 0),
    totalNisContributions: includedEmployees.reduce(
      (sum, emp) => sum + emp.nisContribution,
      0
    ),
    totalDeductions: includedEmployees.reduce(
      (sum, emp) => sum + emp.otherDeductions,
      0
    ),
    payrollCosts: includedEmployees.reduce((sum, emp) => sum + emp.grossPay, 0),
    employerNisContributions: includedEmployees.reduce(
      (sum, emp) => sum + emp.nisContribution,
      0
    ), // Employer matches employee contribution
  };

  const graForm7B: GRAForm7B = {
    companyName: "GK Nexus Solutions Ltd.",
    tin: "TIN-123456789",
    period: payPeriod,
    totalEmployees: payrollSummary.includedEmployees,
    totalGrossPay: payrollSummary.totalGrossPay,
    totalPayeTax: payrollSummary.totalPayeTax,
    totalNisEmployee: payrollSummary.totalNisContributions,
    totalNisEmployer: payrollSummary.employerNisContributions,
    penaltiesInterest: 0,
    totalDue:
      payrollSummary.totalPayeTax +
      payrollSummary.totalNisContributions +
      payrollSummary.employerNisContributions,
  };

  const steps: { id: PayrollRunStep; title: string; description: string }[] = [
    {
      id: "setup",
      title: "Setup",
      description: "Configure payroll run parameters",
    },
    {
      id: "review",
      title: "Review",
      description: "Review employee data and make adjustments",
    },
    {
      id: "calculate",
      title: "Calculate",
      description: "Calculate payroll taxes and deductions",
    },
    {
      id: "approve",
      title: "Approve",
      description: "Review and approve payroll calculations",
    },
    {
      id: "process",
      title: "Process",
      description: "Process payments and generate reports",
    },
    {
      id: "complete",
      title: "Complete",
      description: "Payroll run completed successfully",
    },
  ];

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
      month: "long",
    });

  const getStepIcon = (
    stepId: PayrollRunStep,
    isActive: boolean,
    isCompleted: boolean
  ) => {
    if (isCompleted) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    if (isActive) {
      return <Clock className="h-6 w-6 text-blue-500" />;
    }
    return <div className="h-6 w-6 rounded-full border-2 border-gray-300" />;
  };

  const handleNextStep = () => {
    const stepOrder: PayrollRunStep[] = [
      "setup",
      "review",
      "calculate",
      "approve",
      "process",
      "complete",
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePreviousStep = () => {
    const stepOrder: PayrollRunStep[] = [
      "setup",
      "review",
      "calculate",
      "approve",
      "process",
      "complete",
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const toggleEmployeeStatus = (employeeId: string) => {
    setPayrollEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? {
              ...emp,
              status: emp.status === "included" ? "excluded" : "included",
            }
          : emp
      )
    );
  };

  const processPayroll = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate processing steps
    const steps = [
      "Validating employee data...",
      "Calculating PAYE taxes...",
      "Computing NIS contributions...",
      "Generating payment files...",
      "Creating reports...",
      "Finalizing payroll run...",
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProcessingProgress(((i + 1) / steps.length) * 100);
    }

    setIsProcessing(false);
    setCurrentStep("complete");
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Payroll Run - {formatDate(payPeriod)}
            </h1>
            <p className="text-muted-foreground">
              Process monthly payroll with automated PAYE and NIS calculations.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate({ to: "/payroll" })}
              variant="outline"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button
              onClick={() => navigate({ to: "/payroll/employees" })}
              variant="outline"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Employees
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <section className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted =
              steps.findIndex((s) => s.id === currentStep) > index;

            return (
              <div className="flex flex-col items-center" key={step.id}>
                <div className="flex items-center">
                  {getStepIcon(step.id, isActive, isCompleted)}
                  {index < steps.length - 1 && (
                    <div
                      className={`ml-2 h-1 w-24 ${isCompleted ? "bg-green-500" : "bg-gray-300"}`}
                    />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`font-medium text-sm ${isActive ? "text-blue-500" : isCompleted ? "text-green-500" : "text-gray-500"}`}
                  >
                    {step.title}
                  </p>
                  <p className="max-w-24 text-muted-foreground text-xs">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Step Content */}
      <div className="grid gap-6">
        {/* Setup Step */}
        {currentStep === "setup" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Payroll Setup
              </CardTitle>
              <CardDescription>
                Configure the parameters for this payroll run.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pay-period">Pay Period</Label>
                  <Select onValueChange={setPayPeriod} value={payPeriod}>
                    <SelectTrigger id="pay-period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-12">December 2024</SelectItem>
                      <SelectItem value="2024-11">November 2024</SelectItem>
                      <SelectItem value="2024-10">October 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="run-date">Run Date</Label>
                  <Input
                    id="run-date"
                    readOnly
                    type="date"
                    value="2024-12-15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Run Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  onChange={(e) => setRunNotes(e.target.value)}
                  placeholder="Add any notes or comments for this payroll run..."
                  value={runNotes}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNextStep}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Continue to Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Step */}
        {currentStep === "review" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Review ({payrollSummary.totalEmployees} employees)
                </CardTitle>
                <CardDescription>
                  Review and adjust employee data before calculating payroll.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Basic Salary</TableHead>
                      <TableHead>OT Hours</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollEmployees.map((employee) => (
                      <TableRow
                        className={
                          employee.status === "excluded" ? "opacity-50" : ""
                        }
                        key={employee.id}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {employee.employeeId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>
                          {formatCurrency(employee.basicSalary)}
                        </TableCell>
                        <TableCell>{employee.overtimeHours}h</TableCell>
                        <TableCell>
                          {formatCurrency(employee.grossPay)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              employee.status === "included"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {employee.status}
                          </Badge>
                          {employee.notes && (
                            <p className="mt-1 text-muted-foreground text-xs">
                              {employee.notes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => toggleEmployeeStatus(employee.id)}
                            size="sm"
                            variant="outline"
                          >
                            {employee.status === "included" ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={handlePreviousStep} variant="outline">
                Previous
              </Button>
              <Button onClick={handleNextStep}>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Payroll
              </Button>
            </div>
          </div>
        )}

        {/* Calculate Step */}
        {currentStep === "calculate" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-muted-foreground text-sm">
                        Included Employees
                      </p>
                      <p className="font-bold text-2xl">
                        {payrollSummary.includedEmployees}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-muted-foreground text-sm">
                        Total Gross Pay
                      </p>
                      <p className="font-bold text-2xl">
                        {formatCurrency(payrollSummary.totalGrossPay)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-muted-foreground text-sm">
                        Total PAYE Tax
                      </p>
                      <p className="font-bold text-2xl text-red-600">
                        {formatCurrency(payrollSummary.totalPayeTax)}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-muted-foreground text-sm">
                        Total Net Pay
                      </p>
                      <p className="font-bold text-2xl text-green-600">
                        {formatCurrency(payrollSummary.totalNetPay)}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Calculations</CardTitle>
                <CardDescription>
                  Payroll breakdown for all included employees.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>PAYE Tax</TableHead>
                      <TableHead>NIS</TableHead>
                      <TableHead>Other Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {includedEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {employee.department}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(employee.grossPay)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          -{formatCurrency(employee.payeTax)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          -{formatCurrency(employee.nisContribution)}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          -{formatCurrency(employee.otherDeductions)}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(employee.netPay)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2">
                      <TableCell className="font-bold">TOTALS</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(payrollSummary.totalGrossPay)}
                      </TableCell>
                      <TableCell className="font-bold text-red-600">
                        -{formatCurrency(payrollSummary.totalPayeTax)}
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">
                        -{formatCurrency(payrollSummary.totalNisContributions)}
                      </TableCell>
                      <TableCell className="font-bold text-orange-600">
                        -{formatCurrency(payrollSummary.totalDeductions)}
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatCurrency(payrollSummary.totalNetPay)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={handlePreviousStep} variant="outline">
                Previous
              </Button>
              <Button onClick={handleNextStep}>
                <Check className="mr-2 h-4 w-4" />
                Approve Calculations
              </Button>
            </div>
          </div>
        )}

        {/* Approve Step */}
        {currentStep === "approve" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Final Approval
                </CardTitle>
                <CardDescription>
                  Review the final payroll summary before processing payments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium">Employee Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Employees:</span>
                        <span>{payrollSummary.totalEmployees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Included in Payroll:</span>
                        <span>{payrollSummary.includedEmployees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Excluded:</span>
                        <span>
                          {payrollSummary.totalEmployees -
                            payrollSummary.includedEmployees}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Financial Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Gross Pay:</span>
                        <span>
                          {formatCurrency(payrollSummary.totalGrossPay)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total PAYE Tax:</span>
                        <span className="text-red-600">
                          -{formatCurrency(payrollSummary.totalPayeTax)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total NIS (Employee):</span>
                        <span className="text-blue-600">
                          -
                          {formatCurrency(payrollSummary.totalNisContributions)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Deductions:</span>
                        <span className="text-orange-600">
                          -{formatCurrency(payrollSummary.totalDeductions)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Total Net Pay:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(payrollSummary.totalNetPay)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <h4 className="font-medium">Employer Obligations</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Employee Net Pay:</span>
                      <span>{formatCurrency(payrollSummary.totalNetPay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PAYE Tax (to GRA):</span>
                      <span>{formatCurrency(payrollSummary.totalPayeTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NIS Employee Contribution:</span>
                      <span>
                        {formatCurrency(payrollSummary.totalNisContributions)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>NIS Employer Contribution:</span>
                      <span>
                        {formatCurrency(
                          payrollSummary.employerNisContributions
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Total Payroll Cost:</span>
                      <span>
                        {formatCurrency(
                          payrollSummary.totalGrossPay +
                            payrollSummary.employerNisContributions
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={handlePreviousStep} variant="outline">
                Previous
              </Button>
              <Button onClick={() => setShowConfirmDialog(true)}>
                <Play className="mr-2 h-4 w-4" />
                Process Payroll
              </Button>
            </div>
          </div>
        )}

        {/* Process Step */}
        {currentStep === "process" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Processing Payroll
                </CardTitle>
                <CardDescription>
                  Please wait while we process the payroll payments and generate
                  reports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="space-y-4">
                    <Progress className="w-full" value={processingProgress} />
                    <p className="text-center text-muted-foreground">
                      Processing... {Math.round(processingProgress)}% complete
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                    <h3 className="mt-4 font-medium text-lg">
                      Payroll Processing Complete!
                    </h3>
                    <p className="text-muted-foreground">
                      All payments have been processed successfully.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {!isProcessing && (
              <div className="flex justify-end">
                <Button onClick={handleNextStep}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Payroll Run Complete
                </CardTitle>
                <CardDescription>
                  Payroll for {formatDate(payPeriod)} has been successfully
                  processed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <p className="font-medium text-2xl text-green-600">
                      {payrollSummary.includedEmployees}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Employees Paid
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-2xl">
                      {formatCurrency(payrollSummary.totalNetPay)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Total Net Pay
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-2xl">
                      {formatCurrency(
                        payrollSummary.totalPayeTax +
                          payrollSummary.totalNisContributions * 2
                      )}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Tax & NIS Due
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Payslips (PDF)
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={() => setShowGRAForm(true)}
                    variant="outline"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    GRA Form 7B
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Bank Transfer File
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    NIS Contribution Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">
                      Submit PAYE payment by Dec 15, 2024
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">
                      Submit NIS contributions by Dec 15, 2024
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Next payroll run: Jan 15, 2025
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => navigate({ to: "/payroll" })}>
                <DollarSign className="mr-2 h-4 w-4" />
                Return to Payroll Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog onOpenChange={setShowConfirmDialog} open={showConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Payroll Processing
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to process this payroll run? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-medium">Processing Summary:</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  • {payrollSummary.includedEmployees} employees will be paid
                </li>
                <li>
                  • Total net payments:{" "}
                  {formatCurrency(payrollSummary.totalNetPay)}
                </li>
                <li>
                  • PAYE tax due: {formatCurrency(payrollSummary.totalPayeTax)}
                </li>
                <li>
                  • NIS contributions due:{" "}
                  {formatCurrency(payrollSummary.totalNisContributions * 2)}
                </li>
              </ul>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowConfirmDialog(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmDialog(false);
                  processPayroll();
                }}
              >
                <Play className="mr-2 h-4 w-4" />
                Process Payroll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* GRA Form 7B Dialog */}
      <Dialog onOpenChange={setShowGRAForm} open={showGRAForm}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              GRA Form 7B - PAYE Return
            </DialogTitle>
            <DialogDescription>
              Guyana Revenue Authority Form 7B for {formatDate(payPeriod)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input readOnly value={graForm7B.companyName} />
              </div>
              <div className="space-y-2">
                <Label>TIN Number</Label>
                <Input readOnly value={graForm7B.tin} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Employment and Salary Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex justify-between">
                  <span>Total Number of Employees:</span>
                  <span className="font-medium">
                    {graForm7B.totalEmployees}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Gross Pay:</span>
                  <span className="font-medium">
                    {formatCurrency(graForm7B.totalGrossPay)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Tax and Contribution Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex justify-between">
                  <span>PAYE Tax Deducted:</span>
                  <span className="font-medium">
                    {formatCurrency(graForm7B.totalPayeTax)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>NIS Employee Contributions:</span>
                  <span className="font-medium">
                    {formatCurrency(graForm7B.totalNisEmployee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>NIS Employer Contributions:</span>
                  <span className="font-medium">
                    {formatCurrency(graForm7B.totalNisEmployer)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Penalties/Interest:</span>
                  <span className="font-medium">
                    {formatCurrency(graForm7B.penaltiesInterest)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount Due:</span>
                <span>{formatCurrency(graForm7B.totalDue)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button onClick={() => setShowGRAForm(false)} variant="outline">
                Close
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Submit to GRA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
