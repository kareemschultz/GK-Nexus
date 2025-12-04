import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Calculator, FileText, Receipt, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/tax")({
  component: TaxServicesPage,
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

const taxServices = [
  {
    title: "PAYE Calculator",
    description:
      "Calculate Pay As You Earn tax based on current Guyana tax brackets",
    icon: Calculator,
    href: "/tax/paye",
    badge: "2025 Rates",
  },
  {
    title: "VAT Calculator",
    description: "Calculate Value Added Tax at the standard 14% rate",
    icon: Receipt,
    href: "/tax/vat",
    badge: "14%",
  },
  {
    title: "NIS Calculator",
    description:
      "Calculate National Insurance Scheme contributions for employees and employers",
    icon: TrendingUp,
    href: "/tax/nis",
    badge: "Employee & Employer",
  },
  {
    title: "Tax Filing",
    description: "Prepare and submit tax returns to the GRA",
    icon: FileText,
    href: "/tax/filing",
    badge: "GRA Filing",
  },
];

function TaxServicesPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">Tax Services</h1>
        <p className="mt-2 text-muted-foreground">
          Comprehensive tax calculation and filing tools for Guyana businesses
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {taxServices.map((service) => (
          <Card
            className="cursor-pointer transition-all hover:shadow-md"
            key={service.title}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <service.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <Badge className="mt-1" variant="secondary">
                      {service.badge}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {service.description}
              </CardDescription>
              <Button asChild className="w-full">
                <Link to={service.href}>Open Calculator</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Guyana Tax Information</CardTitle>
          <CardDescription>
            Current tax rates and thresholds for 2025 (Updated per 2025 Budget)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">PAYE Brackets (2025)</h3>
              <ul className="mt-2 space-y-1 text-muted-foreground text-sm">
                <li>0 - $130,000/month: Tax-free</li>
                <li>$130,001 - $260,000/month: 25%</li>
                <li>Over $260,000/month: 35%</li>
              </ul>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">VAT Rate</h3>
              <p className="mt-2 text-muted-foreground text-sm">
                Standard rate: 14%
                <br />
                Some goods/services are zero-rated or exempt
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">NIS Contributions</h3>
              <ul className="mt-2 space-y-1 text-muted-foreground text-sm">
                <li>Employee: 5.6%</li>
                <li>Employer: 8.4%</li>
                <li>Ceiling: $280,000/month</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
