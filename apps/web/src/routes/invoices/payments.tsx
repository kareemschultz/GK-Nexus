import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Search,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/invoices/payments")({
  component: PaymentTrackingPage,
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

interface Payment {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed" | "refunded";
  method: "bank-transfer" | "credit-card" | "cash" | "cheque";
}

const payments: Payment[] = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    clientName: "Caribbean Holdings Ltd",
    amount: 125_000,
    date: "2024-12-28",
    status: "completed",
    method: "bank-transfer",
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-002",
    clientName: "Guyana Mining Corp",
    amount: 85_000,
    date: "2024-12-25",
    status: "pending",
    method: "cheque",
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-003",
    clientName: "Atlantic Shipping Inc",
    amount: 45_000,
    date: "2024-12-20",
    status: "completed",
    method: "credit-card",
  },
  {
    id: "4",
    invoiceNumber: "INV-2024-004",
    clientName: "Georgetown Retail Ltd",
    amount: 32_000,
    date: "2024-12-15",
    status: "failed",
    method: "bank-transfer",
  },
  {
    id: "5",
    invoiceNumber: "INV-2024-005",
    clientName: "Demerara Exports Co",
    amount: 15_000,
    date: "2024-12-10",
    status: "refunded",
    method: "credit-card",
  },
];

const statusConfig = {
  completed: {
    label: "Completed",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
  failed: { label: "Failed", variant: "destructive" as const, icon: Clock },
  refunded: { label: "Refunded", variant: "outline" as const, icon: Clock },
};

const methodConfig = {
  "bank-transfer": "Bank Transfer",
  "credit-card": "Credit Card",
  cash: "Cash",
  cheque: "Cheque",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GY", {
    style: "currency",
    currency: "GYD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function PaymentTrackingPage() {
  const totalReceived = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">Payment Tracking</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor invoice payments and track receivables
        </p>
      </header>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              Total Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-600">
              {formatCurrency(totalReceived)}
            </div>
            <p className="text-muted-foreground text-xs">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-amber-600">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-muted-foreground text-xs">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-red-600">
              {formatCurrency(0)}
            </div>
            <p className="text-muted-foreground text-xs">Past due date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              Total Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
            </div>
            <p className="text-muted-foreground text-xs">All invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search payments..." />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Date Range
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => {
              const StatusIcon = statusConfig[payment.status].icon;
              return (
                <div
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  key={payment.id}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{payment.clientName}</h3>
                      <p className="text-muted-foreground text-sm">
                        {payment.invoiceNumber} • {methodConfig[payment.method]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {payment.date}
                      </p>
                    </div>
                    <Badge variant={statusConfig[payment.status].variant}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusConfig[payment.status].label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
