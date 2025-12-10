import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/payroll/employees/new")({
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

function RouteComponent() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    position: "",
    salary: "",
    startDate: "",
    tinNumber: "",
    nisNumber: "",
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      email: string;
      department?: string;
      position?: string;
      salary?: number;
      startDate?: string;
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.payroll.employees.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        department: data.department || undefined,
        position: data.position || undefined,
        salary: data.salary,
        startDate: data.startDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "employees"] });
      navigate({ to: "/payroll/employees" });
    },
    onError: (error: Error) => {
      console.error("Failed to create employee:", error);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployeeMutation.mutate({
      ...formData,
      salary: formData.salary ? Number(formData.salary) : undefined,
    });
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate({ to: "/payroll/employees" })}
            size="icon"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Add New Employee
            </h1>
            <p className="text-muted-foreground">
              Register a new employee for payroll processing.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Basic details about the employee.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    onChange={handleChange}
                    placeholder="Jane"
                    required
                    value={formData.firstName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                    value={formData.lastName}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  onChange={handleChange}
                  placeholder="jane.doe@company.com"
                  type="email"
                  value={formData.email}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
              <CardDescription>
                Position, department, and salary information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("department", value)
                    }
                    value={formData.department}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Accounting">Accounting</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Administration">
                        Administration
                      </SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    onChange={handleChange}
                    placeholder="Software Engineer"
                    value={formData.position}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Gross Salary (Monthly)</Label>
                  <Input
                    id="salary"
                    min="0"
                    name="salary"
                    onChange={handleChange}
                    placeholder="150000"
                    type="number"
                    value={formData.salary}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    onChange={handleChange}
                    type="date"
                    value={formData.startDate}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Tax & Compliance</CardTitle>
              <CardDescription>
                TIN and NIS numbers for tax calculations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tinNumber">TIN Number</Label>
                  <Input
                    id="tinNumber"
                    name="tinNumber"
                    onChange={handleChange}
                    placeholder="123456789"
                    value={formData.tinNumber}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nisNumber">NIS Number</Label>
                  <Input
                    id="nisNumber"
                    name="nisNumber"
                    onChange={handleChange}
                    placeholder="A-1234567"
                    value={formData.nisNumber}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              onClick={() => navigate({ to: "/payroll/employees" })}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={createEmployeeMutation.isPending} type="submit">
              <Save className="mr-2 h-4 w-4" />
              {createEmployeeMutation.isPending ? "Saving..." : "Save Employee"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
