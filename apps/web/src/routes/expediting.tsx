import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  MoreHorizontal,
  Plus,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export const Route = createFileRoute("/expediting")({
  component: ExpeditingPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

type ExpediteRequest = {
  id: string;
  requestNumber: string;
  clientName: string;
  serviceType: string;
  agency: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  submittedDate: string;
  expectedDate: string;
  assignedTo: string;
};

type GovernmentAgency = {
  id: string;
  name: string;
  code: string;
  activeRequests: number;
  avgProcessingDays: number;
  contactPerson: string;
  phone: string;
};

const mockRequests: ExpediteRequest[] = [
  {
    id: "1",
    requestNumber: "EXP-2024-001",
    clientName: "Guyana Mining Corp",
    serviceType: "Mining License Renewal",
    agency: "GGMC",
    status: "IN_PROGRESS",
    priority: "HIGH",
    submittedDate: "2024-11-15",
    expectedDate: "2024-12-15",
    assignedTo: "James Williams",
  },
  {
    id: "2",
    requestNumber: "EXP-2024-002",
    clientName: "Atlantic Trading Ltd",
    serviceType: "Import License",
    agency: "Ministry of Trade",
    status: "PENDING",
    priority: "MEDIUM",
    submittedDate: "2024-11-20",
    expectedDate: "2024-12-20",
    assignedTo: "Sarah Mitchell",
  },
  {
    id: "3",
    requestNumber: "EXP-2024-003",
    clientName: "Green Energy Guyana",
    serviceType: "Environmental Permit",
    agency: "EPA",
    status: "COMPLETED",
    priority: "HIGH",
    submittedDate: "2024-10-01",
    expectedDate: "2024-11-01",
    assignedTo: "Michael Brown",
  },
  {
    id: "4",
    requestNumber: "EXP-2024-004",
    clientName: "Demerara Timber Inc",
    serviceType: "Forestry Concession",
    agency: "GFC",
    status: "DELAYED",
    priority: "URGENT",
    submittedDate: "2024-09-15",
    expectedDate: "2024-10-30",
    assignedTo: "James Williams",
  },
  {
    id: "5",
    requestNumber: "EXP-2024-005",
    clientName: "Berbice Sugar Ltd",
    serviceType: "Tax Exemption Certificate",
    agency: "GRA",
    status: "IN_PROGRESS",
    priority: "LOW",
    submittedDate: "2024-11-25",
    expectedDate: "2025-01-15",
    assignedTo: "Sarah Mitchell",
  },
];

const mockAgencies: GovernmentAgency[] = [
  {
    id: "1",
    name: "Guyana Revenue Authority",
    code: "GRA",
    activeRequests: 12,
    avgProcessingDays: 14,
    contactPerson: "Mr. David Singh",
    phone: "+592 227-6060",
  },
  {
    id: "2",
    name: "Guyana Geology & Mines Commission",
    code: "GGMC",
    activeRequests: 8,
    avgProcessingDays: 30,
    contactPerson: "Ms. Patricia Torres",
    phone: "+592 225-3047",
  },
  {
    id: "3",
    name: "Environmental Protection Agency",
    code: "EPA",
    activeRequests: 5,
    avgProcessingDays: 21,
    contactPerson: "Dr. Marcus Thomas",
    phone: "+592 225-5467",
  },
  {
    id: "4",
    name: "Guyana Forestry Commission",
    code: "GFC",
    activeRequests: 3,
    avgProcessingDays: 45,
    contactPerson: "Mr. Andrew James",
    phone: "+592 226-7271",
  },
  {
    id: "5",
    name: "Ministry of Trade",
    code: "MOT",
    activeRequests: 15,
    avgProcessingDays: 10,
    contactPerson: "Ms. Linda Charles",
    phone: "+592 226-2505",
  },
];

function ExpeditingPage() {
  const [activeTab, setActiveTab] = useState("requests");

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      PENDING: "outline",
      IN_PROGRESS: "default",
      COMPLETED: "secondary",
      DELAYED: "destructive",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-blue-100 text-blue-800",
      HIGH: "bg-orange-100 text-orange-800",
      URGENT: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[priority]}`}
      >
        {priority}
      </span>
    );
  };

  const totalRequests = mockRequests.length;
  const inProgressRequests = mockRequests.filter(
    (r) => r.status === "IN_PROGRESS"
  ).length;
  const completedRequests = mockRequests.filter(
    (r) => r.status === "COMPLETED"
  ).length;
  const delayedRequests = mockRequests.filter(
    (r) => r.status === "DELAYED"
  ).length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Government Expediting Services
            </h1>
            <p className="text-muted-foreground">
              Manage and track government application expediting requests across
              agencies.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Total Requests
                </p>
                <p className="font-bold text-2xl">{totalRequests}</p>
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
                  In Progress
                </p>
                <p className="font-bold text-2xl">{inProgressRequests}</p>
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
                  Completed
                </p>
                <p className="font-bold text-2xl">{completedRequests}</p>
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
                  Delayed
                </p>
                <p className="font-bold text-2xl">{delayedRequests}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Expediting Dashboard</CardTitle>
          <CardDescription>
            Track all government expediting requests and agency relationships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="requests">
                <FileText className="mr-2 h-4 w-4" />
                Requests
              </TabsTrigger>
              <TabsTrigger value="agencies">
                <TrendingUp className="mr-2 h-4 w-4" />
                Agencies
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Timer className="mr-2 h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Expected Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.requestNumber}
                      </TableCell>
                      <TableCell>{request.clientName}</TableCell>
                      <TableCell>{request.serviceType}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.agency}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {getPriorityBadge(request.priority)}
                      </TableCell>
                      <TableCell>{request.expectedDate}</TableCell>
                      <TableCell>{request.assignedTo}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Update Status</DropdownMenuItem>
                            <DropdownMenuItem>Add Note</DropdownMenuItem>
                            <DropdownMenuItem>View Documents</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="agencies">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Active Requests</TableHead>
                    <TableHead>Avg. Processing Days</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAgencies.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell className="font-medium">
                        {agency.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{agency.code}</Badge>
                      </TableCell>
                      <TableCell>{agency.activeRequests}</TableCell>
                      <TableCell>{agency.avgProcessingDays} days</TableCell>
                      <TableCell>{agency.contactPerson}</TableCell>
                      <TableCell>{agency.phone}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>View Requests</DropdownMenuItem>
                            <DropdownMenuItem>Contact Info</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="timeline">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Timer className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Request Timeline</h3>
                <p className="text-muted-foreground">
                  View the timeline and milestones for all expediting requests.
                </p>
                <Button className="mt-4" variant="outline">
                  View Full Timeline
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
