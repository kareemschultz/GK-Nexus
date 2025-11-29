"use client";

import { useQuery } from "@tanstack/react-query";
import { Calculator, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClientManagementActions,
  ClientTaxStatusCards,
  RecentCalculationsHistory,
  TAX_COMPONENT_CLASSES,
  TaxCalculatorActions,
  type TaxDashboardConfig,
  TaxDashboardSkeleton,
  TaxDeadlineWidgets,
  TaxQuickActions,
} from "./index";

interface TaxDashboardProps extends TaxDashboardConfig {
  onNavigate?: (path: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}

interface DashboardData {
  deadlines: any[];
  clientStatuses: any[];
  recentCalculations: any[];
  stats: {
    totalClients: number;
    overdueDeadlines: number;
    calculationsThisMonth: number;
    complianceScore: number;
  };
  lastUpdated: string;
}

export function TaxDashboard({
  showQuickActions = true,
  showDeadlineWidgets = true,
  showClientStatus = true,
  showRecentCalculations = true,
  enableRealTimeUpdates = false,
  onNavigate,
  onRefresh,
  isLoading = false,
  className,
}: TaxDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  // Simulated API calls - in real app, these would be actual API endpoints
  const dashboardQuery = useQuery({
    queryKey: ["tax-dashboard", refreshKey],
    queryFn: async (): Promise<DashboardData> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        deadlines: [],
        clientStatuses: [],
        recentCalculations: [],
        stats: {
          totalClients: 156,
          overdueDeadlines: 3,
          calculationsThisMonth: 47,
          complianceScore: 94,
        },
        lastUpdated: new Date().toISOString(),
      };
    },
    refetchInterval: enableRealTimeUpdates ? 30_000 : false, // Refresh every 30 seconds if enabled
  });

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    dashboardQuery.refetch();
    onRefresh?.();
    toast.success("Dashboard refreshed", {
      description: "Tax dashboard data has been updated",
    });
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      // Fallback for demo
      toast.info("Navigation", {
        description: `Would navigate to ${path}`,
      });
    }
  };

  // Handle component actions
  const handleViewDeadline = (deadline: any) => {
    handleNavigation(`/tax/deadlines/${deadline.id}`);
  };

  const handleViewClient = (clientId: string) => {
    handleNavigation(`/clients/${clientId}`);
  };

  const handleViewCalculation = (calculationId: string) => {
    handleNavigation(`/tax/calculations/${calculationId}`);
  };

  const handleDownloadReport = (calculationId: string) => {
    toast.success("Report downloaded", {
      description: "Tax calculation report has been downloaded",
    });
  };

  // Auto-refresh setup
  useEffect(() => {
    if (enableRealTimeUpdates) {
      const interval = setInterval(() => {
        dashboardQuery.refetch();
      }, 30_000);

      return () => clearInterval(interval);
    }
  }, [enableRealTimeUpdates, dashboardQuery]);

  // Skip links for accessibility
  const SkipLinks = () => (
    <div className="sr-only focus-within:not-sr-only">
      <a
        className="absolute top-4 left-4 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:outline-none focus:ring-2"
        href="#main-content"
      >
        Skip to main content
      </a>
      <a
        className="absolute top-4 left-32 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:outline-none focus:ring-2"
        href="#quick-actions"
      >
        Skip to quick actions
      </a>
    </div>
  );

  if (isLoading || dashboardQuery.isLoading) {
    return <TaxDashboardSkeleton />;
  }

  return (
    <>
      <SkipLinks />
      <div
        className={`mx-auto max-w-7xl ${TAX_COMPONENT_CLASSES.sectionSpacing} ${className || ""}`}
      >
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={`flex items-center gap-2 font-bold ${TAX_COMPONENT_CLASSES.headingScale}`}
            >
              <Calculator className="h-6 w-6 md:h-8 md:w-8" />
              Tax Management Dashboard
            </h1>
            <p
              className={`mt-2 text-muted-foreground ${TAX_COMPONENT_CLASSES.bodyScale}`}
            >
              Comprehensive tax calculation and compliance management
            </p>
            {dashboardQuery.data?.lastUpdated && (
              <p className="mt-1 text-muted-foreground text-xs">
                Last updated:{" "}
                {new Date(dashboardQuery.data.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              aria-label="Refresh dashboard data"
              className={TAX_COMPONENT_CLASSES.touchTarget}
              disabled={dashboardQuery.isFetching}
              onClick={handleRefresh}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 ${dashboardQuery.isFetching ? "animate-spin" : ""}`}
              />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </header>

        {/* Quick Stats */}
        {dashboardQuery.data && (
          <div className={TAX_COMPONENT_CLASSES.responsiveGrid}>
            <Card>
              <CardContent className={TAX_COMPONENT_CLASSES.cardPadding}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Total Clients
                    </p>
                    <p className="font-bold text-2xl">
                      {dashboardQuery.data.stats.totalClients}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Calculator className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={TAX_COMPONENT_CLASSES.cardPadding}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Overdue Items
                    </p>
                    <p className="font-bold text-2xl text-red-600">
                      {dashboardQuery.data.stats.overdueDeadlines}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <RefreshCw className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={TAX_COMPONENT_CLASSES.cardPadding}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">This Month</p>
                    <p className="font-bold text-2xl text-green-600">
                      {dashboardQuery.data.stats.calculationsThisMonth}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Calculator className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        {showQuickActions && (
          <section aria-labelledby="quick-actions-heading" id="quick-actions">
            <h2 className="sr-only" id="quick-actions-heading">
              Quick Actions
            </h2>
            <TaxQuickActions
              compact={false}
              layout="grid"
              onAction={handleNavigation}
              showDefaults={true}
            />
          </section>
        )}

        {/* Tabbed Content */}
        <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="calculations">Calculations</TabsTrigger>
          </TabsList>

          <TabsContent
            className={TAX_COMPONENT_CLASSES.sectionSpacing}
            value="overview"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Tax Calculator Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tax Calculators</CardTitle>
                    <CardDescription>
                      Quick access to PAYE, VAT, and other tax calculations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TaxCalculatorActions onAction={handleNavigation} />
                  </CardContent>
                </Card>

                {/* Client Management Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Client Management</CardTitle>
                    <CardDescription>
                      Manage client information and documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ClientManagementActions onAction={handleNavigation} />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {showDeadlineWidgets && (
                  <TaxDeadlineWidgets
                    deadlines={dashboardQuery.data?.deadlines}
                    isLoading={dashboardQuery.isLoading}
                    onViewDeadline={handleViewDeadline}
                  />
                )}

                {showClientStatus && (
                  <ClientTaxStatusCards
                    clients={dashboardQuery.data?.clientStatuses}
                    isLoading={dashboardQuery.isLoading}
                    onViewClient={handleViewClient}
                    showSummary={false}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            className={TAX_COMPONENT_CLASSES.sectionSpacing}
            value="deadlines"
          >
            {showDeadlineWidgets && (
              <TaxDeadlineWidgets
                deadlines={dashboardQuery.data?.deadlines}
                isLoading={dashboardQuery.isLoading}
                onViewDeadline={handleViewDeadline}
              />
            )}
          </TabsContent>

          <TabsContent
            className={TAX_COMPONENT_CLASSES.sectionSpacing}
            value="clients"
          >
            {showClientStatus && (
              <ClientTaxStatusCards
                clients={dashboardQuery.data?.clientStatuses}
                isLoading={dashboardQuery.isLoading}
                onViewClient={handleViewClient}
                showSummary={true}
              />
            )}
          </TabsContent>

          <TabsContent
            className={TAX_COMPONENT_CLASSES.sectionSpacing}
            value="calculations"
          >
            {showRecentCalculations && (
              <RecentCalculationsHistory
                calculations={dashboardQuery.data?.recentCalculations}
                isLoading={dashboardQuery.isLoading}
                onDownloadReport={handleDownloadReport}
                onViewCalculation={handleViewCalculation}
                showFilters={true}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Footer with accessibility information */}
        <footer className="mt-8 border-t pt-6">
          <div className="flex flex-col gap-2 text-center text-muted-foreground text-xs md:flex-row md:justify-between">
            <p>
              GK-Nexus Tax Suite - Compliant with Guyana Revenue Authority
              regulations
            </p>
            <div className="flex items-center justify-center gap-4">
              <span>Keyboard shortcuts: Tab to navigate, Enter to select</span>
              {enableRealTimeUpdates && (
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Live updates enabled
                </span>
              )}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// Pre-configured dashboard variants
export function CompactTaxDashboard(
  props: Omit<TaxDashboardProps, keyof TaxDashboardConfig>
) {
  return (
    <TaxDashboard
      {...props}
      enableRealTimeUpdates={false}
      showClientStatus={false}
      showDeadlineWidgets={true}
      showQuickActions={true}
      showRecentCalculations={false}
    />
  );
}

export function FullTaxDashboard(
  props: Omit<TaxDashboardProps, keyof TaxDashboardConfig>
) {
  return (
    <TaxDashboard
      {...props}
      enableRealTimeUpdates={true}
      showClientStatus={true}
      showDeadlineWidgets={true}
      showQuickActions={true}
      showRecentCalculations={true}
    />
  );
}

export function MobileTaxDashboard(
  props: Omit<TaxDashboardProps, keyof TaxDashboardConfig>
) {
  return (
    <TaxDashboard
      {...props}
      className="px-4"
      enableRealTimeUpdates={false}
      showClientStatus={true}
      showDeadlineWidgets={true}
      showQuickActions={true}
      showRecentCalculations={true}
    />
  );
}
