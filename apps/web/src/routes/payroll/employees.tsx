import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
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
import { orpc } from "@/utils/orpc";

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
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const _privateData = useQuery(orpc.privateData.queryOptions());
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

  // Mock employee data
  const mockEmployees: Employee[] = [
    {
      id: "emp-001",
      employeeId: "GKN-001",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@gknexus.com",
      phone: "+592-123-4567",
      position: "Senior Developer",
      department: "Engineering",
      hireDate: "2023-01-15",
      status: "active",
      payFrequency: "monthly",
      grossSalary: 180_000,
      basicSalary: 150_000,
      allowances: 30_000,
      deductions: 35_250,
      netSalary: 144_750,
      payeRate: 0.175,
      payeAmount: 26_250,
      nisContribution: 9000,
      bankAccount: "ACC-123456789",
      nisNumber: "NIS-123456789",
      tinNumber: "TIN-123456789",
      lastPayDate: "2024-11-15",
      nextPayDate: "2024-12-15",
    },
    {
      id: "emp-002",
      employeeId: "GKN-002",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@gknexus.com",
      phone: "+592-234-5678",
      position: "Marketing Manager",
      department: "Sales",
      hireDate: "2022-06-10",
      status: "active",
      payFrequency: "monthly",
      grossSalary: 165_000,
      basicSalary: 135_000,
      allowances: 30_000,
      deductions: 32_175,
      netSalary: 132_825,
      payeRate: 0.175,
      payeAmount: 23_625,
      nisContribution: 8550,
      bankAccount: "ACC-987654321",
      nisNumber: "NIS-987654321",
      tinNumber: "TIN-987654321",
      lastPayDate: "2024-11-15",
      nextPayDate: "2024-12-15",
    },
    {
      id: "emp-003",
      employeeId: "GKN-003",
      firstName: "Michael",
      lastName: "Chen",
      email: "michael.chen@gknexus.com",
      phone: "+592-345-6789",
      position: "Operations Lead",
      department: "Operations",
      hireDate: "2023-03-20",
      status: "active",
      payFrequency: "monthly",
      grossSalary: 155_000,
      basicSalary: 125_000,
      allowances: 30_000,
      deductions: 30_125,
      netSalary: 124_875,
      payeRate: 0.175,
      payeAmount: 21_875,
      nisContribution: 8250,
      bankAccount: "ACC-456789123",
      nisNumber: "NIS-456789123",
      tinNumber: "TIN-456789123",
      lastPayDate: "2024-11-15",
      nextPayDate: "2024-12-15",
    },
    {
      id: "emp-004",
      employeeId: "GKN-004",
      firstName: "Emily",
      lastName: "Davis",
      email: "emily.davis@gknexus.com",
      phone: "+592-456-7890",
      position: "HR Specialist",
      department: "HR",
      hireDate: "2023-08-12",
      status: "on-leave",
      payFrequency: "monthly",
      grossSalary: 120_000,
      basicSalary: 95_000,
      allowances: 25_000,
      deductions: 22_500,
      netSalary: 97_500,
      payeRate: 0.15,
      payeAmount: 15_000,
      nisContribution: 7500,
      bankAccount: "ACC-789123456",
      nisNumber: "NIS-789123456",
      tinNumber: "TIN-789123456",
      lastPayDate: "2024-10-15",
      nextPayDate: "2024-12-15",
    },
    {
      id: "emp-005",
      employeeId: "GKN-005",
      firstName: "Robert",
      lastName: "Wilson",
      email: "robert.wilson@gknexus.com",
      phone: "+592-567-8901",
      position: "Finance Analyst",
      department: "Administration",
      hireDate: "2022-11-05",
      status: "active",
      payFrequency: "monthly",
      grossSalary: 140_000,
      basicSalary: 115_000,
      allowances: 25_000,
      deductions: 26_750,
      netSalary: 113_250,
      payeRate: 0.175,
      payeAmount: 19_250,
      nisContribution: 7500,
      bankAccount: "ACC-321654987",
      nisNumber: "NIS-321654987",
      tinNumber: "TIN-321654987",
      lastPayDate: "2024-11-15",
      nextPayDate: "2024-12-15",
    },
  ];

  // Mock payroll calculation
  const mockPayrollCalc: PayrollCalculation = {
    employeeId: "GKN-001",
    payPeriod: "November 2024",
    grossPay: 180_000,
    basicPay: 150_000,
    allowances: 30_000,
    totalDeductions: 35_250,
    payeDeduction: 26_250,
    nisDeduction: 9000,
    netPay: 144_750,
    payeRate: 0.175,
    overtimeHours: 8,
    overtimePay: 12_000,
  };

  const departments = [...new Set(mockEmployees.map((emp) => emp.department))];

  const filteredEmployees = mockEmployees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus =
      statusFilter === "all" || employee.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
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

  const calculatePAYE = (grossSalary: number) => {
    // Simplified PAYE calculation for Guyana (actual rates may vary)
    const personalAllowance = 55_000; // Monthly personal allowance
    const taxableIncome = Math.max(0, grossSalary - personalAllowance);

    if (taxableIncome <= 55_000) {
      return 0;
    }
    if (taxableIncome <= 125_000) {
      return taxableIncome * 0.15; // 15% tax rate
    }
    return 55_000 * 0.15 + (taxableIncome - 125_000) * 0.175; // 17.5% for higher bracket
  };

  const calculateNIS = (grossSalary: number) => {
    // NIS contribution is typically 5% of gross salary (employee portion)
    const nisRate = 0.05;
    return grossSalary * nisRate;
  };

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
                  <p className="font-bold text-2xl">{mockEmployees.length}</p>
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
                    {mockEmployees.filter((e) => e.status === "active").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
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
                      mockEmployees.reduce((sum, e) => sum + e.grossSalary, 0)
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
                    {formatCurrency(
                      mockEmployees.reduce((sum, e) => sum + e.grossSalary, 0) /
                        mockEmployees.length
                    )}
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
                                ...mockPayrollCalc,
                                employeeId: employee.employeeId,
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
                      ...mockPayrollCalc,
                      employeeId: selectedEmployee.employeeId,
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
                          NIS Contribution (5%):
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
                  <CheckCircle className="mr-2 h-4 w-4" />
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
