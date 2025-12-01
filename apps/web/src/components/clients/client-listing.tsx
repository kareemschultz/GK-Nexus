import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  Calendar,
  CheckCircle,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Grid3X3,
  History,
  List,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Tag,
  Trash2,
  TrendingUp,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { SmartSearch } from "@/components/ui/smart-search";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ClientStatus = "active" | "inactive" | "onboarding" | "suspended";
type EntityType =
  | "INDIVIDUAL"
  | "COMPANY"
  | "PARTNERSHIP"
  | "SOLE_PROPRIETORSHIP";
type ComplianceStatus =
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "PENDING_REVIEW"
  | "WARNING";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface Client {
  id: string;
  clientNumber: string;
  name: string;
  entityType: EntityType;
  status: ClientStatus;
  complianceStatus: ComplianceStatus;
  riskLevel: RiskLevel;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  taxIdNumber: string;
  businessRegistrationNumber: string | null;
  assignedAccountant: string | null;
  assignedManager: string | null;
  clientSince: Date;
  lastActivity: Date | null;
  tags: string[];
  customFields: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;

  // Calculated fields
  immigrationCasesCount: number;
  documentsCount: number;
  pendingTasksCount: number;
  complianceScore: number;
  totalRevenue: number;
  lastContactDate: Date | null;
  nextFollowUpDate: Date | null;
}

interface FilterOptions {
  search: string;
  status: ClientStatus[];
  entityType: EntityType[];
  complianceStatus: ComplianceStatus[];
  riskLevel: RiskLevel[];
  assignedAccountant: string[];
  assignedManager: string[];
  tags: string[];
  region: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
}

interface ClientListingProps {
  clients?: Client[];
  onClientSelect?: (client: Client) => void;
  onCreateClient?: () => void;
  onEditClient?: (clientId: string) => void;
  onDeleteClient?: (clientId: string) => void;
  onBulkAction?: (clientIds: string[], action: string) => void;
  loading?: boolean;
}

const getStatusBadge = (status: ClientStatus) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case "inactive":
      return <Badge variant="secondary">Inactive</Badge>;
    case "onboarding":
      return <Badge className="bg-blue-100 text-blue-800">Onboarding</Badge>;
    case "suspended":
      return <Badge variant="destructive">Suspended</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

const getComplianceBadge = (status: ComplianceStatus) => {
  switch (status) {
    case "COMPLIANT":
      return <Badge className="bg-green-100 text-green-800">Compliant</Badge>;
    case "NON_COMPLIANT":
      return <Badge variant="destructive">Non-Compliant</Badge>;
    case "PENDING_REVIEW":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      );
    case "WARNING":
      return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

const getRiskBadge = (level: RiskLevel) => {
  switch (level) {
    case "LOW":
      return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
    case "MEDIUM":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>
      );
    case "HIGH":
      return <Badge variant="destructive">High Risk</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

const getEntityTypeIcon = (type: EntityType) => {
  switch (type) {
    case "INDIVIDUAL":
      return <Users className="h-4 w-4" />;
    case "COMPANY":
    case "PARTNERSHIP":
    case "SOLE_PROPRIETORSHIP":
      return <Building2 className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
};

const formatDate = (date: Date | string | null) => {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-GY", {
    style: "currency",
    currency: "GYD",
    minimumFractionDigits: 0,
  }).format(amount);

export function ClientListing({
  clients = [],
  onClientSelect,
  onCreateClient,
  onEditClient,
  onDeleteClient,
  onBulkAction,
  loading = false,
}: ClientListingProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"list" | "grid" | "timeline">(
    "list"
  );
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    status: [],
    entityType: [],
    complianceStatus: [],
    riskLevel: [],
    assignedAccountant: [],
    assignedManager: [],
    tags: [],
    region: [],
    dateRange: {},
  });

  // Filter clients based on current filters and active tab
  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Apply tab filter
    switch (activeTab) {
      case "active":
        filtered = filtered.filter((c) => c.status === "active");
        break;
      case "onboarding":
        filtered = filtered.filter((c) => c.status === "onboarding");
        break;
      case "high-risk":
        filtered = filtered.filter((c) => c.riskLevel === "HIGH");
        break;
      case "non-compliant":
        filtered = filtered.filter(
          (c) => c.complianceStatus === "NON_COMPLIANT"
        );
        break;
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchLower) ||
          client.clientNumber.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          client.taxIdNumber.toLowerCase().includes(searchLower) ||
          client.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply other filters
    if (filters.status.length > 0) {
      filtered = filtered.filter((c) => filters.status.includes(c.status));
    }

    if (filters.entityType.length > 0) {
      filtered = filtered.filter((c) =>
        filters.entityType.includes(c.entityType)
      );
    }

    if (filters.complianceStatus.length > 0) {
      filtered = filtered.filter((c) =>
        filters.complianceStatus.includes(c.complianceStatus)
      );
    }

    if (filters.riskLevel.length > 0) {
      filtered = filtered.filter((c) =>
        filters.riskLevel.includes(c.riskLevel)
      );
    }

    if (filters.region.length > 0) {
      filtered = filtered.filter(
        (c) => c.region && filters.region.includes(c.region)
      );
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter((c) =>
        filters.tags.some((tag) => c.tags.includes(tag))
      );
    }

    return filtered;
  }, [clients, filters, activeTab]);

  // Calculate statistics
  const clientStats = useMemo(() => {
    const stats = {
      total: clients.length,
      active: clients.filter((c) => c.status === "active").length,
      onboarding: clients.filter((c) => c.status === "onboarding").length,
      highRisk: clients.filter((c) => c.riskLevel === "HIGH").length,
      nonCompliant: clients.filter(
        (c) => c.complianceStatus === "NON_COMPLIANT"
      ).length,
      immigrationCases: clients.reduce(
        (sum, c) => sum + c.immigrationCasesCount,
        0
      ),
      totalRevenue: clients.reduce((sum, c) => sum + c.totalRevenue, 0),
      averageComplianceScore: Math.round(
        clients.reduce((sum, c) => sum + c.complianceScore, 0) / clients.length
      ),
    };
    return stats;
  }, [clients]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const accountants = [
      ...new Set(clients.map((c) => c.assignedAccountant).filter(Boolean)),
    ];
    const managers = [
      ...new Set(clients.map((c) => c.assignedManager).filter(Boolean)),
    ];
    const allTags = [...new Set(clients.flatMap((c) => c.tags))];
    const regions = [...new Set(clients.map((c) => c.region).filter(Boolean))];

    return { accountants, managers, allTags, regions };
  }, [clients]);

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

  const clearAllFilters = () => {
    setFilters({
      search: "",
      status: [],
      entityType: [],
      complianceStatus: [],
      riskLevel: [],
      assignedAccountant: [],
      assignedManager: [],
      tags: [],
      region: [],
      dateRange: {},
    });
  };

  const searchSuggestions = useMemo(() => {
    const suggestions = [
      ...clients.map((c) => ({
        type: "client" as const,
        value: c.name,
        label: c.name,
        description: `${c.entityType} • ${c.status}`,
      })),
      ...filterOptions.allTags.map((tag) => ({
        type: "tag" as const,
        value: tag,
        label: `#${tag}`,
        description: "Tag",
      })),
    ];
    return suggestions;
  }, [clients, filterOptions.allTags]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Client Management
          </h1>
          <p className="text-muted-foreground">
            Manage client relationships, track compliance, and monitor case
            progress.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => onCreateClient?.()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Total Clients
                </p>
                <p className="font-bold text-2xl">{clientStats.total}</p>
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
                  Active
                </p>
                <p className="font-bold text-2xl">{clientStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
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
                  {clientStats.immigrationCases}
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
                  {formatCurrency(clientStats.totalRevenue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
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
                <p
                  className={`font-bold text-2xl ${
                    clientStats.averageComplianceScore >= 90
                      ? "text-green-600"
                      : clientStats.averageComplianceScore >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {clientStats.averageComplianceScore}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <SmartSearch
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, search: value }))
                  }
                  onSuggestionSelect={(suggestion) => {
                    if (suggestion.type === "client") {
                      const client = clients.find(
                        (c) => c.name === suggestion.value
                      );
                      if (client) {
                        onClientSelect?.(client);
                      }
                    } else {
                      setFilters((prev) => ({
                        ...prev,
                        search: suggestion.value,
                      }));
                    }
                  }}
                  placeholder="Search clients, contacts, or tags..."
                  suggestions={searchSuggestions}
                  value={filters.search}
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

            {/* Advanced Filters */}
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
                            checked={filters.status.includes(
                              status as ClientStatus
                            )}
                            id={`status-${status}`}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters((prev) => ({
                                  ...prev,
                                  status: [
                                    ...prev.status,
                                    status as ClientStatus,
                                  ],
                                }));
                              } else {
                                setFilters((prev) => ({
                                  ...prev,
                                  status: prev.status.filter(
                                    (s) => s !== status
                                  ),
                                }));
                              }
                            }}
                          />
                          <label
                            className="text-sm capitalize"
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
                    Entity Type
                  </label>
                  <div className="space-y-2">
                    {[
                      "INDIVIDUAL",
                      "COMPANY",
                      "PARTNERSHIP",
                      "SOLE_PROPRIETORSHIP",
                    ].map((type) => (
                      <div className="flex items-center space-x-2" key={type}>
                        <Checkbox
                          checked={filters.entityType.includes(
                            type as EntityType
                          )}
                          id={`type-${type}`}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({
                                ...prev,
                                entityType: [
                                  ...prev.entityType,
                                  type as EntityType,
                                ],
                              }));
                            } else {
                              setFilters((prev) => ({
                                ...prev,
                                entityType: prev.entityType.filter(
                                  (t) => t !== type
                                ),
                              }));
                            }
                          }}
                        />
                        <label className="text-sm" htmlFor={`type-${type}`}>
                          {type === "SOLE_PROPRIETORSHIP"
                            ? "Sole Prop."
                            : type.replace("_", " ")}
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
                    {["LOW", "MEDIUM", "HIGH"].map((risk) => (
                      <div className="flex items-center space-x-2" key={risk}>
                        <Checkbox
                          checked={filters.riskLevel.includes(
                            risk as RiskLevel
                          )}
                          id={`risk-${risk}`}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({
                                ...prev,
                                riskLevel: [
                                  ...prev.riskLevel,
                                  risk as RiskLevel,
                                ],
                              }));
                            } else {
                              setFilters((prev) => ({
                                ...prev,
                                riskLevel: prev.riskLevel.filter(
                                  (r) => r !== risk
                                ),
                              }));
                            }
                          }}
                        />
                        <label
                          className="text-sm capitalize"
                          htmlFor={`risk-${risk}`}
                        >
                          {risk.toLowerCase()}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-sm">
                    Actions
                  </label>
                  <Button
                    className="w-full"
                    onClick={clearAllFilters}
                    size="sm"
                    variant="outline"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Client Tabs */}
      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({clientStats.total})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({clientStats.active})
          </TabsTrigger>
          <TabsTrigger value="onboarding">
            Onboarding ({clientStats.onboarding})
          </TabsTrigger>
          <TabsTrigger value="high-risk">
            High Risk ({clientStats.highRisk})
          </TabsTrigger>
          <TabsTrigger value="non-compliant">
            Non-Compliant ({clientStats.nonCompliant})
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Bulk Actions */}
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
                      <Button
                        onClick={() =>
                          onBulkAction?.(selectedClients, "export")
                        }
                        size="sm"
                        variant="outline"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button
                        onClick={() => onBulkAction?.(selectedClients, "tag")}
                        size="sm"
                        variant="outline"
                      >
                        <Tag className="mr-2 h-4 w-4" />
                        Add Tags
                      </Button>
                      <Button
                        onClick={() =>
                          onBulkAction?.(selectedClients, "assign")
                        }
                        size="sm"
                        variant="outline"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Assign
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

          {/* Client List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Clients ({filteredClients.length})</CardTitle>
                {filteredClients.length > 0 && viewMode === "list" && (
                  <Checkbox
                    checked={selectedClients.length === filteredClients.length}
                    indeterminate={
                      selectedClients.length > 0 &&
                      selectedClients.length < filteredClients.length
                    }
                    onCheckedChange={selectAllClients}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div className="animate-pulse" key={i}>
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-muted" />
                        <div className="space-y-2">
                          <div className="h-4 w-[250px] rounded bg-muted" />
                          <div className="h-4 w-[200px] rounded bg-muted" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="py-12 text-center">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-medium text-lg">No clients found</h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {clients.length === 0
                      ? "Start by adding your first client to GK-Nexus."
                      : "Try adjusting your search or filter criteria."}
                  </p>
                  {clients.length === 0 && (
                    <Button className="mt-4" onClick={() => onCreateClient?.()}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add First Client
                    </Button>
                  )}
                </div>
              ) : viewMode === "list" ? (
                <div className="space-y-2">
                  {filteredClients.map((client) => (
                    <div
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                        selectedClients.includes(client.id) ? "bg-muted/25" : ""
                      }`}
                      key={client.id}
                      onClick={() => onClientSelect?.(client)}
                    >
                      <Checkbox
                        checked={selectedClients.includes(client.id)}
                        onCheckedChange={() => toggleClientSelection(client.id)}
                        onClick={(e) => e.stopPropagation()}
                      />

                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`}
                        />
                        <AvatarFallback>
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="truncate font-medium">
                                {client.name}
                              </p>
                              {getEntityTypeIcon(client.entityType)}
                              <Badge className="text-xs" variant="outline">
                                {client.clientNumber}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground text-sm">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </span>
                              {client.phoneNumber && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {client.phoneNumber}
                                </span>
                              )}
                              <span>
                                Client since {formatDate(client.clientSince)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              Status:
                            </span>
                            {getStatusBadge(client.status)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              Compliance:
                            </span>
                            {getComplianceBadge(client.complianceStatus)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              Risk:
                            </span>
                            {getRiskBadge(client.riskLevel)}
                          </div>

                          <div className="flex items-center gap-4 text-muted-foreground text-xs">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {client.immigrationCasesCount} immigration
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {client.documentsCount} docs
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {client.complianceScore}% compliance
                            </span>
                          </div>
                        </div>

                        {client.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {client.tags.slice(0, 3).map((tag) => (
                              <Badge
                                className="text-xs"
                                key={tag}
                                variant="secondary"
                              >
                                #{tag}
                              </Badge>
                            ))}
                            {client.tags.length > 3 && (
                              <Badge className="text-xs" variant="secondary">
                                +{client.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {client.nextFollowUpDate && (
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">
                                Follow-up
                              </p>
                              <p className="text-sm">
                                {formatDate(client.nextFollowUpDate)}
                              </p>
                            </div>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                onClick={(e) => e.stopPropagation()}
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => onClientSelect?.(client)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onEditClient?.(client.id)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Contact
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link to={`/clients/${client.id}/documents`}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Documents
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <History className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDeleteClient?.(client.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                      onClick={() => onClientSelect?.(client)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`}
                              />
                              <AvatarFallback>
                                {client.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">
                                {client.name}
                              </CardTitle>
                              <CardDescription>
                                {client.entityType.replace("_", " ")}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusBadge(client.status)}
                            <Checkbox
                              checked={selectedClients.includes(client.id)}
                              onCheckedChange={() =>
                                toggleClientSelection(client.id)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              Compliance Score
                            </span>
                            <span
                              className={`font-medium ${
                                client.complianceScore >= 90
                                  ? "text-green-600"
                                  : client.complianceScore >= 70
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {client.complianceScore}%
                            </span>
                          </div>
                          <Progress value={client.complianceScore} />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Immigration Cases
                          </span>
                          <span className="font-medium">
                            {client.immigrationCasesCount}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Documents
                          </span>
                          <span className="font-medium">
                            {client.documentsCount}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Revenue
                          </span>
                          <span className="font-medium">
                            {formatCurrency(client.totalRevenue)}
                          </span>
                        </div>

                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between">
                            {getRiskBadge(client.riskLevel)}
                            {getComplianceBadge(client.complianceStatus)}
                          </div>
                          <div className="mt-2 flex justify-between text-muted-foreground text-xs">
                            <span>
                              Last contact: {formatDate(client.lastContactDate)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Calendar view
                <div className="space-y-4">
                  {filteredClients
                    .sort(
                      (a, b) =>
                        new Date(b.lastActivity || 0).getTime() -
                        new Date(a.lastActivity || 0).getTime()
                    )
                    .map((client, index) => (
                      <div className="flex gap-4" key={client.id}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`rounded-full p-2 ${
                              client.status === "active"
                                ? "bg-green-100 text-green-600"
                                : client.status === "onboarding"
                                  ? "bg-blue-100 text-blue-600"
                                  : client.status === "suspended"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Activity className="h-4 w-4" />
                          </div>
                          {index < filteredClients.length - 1 && (
                            <div className="mt-2 h-16 w-0.5 bg-border" />
                          )}
                        </div>
                        <Card
                          className="flex-1 cursor-pointer transition-shadow hover:shadow-md"
                          onClick={() => onClientSelect?.(client)}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`}
                                  />
                                  <AvatarFallback>
                                    {client.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-medium">{client.name}</h3>
                                  <p className="text-muted-foreground text-sm">
                                    Last activity:{" "}
                                    {formatDate(client.lastActivity)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(client.status)}
                                {getRiskBadge(client.riskLevel)}
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="font-medium">
                                  {client.complianceScore}%
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Compliance
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {client.immigrationCasesCount}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Immigration
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {client.documentsCount}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Documents
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {client.pendingTasksCount}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Pending
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
