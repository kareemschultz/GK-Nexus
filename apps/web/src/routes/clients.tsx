import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Grid3X3,
  History,
  List,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-states";
import { SmartSearch } from "@/components/ui/smart-search";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/clients")({
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

type Client = {
  id: string;
  name: string;
  type: "enterprise" | "mid-market" | "smb";
  status: "active" | "inactive" | "onboarding" | "suspended";
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  revenue: number;
  employees: number;
  joinDate: string;
  lastActivity: string;
  complianceScore: number;
  documents: number;
  tags: string[];
  priority: "high" | "medium" | "low";
  immigrationCases: number;
  lastContact: string;
  nextFollowUp?: string;
  relationshipManager: string;
  communicationPreference: "email" | "phone" | "in-person" | "video";
  avatar?: string;
  notes?: string;
  riskLevel: "low" | "medium" | "high";
};

type FilterCriteria = {
  searchTerm: string;
  status: string[];
  type: string[];
  industry: string[];
  priority: string[];
  riskLevel: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  tags: string[];
};

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterCriteria>({
    searchTerm: "",
    status: [],
    type: [],
    industry: [],
    priority: [],
    riskLevel: [],
    dateRange: {},
    tags: [],
  });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "timeline">(
    "list"
  );

  // Fetch clients from API
  const clientsQuery = useQuery({
    queryKey: ["clients", filters.searchTerm],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.clients.list({
        page: 1,
        limit: 100,
        search: filters.searchTerm || undefined,
      });
    },
  });

  // Fetch client stats
  const statsQuery = useQuery({
    queryKey: ["clientStats"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.clients.stats({});
    },
  });

  // Map API response to Client type
  const mapEntityTypeToType = (
    entityType: string
  ): "enterprise" | "mid-market" | "smb" => {
    switch (entityType?.toLowerCase()) {
      case "corporation":
      case "llc":
        return "enterprise";
      case "partnership":
        return "mid-market";
      case "sole_proprietor":
      case "individual":
        return "smb";
      default:
        return "mid-market";
    }
  };

  const mapComplianceStatusToScore = (status: string): number => {
    switch (status?.toLowerCase()) {
      case "compliant":
        return 95;
      case "pending_review":
        return 80;
      case "non_compliant":
        return 60;
      default:
        return 85;
    }
  };

  const clients: Client[] = useMemo(() => {
    if (!clientsQuery.data?.data?.items) return [];

    return clientsQuery.data.data.items.map((apiClient) => ({
      id: apiClient.id,
      name: apiClient.name,
      type: mapEntityTypeToType(apiClient.entityType || ""),
      status: (apiClient.status as Client["status"]) || "active",
      industry: "Business Services", // Default - API doesn't provide this
      contactPerson: apiClient.assignedAccountant || "Not assigned",
      email: apiClient.email || "",
      phone: apiClient.phoneNumber || "",
      address: "", // API doesn't provide address in list
      revenue: 0, // Not in API response
      employees: 0, // Not in API response
      joinDate: apiClient.clientSince
        ? new Date(apiClient.clientSince).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      lastActivity: apiClient.updatedAt
        ? new Date(apiClient.updatedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      complianceScore: mapComplianceStatusToScore(
        apiClient.complianceStatus || ""
      ),
      documents: 0, // Would need separate query
      tags: [], // Not in list response
      priority: "medium" as const,
      immigrationCases: 0, // Would need separate query
      lastContact: apiClient.updatedAt
        ? new Date(apiClient.updatedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      relationshipManager: apiClient.assignedManager || "Not assigned",
      communicationPreference: "email" as const,
      riskLevel: (apiClient.riskLevel as Client["riskLevel"]) || "low",
    }));
  }, [clientsQuery.data]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Search term matching
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        !searchLower ||
        client.name.toLowerCase().includes(searchLower) ||
        client.contactPerson.toLowerCase().includes(searchLower) ||
        client.industry.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.relationshipManager.toLowerCase().includes(searchLower) ||
        client.notes?.toLowerCase().includes(searchLower) ||
        client.tags.some((tag) => tag.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus =
        filters.status.length === 0 || filters.status.includes(client.status);

      // Type filter
      const matchesType =
        filters.type.length === 0 || filters.type.includes(client.type);

      // Industry filter
      const matchesIndustry =
        filters.industry.length === 0 ||
        filters.industry.includes(client.industry);

      // Priority filter
      const matchesPriority =
        filters.priority.length === 0 ||
        filters.priority.includes(client.priority);

      // Risk level filter
      const matchesRiskLevel =
        filters.riskLevel.length === 0 ||
        filters.riskLevel.includes(client.riskLevel);

      // Tags filter
      const matchesTags =
        filters.tags.length === 0 ||
        filters.tags.some((tag) => client.tags.includes(tag));

      // Date range filter
      const matchesDateRange = (() => {
        if (!(filters.dateRange.from || filters.dateRange.to)) return true;
        const clientDate = new Date(client.lastActivity);
        const fromDate = filters.dateRange.from;
        const toDate = filters.dateRange.to;

        if (fromDate && toDate) {
          return clientDate >= fromDate && clientDate <= toDate;
        }
        if (fromDate) {
          return clientDate >= fromDate;
        }
        if (toDate) {
          return clientDate <= toDate;
        }
        return true;
      })();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesIndustry &&
        matchesPriority &&
        matchesRiskLevel &&
        matchesTags &&
        matchesDateRange
      );
    });
  }, [clients, filters]);

  const uniqueIndustries = useMemo(
    () => [...new Set(clients.map((c) => c.industry))],
    [clients]
  );

  const uniqueTags = useMemo(
    () => [...new Set(clients.flatMap((c) => c.tags))],
    [clients]
  );

  const handleFilterChange = (key: keyof FilterCriteria, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const addToFilter = (key: keyof FilterCriteria, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: Array.isArray(prev[key])
        ? [...(prev[key] as string[]), value]
        : [value],
    }));
  };

  const removeFromFilter = (key: keyof FilterCriteria, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: Array.isArray(prev[key])
        ? (prev[key] as string[]).filter((v) => v !== value)
        : [],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: "",
      status: [],
      type: [],
      industry: [],
      priority: [],
      riskLevel: [],
      dateRange: {},
      tags: [],
    });
  };

  const hasActiveFilters = useMemo(
    () =>
      filters.searchTerm ||
      filters.status.length > 0 ||
      filters.type.length > 0 ||
      filters.industry.length > 0 ||
      filters.priority.length > 0 ||
      filters.riskLevel.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange.from ||
      filters.dateRange.to,
    [filters]
  );

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const selectAllClients = () => {
    setSelectedClients(
      selectedClients.length === filteredClients.length
        ? []
        : filteredClients.map((c) => c.id)
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "onboarding":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "suspended":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "onboarding":
        return <Badge variant="outline">Onboarding</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "enterprise":
        return <Badge variant="default">Enterprise</Badge>;
      case "mid-market":
        return <Badge variant="outline">Mid-Market</Badge>;
      case "smb":
        return <Badge variant="secondary">SMB</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>;
      case "medium":
        return <Badge variant="outline">Medium Priority</Badge>;
      case "low":
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return <Badge variant="destructive">High Risk</Badge>;
      case "medium":
        return <Badge variant="outline">Medium Risk</Badge>;
      case "low":
        return <Badge variant="default">Low Risk</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) {
      return "text-green-500";
    }
    if (score >= 80) {
      return "text-yellow-500";
    }
    return "text-red-500";
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const searchSuggestions = useMemo(() => {
    const suggestions = [
      ...clients.map((c) => ({
        type: "client" as const,
        value: c.name,
        label: c.name,
        description: c.industry,
      })),
      ...uniqueIndustries.map((industry) => ({
        type: "industry" as const,
        value: industry,
        label: industry,
        description: "Industry",
      })),
      ...uniqueTags.map((tag) => ({
        type: "tag" as const,
        value: tag,
        label: tag,
        description: "Tag",
      })),
    ];
    return suggestions;
  }, [clients, uniqueIndustries, uniqueTags]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Client Management
            </h1>
            <p className="text-muted-foreground">
              Manage client relationships, track immigration cases, and monitor
              compliance status.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={() => navigate({ to: "/clients/new" })}
            >
              <UserPlus className="h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>
      </header>

      {/* Enhanced Search and Filters */}
      <section aria-label="Client search and filters" className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Main search bar */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <SmartSearch
                    onChange={(value) =>
                      handleFilterChange("searchTerm", value)
                    }
                    onSuggestionSelect={(suggestion) => {
                      if (suggestion.type === "client") {
                        const client = clients.find(
                          (c) => c.name === suggestion.value
                        );
                        if (client) {
                          setSelectedClient(client);
                          setShowClientDetails(true);
                        }
                      } else {
                        handleFilterChange("searchTerm", suggestion.value);
                      }
                    }}
                    placeholder="Search clients, contacts, or industries..."
                    suggestions={searchSuggestions}
                    value={filters.searchTerm}
                  />
                </div>
                <Button
                  className={showAdvancedFilters ? "bg-muted" : ""}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  size="icon"
                  variant="outline"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <div className="flex rounded-md border">
                  <Button
                    className="rounded-r-none"
                    onClick={() => setViewMode("list")}
                    size="sm"
                    variant={viewMode === "list" ? "default" : "ghost"}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    className="rounded-none border-x"
                    onClick={() => setViewMode("grid")}
                    size="sm"
                    variant={viewMode === "grid" ? "default" : "ghost"}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    className="rounded-l-none"
                    onClick={() => setViewMode("timeline")}
                    size="sm"
                    variant={viewMode === "timeline" ? "default" : "ghost"}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Active filters display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    Active filters:
                  </span>
                  {filters.status.map((status) => (
                    <Badge className="gap-1" key={status} variant="secondary">
                      {status}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromFilter("status", status)}
                      />
                    </Badge>
                  ))}
                  {filters.type.map((type) => (
                    <Badge className="gap-1" key={type} variant="secondary">
                      {type}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromFilter("type", type)}
                      />
                    </Badge>
                  ))}
                  {filters.priority.map((priority) => (
                    <Badge className="gap-1" key={priority} variant="secondary">
                      {priority} priority
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromFilter("priority", priority)}
                      />
                    </Badge>
                  ))}
                  {filters.tags.map((tag) => (
                    <Badge className="gap-1" key={tag} variant="secondary">
                      #{tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromFilter("tags", tag)}
                      />
                    </Badge>
                  ))}
                  <Button
                    className="text-xs"
                    onClick={clearAllFilters}
                    size="sm"
                    variant="ghost"
                  >
                    Clear all
                  </Button>
                </div>
              )}

              {/* Advanced filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-2 block font-medium text-sm">
                      Status
                    </label>
                    <div className="space-y-2">
                      {["active", "onboarding", "inactive", "suspended"].map(
                        (status) => (
                          <div
                            className="flex items-center space-x-2"
                            key={status}
                          >
                            <Checkbox
                              checked={filters.status.includes(status)}
                              id={`status-${status}`}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addToFilter("status", status);
                                } else {
                                  removeFromFilter("status", status);
                                }
                              }}
                            />
                            <label
                              className="font-medium text-sm capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              htmlFor={`status-${status}`}
                            >
                              {status}
                            </label>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-sm">
                      Client Type
                    </label>
                    <div className="space-y-2">
                      {["enterprise", "mid-market", "smb"].map((type) => (
                        <div className="flex items-center space-x-2" key={type}>
                          <Checkbox
                            checked={filters.type.includes(type)}
                            id={`type-${type}`}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                addToFilter("type", type);
                              } else {
                                removeFromFilter("type", type);
                              }
                            }}
                          />
                          <label
                            className="font-medium text-sm capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            htmlFor={`type-${type}`}
                          >
                            {type === "smb" ? "SMB" : type.replace("-", " ")}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-sm">
                      Priority
                    </label>
                    <div className="space-y-2">
                      {["high", "medium", "low"].map((priority) => (
                        <div
                          className="flex items-center space-x-2"
                          key={priority}
                        >
                          <Checkbox
                            checked={filters.priority.includes(priority)}
                            id={`priority-${priority}`}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                addToFilter("priority", priority);
                              } else {
                                removeFromFilter("priority", priority);
                              }
                            }}
                          />
                          <label
                            className="font-medium text-sm capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            htmlFor={`priority-${priority}`}
                          >
                            {priority}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-sm">
                      Risk Level
                    </label>
                    <div className="space-y-2">
                      {["low", "medium", "high"].map((risk) => (
                        <div className="flex items-center space-x-2" key={risk}>
                          <Checkbox
                            checked={filters.riskLevel.includes(risk)}
                            id={`risk-${risk}`}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                addToFilter("riskLevel", risk);
                              } else {
                                removeFromFilter("riskLevel", risk);
                              }
                            }}
                          />
                          <label
                            className="font-medium text-sm capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            htmlFor={`risk-${risk}`}
                          >
                            {risk}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Client Overview Stats */}
      <section aria-label="Client overview statistics" className="mb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Total Clients
                  </p>
                  <p className="font-bold text-2xl">{clients.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Active Clients
                  </p>
                  <p className="font-bold text-2xl">
                    {clients.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Immigration Cases
                  </p>
                  <p className="font-bold text-2xl">
                    {clients.reduce((sum, c) => sum + c.immigrationCases, 0)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Total Revenue
                  </p>
                  <p className="font-bold text-2xl">
                    {formatCurrency(
                      clients.reduce((sum, c) => sum + c.revenue, 0)
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Avg Compliance
                  </p>
                  <p className="font-bold text-2xl">
                    {Math.round(
                      clients.reduce((sum, c) => sum + c.complianceScore, 0) /
                        clients.length
                    )}
                    %
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bulk actions bar */}
      {selectedClients.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedClients.length} client
                  {selectedClients.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                  <Button size="sm" variant="outline">
                    <Tag className="mr-2 h-4 w-4" />
                    Add Tags
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => setSelectedClients([])}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client List/Grid/Calendar */}
      <section aria-label="Client listing">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Clients ({filteredClients.length})
                  {hasActiveFilters && (
                    <span className="ml-2 font-normal text-muted-foreground text-sm">
                      (filtered from {clients.length} total)
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {viewMode === "list" &&
                    "Comprehensive view of all client accounts and their current status."}
                  {viewMode === "grid" &&
                    "Visual overview of client portfolio with key metrics."}
                  {viewMode === "timeline" &&
                    "Chronological view of client activities and milestones."}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {viewMode === "list" && filteredClients.length > 0 && (
                  <Checkbox
                    checked={
                      selectedClients.length === filteredClients.length
                        ? true
                        : selectedClients.length > 0
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={selectAllClients}
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <EmptyState
                action={
                  <Button onClick={() => navigate({ to: "/clients/new" })}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add First Client
                  </Button>
                }
                description={
                  hasActiveFilters
                    ? "Try adjusting your search or filter criteria to find clients."
                    : "Get started by adding your first client to GK-Nexus."
                }
                icon={Building2}
                title="No clients found"
              />
            ) : viewMode === "list" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedClients.length === filteredClients.length
                            ? true
                            : selectedClients.length > 0
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={selectAllClients}
                      />
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Immigration Cases</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead>Next Follow-up</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedClients.includes(client.id) ? "bg-muted/25" : ""
                      }`}
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setShowClientDetails(true);
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedClients.includes(client.id)}
                          onCheckedChange={() =>
                            toggleClientSelection(client.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={client.avatar} />
                            <AvatarFallback>
                              {client.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {client.contactPerson}
                            </p>
                            <div className="mt-1 flex gap-1">
                              {client.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  className="px-1 text-xs"
                                  key={tag}
                                  variant="outline"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {client.tags.length > 2 && (
                                <Badge
                                  className="px-1 text-xs"
                                  variant="outline"
                                >
                                  +{client.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(client.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(client.status)}
                          {getStatusBadge(client.status)}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(client.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {client.immigrationCases}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${getComplianceColor(client.complianceScore)}`}
                        >
                          {client.complianceScore}%
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(client.lastContact)}</TableCell>
                      <TableCell>
                        {client.nextFollowUp ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(client.nextFollowUp)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({ to: `/clients/${client.id}/edit` })
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Contact
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <History className="mr-2 h-4 w-4" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map((client) => (
                  <Card
                    className={`cursor-pointer transition-shadow hover:shadow-md ${
                      selectedClients.includes(client.id)
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client);
                      setShowClientDetails(true);
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={client.avatar} />
                            <AvatarFallback>
                              {client.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {client.name}
                            </CardTitle>
                            <p className="text-muted-foreground text-sm">
                              {client.contactPerson}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(client.status)}
                          <Checkbox
                            checked={selectedClients.includes(client.id)}
                            onCheckedChange={(e) => {
                              e.stopPropagation();
                              toggleClientSelection(client.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getTypeBadge(client.type)}
                        {getPriorityBadge(client.priority)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Immigration Cases
                        </span>
                        <span className="font-medium">
                          {client.immigrationCases}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Compliance
                        </span>
                        <span
                          className={`font-medium ${getComplianceColor(client.complianceScore)}`}
                        >
                          {client.complianceScore}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Revenue
                        </span>
                        <span className="font-medium">
                          {formatCurrency(client.revenue)}
                        </span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-muted-foreground text-xs">
                          <span>
                            Last contact: {formatDate(client.lastContact)}
                          </span>
                          {client.nextFollowUp && (
                            <span>
                              Follow-up: {formatDate(client.nextFollowUp)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((client, index) => (
                  <div className="flex gap-4" key={client.id}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          client.priority === "high"
                            ? "bg-red-100 text-red-600"
                            : client.priority === "medium"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-green-100 text-green-600"
                        }`}
                      >
                        <Activity className="h-4 w-4" />
                      </div>
                      {index < filteredClients.length - 1 && (
                        <div className="mt-2 h-16 w-0.5 bg-border" />
                      )}
                    </div>
                    <Card className="flex-1">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={client.avatar} />
                              <AvatarFallback>
                                {client.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{client.name}</h3>
                              <p className="text-muted-foreground text-sm">
                                Last activity: {formatDate(client.lastActivity)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(client.status)}
                            {getPriorityBadge(client.priority)}
                          </div>
                        </div>
                        {client.notes && (
                          <p className="mt-2 text-muted-foreground text-sm">
                            {client.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Enhanced Client Details Dialog */}
      <Dialog onOpenChange={setShowClientDetails} open={showClientDetails}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedClient?.avatar} />
                <AvatarFallback>
                  {selectedClient?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl">{selectedClient?.name}</h2>
                <p className="font-normal text-muted-foreground text-sm">
                  {selectedClient?.industry} • {selectedClient?.contactPerson}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Comprehensive client profile with immigration cases, compliance
              status, and relationship details.
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="mt-6">
              <Tabs className="w-full" defaultValue="overview">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="immigration">Immigration</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="communications">
                    Communications
                  </TabsTrigger>
                  <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                <TabsContent className="space-y-6" value="overview">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Users className="h-5 w-5" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedClient.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedClient.phone}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <span>{selectedClient.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">
                            {selectedClient.communicationPreference}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Business Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Building2 className="h-5 w-5" />
                          Business Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Industry:
                          </span>
                          <span className="font-medium">
                            {selectedClient.industry}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          {getTypeBadge(selectedClient.type)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Revenue:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(selectedClient.revenue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Employees:
                          </span>
                          <span className="font-medium">
                            {selectedClient.employees.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Join Date:
                          </span>
                          <span className="font-medium">
                            {formatDate(selectedClient.joinDate)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Status Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Activity className="h-5 w-5" />
                          Status & Priority
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(selectedClient.status)}
                            {getStatusBadge(selectedClient.status)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Priority:
                          </span>
                          {getPriorityBadge(selectedClient.priority)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Risk Level:
                          </span>
                          {getRiskBadge(selectedClient.riskLevel)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Manager:
                          </span>
                          <span className="font-medium">
                            {selectedClient.relationshipManager}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tags and Notes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Tag className="h-5 w-5" />
                          Tags & Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-muted-foreground text-sm">
                            Tags:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedClient.tags.map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {selectedClient.notes && (
                          <div>
                            <span className="text-muted-foreground text-sm">
                              Notes:
                            </span>
                            <p className="mt-1 text-sm">
                              {selectedClient.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-muted-foreground text-sm">
                              Immigration Cases
                            </p>
                            <p className="font-bold text-2xl">
                              {selectedClient.immigrationCases}
                            </p>
                          </div>
                          <FileText className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-muted-foreground text-sm">
                              Compliance Score
                            </p>
                            <p
                              className={`font-bold text-2xl ${getComplianceColor(selectedClient.complianceScore)}`}
                            >
                              {selectedClient.complianceScore}%
                            </p>
                          </div>
                          <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-muted-foreground text-sm">
                              Documents
                            </p>
                            <p className="font-bold text-2xl">
                              {selectedClient.documents}
                            </p>
                          </div>
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-muted-foreground text-sm">
                              Last Contact
                            </p>
                            <p className="font-bold text-sm">
                              {formatDate(selectedClient.lastContact)}
                            </p>
                          </div>
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="immigration">
                  <Card>
                    <CardHeader>
                      <CardTitle>Immigration Cases</CardTitle>
                      <CardDescription>
                        Track visa applications, status, and deadlines for this
                        client.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <h3 className="font-medium">
                              H-1B Applications (8 active)
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              Annual cap cases in progress
                            </p>
                          </div>
                          <Badge variant="outline">In Progress</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <h3 className="font-medium">
                              L-1 Transfer (2 cases)
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              Intracompany transfer petitions
                            </p>
                          </div>
                          <Badge variant="default">Approved</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <h3 className="font-medium">
                              PERM Labor Certification (2 cases)
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              Permanent residence applications
                            </p>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                      </div>
                      <div className="mt-6 flex gap-2">
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          New Case
                        </Button>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View All Cases
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents">
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Management</CardTitle>
                      <CardDescription>
                        Client documents, uploads, and approval status.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Document management interface would be implemented here,
                        integrating with the enhanced document management
                        system.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="communications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Communication History</CardTitle>
                      <CardDescription>
                        Track all interactions and conversations with this
                        client.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Communication history interface would be implemented
                        here.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="compliance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Compliance Status</CardTitle>
                      <CardDescription>
                        Detailed compliance metrics and requirements tracking.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Compliance management interface would be implemented
                        here.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t pt-6">
                <Button
                  onClick={() => setShowClientDetails(false)}
                  variant="outline"
                >
                  Close
                </Button>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Client
                </Button>
                <Button variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact
                </Button>
                <Button
                  onClick={() =>
                    navigate({ to: `/clients/${selectedClient.id}/documents` })
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Documents
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
