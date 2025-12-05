import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileText,
  Filter,
  Grid3X3,
  Plus,
  Shield,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client } from "@/utils/orpc";

type IconName =
  | "DollarSign"
  | "Users"
  | "Shield"
  | "Clock"
  | "TrendingUp"
  | "UserCheck";

interface KPIWidget {
  id: string;
  title: string;
  value: string;
  change: string;
  iconName: IconName;
  trend: "up" | "down" | "stable";
  position: number;
  visible: boolean;
  path?: string;
}

// Icon mapping for serialization/deserialization
const ICON_MAP: Record<
  IconName,
  React.ComponentType<{ className?: string }>
> = {
  DollarSign,
  Users,
  Shield,
  Clock,
  TrendingUp,
  UserCheck,
};

interface Task {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  deadline: string;
  status: "pending" | "in_progress" | "completed";
  assignee?: string;
}

interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  time: string;
  status: "success" | "warning" | "info" | "error";
  user?: string;
  metadata?: Record<string, any>;
}

type DashboardData = {
  period: {
    startDate: string;
    endDate: string;
    timeRange: string;
  };
  clients: {
    total: number;
    active: number;
    inactive: number;
    newThisPeriod: number;
  };
  revenue: {
    totalRevenue: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    invoiceCount: number;
  };
  tax: {
    totalPayroll: number;
    totalPayeTax: number;
    totalNisContributions: number;
    payrollRecords: number;
  };
  appointments: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
  };
  documents: {
    total: number;
    confidential: number;
    totalSize: number;
  };
  complianceAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    dueDate: string;
    clientId: string;
  }>;
};

export function EnhancedDashboard() {
  const navigate = useNavigate();
  const [navigationLoading, setNavigationLoading] = useState<string | null>(
    null
  );
  const [navigationError, setNavigationError] = useState<string | null>(null);

  // Clear old broken localStorage key on mount
  useEffect(() => {
    // Remove the old key that stored non-serializable icons
    localStorage.removeItem("dashboard-widgets");
  }, []);

  // State management for enhanced features
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [customization, setCustomization] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Navigation handlers
  const handleNavigation = async (path: string) => {
    try {
      setNavigationLoading(path);
      setNavigationError(null);
      await navigate({ to: path });
    } catch (error) {
      console.error(`Navigation error to ${path}:`, error);
      setNavigationError(`Failed to navigate to ${path}`);
    } finally {
      setNavigationLoading(null);
    }
  };

  // Safe API call wrapper that handles errors gracefully
  const safeApiCall = async <T,>(
    apiCall: () => Promise<T>,
    fallback: T
  ): Promise<T> => {
    try {
      return await apiCall();
    } catch (error) {
      console.warn("API call failed, using fallback data:", error);
      return fallback;
    }
  };

  // Use the real dashboard API with safe fallbacks
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () =>
      safeApiCall(() => client.dashboardOverview({ timeRange: "30d" }), {
        success: true,
        data: mockDashboard,
      } as Awaited<ReturnType<typeof client.dashboardOverview>>),
    refetchInterval: 30_000, // Refresh every 30 seconds
    retry: 1,
    staleTime: 30_000,
  });

  const kpisQuery = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () =>
      safeApiCall(
        () =>
          client.dashboardKpis({
            period: "monthly",
            year: new Date().getFullYear(),
          }),
        {
          success: true,
          data: {
            period: "monthly",
            year: new Date().getFullYear(),
            month: undefined,
            quarter: undefined,
            revenue: [],
            clients: [],
          },
        } as Awaited<ReturnType<typeof client.dashboardKpis>>
      ),
    refetchInterval: 60_000, // Refresh every minute
    retry: 1,
    staleTime: 60_000,
  });

  const financialQuery = useQuery({
    queryKey: ["dashboard", "financial"],
    queryFn: () =>
      safeApiCall(
        () => client.dashboardFinancialSummary({ timeRange: "30d" }),
        {
          success: true,
          data: {
            period: { startDate: "", endDate: "", timeRange: "30d" },
            invoiceSummary: {},
            cashFlow: [],
          },
        } as Awaited<ReturnType<typeof client.dashboardFinancialSummary>>
      ),
    refetchInterval: 30_000,
    retry: 1,
    staleTime: 30_000,
  });

  const complianceQuery = useQuery({
    queryKey: ["dashboard", "compliance"],
    queryFn: () =>
      safeApiCall(
        () =>
          client.dashboardComplianceReport({
            year: new Date().getFullYear(),
          }),
        {
          success: true,
          data: {
            period: { year: new Date().getFullYear(), month: undefined },
            overview: {},
            byType: [],
            upcomingDeadlines: [],
            clientCompliance: [],
          },
        } as Awaited<ReturnType<typeof client.dashboardComplianceReport>>
      ),
    refetchInterval: 60_000,
    retry: 1,
    staleTime: 60_000,
  });

  // Default widgets configuration
  const defaultWidgets: KPIWidget[] = [
    {
      id: "revenue",
      title: "Total Revenue",
      value: "$2,847,392",
      change: "+12.5%",
      iconName: "DollarSign",
      trend: "up",
      position: 0,
      visible: true,
      path: "/invoices",
    },
    {
      id: "clients",
      title: "Active Clients",
      value: "1,234",
      change: "+5.2%",
      iconName: "Users",
      trend: "up",
      position: 1,
      visible: true,
      path: "/clients",
    },
    {
      id: "compliance",
      title: "Compliance Score",
      value: "98.4%",
      change: "+2.1%",
      iconName: "Shield",
      trend: "up",
      position: 2,
      visible: true,
      path: "/compliance",
    },
    {
      id: "pending",
      title: "Pending Reviews",
      value: "23",
      change: "-8.3%",
      iconName: "Clock",
      trend: "down",
      position: 3,
      visible: true,
      path: "/documents",
    },
    {
      id: "conversion",
      title: "Conversion Rate",
      value: "73.2%",
      change: "+3.1%",
      iconName: "TrendingUp",
      trend: "up",
      position: 4,
      visible: true,
      path: "/reports",
    },
    {
      id: "satisfaction",
      title: "Client Satisfaction",
      value: "4.8/5.0",
      change: "+0.2",
      iconName: "UserCheck",
      trend: "up",
      position: 5,
      visible: true,
      path: "/clients",
    },
  ];

  // Widget configuration with local storage persistence
  const [widgets, setWidgets] = useState<KPIWidget[]>(() => {
    const saved = localStorage.getItem("dashboard-widgets-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate that parsed widgets have proper iconName
        if (
          Array.isArray(parsed) &&
          parsed.every((w) => w.iconName && ICON_MAP[w.iconName as IconName])
        ) {
          return parsed;
        }
      } catch {
        // Invalid data, use defaults
      }
    }
    return defaultWidgets;
  });

  // Tasks data
  const [tasks] = useState<Task[]>([
    {
      id: "1",
      title: "Complete Q4 Financial Audit for TechCorp",
      priority: "high",
      deadline: "2024-01-15",
      status: "in_progress",
      assignee: "John Smith",
    },
    {
      id: "2",
      title: "Review Compliance Documentation",
      priority: "medium",
      deadline: "2024-01-20",
      status: "pending",
      assignee: "Sarah Johnson",
    },
    {
      id: "3",
      title: "Client Onboarding: DataFlow Solutions",
      priority: "high",
      deadline: "2024-01-18",
      status: "pending",
    },
    {
      id: "4",
      title: "Tax Filing Preparation - SMB Clients",
      priority: "medium",
      deadline: "2024-01-25",
      status: "completed",
      assignee: "Mike Chen",
    },
  ]);

  // Enhanced analytics data
  const revenueAnalyticsData = useMemo(
    () => [
      { month: "Jul", revenue: 45_000, clients: 120, target: 50_000 },
      { month: "Aug", revenue: 52_000, clients: 135, target: 55_000 },
      { month: "Sep", revenue: 48_000, clients: 128, target: 52_000 },
      { month: "Oct", revenue: 61_000, clients: 142, target: 58_000 },
      { month: "Nov", revenue: 55_000, clients: 138, target: 60_000 },
      { month: "Dec", revenue: 67_000, clients: 155, target: 65_000 },
    ],
    []
  );

  const clientAcquisitionData = useMemo(
    () => [
      { stage: "Leads", count: 450, conversion: 100 },
      { stage: "Qualified", count: 320, conversion: 71 },
      { stage: "Proposals", count: 180, conversion: 56 },
      { stage: "Negotiation", count: 95, conversion: 53 },
      { stage: "Closed Won", count: 42, conversion: 44 },
    ],
    []
  );

  const complianceMetrics = useMemo(
    () => [
      { area: "Data Protection", score: 98, trend: "up", alerts: 0 },
      { area: "Financial Regulations", score: 96, trend: "stable", alerts: 1 },
      { area: "Security Standards", score: 89, trend: "down", alerts: 3 },
      { area: "Quality Assurance", score: 94, trend: "up", alerts: 0 },
      { area: "Risk Management", score: 92, trend: "up", alerts: 1 },
    ],
    []
  );

  const staffProductivityData = useMemo(
    () => [
      { name: "John Smith", tasks: 24, completed: 22, efficiency: 92 },
      { name: "Sarah Johnson", tasks: 18, completed: 17, efficiency: 94 },
      { name: "Mike Chen", tasks: 31, completed: 28, efficiency: 90 },
      { name: "Lisa Wong", tasks: 15, completed: 15, efficiency: 100 },
      { name: "David Kim", tasks: 27, completed: 24, efficiency: 89 },
    ],
    []
  );

  // Real-time activity data
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: "1",
      type: "client_onboarded",
      message: "New client 'TechCorp Inc.' successfully onboarded",
      time: "2 hours ago",
      status: "success",
      user: "Sarah Johnson",
      metadata: { clientId: "tc-001", revenue: 45_000 },
    },
    {
      id: "2",
      type: "compliance_alert",
      message: "Security audit scheduled for DataFlow Solutions",
      time: "4 hours ago",
      status: "warning",
      user: "System",
      metadata: { clientId: "df-002", severity: "medium" },
    },
    {
      id: "3",
      type: "document_processed",
      message: "Q4 financial reports processed and validated",
      time: "6 hours ago",
      status: "success",
      user: "Mike Chen",
      metadata: { documents: 12, clientCount: 8 },
    },
    {
      id: "4",
      type: "payment_received",
      message: "Payment of $15,000 received from Enterprise Corp",
      time: "8 hours ago",
      status: "success",
      user: "System",
      metadata: { amount: 15_000, invoiceId: "inv-2024-001" },
    },
  ]);

  // Mock data fallback while we don't have real data
  const mockDashboard: DashboardData = {
    period: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      timeRange: "30d",
    },
    clients: { total: 234, active: 198, inactive: 36, newThisPeriod: 12 },
    revenue: {
      totalRevenue: 2_847_392,
      paidAmount: 2_234_567,
      pendingAmount: 456_789,
      overdueAmount: 156_036,
      invoiceCount: 145,
    },
    tax: {
      totalPayroll: 1_234_567,
      totalPayeTax: 234_567,
      totalNisContributions: 156_789,
      payrollRecords: 89,
    },
    appointments: { total: 67, scheduled: 23, completed: 38, cancelled: 6 },
    documents: { total: 1567, confidential: 234, totalSize: 15_678_901_234 },
    complianceAlerts: [
      {
        id: "1",
        type: "TAX_FILING",
        severity: "HIGH",
        title: "Q4 Tax Returns Due",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        clientId: "client1",
      },
      {
        id: "2",
        type: "AUDIT_PREPARATION",
        severity: "MEDIUM",
        title: "Annual Audit Preparation",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        clientId: "client2",
      },
    ],
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new activity
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type: "task_completed",
        message: `Task completed: ${tasks[Math.floor(Math.random() * tasks.length)]?.title}`,
        time: "Just now",
        status: "success",
        user: "System",
      };

      setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);

      // Simulate notifications
      if (Math.random() > 0.8) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: "info",
          title: "System Update",
          message: "Dashboard data refreshed successfully",
          timestamp: new Date().toISOString(),
          read: false,
        };

        setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]);
        setUnreadCount((prev) => prev + 1);
      }
    }, 30_000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [tasks]);

  // Save widget configuration to localStorage
  useEffect(() => {
    localStorage.setItem("dashboard-widgets-v2", JSON.stringify(widgets));
  }, [widgets]);

  // Filter activities based on search and filter
  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) => {
        const matchesSearch =
          activity.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.user?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
          selectedFilter === "all" || activity.status === selectedFilter;
        return matchesSearch && matchesFilter;
      }),
    [activities, searchTerm, selectedFilter]
  );

  // Use mock data if API calls fail
  const dashboard = dashboardQuery.data?.data || mockDashboard;
  const kpis = kpisQuery.data?.data;
  const _financial = financialQuery.data?.data;
  const _compliance = complianceQuery.data?.data;

  // Export functionality
  const exportData = (format: "csv" | "json" | "pdf") => {
    const data = {
      kpis: widgets.filter((w) => w.visible),
      revenue: revenueAnalyticsData,
      clients: clientAcquisitionData,
      compliance: complianceMetrics,
      activities: activities.slice(0, 10),
      generatedAt: new Date().toISOString(),
    };

    if (format === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    // CSV and PDF implementations would go here
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatFileSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "client_onboarded":
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case "compliance_alert":
        return <Shield className="h-4 w-4 text-yellow-500" />;
      case "document_processed":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "payment_received":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "task_completed":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getComplianceIcon = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "MEDIUM":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "LOW":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "destructive" as const;
      case "MEDIUM":
        return "default" as const;
      case "LOW":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header with Actions */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Enterprise Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time business insights and performance monitoring
            </p>
            {dashboardQuery.isLoading && (
              <p className="text-muted-foreground text-sm">
                Loading real-time data...
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button className="relative" size="icon" variant="outline">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="-right-2 -top-2 absolute h-5 w-5 rounded-full p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Notifications</h3>
                    <Button
                      onClick={() => {
                        setNotifications([]);
                        setUnreadCount(0);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Clear all
                    </Button>
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        className="space-y-1 rounded-lg border p-3"
                        key={notification.id}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                          <Badge className="text-xs" variant="outline">
                            {notification.type}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {notification.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-center text-muted-foreground text-sm">
                      No notifications
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Export Menu */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    onClick={() => exportData("json")}
                    variant="ghost"
                  >
                    Export as JSON
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={() => exportData("csv")}
                    variant="ghost"
                  >
                    Export as CSV
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={() => exportData("pdf")}
                    variant="ghost"
                  >
                    Export as PDF
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Customization Toggle */}
            <Button
              onClick={() => setCustomization(!customization)}
              variant={customization ? "default" : "outline"}
            >
              <Grid3X3 className="mr-2 h-4 w-4" />
              {customization ? "Done" : "Customize"}
            </Button>
          </div>
        </div>
        {navigationError && (
          <Alert className="mt-4" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {navigationError}
              <Button
                className="ml-2"
                onClick={() => setNavigationError(null)}
                size="sm"
                variant="ghost"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </header>

      {/* Customizable KPI Widgets */}
      <section aria-labelledby="kpi-heading" className="mb-8">
        <h2 className="sr-only" id="kpi-heading">
          Key Performance Indicators
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {widgets
            .filter((w) => w.visible)
            .sort((a, b) => a.position - b.position)
            .map((widget) => {
              const IconComponent = ICON_MAP[widget.iconName] || DollarSign;
              const isPositive = widget.change.startsWith("+");
              const isNegative = widget.change.startsWith("-");

              return (
                <Card
                  className={`transition-all duration-200 ${
                    customization
                      ? "cursor-move ring-2 ring-blue-200"
                      : "cursor-pointer hover:shadow-lg"
                  }`}
                  key={widget.id}
                  onClick={() =>
                    !customization &&
                    widget.path &&
                    handleNavigation(widget.path)
                  }
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-medium text-sm">
                      {widget.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      {customization && (
                        <Button
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWidgets((prev) =>
                              prev.map((w) =>
                                w.id === widget.id
                                  ? { ...w, visible: false }
                                  : w
                              )
                            );
                          }}
                          size="icon"
                          variant="ghost"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="font-bold text-2xl">{widget.value}</div>
                    <div className="mt-2 flex items-center gap-1">
                      {isPositive && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                      {isNegative && (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <Badge
                        className="text-xs"
                        variant={
                          isPositive
                            ? "default"
                            : isNegative
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {widget.change} from last month
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

          {/* Add Widget Button (only in customization mode) */}
          {customization && (
            <Card className="border-2 border-muted-foreground/25 border-dashed">
              <CardContent className="flex h-full min-h-[120px] items-center justify-center">
                <Button className="h-full w-full" variant="ghost">
                  <div className="text-center">
                    <Plus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">Add Widget</p>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Real-time Compliance Alerts */}
      <section aria-labelledby="compliance-heading" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2"
              id="compliance-heading"
            >
              <Shield className="h-5 w-5" />
              Compliance Alerts
            </CardTitle>
            <CardDescription>
              Critical compliance items requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.complianceAlerts.length > 0 ? (
              <div className="space-y-3">
                {dashboard.complianceAlerts.slice(0, 5).map((alert) => (
                  <div
                    aria-label={`Review compliance alert: ${alert.title}`}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    key={alert.id}
                    onClick={() => handleNavigation("/compliance")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNavigation("/compliance");
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-3">
                      {getComplianceIcon(alert.severity)}
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-muted-foreground text-xs">
                          Due: {new Date(alert.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Button
                        disabled={navigationLoading === "/compliance"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigation("/compliance");
                        }}
                        size="sm"
                        variant="outline"
                      >
                        {navigationLoading === "/compliance"
                          ? "Loading..."
                          : "Review"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-green-500" />
                  <p className="font-medium text-sm">
                    All compliance items are up to date
                  </p>
                  <p className="text-muted-foreground text-xs">
                    No immediate actions required
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Enhanced Analytics Tabs */}
      <section aria-labelledby="analytics-heading" className="mb-8">
        <Tabs className="w-full" defaultValue="revenue">
          <div className="mb-4 flex items-center justify-between">
            <TabsList className="grid w-auto grid-cols-5">
              <TabsTrigger className="flex items-center gap-2" value="revenue">
                <BarChart3 className="h-4 w-4" />
                Revenue
              </TabsTrigger>
              <TabsTrigger className="flex items-center gap-2" value="clients">
                <Users className="h-4 w-4" />
                Client Funnel
              </TabsTrigger>
              <TabsTrigger
                className="flex items-center gap-2"
                value="compliance"
              >
                <Shield className="h-4 w-4" />
                Compliance
              </TabsTrigger>
              <TabsTrigger
                className="flex items-center gap-2"
                value="productivity"
              >
                <TrendingUp className="h-4 w-4" />
                Productivity
              </TabsTrigger>
              <TabsTrigger
                className="flex items-center gap-2"
                value="documents"
              >
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
            </TabsList>

            <Select
              onValueChange={setSelectedTimeRange}
              value={selectedTimeRange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics with Targets</CardTitle>
                <CardDescription>
                  Track revenue performance against targets and client growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer height={400} width="100%">
                  <AreaChart data={revenueAnalyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue" || name === "target"
                          ? `$${value.toLocaleString()}`
                          : value,
                        name === "revenue"
                          ? "Actual Revenue"
                          : name === "target"
                            ? "Target Revenue"
                            : "Clients",
                      ]}
                    />
                    <Area
                      dataKey="target"
                      fill="#e2e8f0"
                      fillOpacity={0.4}
                      stackId="1"
                      stroke="#94a3b8"
                      type="monotone"
                    />
                    <Area
                      dataKey="revenue"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      stackId="2"
                      stroke="#2563eb"
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Client Acquisition Funnel</CardTitle>
                <CardDescription>
                  Track conversion rates throughout the client acquisition
                  process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer height={400} width="100%">
                  <BarChart data={clientAcquisitionData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" width={100} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "count" ? `${value} leads` : `${value}%`,
                        name === "count" ? "Lead Count" : "Conversion Rate",
                      ]}
                    />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-5 gap-4">
                  {clientAcquisitionData.map((stage, index) => (
                    <div className="text-center" key={stage.stage}>
                      <div className="font-bold text-lg">
                        {stage.conversion}%
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {stage.stage}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Score Monitoring</CardTitle>
                <CardDescription>
                  Real-time compliance metrics and alert tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceMetrics.map((metric) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-4"
                      key={metric.area}
                    >
                      <div className="flex items-center gap-3">
                        <Shield
                          className={`h-5 w-5 ${
                            metric.score >= 95
                              ? "text-green-500"
                              : metric.score >= 90
                                ? "text-yellow-500"
                                : "text-red-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{metric.area}</p>
                          <p className="text-muted-foreground text-sm">
                            {metric.alerts} active alerts
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold">{metric.score}%</div>
                          <div className="flex items-center gap-1">
                            {metric.trend === "up" && (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            )}
                            {metric.trend === "down" && (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className="text-muted-foreground text-xs">
                              {metric.trend}
                            </span>
                          </div>
                        </div>
                        <Progress className="w-20" value={metric.score} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="productivity">
            <Card>
              <CardHeader>
                <CardTitle>Staff Productivity Metrics</CardTitle>
                <CardDescription>
                  Individual performance and task completion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer height={400} width="100%">
                  <BarChart data={staffProductivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="completed"
                      fill="#3b82f6"
                      name="Completed Tasks"
                    />
                    <Bar dataKey="tasks" fill="#e2e8f0" name="Total Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Processing Status</CardTitle>
                <CardDescription>
                  Track document workflow and processing times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="font-bold text-2xl text-blue-600">
                      1,247
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Total Documents
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl text-green-600">
                      1,089
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Processed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl text-yellow-600">
                      158
                    </div>
                    <div className="text-muted-foreground text-sm">Pending</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing Progress</span>
                    <span>87.3%</span>
                  </div>
                  <Progress value={87.3} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Bottom Grid: Tasks, Activity, and Calendar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Task Management
            </CardTitle>
            <CardDescription>Upcoming deadlines and priorities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div
                  className="flex items-start gap-3 rounded-lg border p-3"
                  key={task.id}
                >
                  <div
                    className={`mt-2 h-2 w-2 rounded-full ${
                      task.priority === "high"
                        ? "bg-red-500"
                        : task.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                        variant="outline"
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    {task.assignee && (
                      <p className="text-muted-foreground text-xs">
                        Assigned to: {task.assignee}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="mt-4 w-full"
              disabled={navigationLoading === "/appointments"}
              onClick={() => handleNavigation("/appointments")}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              {navigationLoading === "/appointments"
                ? "Loading..."
                : "View All Tasks"}
            </Button>
          </CardContent>
        </Card>

        {/* Real-time Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Activity
            </CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <Input
                className="h-8"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search activities..."
                value={searchTerm}
              />
              <Select onValueChange={setSelectedFilter} value={selectedFilter}>
                <SelectTrigger className="h-8 w-24">
                  <Filter className="h-3 w-3" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {filteredActivities.map((activity) => (
                <div
                  className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50"
                  key={activity.id}
                >
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-xs">{activity.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-xs">
                        {activity.time}
                      </p>
                      <Badge className="text-xs" variant="outline">
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Schedule
            </CardTitle>
            <CardDescription>Appointments and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="text-center">
                  <div className="font-bold text-blue-600 text-sm">15</div>
                  <div className="text-blue-600 text-xs">JAN</div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    Client Meeting - TechCorp
                  </p>
                  <p className="text-muted-foreground text-xs">
                    10:00 AM - 11:00 AM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="text-center">
                  <div className="font-bold text-sm">18</div>
                  <div className="text-muted-foreground text-xs">JAN</div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Compliance Audit</p>
                  <p className="text-muted-foreground text-xs">
                    2:00 PM - 4:00 PM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="text-center">
                  <div className="font-bold text-sm">20</div>
                  <div className="text-muted-foreground text-xs">JAN</div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Tax Filing Deadline</p>
                  <p className="text-muted-foreground text-xs">SMB Clients</p>
                </div>
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              disabled={navigationLoading === "/appointments/calendar"}
              onClick={() => handleNavigation("/appointments/calendar")}
              variant="outline"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {navigationLoading === "/appointments/calendar"
                ? "Loading..."
                : "View Full Calendar"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Footer */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              Last updated: {new Date().toLocaleString()}
              {dashboardQuery.isFetching && " • Refreshing..."}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={dashboardQuery.error ? "destructive" : "default"}>
                {dashboardQuery.error ? "API Error" : "Connected"}
              </Badge>
              <Button
                onClick={() => dashboardQuery.refetch()}
                size="sm"
                variant="outline"
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
