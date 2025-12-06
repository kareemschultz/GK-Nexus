import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  History,
  MoreHorizontal,
  Plus,
  Search,
  TrendingUp,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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

export const Route = createFileRoute("/immigration")({
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

type ImmigrationCase = {
  id: string;
  caseNumber: string;
  petitionType: string;
  visaCategory: string;
  beneficiaryName: string;
  beneficiaryEmail: string;
  clientId: string;
  clientName: string;
  status:
    | "draft"
    | "filed"
    | "pending"
    | "rfe"
    | "approved"
    | "denied"
    | "completed";
  priority: "normal" | "premium" | "expedite";
  filingDate: string;
  currentStep: string;
  nextAction: string;
  nextActionDate: string;
  attorney: string;
  estimatedCompletion: string;
  progressPercentage: number;
  documents: DocumentRequirement[];
  timeline: TimelineEvent[];
  fees: CaseFees;
  notes?: string;
  tags: string[];
  riskLevel: "low" | "medium" | "high";
  lastUpdated: string;
};

type DocumentRequirement = {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: "pending" | "submitted" | "approved" | "rejected";
  submittedDate?: string;
  approvedDate?: string;
  reviewer?: string;
  notes?: string;
  fileUrl?: string;
  dueDate?: string;
};

type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "filing" | "response" | "decision" | "deadline" | "note";
  status: "completed" | "pending" | "overdue";
  responsible?: string;
};

type CaseFees = {
  governmentFee: number;
  attorneyFee: number;
  premiumProcessing?: number;
  total: number;
  paid: number;
  outstanding: number;
};

type FilterCriteria = {
  searchTerm: string;
  status: string[];
  petitionType: string[];
  priority: string[];
  attorney: string[];
  client: string[];
  tags: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
};

function RouteComponent() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterCriteria>({
    searchTerm: "",
    status: [],
    petitionType: [],
    priority: [],
    attorney: [],
    client: [],
    tags: [],
    dateRange: {},
  });
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [selectedCase, setSelectedCase] = useState<ImmigrationCase | null>(
    null
  );
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "timeline">(
    "list"
  );

  // Fetch immigration cases from API
  const casesQuery = useQuery({
    queryKey: ["immigrationCases", filters.searchTerm],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.immigrationListCases({
        page: 1,
        limit: 100,
        search: filters.searchTerm || undefined,
      });
    },
  });

  // Map API response to ImmigrationCase type
  const immigrationCases: ImmigrationCase[] = useMemo(() => {
    if (!casesQuery.data?.data?.items) return [];

    return casesQuery.data.data.items.map(
      (apiCase: {
        id: string;
        caseNumber: string;
        caseType: string;
        priority: string;
        status: string;
        title: string;
        clientId: string;
        assignedTo: string | null;
        applicationDate: string | Date | null;
        targetCompletionDate: string | Date | null;
        currentStage: string | null;
        updatedAt: string | Date | null;
      }) => ({
        id: apiCase.id,
        caseNumber: apiCase.caseNumber || "N/A",
        petitionType:
          apiCase.caseType?.replace(/_/g, " ").toUpperCase() || "N/A",
        visaCategory: apiCase.caseType?.replace(/_/g, " ") || "N/A",
        beneficiaryName: apiCase.title || "Unnamed Case",
        beneficiaryEmail: "",
        clientId: apiCase.clientId || "",
        clientName: "Client",
        status: (apiCase.status?.toLowerCase() ||
          "pending") as ImmigrationCase["status"],
        priority: (apiCase.priority?.toLowerCase() ||
          "normal") as ImmigrationCase["priority"],
        filingDate: apiCase.applicationDate
          ? new Date(apiCase.applicationDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        currentStep: apiCase.currentStage || "Processing",
        nextAction: "Review case",
        nextActionDate: apiCase.targetCompletionDate
          ? new Date(apiCase.targetCompletionDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        attorney: apiCase.assignedTo || "Unassigned",
        estimatedCompletion: apiCase.targetCompletionDate
          ? new Date(apiCase.targetCompletionDate).toISOString().split("T")[0]
          : "TBD",
        progressPercentage: 50,
        documents: [],
        timeline: [],
        fees: {
          governmentFee: 0,
          attorneyFee: 0,
          total: 0,
          paid: 0,
          outstanding: 0,
        },
        tags: [],
        riskLevel: "medium" as const,
        lastUpdated: apiCase.updatedAt
          ? new Date(apiCase.updatedAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      })
    );
  }, [casesQuery.data]);

  const filteredCases = useMemo(
    () =>
      immigrationCases.filter((case_) => {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          !searchLower ||
          case_.caseNumber.toLowerCase().includes(searchLower) ||
          case_.beneficiaryName.toLowerCase().includes(searchLower) ||
          case_.clientName.toLowerCase().includes(searchLower) ||
          case_.petitionType.toLowerCase().includes(searchLower) ||
          case_.attorney.toLowerCase().includes(searchLower) ||
          case_.tags.some((tag) => tag.toLowerCase().includes(searchLower));

        const matchesStatus =
          filters.status.length === 0 || filters.status.includes(case_.status);
        const matchesPetitionType =
          filters.petitionType.length === 0 ||
          filters.petitionType.includes(case_.petitionType);
        const matchesPriority =
          filters.priority.length === 0 ||
          filters.priority.includes(case_.priority);
        const matchesAttorney =
          filters.attorney.length === 0 ||
          filters.attorney.includes(case_.attorney);
        const matchesClient =
          filters.client.length === 0 ||
          filters.client.includes(case_.clientName);
        const matchesTags =
          filters.tags.length === 0 ||
          filters.tags.some((tag) => case_.tags.includes(tag));

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPetitionType &&
          matchesPriority &&
          matchesAttorney &&
          matchesClient &&
          matchesTags
        );
      }),
    [immigrationCases, filters]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "filed":
        return <Badge variant="secondary">Filed</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "rfe":
        return <Badge variant="destructive">RFE</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "denied":
        return <Badge variant="destructive">Denied</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "premium":
        return (
          <Badge className="text-xs" variant="destructive">
            Premium
          </Badge>
        );
      case "expedite":
        return (
          <Badge className="text-xs" variant="outline">
            Expedite
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return (
          <Badge className="text-xs" variant="destructive">
            High Risk
          </Badge>
        );
      case "medium":
        return (
          <Badge className="text-xs" variant="outline">
            Medium Risk
          </Badge>
        );
      case "low":
        return (
          <Badge className="text-xs" variant="secondary">
            Low Risk
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="text-xs" variant="default">
            Approved
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="text-xs" variant="secondary">
            Submitted
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="text-xs" variant="destructive">
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="text-xs" variant="outline">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="text-xs" variant="outline">
            Pending
          </Badge>
        );
    }
  };

  const getTimelineStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const clearAllFilters = () => {
    setFilters({
      searchTerm: "",
      status: [],
      petitionType: [],
      priority: [],
      attorney: [],
      client: [],
      tags: [],
      dateRange: {},
    });
  };

  const hasActiveFilters = useMemo(
    () =>
      filters.searchTerm ||
      filters.status.length > 0 ||
      filters.petitionType.length > 0 ||
      filters.priority.length > 0 ||
      filters.attorney.length > 0 ||
      filters.client.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange.from ||
      filters.dateRange.to,
    [filters]
  );

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

  const handleFilterChange = (key: keyof FilterCriteria, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCaseSelection = (caseId: string) => {
    setSelectedCases((prev) =>
      prev.includes(caseId)
        ? prev.filter((id) => id !== caseId)
        : [...prev, caseId]
    );
  };

  const selectAllCases = () => {
    setSelectedCases(
      selectedCases.length === filteredCases.length
        ? []
        : filteredCases.map((c) => c.id)
    );
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Immigration Cases
            </h1>
            <p className="text-muted-foreground">
              Track visa applications, monitor status, and manage immigration
              workflows.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Button>
          </div>
        </div>
      </header>

      {/* Enhanced Search and Filters */}
      <section aria-label="Case search and filters" className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Main search bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(e) =>
                      handleFilterChange("searchTerm", e.target.value)
                    }
                    placeholder="Search cases, beneficiaries, clients, or case numbers..."
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
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    className="rounded-none border-x"
                    onClick={() => setViewMode("kanban")}
                    size="sm"
                    variant={viewMode === "kanban" ? "default" : "ghost"}
                  >
                    <TrendingUp className="h-4 w-4" />
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
                  {filters.petitionType.map((type) => (
                    <Badge className="gap-1" key={type} variant="secondary">
                      {type}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromFilter("petitionType", type)}
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
                      {[
                        "draft",
                        "filed",
                        "pending",
                        "rfe",
                        "approved",
                        "denied",
                        "completed",
                      ].map((status) => (
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
                            {status === "rfe" ? "RFE" : status}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-sm">
                      Petition Type
                    </label>
                    <div className="space-y-2">
                      {[
                        "H-1B",
                        "L-1A",
                        "L-1B",
                        "O-1",
                        "PERM",
                        "EB-1",
                        "EB-2",
                        "EB-3",
                      ].map((type) => (
                        <div className="flex items-center space-x-2" key={type}>
                          <Checkbox
                            checked={filters.petitionType.includes(type)}
                            id={`type-${type}`}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                addToFilter("petitionType", type);
                              } else {
                                removeFromFilter("petitionType", type);
                              }
                            }}
                          />
                          <label
                            className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            htmlFor={`type-${type}`}
                          >
                            {type}
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
                      {["normal", "premium", "expedite"].map((priority) => (
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
                      Attorney
                    </label>
                    <div className="space-y-2">
                      {["Sarah Johnson", "Michael Chen", "Emily Davis"].map(
                        (attorney) => (
                          <div
                            className="flex items-center space-x-2"
                            key={attorney}
                          >
                            <Checkbox
                              checked={filters.attorney.includes(attorney)}
                              id={`attorney-${attorney}`}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addToFilter("attorney", attorney);
                                } else {
                                  removeFromFilter("attorney", attorney);
                                }
                              }}
                            />
                            <label
                              className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              htmlFor={`attorney-${attorney}`}
                            >
                              {attorney}
                            </label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Case Overview Stats */}
      <section aria-label="Case overview statistics" className="mb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Total Cases
                  </p>
                  <p className="font-bold text-2xl">
                    {immigrationCases.length}
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
                  <p className="font-medium text-muted-foreground text-sm">
                    Approved Cases
                  </p>
                  <p className="font-bold text-2xl">
                    {
                      immigrationCases.filter((c) => c.status === "approved")
                        .length
                    }
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
                    Pending Cases
                  </p>
                  <p className="font-bold text-2xl">
                    {
                      immigrationCases.filter(
                        (c) => c.status === "pending" || c.status === "filed"
                      ).length
                    }
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    RFE Cases
                  </p>
                  <p className="font-bold text-2xl">
                    {immigrationCases.filter((c) => c.status === "rfe").length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Success Rate
                  </p>
                  <p className="font-bold text-2xl text-green-600">
                    {Math.round(
                      (immigrationCases.filter((c) => c.status === "approved")
                        .length /
                        immigrationCases.length) *
                        100
                    )}
                    %
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bulk actions bar */}
      {selectedCases.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedCases.length} case
                  {selectedCases.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Update
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected
                  </Button>
                  <Button size="sm" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Reassign
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => setSelectedCases([])}
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

      {/* Cases Table */}
      <section aria-label="Immigration cases table">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Immigration Cases ({filteredCases.length})
                  {hasActiveFilters && (
                    <span className="ml-2 font-normal text-muted-foreground text-sm">
                      (filtered from {immigrationCases.length} total)
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Track and manage all immigration petitions and applications.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {filteredCases.length > 0 && (
                  <Checkbox
                    checked={
                      selectedCases.length === filteredCases.length
                        ? true
                        : selectedCases.length > 0
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={selectAllCases}
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCases.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold text-lg">No cases found</h3>
                <p className="text-muted-foreground">
                  {hasActiveFilters
                    ? "Try adjusting your search or filter criteria to find cases."
                    : "Get started by creating your first immigration case."}
                </p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Case
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedCases.length === filteredCases.length
                            ? true
                            : selectedCases.length > 0
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={selectAllCases}
                      />
                    </TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Next Action</TableHead>
                    <TableHead>Attorney</TableHead>
                    <TableHead>Est. Completion</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((case_) => (
                    <TableRow
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedCases.includes(case_.id) ? "bg-muted/25" : ""
                      }`}
                      key={case_.id}
                      onClick={() => {
                        setSelectedCase(case_);
                        setShowCaseDetails(true);
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedCases.includes(case_.id)}
                          onCheckedChange={() => toggleCaseSelection(case_.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{case_.caseNumber}</p>
                            <p className="text-muted-foreground text-xs">
                              {case_.petitionType} - {case_.visaCategory}
                            </p>
                            <div className="mt-1 flex gap-1">
                              {getPriorityBadge(case_.priority)}
                              {getRiskBadge(case_.riskLevel)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {case_.beneficiaryName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {case_.beneficiaryName}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {case_.beneficiaryEmail}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">
                          {case_.clientName}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(case_.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {case_.progressPercentage}%
                          </p>
                          <Progress
                            className="h-2"
                            value={case_.progressPercentage}
                          />
                          <p className="text-muted-foreground text-xs">
                            {case_.currentStep}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {case_.nextAction}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Due: {formatDate(case_.nextActionDate)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{case_.attorney}</TableCell>
                      <TableCell>
                        {formatDate(case_.estimatedCompletion)}
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
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Documents
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              Timeline
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <History className="mr-2 h-4 w-4" />
                              Case History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Case Details Dialog */}
      <Dialog onOpenChange={setShowCaseDetails} open={showCaseDetails}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <div>
                <h2 className="text-xl">{selectedCase?.caseNumber}</h2>
                <p className="font-normal text-muted-foreground text-sm">
                  {selectedCase?.petitionType} - {selectedCase?.beneficiaryName}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Comprehensive case details including timeline, documents, and
              progress tracking.
            </DialogDescription>
          </DialogHeader>

          {selectedCase && (
            <div className="mt-6">
              <Tabs className="w-full" defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="fees">Fees & Billing</TabsTrigger>
                </TabsList>

                <TabsContent className="space-y-6" value="overview">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Case Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="h-5 w-5" />
                          Case Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Case Number:
                          </span>
                          <span className="font-medium">
                            {selectedCase.caseNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Petition Type:
                          </span>
                          <span className="font-medium">
                            {selectedCase.petitionType}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Visa Category:
                          </span>
                          <span className="font-medium">
                            {selectedCase.visaCategory}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Filing Date:
                          </span>
                          <span className="font-medium">
                            {formatDate(selectedCase.filingDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          {getStatusBadge(selectedCase.status)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Priority:
                          </span>
                          {getPriorityBadge(selectedCase.priority) || (
                            <span className="text-sm">Normal</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Progress Tracking */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <TrendingUp className="h-5 w-5" />
                          Progress Tracking
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="mb-2 flex justify-between">
                            <span className="text-muted-foreground text-sm">
                              Overall Progress
                            </span>
                            <span className="font-medium text-sm">
                              {selectedCase.progressPercentage}%
                            </span>
                          </div>
                          <Progress
                            className="h-3"
                            value={selectedCase.progressPercentage}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Current Step:
                            </span>
                            <span className="font-medium">
                              {selectedCase.currentStep}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Next Action:
                            </span>
                            <span className="font-medium">
                              {selectedCase.nextAction}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Due Date:
                            </span>
                            <span className="font-medium">
                              {formatDate(selectedCase.nextActionDate)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Est. Completion:
                            </span>
                            <span className="font-medium">
                              {formatDate(selectedCase.estimatedCompletion)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Beneficiary Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <User className="h-5 w-5" />
                          Beneficiary Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {selectedCase.beneficiaryName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {selectedCase.beneficiaryName}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {selectedCase.beneficiaryEmail}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Client Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Building2 className="h-5 w-5" />
                          Client Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Client:</span>
                          <span className="font-medium">
                            {selectedCase.clientName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Attorney:
                          </span>
                          <span className="font-medium">
                            {selectedCase.attorney}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Risk Level:
                          </span>
                          {getRiskBadge(selectedCase.riskLevel)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent className="space-y-6" value="documents">
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Requirements</CardTitle>
                      <CardDescription>
                        Track document submission and approval status.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedCase.documents.map((doc) => (
                          <div
                            className="flex items-center justify-between rounded-lg border p-4"
                            key={doc.id}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <h4 className="font-medium">{doc.name}</h4>
                                  <p className="text-muted-foreground text-sm">
                                    {doc.description}
                                  </p>
                                  {doc.submittedDate && (
                                    <p className="text-muted-foreground text-xs">
                                      Submitted: {formatDate(doc.submittedDate)}
                                    </p>
                                  )}
                                  {doc.dueDate && (
                                    <p className="text-orange-600 text-xs">
                                      Due: {formatDate(doc.dueDate)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getDocumentStatusBadge(doc.status)}
                              {doc.required && (
                                <Badge className="text-xs" variant="outline">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent className="space-y-6" value="timeline">
                  <Card>
                    <CardHeader>
                      <CardTitle>Case Timeline</CardTitle>
                      <CardDescription>
                        Track important events and milestones in this case.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedCase.timeline.map((event, index) => (
                          <div key={event.id}>
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                {getTimelineStatusIcon(event.status)}
                                {index < selectedCase.timeline.length - 1 && (
                                  <div className="mt-2 h-12 w-0.5 bg-border" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{event.title}</h4>
                                  <span className="text-muted-foreground text-sm">
                                    {formatDate(event.date)}
                                  </span>
                                </div>
                                <p className="mt-1 text-muted-foreground text-sm">
                                  {event.description}
                                </p>
                                {event.responsible && (
                                  <p className="mt-1 text-muted-foreground text-xs">
                                    Responsible: {event.responsible}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent className="space-y-6" value="fees">
                  <Card>
                    <CardHeader>
                      <CardTitle>Fees & Billing</CardTitle>
                      <CardDescription>
                        Track case fees, payments, and outstanding amounts.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Government Fee:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(
                                  selectedCase.fees.governmentFee
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Attorney Fee:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(selectedCase.fees.attorneyFee)}
                              </span>
                            </div>
                            {selectedCase.fees.premiumProcessing && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Premium Processing:
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(
                                    selectedCase.fees.premiumProcessing
                                  )}
                                </span>
                              </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-medium">
                              <span>Total:</span>
                              <span>
                                {formatCurrency(selectedCase.fees.total)}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Paid:
                              </span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(selectedCase.fees.paid)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Outstanding:
                              </span>
                              <span
                                className={`font-medium ${selectedCase.fees.outstanding > 0 ? "text-red-600" : "text-green-600"}`}
                              >
                                {formatCurrency(selectedCase.fees.outstanding)}
                              </span>
                            </div>
                            <div className="pt-2">
                              <Progress
                                className="h-2"
                                value={
                                  (selectedCase.fees.paid /
                                    selectedCase.fees.total) *
                                  100
                                }
                              />
                              <p className="mt-1 text-muted-foreground text-xs">
                                {Math.round(
                                  (selectedCase.fees.paid /
                                    selectedCase.fees.total) *
                                    100
                                )}
                                % paid
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t pt-6">
                <Button
                  onClick={() => setShowCaseDetails(false)}
                  variant="outline"
                >
                  Close
                </Button>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Documents
                </Button>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Update Timeline
                </Button>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
