import { createFileRoute } from "@tanstack/react-router";
import { Calculator, Download, FileText, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/tax/nis")({
  component: NISPage,
});

function NISPage() {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              NIS Contributions
            </h1>
            <p className="text-muted-foreground">
              Calculate and manage National Insurance Scheme contributions
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </header>

      <div className="mb-8 grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total NIS</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{formatCurrency(156_789)}</div>
            <p className="text-muted-foreground text-xs">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Employee Share
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{formatCurrency(78_395)}</div>
            <p className="text-muted-foreground text-xs">50% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Employer Share
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{formatCurrency(78_394)}</div>
            <p className="text-muted-foreground text-xs">50% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Employees</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">89</div>
            <p className="text-muted-foreground text-xs">Contributing</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>NIS Calculator</CardTitle>
            <CardDescription>
              Calculate NIS contributions for individual employees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gross-salary">Gross Monthly Salary (GYD)</Label>
              <Input
                id="gross-salary"
                placeholder="Enter gross salary"
                type="number"
              />
            </div>

            <div className="space-y-2 rounded-lg bg-muted p-4">
              <div className="flex justify-between">
                <span className="text-sm">NIS Rate:</span>
                <span className="font-medium">13.0% (6.5% each)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Maximum Insurable Earnings:</span>
                <span className="font-medium">{formatCurrency(250_000)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm">Employee Contribution (6.5%):</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm">Employer Contribution (6.5%):</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total NIS Contribution:</span>
                <span>{formatCurrency(0)}</span>
              </div>
            </div>

            <Button className="w-full">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate NIS
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NIS Remittance</CardTitle>
            <CardDescription>
              Submit NIS contributions to the authority
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Period:</span>
                <Badge>December 2023</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Due:</span>
                <span className="font-medium">{formatCurrency(156_789)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Due Date:</span>
                <span className="font-medium text-red-600">
                  15th January 2024
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Generate NIS Return
              </Button>
              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Payment Slip
              </Button>
              <Button className="w-full" variant="outline">
                Submit Online Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent NIS Calculations</CardTitle>
          <CardDescription>Latest NIS computation records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: "1",
                employee: "John Smith",
                grossSalary: 150_000,
                employeeContrib: 9750,
                employerContrib: 9750,
                totalContrib: 19_500,
                period: "December 2023",
                status: "calculated",
              },
              {
                id: "2",
                employee: "Jane Doe",
                grossSalary: 200_000,
                employeeContrib: 13_000,
                employerContrib: 13_000,
                totalContrib: 26_000,
                period: "December 2023",
                status: "calculated",
              },
              {
                id: "3",
                employee: "Bob Johnson",
                grossSalary: 300_000,
                employeeContrib: 16_250,
                employerContrib: 16_250,
                totalContrib: 32_500,
                period: "December 2023",
                status: "calculated",
              },
            ].map((record) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4"
                key={record.id}
              >
                <div className="flex items-center space-x-4">
                  <Calculator className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{record.employee}</p>
                    <p className="text-muted-foreground text-sm">
                      Gross: {formatCurrency(record.grossSalary)} • Period:{" "}
                      {record.period}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Employee: {formatCurrency(record.employeeContrib)} •
                      Employer: {formatCurrency(record.employerContrib)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(record.totalContrib)}
                    </p>
                    <Badge variant="secondary">{record.status}</Badge>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
