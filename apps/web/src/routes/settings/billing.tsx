import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Check,
  CreditCard,
  Download,
  ExternalLink,
  Plus,
  Receipt,
  Shield,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SettingsLayout } from "@/components/settings-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings/billing")({
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

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    description: "For individuals getting started",
    features: [
      "Up to 5 clients",
      "Basic tax calculations",
      "Email support",
      "1 user",
    ],
    current: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: 99,
    description: "For growing businesses",
    features: [
      "Up to 50 clients",
      "Advanced tax calculations",
      "Priority support",
      "5 users",
      "Document management",
      "API access",
    ],
    current: true,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299,
    description: "For large organizations",
    features: [
      "Unlimited clients",
      "Custom integrations",
      "24/7 dedicated support",
      "Unlimited users",
      "Advanced analytics",
      "Compliance automation",
      "White-label option",
    ],
    current: false,
  },
];

const invoices = [
  {
    id: "INV-2024-001",
    date: "Jan 1, 2024",
    amount: "$99.00",
    status: "paid",
  },
  {
    id: "INV-2023-012",
    date: "Dec 1, 2023",
    amount: "$99.00",
    status: "paid",
  },
  {
    id: "INV-2023-011",
    date: "Nov 1, 2023",
    amount: "$99.00",
    status: "paid",
  },
  {
    id: "INV-2023-010",
    date: "Oct 1, 2023",
    amount: "$99.00",
    status: "paid",
  },
];

function RouteComponent() {
  const [paymentMethods] = useState([
    {
      id: "pm_1",
      type: "card",
      brand: "Visa",
      last4: "4242",
      expiry: "12/25",
      default: true,
    },
    {
      id: "pm_2",
      type: "card",
      brand: "Mastercard",
      last4: "8888",
      expiry: "06/26",
      default: false,
    },
  ]);

  const currentPlan = plans.find((p) => p.current);
  const usagePercent = 72;

  const handleChangePlan = (planId: string) => {
    toast.success(`Plan change to ${planId} initiated`);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Downloading invoice ${invoiceId}...`);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold text-2xl">Billing</h2>
          <p className="text-muted-foreground">
            Manage your subscription and payment methods.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>
                    You are currently on the {currentPlan?.name} plan.
                  </CardDescription>
                </div>
                <Badge className="text-sm" variant="default">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-4xl">
                  ${currentPlan?.price}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Client Usage</span>
                  <span>36 / 50 clients</span>
                </div>
                <Progress value={usagePercent} />
                <p className="text-muted-foreground text-xs">
                  {100 - usagePercent}% of your plan limit remaining
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm">
                  Next billing date:{" "}
                  <span className="font-medium">February 1, 2024</span>
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            </CardFooter>
          </Card>

          {/* Available Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>
                Upgrade or downgrade your plan based on your needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan) => (
                  <div
                    className={cn(
                      "relative rounded-lg border p-4 transition-all",
                      plan.current && "border-primary ring-2 ring-primary/20",
                      plan.popular && "shadow-lg"
                    )}
                    key={plan.id}
                  >
                    {plan.popular && (
                      <Badge className="-top-2 -translate-x-1/2 absolute left-1/2">
                        Most Popular
                      </Badge>
                    )}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <p className="text-muted-foreground text-sm">
                          {plan.description}
                        </p>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-3xl">
                          ${plan.price}
                        </span>
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((feature) => (
                          <li
                            className="flex items-center gap-2 text-sm"
                            key={feature}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        disabled={plan.current}
                        onClick={() => handleChangePlan(plan.id)}
                        variant={plan.current ? "outline" : "default"}
                      >
                        {plan.current ? "Current Plan" : "Upgrade"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Manage your payment methods for subscription billing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={method.id}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {method.brand} •••• {method.last4}
                        </p>
                        {method.default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Expires {method.expiry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.default && (
                      <Button size="sm" variant="outline">
                        Set Default
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button className="w-full" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Billing History
              </CardTitle>
              <CardDescription>
                Download invoices and view payment history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.id}
                      </TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.amount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === "paid" ? "default" : "secondary"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your payment information is securely processed and encrypted. We
              never store your full card details.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </SettingsLayout>
  );
}
