import {
  ArrowRight,
  BookOpen,
  Building2,
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Filter,
  Inbox,
  Lightbulb,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
    icon?: React.ElementType;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost";
    icon?: React.ElementType;
  };
  suggestions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  }>;
  illustration?:
    | "search"
    | "create"
    | "upload"
    | "filter"
    | "connect"
    | "complete"
    | "custom";
  size?: "sm" | "md" | "lg";
  showCard?: boolean;
  className?: string;
}

const illustrations = {
  search: Search,
  create: Plus,
  upload: Upload,
  filter: Filter,
  connect: ExternalLink,
  complete: CheckCircle,
  custom: Inbox,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  suggestions = [],
  illustration = "custom",
  size = "md",
  showCard = true,
  className = "",
}: EmptyStateProps) {
  const IconComponent = icon || illustrations[illustration];

  const sizeClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
  };

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const content = (
    <div className={`space-y-6 text-center ${sizeClasses[size]} ${className}`}>
      {/* Icon/Illustration */}
      <div className="flex justify-center">
        <div className="rounded-full bg-muted/30 p-3">
          <IconComponent
            className={`${iconSizes[size]} text-muted-foreground`}
          />
        </div>
      </div>

      {/* Title & Description */}
      <div className="mx-auto max-w-sm space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {action && (
          <Button
            className="flex items-center gap-2"
            onClick={action.onClick}
            variant={action.variant || "default"}
          >
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </Button>
        )}

        {secondaryAction && (
          <div>
            <Button
              className="flex items-center gap-2"
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || "outline"}
            >
              {secondaryAction.icon && (
                <secondaryAction.icon className="h-4 w-4" />
              )}
              {secondaryAction.label}
            </Button>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="text-muted-foreground text-xs">
            Or try these suggestions:
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                className="flex items-center gap-1 text-xs"
                key={index}
                onClick={suggestion.onClick}
                size="sm"
                variant="ghost"
              >
                {suggestion.icon && <suggestion.icon className="h-3 w-3" />}
                {suggestion.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (showCard) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6">{content}</CardContent>
      </Card>
    );
  }

  return content;
}

// Specialized empty state components for common scenarios

export function NoClientsEmptyState({
  onCreateClient,
  onImportClients,
  onViewSample,
}: {
  onCreateClient: () => void;
  onImportClients: () => void;
  onViewSample: () => void;
}) {
  return (
    <EmptyState
      action={{
        label: "Add First Client",
        onClick: onCreateClient,
        icon: Plus,
      }}
      description="Start building your client base by adding your first client or importing from existing records."
      icon={Users}
      secondaryAction={{
        label: "Import Clients",
        onClick: onImportClients,
        variant: "outline",
        icon: Upload,
      }}
      suggestions={[
        { label: "View Sample Client", onClick: onViewSample, icon: BookOpen },
      ]}
      title="No clients yet"
    />
  );
}

export function NoInvoicesEmptyState({
  onCreateInvoice,
  onCreateFromTemplate,
  onViewTemplates,
}: {
  onCreateInvoice: () => void;
  onCreateFromTemplate: () => void;
  onViewTemplates: () => void;
}) {
  return (
    <EmptyState
      action={{
        label: "Create Invoice",
        onClick: onCreateInvoice,
        icon: Plus,
      }}
      description="Create your first invoice to start billing clients and tracking payments."
      icon={FileText}
      suggestions={[
        {
          label: "Use Template",
          onClick: onCreateFromTemplate,
          icon: FileText,
        },
        { label: "Browse Templates", onClick: onViewTemplates, icon: BookOpen },
      ]}
      title="No invoices found"
    />
  );
}

export function NoSearchResultsEmptyState({
  query,
  onClearFilters,
  onCreateNew,
  onBrowseAll,
  createLabel = "Create New",
  browseLabel = "Browse All",
}: {
  query: string;
  onClearFilters: () => void;
  onCreateNew?: () => void;
  onBrowseAll: () => void;
  createLabel?: string;
  browseLabel?: string;
}) {
  return (
    <EmptyState
      action={{
        label: "Clear Filters",
        onClick: onClearFilters,
        variant: "outline",
        icon: RefreshCw,
      }}
      description={`We couldn't find anything matching "${query}". Try adjusting your search or filters.`}
      icon={Search}
      size="sm"
      suggestions={[
        ...(onCreateNew
          ? [{ label: createLabel, onClick: onCreateNew, icon: Plus }]
          : []),
        { label: browseLabel, onClick: onBrowseAll, icon: ArrowRight },
      ]}
      title="No results found"
    />
  );
}

export function NoDataEmptyState({
  title = "No data available",
  description = "There is no data to display at the moment.",
  onRefresh,
  onImport,
  refreshLabel = "Refresh",
  importLabel = "Import Data",
}: {
  title?: string;
  description?: string;
  onRefresh?: () => void;
  onImport?: () => void;
  refreshLabel?: string;
  importLabel?: string;
}) {
  return (
    <EmptyState
      action={
        onRefresh
          ? {
              label: refreshLabel,
              onClick: onRefresh,
              variant: "outline",
              icon: RefreshCw,
            }
          : undefined
      }
      description={description}
      icon={Inbox}
      secondaryAction={
        onImport
          ? {
              label: importLabel,
              onClick: onImport,
              variant: "ghost",
              icon: Upload,
            }
          : undefined
      }
      showCard={false}
      size="sm"
      title={title}
    />
  );
}

export function NoTransactionsEmptyState({
  onAddTransaction,
  onConnectBank,
  onViewGuide,
}: {
  onAddTransaction: () => void;
  onConnectBank: () => void;
  onViewGuide: () => void;
}) {
  return (
    <EmptyState
      action={{
        label: "Add Transaction",
        onClick: onAddTransaction,
        icon: Plus,
      }}
      description="Start tracking your business finances by adding transactions or connecting your bank account."
      icon={CreditCard}
      secondaryAction={{
        label: "Connect Bank Account",
        onClick: onConnectBank,
        variant: "outline",
        icon: Building2,
      }}
      suggestions={[
        { label: "Setup Guide", onClick: onViewGuide, icon: BookOpen },
      ]}
      title="No transactions recorded"
    />
  );
}

export function EmptyDashboardState({
  onQuickStart,
  onViewTutorials,
  onSetupDemo,
}: {
  onQuickStart: () => void;
  onViewTutorials: () => void;
  onSetupDemo: () => void;
}) {
  return (
    <Card className="border-dashed bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="p-8">
        <div className="space-y-6 text-center">
          {/* Welcome Header */}
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-2xl">Welcome to GK-Nexus</h2>
              <p className="text-muted-foreground">
                Your comprehensive business management solution for Guyanese
                businesses
              </p>
            </div>
          </div>

          {/* Quick Start */}
          <div className="space-y-4">
            <Button
              className="flex items-center gap-2 px-6 py-3 text-base"
              onClick={onQuickStart}
            >
              <Target className="h-5 w-5" />
              Quick Start Guide
            </Button>

            <div className="flex justify-center gap-3">
              <Button
                className="flex items-center gap-2"
                onClick={onViewTutorials}
                variant="outline"
              >
                <BookOpen className="h-4 w-4" />
                View Tutorials
              </Button>
              <Button
                className="flex items-center gap-2"
                onClick={onSetupDemo}
                variant="outline"
              >
                <Lightbulb className="h-4 w-4" />
                Setup Demo Data
              </Button>
            </div>
          </div>

          {/* Features Overview */}
          <div className="grid grid-cols-2 gap-4 border-t pt-6 md:grid-cols-4">
            {[
              { icon: Users, label: "Client Management" },
              { icon: FileText, label: "Invoicing" },
              { icon: Calculator, label: "Tax Calculations" },
              { icon: Building2, label: "Business Reports" },
            ].map((feature, index) => (
              <div className="space-y-2 text-center" key={index}>
                <div className="flex justify-center">
                  <div className="rounded-md bg-background p-2 shadow-sm">
                    <feature.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading empty state for when data is being fetched
export function LoadingEmptyState({
  title = "Loading...",
  description = "Please wait while we fetch your data.",
  size = "md",
}: {
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
  };

  return (
    <div className={`space-y-4 text-center ${sizeClasses[size]}`}>
      <div className="flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

// Error empty state
export function ErrorEmptyState({
  title = "Something went wrong",
  description = "We encountered an error while loading your data.",
  onRetry,
  onContactSupport,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
}) {
  return (
    <EmptyState
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
              icon: RefreshCw,
            }
          : undefined
      }
      className="text-center"
      description={description}
      icon={RefreshCw}
      secondaryAction={
        onContactSupport
          ? {
              label: "Contact Support",
              onClick: onContactSupport,
              variant: "outline",
              icon: ExternalLink,
            }
          : undefined
      }
      size="md"
      title={title}
    />
  );
}

// Upcoming features empty state
export function ComingSoonEmptyState({
  title = "Coming Soon",
  description = "This feature is currently under development and will be available soon.",
  onNotifyMe,
  onViewRoadmap,
  estimatedDate,
}: {
  title?: string;
  description?: string;
  onNotifyMe?: () => void;
  onViewRoadmap?: () => void;
  estimatedDate?: string;
}) {
  return (
    <EmptyState
      action={
        onNotifyMe
          ? {
              label: "Notify Me",
              onClick: onNotifyMe,
              variant: "outline",
            }
          : undefined
      }
      description={description}
      icon={Clock}
      size="md"
      suggestions={[
        ...(onViewRoadmap
          ? [{ label: "View Roadmap", onClick: onViewRoadmap, icon: Calendar }]
          : []),
        ...(estimatedDate
          ? [
              {
                label: `Expected: ${estimatedDate}`,
                onClick: () => {},
                icon: Clock,
              },
            ]
          : []),
      ]}
      title={title}
    />
  );
}
