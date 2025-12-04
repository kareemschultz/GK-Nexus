import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  Clock,
  Database,
  FileText,
  FolderOpen,
  Globe,
  Handshake,
  Home,
  LogOut,
  Plane,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import {
  BUSINESSES,
  type BusinessUnit,
  useBusinessContext,
} from "@/lib/business-context";
import { cn } from "@/lib/utils";

interface SidebarSection {
  title: string;
  items: SidebarItem[];
  business?: BusinessUnit; // Which business this section belongs to
}

interface SidebarItem {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  external?: boolean;
  children?: SidebarItem[];
  business?: BusinessUnit; // Which business this item belongs to
}

const sidebarSections: SidebarSection[] = [
  {
    title: "Core Services",
    items: [
      {
        title: "Dashboard",
        to: "/dashboard",
        icon: Home,
        business: "all",
      },
      {
        title: "Client Management",
        to: "/clients",
        icon: Users,
        business: "all",
        children: [
          {
            title: "All Clients",
            to: "/clients",
            icon: Users,
            business: "all",
          },
          {
            title: "Onboard New Client",
            to: "/clients/new",
            icon: UserCheck,
            business: "all",
          },
          {
            title: "Active Cases",
            to: "/clients/active",
            icon: FolderOpen,
            business: "all",
          },
        ],
      },
      {
        title: "Tax Services",
        to: "/tax",
        icon: Calculator,
        business: "kaj",
        children: [
          {
            title: "PAYE Calculator",
            to: "/tax/paye",
            icon: Calculator,
            business: "kaj",
          },
          {
            title: "VAT Calculator",
            to: "/tax/vat",
            icon: Calculator,
            business: "kaj",
          },
          {
            title: "NIS Calculator",
            to: "/tax/nis",
            icon: Calculator,
            business: "kaj",
          },
          {
            title: "Tax Filing",
            to: "/tax/filing",
            icon: FileText,
            business: "kaj",
          },
        ],
      },
      {
        title: "Payroll Services",
        to: "/payroll",
        icon: Receipt,
        business: "kaj",
        children: [
          {
            title: "Payroll Dashboard",
            to: "/payroll",
            icon: BarChart3,
            business: "kaj",
          },
          {
            title: "Employee Records",
            to: "/payroll/employees",
            icon: Users,
            business: "kaj",
          },
          {
            title: "Run Payroll",
            to: "/payroll/run",
            icon: Clock,
            business: "kaj",
          },
          {
            title: "Payroll Reports",
            to: "/payroll/reports",
            icon: FileText,
            business: "kaj",
          },
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
        business: "all",
        children: [
          {
            title: "All Documents",
            to: "/documents",
            icon: FileText,
            business: "all",
          },
          {
            title: "Upload Documents",
            to: "/documents/upload",
            icon: FolderOpen,
            business: "all",
          },
          {
            title: "Templates",
            to: "/documents/templates",
            icon: Database,
            business: "all",
          },
        ],
      },
      {
        title: "Compliance Hub",
        to: "/compliance",
        icon: Shield,
        badge: "3",
        business: "kaj",
        children: [
          {
            title: "Compliance Dashboard",
            to: "/compliance",
            icon: Shield,
            business: "kaj",
          },
          {
            title: "GRA Filing",
            to: "/compliance/gra-filing",
            icon: Globe,
            business: "kaj",
          },
          {
            title: "Audit Reports",
            to: "/compliance/reports",
            icon: BarChart3,
            business: "kaj",
          },
          {
            title: "Alerts",
            to: "/compliance/alerts",
            icon: AlertTriangle,
            badge: "3",
            business: "kaj",
          },
        ],
      },
      {
        title: "Invoice Management",
        to: "/invoices",
        icon: Receipt,
        business: "all",
        children: [
          {
            title: "All Invoices",
            to: "/invoices",
            icon: Receipt,
            business: "all",
          },
          {
            title: "Create Invoice",
            to: "/invoices/new",
            icon: FileText,
            business: "all",
          },
          {
            title: "Payment Tracking",
            to: "/invoices/payments",
            icon: BarChart3,
            business: "all",
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
        business: "all",
        children: [
          {
            title: "Dashboard",
            to: "/time-tracking",
            icon: BarChart3,
            business: "all",
          },
          {
            title: "Active Timer",
            to: "/time-tracking/timer",
            icon: Timer,
            business: "all",
          },
          {
            title: "Time Entries",
            to: "/time-tracking/entries",
            icon: Clock,
            business: "all",
          },
          {
            title: "Reports",
            to: "/time-tracking/reports",
            icon: FileText,
            business: "all",
          },
          {
            title: "Projects",
            to: "/time-tracking/projects",
            icon: FolderOpen,
            business: "all",
          },
        ],
      },
      {
        title: "Automation",
        to: "/automation",
        icon: Zap,
        business: "all",
        children: [
          {
            title: "Dashboard",
            to: "/automation",
            icon: BarChart3,
            business: "all",
          },
          {
            title: "Rules & Workflows",
            to: "/automation/rules",
            icon: Workflow,
            business: "all",
          },
          {
            title: "Templates",
            to: "/automation/templates",
            icon: Database,
            business: "all",
          },
          {
            title: "Execution History",
            to: "/automation/history",
            icon: Clock,
            business: "all",
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
        business: "all",
        children: [
          {
            title: "Calendar View",
            to: "/appointments/calendar",
            icon: Calendar,
            business: "all",
          },
          {
            title: "Booking Management",
            to: "/appointments",
            icon: Clock,
            business: "all",
          },
          {
            title: "Client Requests",
            to: "/appointments/requests",
            icon: Bell,
            business: "all",
          },
        ],
      },
      {
        title: "User Management",
        to: "/users",
        icon: Users,
        business: "all",
        children: [
          { title: "All Users", to: "/users", icon: Users, business: "all" },
          {
            title: "Invite Users",
            to: "/users/invite",
            icon: UserCheck,
            business: "all",
          },
          {
            title: "Roles & Permissions",
            to: "/users/roles",
            icon: Shield,
            business: "all",
          },
        ],
      },
      {
        title: "System Settings",
        to: "/settings",
        icon: Settings,
        business: "all",
        children: [
          {
            title: "General Settings",
            to: "/settings",
            icon: Settings,
            business: "all",
          },
          {
            title: "Security",
            to: "/settings/security",
            icon: Shield,
            business: "all",
          },
          {
            title: "Notifications",
            to: "/settings/notifications",
            icon: Bell,
            business: "all",
          },
        ],
      },
    ],
  },
  {
    title: "KAJ Financial Services",
    business: "kaj",
    items: [
      {
        title: "Service Catalog",
        to: "/service-catalog",
        icon: Briefcase,
        business: "kaj",
      },
    ],
  },
  {
    title: "GCMC Consultancy",
    business: "gcmc",
    items: [
      {
        title: "Immigration Services",
        to: "/immigration",
        icon: Plane,
        business: "gcmc",
      },
      {
        title: "Property Management",
        to: "/property-management",
        icon: Building2,
        business: "gcmc",
      },
      {
        title: "Expediting Services",
        to: "/expediting",
        icon: Clock,
        business: "gcmc",
      },
      {
        title: "Training",
        to: "/training",
        icon: BookOpen,
        business: "gcmc",
      },
      {
        title: "Local Content",
        to: "/local-content",
        icon: ClipboardCheck,
        business: "gcmc",
      },
      {
        title: "Partner Network",
        to: "/partner-network",
        icon: Handshake,
        business: "gcmc",
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
    business: "all",
    children: [
      {
        title: "My Profile",
        to: "/portal/profile",
        icon: Users,
        external: true,
        business: "all",
      },
      {
        title: "My Documents",
        to: "/portal/documents",
        icon: FileText,
        external: true,
        business: "all",
      },
      {
        title: "Book Appointment",
        to: "/portal/appointments",
        icon: Calendar,
        external: true,
        business: "all",
      },
      {
        title: "Filing Status",
        to: "/portal/filings",
        icon: Shield,
        external: true,
        business: "all",
      },
      {
        title: "Payment History",
        to: "/portal/payments",
        icon: Receipt,
        external: true,
        business: "all",
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
  const { activeBusiness, setActiveBusiness } = useBusinessContext();

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

  // Filter items based on active business
  const isItemVisible = (item: SidebarItem): boolean => {
    if (activeBusiness === "all") return true;
    if (!item.business || item.business === "all") return true;
    return item.business === activeBusiness;
  };

  const isSectionVisible = (section: SidebarSection): boolean => {
    if (activeBusiness === "all") return true;
    if (!section.business || section.business === "all") return true;
    return section.business === activeBusiness;
  };

  const filterItems = (items: SidebarItem[]): SidebarItem[] =>
    items.filter(isItemVisible).map((item) => ({
      ...item,
      children: item.children ? filterItems(item.children) : undefined,
    }));

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = isActive(item.to);

    // For items with children at level 0, clicking expands instead of navigating
    // For child items (level > 0) or items without children, clicking navigates
    const shouldExpandOnClick = hasChildren && level === 0 && !isCollapsed;

    return (
      <div className={cn("relative", level > 0 && "ml-4")} key={item.title}>
        <div className="flex items-center">
          {shouldExpandOnClick ? (
            // Parent items with children - clicking expands/collapses
            <button
              className={cn(
                "flex flex-1 items-center gap-3 rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                active && "bg-accent text-accent-foreground"
              )}
              onClick={() => toggleExpanded(item.title)}
              type="button"
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <Badge
                  className="ml-auto h-5 w-5 p-0 text-xs"
                  variant="destructive"
                >
                  {item.badge}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            // Child items or items without children - clicking navigates
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

  const getBusinessLabel = () => {
    if (activeBusiness === "all") return "All Businesses";
    return BUSINESSES[activeBusiness].name;
  };

  const getBusinessColor = () => {
    if (activeBusiness === "all") return "bg-gray-500";
    if (activeBusiness === "kaj") return "bg-blue-500";
    return "bg-green-500";
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

      {/* Business Switcher */}
      {!isCollapsed && (
        <div className="border-b p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="w-full justify-between text-left font-normal"
                variant="outline"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn("h-2 w-2 rounded-full", getBusinessColor())}
                  />
                  <span className="truncate text-sm">{getBusinessLabel()}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setActiveBusiness("all")}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-500" />
                  <span>All Businesses</span>
                </div>
                {activeBusiness === "all" && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setActiveBusiness("kaj")}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <div className="font-medium">KAJ Financial Services</div>
                    <div className="text-muted-foreground text-xs">
                      Tax, Payroll, Accounting
                    </div>
                  </div>
                </div>
                {activeBusiness === "kaj" && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setActiveBusiness("gcmc")}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <div className="font-medium">GCMC Consultancy</div>
                    <div className="text-muted-foreground text-xs">
                      Immigration, Training, Consulting
                    </div>
                  </div>
                </div>
                {activeBusiness === "gcmc" && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-6">
          {sidebarSections.filter(isSectionVisible).map((section) => {
            const filteredItems = filterItems(section.items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={section.title}>
                {!isCollapsed && (
                  <h3 className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {filteredItems.map((item) => renderSidebarItem(item))}
                </div>
              </div>
            );
          })}

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
