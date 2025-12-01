import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Database,
  FileText,
  FolderOpen,
  Globe,
  Home,
  LogOut,
  Receipt,
  Settings,
  Shield,
  Timer,
  UserCheck,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarItem {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  external?: boolean;
  children?: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: "Core Services",
    items: [
      {
        title: "Dashboard",
        to: "/dashboard",
        icon: Home,
      },
      {
        title: "Client Management",
        to: "/clients",
        icon: Users,
        children: [
          { title: "All Clients", to: "/clients", icon: Users },
          { title: "Onboard New Client", to: "/clients/new", icon: UserCheck },
          { title: "Active Cases", to: "/clients/active", icon: FolderOpen },
        ],
      },
      {
        title: "Tax Services",
        to: "/tax",
        icon: Calculator,
        children: [
          { title: "PAYE Calculator", to: "/tax/paye", icon: Calculator },
          { title: "VAT Calculator", to: "/tax/vat", icon: Calculator },
          { title: "NIS Calculator", to: "/tax/nis", icon: Calculator },
          { title: "Tax Filing", to: "/tax/filing", icon: FileText },
        ],
      },
      {
        title: "Payroll Services",
        to: "/payroll",
        icon: Receipt,
        children: [
          { title: "Payroll Dashboard", to: "/payroll", icon: BarChart3 },
          { title: "Employee Records", to: "/payroll/employees", icon: Users },
          { title: "Run Payroll", to: "/payroll/run", icon: Clock },
          { title: "Payroll Reports", to: "/payroll/reports", icon: FileText },
        ],
      },
    ],
  },
  {
    title: "Document & Compliance",
    items: [
      {
        title: "Document Center",
        to: "/documents",
        icon: FileText,
        children: [
          { title: "All Documents", to: "/documents", icon: FileText },
          {
            title: "Upload Documents",
            to: "/documents/upload",
            icon: FolderOpen,
          },
          { title: "Templates", to: "/documents/templates", icon: Database },
        ],
      },
      {
        title: "Compliance Hub",
        to: "/compliance",
        icon: Shield,
        badge: "3",
        children: [
          { title: "Compliance Dashboard", to: "/compliance", icon: Shield },
          { title: "GRA Filing", to: "/compliance/gra-filing", icon: Globe },
          {
            title: "Audit Reports",
            to: "/compliance/reports",
            icon: BarChart3,
          },
          {
            title: "Alerts",
            to: "/compliance/alerts",
            icon: AlertTriangle,
            badge: "3",
          },
        ],
      },
      {
        title: "Invoice Management",
        to: "/invoices",
        icon: Receipt,
        children: [
          { title: "All Invoices", to: "/invoices", icon: Receipt },
          { title: "Create Invoice", to: "/invoices/new", icon: FileText },
          {
            title: "Payment Tracking",
            to: "/invoices/payments",
            icon: BarChart3,
          },
        ],
      },
    ],
  },
  {
    title: "Productivity",
    items: [
      {
        title: "Time Tracking",
        to: "/time-tracking",
        icon: Timer,
        children: [
          { title: "Dashboard", to: "/time-tracking", icon: BarChart3 },
          { title: "Active Timer", to: "/time-tracking/timer", icon: Timer },
          { title: "Time Entries", to: "/time-tracking/entries", icon: Clock },
          { title: "Reports", to: "/time-tracking/reports", icon: FileText },
          {
            title: "Projects",
            to: "/time-tracking/projects",
            icon: FolderOpen,
          },
        ],
      },
      {
        title: "Automation",
        to: "/automation",
        icon: Zap,
        children: [
          { title: "Dashboard", to: "/automation", icon: BarChart3 },
          {
            title: "Rules & Workflows",
            to: "/automation/rules",
            icon: Workflow,
          },
          { title: "Templates", to: "/automation/templates", icon: Database },
          {
            title: "Execution History",
            to: "/automation/history",
            icon: Clock,
          },
        ],
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Internal Appointments",
        to: "/appointments",
        icon: Calendar,
        children: [
          {
            title: "Calendar View",
            to: "/appointments/calendar",
            icon: Calendar,
          },
          { title: "Booking Management", to: "/appointments", icon: Clock },
          {
            title: "Client Requests",
            to: "/appointments/requests",
            icon: Bell,
          },
        ],
      },
      {
        title: "User Management",
        to: "/users",
        icon: Users,
        children: [
          { title: "All Users", to: "/users", icon: Users },
          { title: "Invite Users", to: "/users/invite", icon: UserCheck },
          { title: "Roles & Permissions", to: "/users/roles", icon: Shield },
        ],
      },
      {
        title: "System Settings",
        to: "/settings",
        icon: Settings,
        children: [
          { title: "General Settings", to: "/settings", icon: Settings },
          { title: "Security", to: "/settings/security", icon: Shield },
          { title: "Notifications", to: "/settings/notifications", icon: Bell },
        ],
      },
    ],
  },
];

const externalPortalItems: SidebarItem[] = [
  {
    title: "Client Portal",
    to: "/portal",
    icon: Globe,
    external: true,
    children: [
      {
        title: "My Profile",
        to: "/portal/profile",
        icon: Users,
        external: true,
      },
      {
        title: "My Documents",
        to: "/portal/documents",
        icon: FileText,
        external: true,
      },
      {
        title: "Book Appointment",
        to: "/portal/appointments",
        icon: Calendar,
        external: true,
      },
      {
        title: "Filing Status",
        to: "/portal/filings",
        icon: Shield,
        external: true,
      },
      {
        title: "Payment History",
        to: "/portal/payments",
        icon: Receipt,
        external: true,
      },
    ],
  },
];

interface EnterpriseSidebarProps {
  className?: string;
}

export function EnterpriseSidebar({ className }: EnterpriseSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authClient.signOut();
      toast.success("Logged out successfully");
      navigate({ to: "/login" });
    } catch {
      toast.error("Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserInitials = (name: string | undefined) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemTitle)
        ? prev.filter((item) => item !== itemTitle)
        : [...prev, itemTitle]
    );
  };

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = isActive(item.to);

    return (
      <div className={cn("relative", level > 0 && "ml-4")} key={item.title}>
        <div className="flex items-center">
          <Link
            className={cn(
              "flex flex-1 items-center gap-3 rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
              active && "bg-accent text-accent-foreground",
              isCollapsed && "justify-center px-2",
              level > 0 && "ml-1 text-xs"
            )}
            to={item.to}
          >
            <item.icon
              className={cn("h-4 w-4 flex-shrink-0", level > 0 && "h-3 w-3")}
            />
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <Badge
                    className="ml-auto h-5 w-5 p-0 text-xs"
                    variant="destructive"
                  >
                    {item.badge}
                  </Badge>
                )}
                {item.external && (
                  <Badge className="ml-auto text-xs" variant="outline">
                    External
                  </Badge>
                )}
              </>
            )}
          </Link>
          {hasChildren && !isCollapsed && (
            <Button
              className="h-8 w-8 p-0"
              onClick={() => toggleExpanded(item.title)}
              size="sm"
              variant="ghost"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-semibold text-sm">GK-Nexus</h2>
              <p className="text-muted-foreground text-xs">Enterprise Suite</p>
            </div>
          </div>
        )}
        <Button
          className="h-8 w-8 p-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
          size="sm"
          variant="ghost"
        >
          {isCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-6">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h3 className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => renderSidebarItem(item))}
              </div>
            </div>
          ))}

          {/* External Portal Section */}
          <div className="border-t pt-4">
            {!isCollapsed && (
              <h3 className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Client Access
              </h3>
            )}
            <div className="space-y-1">
              {externalPortalItems.map((item) => renderSidebarItem(item))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        {isCollapsed ? (
          <Button
            aria-label="Log out"
            className="mx-auto h-8 w-8 p-0"
            disabled={isLoggingOut}
            onClick={handleLogout}
            size="sm"
            variant="ghost"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center justify-between">
            {isSessionLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <span className="font-medium text-primary-foreground text-xs">
                    {getUserInitials(session?.user?.name)}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium">
                    {session?.user?.name ?? "Unknown User"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {session?.user?.email ?? "No email"}
                  </p>
                </div>
              </div>
            )}
            <Button
              aria-label="Log out"
              className="h-8 w-8 p-0"
              disabled={isLoggingOut}
              onClick={handleLogout}
              size="sm"
              variant="ghost"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
