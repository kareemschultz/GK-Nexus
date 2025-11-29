import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Star,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents/requirements")({
  component: DocumentRequirementsPage,
});

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "review" | "approved" | "rejected";
  dueDate?: string;
  assignedTo?: string;
  requiredForCase: string[];
  templateId?: string;
  uploadedDocumentId?: string;
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
  isOptional: boolean;
  dependencies: string[];
  estimatedCompletionTime: number; // in hours
  completionPercentage: number;
  lastUpdated: string;
  tags: string[];
}

interface RequirementChecklist {
  id: string;
  name: string;
  description: string;
  caseId?: string;
  clientId?: string;
  type: "immigration" | "tax" | "corporate" | "compliance" | "general";
  status: "draft" | "active" | "completed" | "archived";
  requirements: string[]; // requirement IDs
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  totalRequirements: number;
  completedRequirements: number;
  approvedRequirements: number;
  pendingRequirements: number;
  dueDate?: string;
  priority: "low" | "medium" | "high" | "critical";
}

const mockRequirements: DocumentRequirement[] = [
  {
    id: "req-1",
    name: "Passport Copy (Certified)",
    description:
      "Certified copy of current passport, all pages including blank pages",
    category: "Identity",
    priority: "critical",
    status: "approved",
    dueDate: "2024-02-15",
    assignedTo: "client-123",
    requiredForCase: ["case-visa-001"],
    templateId: "template-passport",
    uploadedDocumentId: "doc-456",
    submittedBy: "client-123",
    submittedAt: "2024-01-10T10:00:00Z",
    reviewedBy: "agent-001",
    reviewedAt: "2024-01-11T14:30:00Z",
    reviewComments: "Document accepted. Clear copy with all required pages.",
    isOptional: false,
    dependencies: [],
    estimatedCompletionTime: 2,
    completionPercentage: 100,
    lastUpdated: "2024-01-11T14:30:00Z",
    tags: ["identity", "passport", "certified"],
  },
  {
    id: "req-2",
    name: "Educational Certificates",
    description:
      "Original or certified copies of all educational certificates and transcripts",
    category: "Education",
    priority: "high",
    status: "in_progress",
    dueDate: "2024-02-20",
    assignedTo: "client-123",
    requiredForCase: ["case-visa-001"],
    isOptional: false,
    dependencies: ["req-1"],
    estimatedCompletionTime: 4,
    completionPercentage: 75,
    lastUpdated: "2024-01-15T09:00:00Z",
    tags: ["education", "certificates", "transcripts"],
  },
  {
    id: "req-3",
    name: "Employment Letter",
    description:
      "Letter from current employer confirming employment status and salary",
    category: "Employment",
    priority: "high",
    status: "review",
    dueDate: "2024-02-10",
    assignedTo: "client-123",
    requiredForCase: ["case-visa-001"],
    uploadedDocumentId: "doc-789",
    submittedBy: "client-123",
    submittedAt: "2024-01-12T16:00:00Z",
    isOptional: false,
    dependencies: [],
    estimatedCompletionTime: 1,
    completionPercentage: 100,
    lastUpdated: "2024-01-12T16:00:00Z",
    tags: ["employment", "salary", "verification"],
  },
  {
    id: "req-4",
    name: "Bank Statements (6 months)",
    description: "Last 6 months of bank statements showing financial stability",
    category: "Financial",
    priority: "medium",
    status: "pending",
    dueDate: "2024-02-25",
    assignedTo: "client-123",
    requiredForCase: ["case-visa-001"],
    isOptional: false,
    dependencies: [],
    estimatedCompletionTime: 3,
    completionPercentage: 0,
    lastUpdated: "2024-01-08T12:00:00Z",
    tags: ["financial", "bank-statements", "proof-of-funds"],
  },
  {
    id: "req-5",
    name: "Medical Examination",
    description: "Medical examination by panel physician (Form IMM 1017E)",
    category: "Medical",
    priority: "high",
    status: "rejected",
    dueDate: "2024-02-18",
    assignedTo: "client-123",
    requiredForCase: ["case-visa-001"],
    uploadedDocumentId: "doc-101",
    submittedBy: "client-123",
    submittedAt: "2024-01-14T11:00:00Z",
    reviewedBy: "agent-002",
    reviewedAt: "2024-01-15T13:00:00Z",
    reviewComments: "Form incomplete. Please complete section 4 and resubmit.",
    isOptional: false,
    dependencies: [],
    estimatedCompletionTime: 6,
    completionPercentage: 80,
    lastUpdated: "2024-01-15T13:00:00Z",
    tags: ["medical", "examination", "panel-physician"],
  },
  {
    id: "req-6",
    name: "Police Clearance Certificate",
    description: "Police clearance certificate from country of residence",
    category: "Background",
    priority: "critical",
    status: "pending",
    dueDate: "2024-03-01",
    assignedTo: "client-123",
    requiredForCase: ["case-visa-001"],
    isOptional: false,
    dependencies: ["req-1"],
    estimatedCompletionTime: 8,
    completionPercentage: 25,
    lastUpdated: "2024-01-09T14:00:00Z",
    tags: ["background", "police", "clearance"],
  },
];

const mockChecklists: RequirementChecklist[] = [
  {
    id: "checklist-1",
    name: "Express Entry - Federal Skilled Worker",
    description:
      "Complete document checklist for Express Entry application under Federal Skilled Worker program",
    caseId: "case-visa-001",
    clientId: "client-123",
    type: "immigration",
    status: "active",
    requirements: ["req-1", "req-2", "req-3", "req-4", "req-5", "req-6"],
    createdBy: "agent-001",
    createdAt: "2024-01-05T10:00:00Z",
    totalRequirements: 6,
    completedRequirements: 1,
    approvedRequirements: 1,
    pendingRequirements: 3,
    dueDate: "2024-03-01",
    priority: "high",
  },
  {
    id: "checklist-2",
    name: "Corporate Tax Compliance",
    description:
      "Annual corporate tax filing requirements and supporting documents",
    caseId: "case-tax-002",
    clientId: "client-456",
    type: "tax",
    status: "completed",
    requirements: ["req-7", "req-8", "req-9"],
    createdBy: "agent-002",
    createdAt: "2024-01-01T09:00:00Z",
    completedAt: "2024-01-20T17:00:00Z",
    totalRequirements: 3,
    completedRequirements: 3,
    approvedRequirements: 3,
    pendingRequirements: 0,
    priority: "medium",
  },
];

const categories = [
  "All Categories",
  "Identity",
  "Education",
  "Employment",
  "Financial",
  "Medical",
  "Background",
  "Legal",
];

const priorities = [
  { value: "critical", label: "Critical", color: "text-red-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "low", label: "Low", color: "text-green-600" },
];

const statuses = [
  { value: "pending", label: "Pending", color: "text-gray-600", icon: Circle },
  {
    value: "in_progress",
    label: "In Progress",
    color: "text-blue-600",
    icon: Clock,
  },
  {
    value: "review",
    label: "Under Review",
    color: "text-purple-600",
    icon: RefreshCw,
  },
  {
    value: "approved",
    label: "Approved",
    color: "text-green-600",
    icon: CheckCircle,
  },
  {
    value: "rejected",
    label: "Rejected",
    color: "text-red-600",
    icon: XCircle,
  },
];

function DocumentRequirementsPage() {
  const [activeTab, setActiveTab] = useState("requirements");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedRequirement, setSelectedRequirement] =
    useState<DocumentRequirement | null>(null);
  const [selectedChecklist, setSelectedChecklist] =
    useState<RequirementChecklist | null>(null);
  const [isRequirementDialogOpen, setIsRequirementDialogOpen] = useState(false);
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [isCreateRequirementOpen, setIsCreateRequirementOpen] = useState(false);
  const [isCreateChecklistOpen, setIsCreateChecklistOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    const statusConfig = statuses.find((s) => s.value === status);
    if (!statusConfig) return Circle;
    return statusConfig.icon;
  };

  const getStatusColor = (status: string) => {
    const statusConfig = statuses.find((s) => s.value === status);
    return statusConfig?.color || "text-gray-600";
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = priorities.find((p) => p.value === priority);
    return priorityConfig?.color || "text-gray-600";
  };

  const filteredRequirements = mockRequirements.filter((requirement) => {
    const matchesSearch =
      requirement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      requirement.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      requirement.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "All Categories" ||
      requirement.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "all" || requirement.status === selectedStatus;

    const matchesPriority =
      selectedPriority === "all" || requirement.priority === selectedPriority;

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  const filteredChecklists = mockChecklists.filter((checklist) => {
    const matchesSearch =
      checklist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checklist.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleRequirementClick = (requirement: DocumentRequirement) => {
    setSelectedRequirement(requirement);
    setIsRequirementDialogOpen(true);
  };

  const handleChecklistClick = (checklist: RequirementChecklist) => {
    setSelectedChecklist(checklist);
    setIsChecklistDialogOpen(true);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString();

  const getDueDateStatus = (dueDate?: string) => {
    if (!dueDate) return "none";
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "overdue";
    if (diffDays <= 3) return "urgent";
    if (diffDays <= 7) return "warning";
    return "normal";
  };

  return (
    <div className="container mx-auto max-w-full px-4 py-6">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <Button asChild size="sm" variant="ghost">
            <Link to="/documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Document Requirements
            </h1>
            <p className="text-muted-foreground">
              Manage document checklists and track submission progress
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreateRequirementOpen(true)}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Requirement
            </Button>
            <Button onClick={() => setIsCreateChecklistOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Checklist
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Active Checklists
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {mockChecklists.filter((c) => c.status === "active").length}
            </div>
            <p className="text-muted-foreground text-xs">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {mockRequirements.filter((r) => r.status === "review").length}
            </div>
            <p className="text-muted-foreground text-xs">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Overdue Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {
                mockRequirements.filter(
                  (r) => r.dueDate && getDueDateStatus(r.dueDate) === "overdue"
                ).length
              }
            </div>
            <p className="text-muted-foreground text-xs">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Completion Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {Math.round(
                (mockRequirements.filter((r) => r.status === "approved")
                  .length /
                  mockRequirements.length) *
                  100
              )}
              %
            </div>
            <p className="text-muted-foreground text-xs">Overall progress</p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="checklists">Checklists</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
              />
            </div>

            {activeTab === "requirements" && (
              <>
                <Select
                  onValueChange={setSelectedCategory}
                  value={selectedCategory}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  onValueChange={setSelectedStatus}
                  value={selectedStatus}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  onValueChange={setSelectedPriority}
                  value={selectedPriority}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        <TabsContent className="space-y-6" value="requirements">
          {filteredRequirements.length === 0 ? (
            <EmptyState
              description="No document requirements found matching your criteria"
              icon={FileText}
              title="No Requirements"
            />
          ) : (
            <div className="space-y-4">
              {filteredRequirements.map((requirement) => {
                const StatusIcon = getStatusIcon(requirement.status);
                const dueDateStatus = getDueDateStatus(requirement.dueDate);

                return (
                  <Card
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    key={requirement.id}
                    onClick={() => handleRequirementClick(requirement)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-3">
                            <StatusIcon
                              className={cn(
                                "mt-1 h-5 w-5",
                                getStatusColor(requirement.status)
                              )}
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg">
                                    {requirement.name}
                                  </h3>
                                  <p className="text-muted-foreground text-sm">
                                    {requirement.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={cn(
                                      "font-medium",
                                      getPriorityColor(requirement.priority)
                                    )}
                                    variant="outline"
                                  >
                                    {requirement.priority
                                      .charAt(0)
                                      .toUpperCase() +
                                      requirement.priority.slice(1)}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {requirement.category}
                                  </Badge>
                                  {requirement.isOptional && (
                                    <Badge variant="outline">Optional</Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <StatusIcon
                                    className={cn(
                                      "h-3 w-3",
                                      getStatusColor(requirement.status)
                                    )}
                                  />
                                  <span
                                    className={getStatusColor(
                                      requirement.status
                                    )}
                                  >
                                    {
                                      statuses.find(
                                        (s) => s.value === requirement.status
                                      )?.label
                                    }
                                  </span>
                                </div>

                                {requirement.dueDate && (
                                  <div
                                    className={cn(
                                      "flex items-center gap-1",
                                      dueDateStatus === "overdue" &&
                                        "text-red-600",
                                      dueDateStatus === "urgent" &&
                                        "text-orange-600",
                                      dueDateStatus === "warning" &&
                                        "text-yellow-600"
                                    )}
                                  >
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      Due {formatDate(requirement.dueDate)}
                                    </span>
                                  </div>
                                )}

                                {requirement.assignedTo && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{requirement.assignedTo}</span>
                                  </div>
                                )}

                                <div className="text-muted-foreground">
                                  {requirement.estimatedCompletionTime}h
                                  estimated
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Progress</span>
                                  <span>
                                    {requirement.completionPercentage}%
                                  </span>
                                </div>
                                <Progress
                                  className="h-2"
                                  value={requirement.completionPercentage}
                                />
                              </div>

                              {requirement.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {requirement.tags.map((tag) => (
                                    <Badge
                                      className="text-xs"
                                      key={tag}
                                      variant="outline"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent className="space-y-6" value="checklists">
          {filteredChecklists.length === 0 ? (
            <EmptyState
              description="No checklists found matching your criteria"
              icon={FileText}
              title="No Checklists"
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredChecklists.map((checklist) => {
                const completionRate =
                  checklist.totalRequirements > 0
                    ? (checklist.approvedRequirements /
                        checklist.totalRequirements) *
                      100
                    : 0;

                return (
                  <Card
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    key={checklist.id}
                    onClick={() => handleChecklistClick(checklist)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {checklist.name}
                          </CardTitle>
                          <p className="text-muted-foreground text-sm">
                            {checklist.description}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "font-medium",
                            checklist.status === "completed" &&
                              "bg-green-100 text-green-800",
                            checklist.status === "active" &&
                              "bg-blue-100 text-blue-800",
                            checklist.status === "draft" &&
                              "bg-gray-100 text-gray-800"
                          )}
                        >
                          {checklist.status.charAt(0).toUpperCase() +
                            checklist.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Overall Progress</span>
                          <span>{Math.round(completionRate)}%</span>
                        </div>
                        <Progress className="h-2" value={completionRate} />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>
                              {checklist.approvedRequirements} Approved
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span>{checklist.pendingRequirements} Pending</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-gray-600" />
                            <span>{checklist.totalRequirements} Total</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star
                              className={cn(
                                "h-3 w-3",
                                getPriorityColor(checklist.priority)
                              )}
                            />
                            <span
                              className={cn(
                                "capitalize",
                                getPriorityColor(checklist.priority)
                              )}
                            >
                              {checklist.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      {checklist.dueDate && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Calendar className="h-3 w-3" />
                          <span>Due {formatDate(checklist.dueDate)}</span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center justify-between text-muted-foreground text-xs">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{checklist.createdBy}</span>
                        </div>
                        <span>{formatDate(checklist.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Requirement Detail Dialog */}
      <Dialog
        onOpenChange={setIsRequirementDialogOpen}
        open={isRequirementDialogOpen}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequirement && (
                <>
                  {(() => {
                    const StatusIcon = getStatusIcon(
                      selectedRequirement.status
                    );
                    return (
                      <StatusIcon
                        className={cn(
                          "h-5 w-5",
                          getStatusColor(selectedRequirement.status)
                        )}
                      />
                    );
                  })()}
                  {selectedRequirement.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedRequirement?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedRequirement && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium text-sm">Category</Label>
                    <Badge className="ml-2" variant="secondary">
                      {selectedRequirement.category}
                    </Badge>
                  </div>

                  <div>
                    <Label className="font-medium text-sm">Priority</Label>
                    <Badge
                      className={cn(
                        "ml-2 font-medium",
                        getPriorityColor(selectedRequirement.priority)
                      )}
                      variant="outline"
                    >
                      {selectedRequirement.priority.charAt(0).toUpperCase() +
                        selectedRequirement.priority.slice(1)}
                    </Badge>
                  </div>

                  <div>
                    <Label className="font-medium text-sm">Status</Label>
                    <Badge
                      className={cn(
                        "ml-2",
                        getStatusColor(selectedRequirement.status)
                      )}
                      variant="outline"
                    >
                      {
                        statuses.find(
                          (s) => s.value === selectedRequirement.status
                        )?.label
                      }
                    </Badge>
                  </div>

                  <div>
                    <Label className="font-medium text-sm">Progress</Label>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Completion</span>
                        <span>{selectedRequirement.completionPercentage}%</span>
                      </div>
                      <Progress
                        className="h-2"
                        value={selectedRequirement.completionPercentage}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedRequirement.dueDate && (
                    <div>
                      <Label className="font-medium text-sm">Due Date</Label>
                      <p className="mt-1 text-sm">
                        {formatDate(selectedRequirement.dueDate)}
                      </p>
                    </div>
                  )}

                  {selectedRequirement.assignedTo && (
                    <div>
                      <Label className="font-medium text-sm">Assigned To</Label>
                      <p className="mt-1 text-sm">
                        {selectedRequirement.assignedTo}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="font-medium text-sm">
                      Estimated Time
                    </Label>
                    <p className="mt-1 text-sm">
                      {selectedRequirement.estimatedCompletionTime} hours
                    </p>
                  </div>

                  <div>
                    <Label className="font-medium text-sm">Required</Label>
                    <p className="mt-1 text-sm">
                      {selectedRequirement.isOptional ? "Optional" : "Required"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRequirement.submittedAt && (
                <div className="space-y-2">
                  <Label className="font-medium text-sm">
                    Submission Details
                  </Label>
                  <div className="space-y-2 rounded-lg bg-muted p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Submitted by:</span>
                      <span>{selectedRequirement.submittedBy}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Submitted at:</span>
                      <span>
                        {formatDateTime(selectedRequirement.submittedAt)}
                      </span>
                    </div>
                    {selectedRequirement.uploadedDocumentId && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Document ID:</span>
                        <span>{selectedRequirement.uploadedDocumentId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequirement.reviewComments && (
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Review Comments</Label>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm">
                      {selectedRequirement.reviewComments}
                    </p>
                    {selectedRequirement.reviewedBy &&
                      selectedRequirement.reviewedAt && (
                        <div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
                          <span>
                            Reviewed by {selectedRequirement.reviewedBy}
                          </span>
                          <span>
                            {formatDateTime(selectedRequirement.reviewedAt)}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {selectedRequirement.tags.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Tags</Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedRequirement.tags.map((tag) => (
                      <Badge className="text-xs" key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setIsRequirementDialogOpen(false)}
              variant="outline"
            >
              Close
            </Button>
            {selectedRequirement?.templateId && (
              <Button asChild>
                <Link
                  to={`/documents/templates/${selectedRequirement.templateId}`}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Link>
              </Button>
            )}
            {selectedRequirement?.uploadedDocumentId && (
              <Button asChild>
                <Link
                  to={`/documents/${selectedRequirement.uploadedDocumentId}`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Document
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Detail Dialog */}
      <Dialog
        onOpenChange={setIsChecklistDialogOpen}
        open={isChecklistDialogOpen}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{selectedChecklist?.name}</DialogTitle>
            <DialogDescription>
              {selectedChecklist?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedChecklist && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="font-bold text-2xl text-green-600">
                      {selectedChecklist.approvedRequirements}
                    </div>
                    <p className="text-muted-foreground text-sm">Approved</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="font-bold text-2xl text-blue-600">
                      {selectedChecklist.completedRequirements}
                    </div>
                    <p className="text-muted-foreground text-sm">Completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="font-bold text-2xl text-orange-600">
                      {selectedChecklist.pendingRequirements}
                    </div>
                    <p className="text-muted-foreground text-sm">Pending</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="font-bold text-2xl">
                      {selectedChecklist.totalRequirements}
                    </div>
                    <p className="text-muted-foreground text-sm">Total</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Label className="font-medium text-base">Requirements</Label>
                <div className="space-y-2">
                  {selectedChecklist.requirements.map((requirementId) => {
                    const requirement = mockRequirements.find(
                      (r) => r.id === requirementId
                    );
                    if (!requirement) return null;

                    const StatusIcon = getStatusIcon(requirement.status);

                    return (
                      <Card key={requirementId}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <StatusIcon
                              className={cn(
                                "h-4 w-4",
                                getStatusColor(requirement.status)
                              )}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">
                                {requirement.name}
                              </h4>
                              <p className="text-muted-foreground text-sm">
                                {requirement.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={cn(
                                  "text-xs",
                                  getStatusColor(requirement.status)
                                )}
                                variant="outline"
                              >
                                {
                                  statuses.find(
                                    (s) => s.value === requirement.status
                                  )?.label
                                }
                              </Badge>
                              <Badge className="text-xs" variant="secondary">
                                {requirement.category}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setIsChecklistDialogOpen(false)}
              variant="outline"
            >
              Close
            </Button>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
