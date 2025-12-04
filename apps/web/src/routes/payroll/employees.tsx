import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  Loader2,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/payroll/employees")({
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

type Employee = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  status: "active" | "inactive" | "terminated" | "on-leave";
  payFrequency: "weekly" | "bi-weekly" | "monthly";
  grossSalary: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  payeRate: number;
  payeAmount: number;
  nisContribution: number;
  bankAccount: string;
  nisNumber: string;
  tinNumber: string;
  lastPayDate: string;
  nextPayDate: string;
};

type PayrollCalculation = {
  employeeId: string;
  payPeriod: string;
  grossPay: number;
  basicPay: number;
  allowances: number;
  totalDeductions: number;
  payeDeduction: number;
  nisDeduction: number;
  netPay: number;
  payeRate: number;
  overtimeHours: number;
  overtimePay: number;
};

function RouteComponent() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [showPayrollCalc, setShowPayrollCalc] = useState(false);
  const [selectedPayrollCalc, setSelectedPayrollCalc] =
    useState<PayrollCalculation | null>(null);

  // Fetch employees from API
  const { data: employeesResponse, isLoading } = useQuery({
    queryKey: ["payroll", "employees"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.payroll.employees.list({});
    },
  });

  // Map API response to component format
  const employees: Employee[] = useMemo(() => {
    const apiEmployees = employeesResponse?.data?.items || [];
    return apiEmployees.map((emp: any) => {
      const grossSalary = emp.salary || 150_000;
      const payeAmount = grossSalary * 0.175;
      const nisContribution = grossSalary * 0.056;
      const deductions = payeAmount + nisContribution;
      const netSalary = grossSalary - deductions;
      const nameParts = (emp.name || "").split(" ");

      return {
        id: emp.id,
        employeeId: `GKN-${emp.id.slice(0, 3).toUpperCase()}`,
        firstName: nameParts[0] || "Unknown",
        lastName: nameParts.slice(1).join(" ") || "",
        email: emp.email || "",
        phone: "+592-000-0000",
        position: emp.position || "Staff",
        department: emp.department || "General",
        hireDate: emp.startDate || new Date().toISOString().split("T")[0],
        status: (emp.status === "on_leave"
          ? "on-leave"
          : emp.status || "active") as Employee["status"],
        payFrequency: "monthly" as const,
        grossSalary,
        basicSalary: grossSalary * 0.8,
        allowances: grossSalary * 0.2,
        deductions,
        netSalary,
        payeRate: 0.175,
        payeAmount,
        nisContribution,
        bankAccount: "ACC-XXXXXXXXX",
        nisNumber: emp.nisNumber || "NIS-XXXXXXXXX",
        tinNumber: emp.tinNumber || "TIN-XXXXXXXXX",
        lastPayDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        nextPayDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      };
    });
  }, [employeesResponse]);

  // Default payroll calculation template
  const defaultPayrollCalc: PayrollCalculation = {
    employeeId: "",
    payPeriod: new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    grossPay: 180_000,
    basicPay: 150_000,
    allowances: 30_000,
    totalDeductions: 35_250,
    payeDeduction: 26_250,
    nisDeduction: 9000,
    netPay: 144_750,
    payeRate: 0.175,
    overtimeHours: 0,
    overtimePay: 0,
  };

  const departments = useMemo(
    () => [...new Set(employees.map((emp) => emp.department))],
    [employees]
  );

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const matchesSearch =
          employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.employeeId
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.position.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment =
          departmentFilter === "all" ||
          employee.department === departmentFilter;
        const matchesStatus =
          statusFilter === "all" || employee.status === statusFilter;

        return matchesSearch && matchesDepartment && matchesStatus;
      }),
    [employees, searchTerm, departmentFilter, statusFilter]
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "terminated":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "on-leave":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "terminated":
        return <Badge variant="destructive">Terminated</Badge>;
      case "on-leave":
        return <Badge variant="outline">On Leave</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    switch (frequency) {
      case "weekly":
        return <Badge variant="outline">Weekly</Badge>;
      case "bi-weekly":
        return <Badge variant="outline">Bi-Weekly</Badge>;
      case "monthly":
        return <Badge variant="default">Monthly</Badge>;
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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading employees...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Employee Payroll Management
            </h1>
            <p className="text-muted-foreground">
              Manage employee records and payroll calculations with PAYE and NIS
              compliance.
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>
      </header>

      {/* Filters and Search */}
      <section aria-label="Employee filters and search" className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search employees by name, ID, email, or position..."
                  value={searchTerm}
                />
              </div>
              <div className="flex gap-2">
                <Select
                  onValueChange={setDepartmentFilter}
                  value={departmentFilter}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Employee Overview Stats */}
      <section aria-label="Employee overview statistics" className="mb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Total Employees
                  </p>
                  <p className="font-bold text-2xl">{employees.length}</p>
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
                    Active Employees
                  </p>
                  <p className="font-bold text-2xl">
                    {employees.filter((e) => e.status === "active").length}
                  </p>
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
                    Total Monthly Payroll
                  </p>
                  <p className="font-bold text-2xl">
                    {formatCurrency(
                      employees.reduce((sum, e) => sum + e.grossSalary, 0)
                    )}
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
                    Average Salary
                  </p>
                  <p className="font-bold text-2xl">
                    {employees.length > 0
                      ? formatCurrency(
                          employees.reduce((sum, e) => sum + e.grossSalary, 0) /
                            employees.length
                        )
                      : formatCurrency(0)}
                  </p>
                </div>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Employee Table */}
      <section aria-label="Employee listing table">
        <Card>
          <CardHeader>
            <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
            <CardDescription>
              Comprehensive view of all employee records and payroll
              information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pay Frequency</TableHead>
                  <TableHead>Gross Salary</TableHead>
                  <TableHead>PAYE</TableHead>
                  <TableHead>NIS</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow className="hover:bg-muted/50" key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {employee.firstName.charAt(0)}
                            {employee.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            ID: {employee.employeeId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(employee.status)}
                        {getStatusBadge(employee.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getFrequencyBadge(employee.payFrequency)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(employee.grossSalary)}
                    </TableCell>
                    <TableCell>{formatCurrency(employee.payeAmount)}</TableCell>
                    <TableCell>
                      {formatCurrency(employee.nisContribution)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(employee.netSalary)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowEmployeeDetails(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPayrollCalc({
                                ...defaultPayrollCalc,
                                employeeId: employee.employeeId,
                                grossPay: employee.grossSalary,
                                basicPay: employee.basicSalary,
                                allowances: employee.allowances,
                                totalDeductions: employee.deductions,
                                payeDeduction: employee.payeAmount,
                                nisDeduction: employee.nisContribution,
                                netPay: employee.netSalary,
                              });
                              setShowPayrollCalc(true);
                            }}
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            View Payroll Calc
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Employee
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredEmployees.length === 0 && (
              <div className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold text-lg">
                  No employees found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Employee Details Dialog */}
      <Dialog onOpenChange={setShowEmployeeDetails} open={showEmployeeDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogTitle>
            <DialogDescription>
              Detailed employee information and payroll data.
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="grid gap-6">
              {/* Personal Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Employee ID:
                      </span>
                      <span className="font-medium">
                        {selectedEmployee.employeeId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Hire Date:</span>
                      <span className="font-medium">
                        {formatDate(selectedEmployee.hireDate)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Employment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Position:</span>
                      <span className="font-medium">
                        {selectedEmployee.position}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">
                        {selectedEmployee.department}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(selectedEmployee.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Pay Frequency:
                      </span>
                      {getFrequencyBadge(selectedEmployee.payFrequency)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payroll Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payroll Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Gross Salary
                      </p>
                      <p className="font-bold text-lg">
                        {formatCurrency(selectedEmployee.grossSalary)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">PAYE Tax</p>
                      <p className="font-bold text-lg text-red-600">
                        -{formatCurrency(selectedEmployee.payeAmount)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        NIS Contribution
                      </p>
                      <p className="font-bold text-blue-600 text-lg">
                        -{formatCurrency(selectedEmployee.nisContribution)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Other Deductions
                      </p>
                      <p className="font-bold text-lg text-orange-600">
                        -
                        {formatCurrency(
                          selectedEmployee.deductions -
                            selectedEmployee.payeAmount -
                            selectedEmployee.nisContribution
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">Net Pay</p>
                      <p className="font-bold text-green-600 text-xl">
                        {formatCurrency(selectedEmployee.netSalary)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        NIS Number
                      </p>
                      <p className="font-medium">
                        {selectedEmployee.nisNumber}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        TIN Number
                      </p>
                      <p className="font-medium">
                        {selectedEmployee.tinNumber}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Bank Account
                      </p>
                      <p className="font-medium">
                        {selectedEmployee.bankAccount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowEmployeeDetails(false)}
                  variant="outline"
                >
                  Close
                </Button>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Employee
                </Button>
                <Button
                  onClick={() => {
                    setSelectedPayrollCalc({
                      ...defaultPayrollCalc,
                      employeeId: selectedEmployee.employeeId,
                      grossPay: selectedEmployee.grossSalary,
                      basicPay: selectedEmployee.basicSalary,
                      allowances: selectedEmployee.allowances,
                      totalDeductions: selectedEmployee.deductions,
                      payeDeduction: selectedEmployee.payeAmount,
                      nisDeduction: selectedEmployee.nisContribution,
                      netPay: selectedEmployee.netSalary,
                    });
                    setShowPayrollCalc(true);
                    setShowEmployeeDetails(false);
                  }}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Calculate Payroll
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payroll Calculation Dialog */}
      <Dialog onOpenChange={setShowPayrollCalc} open={showPayrollCalc}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payroll Calculation - {selectedPayrollCalc?.employeeId}
            </DialogTitle>
            <DialogDescription>
              Detailed payroll calculation with PAYE and NIS breakdown for{" "}
              {selectedPayrollCalc?.payPeriod}.
            </DialogDescription>
          </DialogHeader>

          {selectedPayrollCalc && (
            <div className="grid gap-6">
              {/* Calculation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Calculation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Basic Pay:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(selectedPayrollCalc.basicPay)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Allowances:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(selectedPayrollCalc.allowances)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Overtime Pay:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(selectedPayrollCalc.overtimePay)}
                        </span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Gross Pay:</span>
                          <span className="font-bold text-lg">
                            {formatCurrency(selectedPayrollCalc.grossPay)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          PAYE Tax (
                          {(selectedPayrollCalc.payeRate * 100).toFixed(1)}%):
                        </span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(selectedPayrollCalc.payeDeduction)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          NIS Contribution (5.6%):
                        </span>
                        <span className="font-medium text-blue-600">
                          -{formatCurrency(selectedPayrollCalc.nisDeduction)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Other Deductions:
                        </span>
                        <span className="font-medium text-orange-600">
                          -
                          {formatCurrency(
                            selectedPayrollCalc.totalDeductions -
                              selectedPayrollCalc.payeDeduction -
                              selectedPayrollCalc.nisDeduction
                          )}
                        </span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Net Pay:</span>
                          <span className="font-bold text-green-600 text-lg">
                            {formatCurrency(selectedPayrollCalc.netPay)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PAYE Calculation Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">PAYE Tax Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Gross Monthly Income:
                      </span>
                      <span>
                        {formatCurrency(selectedPayrollCalc.grossPay)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Less: Personal Allowance:
                      </span>
                      <span>-{formatCurrency(55_000)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Taxable Income:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(
                          Math.max(0, selectedPayrollCalc.grossPay - 55_000)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">
                        PAYE Tax (
                        {(selectedPayrollCalc.payeRate * 100).toFixed(1)}%):
                      </span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(selectedPayrollCalc.payeDeduction)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowPayrollCalc(false)}
                  variant="outline"
                >
                  Close
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Calculation
                </Button>
                <Button>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve & Process
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
