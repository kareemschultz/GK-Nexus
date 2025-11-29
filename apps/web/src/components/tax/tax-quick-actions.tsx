"use client";

import {
  BookOpen,
  Building2,
  Calculator,
  Calendar,
  Download,
  FileText,
  Plus,
  Receipt,
  Upload,
  Users,
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

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  disabled?: boolean;
}

interface TaxQuickActionsProps {
  onAction?: (actionId: string) => void;
  customActions?: QuickAction[];
  showDefaults?: boolean;
  layout?: "grid" | "list";
  compact?: boolean;
}

export function TaxQuickActions({
  onAction,
  customActions = [],
  showDefaults = true,
  layout = "grid",
  compact = false,
}: TaxQuickActionsProps) {
  const defaultActions: QuickAction[] = [
    {
      id: "paye-calculator",
      title: "PAYE Calculator",
      description: "Calculate monthly PAYE tax and NIS contributions",
      icon: Calculator,
      color: "text-blue-600",
      bgColor:
        "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40",
      href: "/tax/paye",
      badge: "Popular",
    },
    {
      id: "vat-calculator",
      title: "VAT Calculator",
      description: "Calculate VAT returns and single transactions",
      icon: Receipt,
      color: "text-green-600",
      bgColor:
        "bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40",
      href: "/tax/vat",
      badge: "GRA Compliant",
    },
    {
      id: "new-client",
      title: "Add New Client",
      description: "Onboard a new client for tax services",
      icon: Users,
      color: "text-purple-600",
      bgColor:
        "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40",
      href: "/clients/new",
    },
    {
      id: "upload-documents",
      title: "Upload Documents",
      description: "Upload tax documents and receipts",
      icon: Upload,
      color: "text-orange-600",
      bgColor:
        "bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/40",
      href: "/documents/upload",
    },
    {
      id: "business-setup",
      title: "Business Registration",
      description: "Register new business entity with GRA",
      icon: Building2,
      color: "text-indigo-600",
      bgColor:
        "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40",
      href: "/business/register",
    },
    {
      id: "schedule-appointment",
      title: "Schedule Meeting",
      description: "Book consultation with tax advisor",
      icon: Calendar,
      color: "text-pink-600",
      bgColor:
        "bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/20 dark:hover:bg-pink-950/40",
      href: "/appointments/schedule",
    },
    {
      id: "generate-report",
      title: "Generate Reports",
      description: "Create tax reports and summaries",
      icon: FileText,
      color: "text-teal-600",
      bgColor:
        "bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/40",
      href: "/reports/generate",
    },
    {
      id: "download-forms",
      title: "GRA Forms",
      description: "Download official GRA tax forms",
      icon: Download,
      color: "text-red-600",
      bgColor:
        "bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40",
      href: "/forms/download",
    },
    {
      id: "tax-guide",
      title: "Tax Guidelines",
      description: "View current tax rates and regulations",
      icon: BookOpen,
      color: "text-amber-600",
      bgColor:
        "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40",
      href: "/guides/tax",
    },
  ];

  const actions = showDefaults
    ? [...defaultActions, ...customActions]
    : customActions;

  const handleActionClick = (action: QuickAction) => {
    if (action.disabled) return;

    if (action.onClick) {
      action.onClick();
    } else if (onAction) {
      onAction(action.id);
    } else if (action.href) {
      // In a real app, you'd use navigation here
      console.log(`Navigate to: ${action.href}`);
    }
  };

  const ActionCard = ({ action }: { action: QuickAction }) => {
    const IconComponent = action.icon;

    if (compact) {
      return (
        <Button
          className={`h-auto flex-col gap-2 p-4 ${action.bgColor} ${action.disabled ? "cursor-not-allowed opacity-50" : ""}`}
          disabled={action.disabled}
          onClick={() => handleActionClick(action)}
          variant="ghost"
        >
          <div className="flex items-center justify-center">
            <IconComponent className={`h-6 w-6 ${action.color}`} />
            {action.badge && (
              <Badge className="ml-2 text-xs" variant="secondary">
                {action.badge}
              </Badge>
            )}
          </div>
          <div className="text-center">
            <div className="font-medium text-sm">{action.title}</div>
            {layout === "list" && (
              <div className="mt-1 text-muted-foreground text-xs">
                {action.description}
              </div>
            )}
          </div>
        </Button>
      );
    }

    return (
      <Card
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
          action.disabled
            ? "cursor-not-allowed opacity-50"
            : "hover:-translate-y-1"
        }`}
        onClick={() => handleActionClick(action)}
      >
        <CardContent className={`p-4 ${action.bgColor} rounded-lg`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={"rounded-lg bg-white/50 p-2 dark:bg-gray-900/50"}>
                <IconComponent className={`h-5 w-5 ${action.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{action.title}</h3>
                  {action.badge && (
                    <Badge className="text-xs" variant="secondary">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-muted-foreground text-xs">
                  {action.description}
                </p>
              </div>
            </div>
            {!action.disabled && (
              <Plus className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (layout === "list") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used tax and business operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {actions.map((action) => (
              <div className="group" key={action.id}>
                <ActionCard action={action} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <CardTitle>Quick Actions</CardTitle>
          </div>
          <Badge className="text-xs" variant="outline">
            {actions.length} actions
          </Badge>
        </div>
        <CardDescription>
          Fast access to commonly used tax and business operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`grid gap-3 ${
            compact
              ? "grid-cols-2 md:grid-cols-4"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {actions.map((action) => (
            <div className="group" key={action.id}>
              <ActionCard action={action} />
            </div>
          ))}
        </div>

        {actions.length === 0 && (
          <div className="py-8 text-center">
            <Calculator className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
            <p className="font-medium text-sm">No quick actions available</p>
            <p className="text-muted-foreground text-xs">
              Configure quick actions to get started faster
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized components for different sections
export function TaxCalculatorActions({
  onAction,
}: {
  onAction?: (actionId: string) => void;
}) {
  const calculatorActions: QuickAction[] = [
    {
      id: "paye-calculator",
      title: "PAYE Tax",
      description: "Calculate employee taxes",
      icon: Calculator,
      color: "text-blue-600",
      bgColor:
        "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40",
      href: "/tax/paye",
    },
    {
      id: "vat-calculator",
      title: "VAT Return",
      description: "Calculate VAT obligations",
      icon: Receipt,
      color: "text-green-600",
      bgColor:
        "bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40",
      href: "/tax/vat",
    },
    {
      id: "cit-calculator",
      title: "Corporation Tax",
      description: "Calculate business tax",
      icon: Building2,
      color: "text-purple-600",
      bgColor:
        "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40",
      href: "/tax/cit",
    },
    {
      id: "nis-calculator",
      title: "NIS Contributions",
      description: "Calculate social security",
      icon: Users,
      color: "text-orange-600",
      bgColor:
        "bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/40",
      href: "/tax/nis",
    },
  ];

  return (
    <TaxQuickActions
      compact={true}
      customActions={calculatorActions}
      layout="grid"
      onAction={onAction}
      showDefaults={false}
    />
  );
}

export function ClientManagementActions({
  onAction,
}: {
  onAction?: (actionId: string) => void;
}) {
  const clientActions: QuickAction[] = [
    {
      id: "add-client",
      title: "Add Client",
      description: "Register new client",
      icon: Plus,
      color: "text-blue-600",
      bgColor:
        "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40",
      href: "/clients/new",
    },
    {
      id: "upload-docs",
      title: "Upload Documents",
      description: "Add client documents",
      icon: Upload,
      color: "text-green-600",
      bgColor:
        "bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40",
      href: "/documents/upload",
    },
    {
      id: "schedule-meeting",
      title: "Schedule Meeting",
      description: "Book consultation",
      icon: Calendar,
      color: "text-purple-600",
      bgColor:
        "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40",
      href: "/appointments/schedule",
    },
  ];

  return (
    <TaxQuickActions
      compact={true}
      customActions={clientActions}
      layout="grid"
      onAction={onAction}
      showDefaults={false}
    />
  );
}
