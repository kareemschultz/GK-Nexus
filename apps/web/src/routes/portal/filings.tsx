import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  MapPin,
  Search,
  Shield,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/portal/filings")({
  component: FilingsPage,
});

interface Filing {
  id: string;
  title: string;
  type: string;
  period: string;
  dueDate: string;
  submittedDate: string | null;
  status: string;
  amount: string;
  filingNumber: string | null;
  description: string;
  priority: string;
}

const complianceMetrics = [
  {
    category: "GIT Returns",
    completed: 11,
    total: 12,
    percentage: 92,
    trend: "+2%",
    nextDue: "2025-01-15",
    status: "good",
  },
  {
    category: "PAYE Submissions",
    completed: 12,
    total: 12,
    percentage: 100,
    trend: "+0%",
    nextDue: "2025-01-15",
    status: "excellent",
  },
  {
    category: "WHT Returns",
    completed: 3,
    total: 4,
    percentage: 75,
    trend: "-25%",
    nextDue: "2025-01-31",
    status: "attention",
  },
  {
    category: "Corporation Tax",
    completed: 1,
    total: 1,
    percentage: 100,
    trend: "+0%",
    nextDue: "2025-03-31",
    status: "excellent",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "submitted":
    case "approved":
    case "completed":
      return "default";
    case "pending":
    case "upcoming":
      return "secondary";
    case "overdue":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "submitted":
      return <Clock aria-hidden="true" className="h-4 w-4" />;
    case "approved":
    case "completed":
      return <CheckCircle2 aria-hidden="true" className="h-4 w-4" />;
    case "pending":
    case "upcoming":
      return <AlertCircle aria-hidden="true" className="h-4 w-4" />;
    case "overdue":
      return <XCircle aria-hidden="true" className="h-4 w-4" />;
    default:
      return <FileText aria-hidden="true" className="h-4 w-4" />;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent":
      return "destructive";
    case "high":
      return "default";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "outline";
  }
}

function getComplianceStatusColor(status: string) {
  switch (status) {
    case "excellent":
      return "text-green-600";
    case "good":
      return "text-blue-600";
    case "attention":
      return "text-amber-600";
    case "critical":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

function getDaysUntilColor(days: number) {
  if (days < 0) return "destructive";
  if (days <= 7) return "destructive";
  if (days <= 14) return "secondary";
  return "outline";
}

function FilingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Fetch filings from API
  const { data: filingsResponse, isLoading } = useQuery({
    queryKey: ["tax", "filings"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.tax.filings.list({});
    },
  });

  // Map API response to component format
  const filings: Filing[] = useMemo(() => {
    const apiFilings = filingsResponse?.data?.items || [];
    return apiFilings.map((f: any) => {
      const dueDate = f.dueDate || new Date().toISOString().split("T")[0];
      const now = new Date();
      const due = new Date(dueDate);
      const daysUntil = Math.ceil(
        (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let status = f.status || "pending";
      if (status === "completed") status = "approved";
      if (daysUntil < 0 && status === "pending") status = "overdue";

      let priority = "medium";
      if (daysUntil < 0) priority = "urgent";
      else if (daysUntil <= 7) priority = "high";
      else if (daysUntil <= 14) priority = "medium";
      else priority = "low";

      return {
        id: f.id,
        title: `${f.type?.replace(/_/g, " ")} - ${f.period}`,
        type: f.type?.split("_")[0] || "TAX",
        period: f.period || "2024",
        dueDate,
        submittedDate: f.submittedAt,
        status,
        amount: f.amount ? `GYD ${f.amount.toLocaleString()}` : "TBD",
        filingNumber: f.graReference,
        description: `${f.type?.replace(/_/g, " ")} filing`,
        priority,
      };
    });
  }, [filingsResponse]);

  // Calculate upcoming deadlines from filings
  const upcomingDeadlines = useMemo(
    () =>
      filings
        .filter((f) => f.status === "pending" || f.status === "upcoming")
        .map((f) => {
          const due = new Date(f.dueDate);
          const now = new Date();
          const daysUntil = Math.ceil(
            (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return {
            id: f.id,
            title: f.title,
            type: f.type,
            dueDate: f.dueDate,
            daysUntil,
            priority: f.priority,
            description: f.description,
          };
        })
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 5),
    [filings]
  );

  const filteredFilings = filings.filter((filing) => {
    const matchesSearch =
      filing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filing.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filing.period.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || filing.status === filterStatus;
    const matchesType = filterType === "all" || filing.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const overallComplianceRate = Math.round(
    complianceMetrics.reduce((sum, metric) => sum + metric.percentage, 0) /
      complianceMetrics.length
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading filings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-bold text-3xl text-foreground">Filing Status</h1>
        <p className="text-muted-foreground">
          Track your GRA submissions, compliance status, and upcoming deadlines
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-green-50 p-2 dark:bg-green-950">
                <CheckCircle2
                  aria-hidden="true"
                  className="h-4 w-4 text-green-600"
                />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {overallComplianceRate}%
                </p>
                <p className="text-muted-foreground text-xs">Compliance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-blue-50 p-2 dark:bg-blue-950">
                <FileText
                  aria-hidden="true"
                  className="h-4 w-4 text-blue-600"
                />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {
                    filings.filter(
                      (f) => f.status === "submitted" || f.status === "approved"
                    ).length
                  }
                </p>
                <p className="text-muted-foreground text-xs">Filed This Year</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-amber-50 p-2 dark:bg-amber-950">
                <AlertTriangle
                  aria-hidden="true"
                  className="h-4 w-4 text-amber-600"
                />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {upcomingDeadlines.length}
                </p>
                <p className="text-muted-foreground text-xs">
                  Upcoming Deadlines
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-red-50 p-2 dark:bg-red-950">
                <XCircle aria-hidden="true" className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {filings.filter((f) => f.status === "overdue").length}
                </p>
                <p className="text-muted-foreground text-xs">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 aria-hidden="true" className="h-5 w-5" />
            <span>Compliance Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {complianceMetrics.map((metric) => (
              <div className="space-y-3" key={metric.category}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">
                    {metric.category}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={getComplianceStatusColor(metric.status)}
                      variant="outline"
                    >
                      {metric.percentage}%
                    </Badge>
                    <span
                      className={`text-sm ${
                        metric.trend.startsWith("+")
                          ? "text-green-600"
                          : metric.trend.startsWith("-")
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <Progress
                  aria-label={`${metric.category} compliance progress: ${metric.percentage}%`}
                  className="h-2"
                  value={metric.percentage}
                />
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>
                    {metric.completed} of {metric.total} completed
                  </span>
                  <span>
                    Next due: {new Date(metric.nextDue).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin aria-hidden="true" className="h-5 w-5" />
            <span>Upcoming Deadlines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No upcoming deadlines
              </div>
            ) : (
              upcomingDeadlines.map((deadline) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  key={deadline.id}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`rounded-full p-2 ${
                        deadline.priority === "urgent"
                          ? "bg-red-50 dark:bg-red-950"
                          : deadline.priority === "high"
                            ? "bg-amber-50 dark:bg-amber-950"
                            : "bg-blue-50 dark:bg-blue-950"
                      }`}
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className={`h-4 w-4 ${
                          deadline.priority === "urgent"
                            ? "text-red-600"
                            : deadline.priority === "high"
                              ? "text-amber-600"
                              : "text-blue-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {deadline.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {deadline.description}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Due: {new Date(deadline.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={getDaysUntilColor(deadline.daysUntil)}>
                      {deadline.daysUntil < 0
                        ? "OVERDUE"
                        : `${deadline.daysUntil} days`}
                    </Badge>
                    <Badge variant={getPriorityColor(deadline.priority)}>
                      {deadline.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield aria-hidden="true" className="h-5 w-5" />
            <span>Filing History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground"
              />
              <Input
                aria-label="Search filings"
                className="pl-10"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search filings..."
                value={searchQuery}
              />
            </div>
            <Select onValueChange={setFilterStatus} value={filterStatus}>
              <SelectTrigger
                aria-label="Filter by status"
                className="w-full sm:w-48"
              >
                <Filter aria-hidden="true" className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setFilterType} value={filterType}>
              <SelectTrigger
                aria-label="Filter by type"
                className="w-full sm:w-48"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="VAT">VAT</SelectItem>
                <SelectItem value="PAYE">PAYE</SelectItem>
                <SelectItem value="CORPORATE">Corporate Tax</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs className="space-y-4" defaultValue="table">
            <TabsList>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filing</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFilings.map((filing) => (
                      <TableRow className="hover:bg-muted/50" key={filing.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {filing.title}
                            </p>
                            {filing.filingNumber && (
                              <p className="text-muted-foreground text-sm">
                                #{filing.filingNumber}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{filing.type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {filing.period}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(filing.status)}>
                            {getStatusIcon(filing.status)}
                            <span className="ml-1 capitalize">
                              {filing.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(filing.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {filing.amount}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              aria-label={`View ${filing.title}`}
                              size="sm"
                              variant="ghost"
                            >
                              <Eye aria-hidden="true" className="h-4 w-4" />
                            </Button>
                            {filing.status === "approved" && (
                              <Button
                                aria-label={`Download ${filing.title}`}
                                size="sm"
                                variant="ghost"
                              >
                                <Download
                                  aria-hidden="true"
                                  className="h-4 w-4"
                                />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <div className="space-y-6">
                {filteredFilings.map((filing, index) => (
                  <div
                    className="relative flex items-start space-x-4"
                    key={filing.id}
                  >
                    {index < filteredFilings.length - 1 && (
                      <div className="absolute top-12 left-6 h-20 w-0.5 bg-border" />
                    )}

                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                        filing.status === "approved"
                          ? "bg-green-50 dark:bg-green-950"
                          : filing.status === "submitted"
                            ? "bg-blue-50 dark:bg-blue-950"
                            : filing.status === "overdue"
                              ? "bg-red-50 dark:bg-red-950"
                              : "bg-amber-50 dark:bg-amber-950"
                      }`}
                    >
                      {getStatusIcon(filing.status)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-foreground">
                                  {filing.title}
                                </h3>
                                <Badge variant={getStatusColor(filing.status)}>
                                  {filing.status}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground text-sm">
                                {filing.description}
                              </p>
                              <div className="flex items-center space-x-4 text-muted-foreground text-sm">
                                <span>Period: {filing.period}</span>
                                <span>
                                  Due:{" "}
                                  {new Date(
                                    filing.dueDate
                                  ).toLocaleDateString()}
                                </span>
                                {filing.submittedDate && (
                                  <span>
                                    Submitted:{" "}
                                    {new Date(
                                      filing.submittedDate
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-foreground text-sm">
                                {filing.amount}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={getPriorityColor(filing.priority)}
                              >
                                {filing.priority}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {filteredFilings.length === 0 && (
            <div className="py-12 text-center">
              <FileText
                aria-hidden="true"
                className="mx-auto mb-4 h-12 w-12 text-muted-foreground"
              />
              <h3 className="mb-2 font-medium text-foreground text-lg">
                No filings found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== "all" || filterType !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Your filing history will appear here as submissions are processed."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
