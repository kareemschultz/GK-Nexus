import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  FolderOpen,
  Search,
  Users,
} from "lucide-react";
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
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";
export const Route = createFileRoute("/clients/active")({
  component: ActiveCasesPage,
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

interface ActiveCase {
  id: string;
  clientName: string;
  caseType: string;
  status: "in-progress" | "pending-review" | "awaiting-documents" | "scheduled";
  priority: "high" | "medium" | "low";
  dueDate: string;
  assignedTo: string;
  lastActivity: string;
}
const statusConfig = {
  "in-progress": { label: "In Progress", variant: "default" as const },
  "pending-review": { label: "Pending Review", variant: "secondary" as const },
  "awaiting-documents": {
    label: "Awaiting Documents",
    variant: "outline" as const,
  },
  scheduled: { label: "Scheduled", variant: "secondary" as const },
};

const priorityConfig = {
  high: { label: "High", variant: "destructive" as const },
  medium: { label: "Medium", variant: "secondary" as const },
  low: { label: "Low", variant: "outline" as const },
};

function ActiveCasesPage() {
  // Fetch active clients from API
  const { data: clientsResponse, isLoading } = useQuery({
    queryKey: ["activeClients"],
    queryFn: () => orpc.clients.list({ status: "active", page: 1, limit: 100 }),
  });

  // Map clients to ActiveCase type
  const activeCases: ActiveCase[] = (clientsResponse?.data?.items || []).map(
    (client: {
      id: string;
      name: string;
      status: string;
      riskLevel: string | null;
      assignedManager: string | null;
      updatedAt: string | Date | null;
    }) => ({
      id: client.id,
      clientName: client.name,
      caseType: "Client Services",
      status: "in-progress" as const,
      priority: (client.riskLevel?.toLowerCase() === "high"
        ? "high"
        : client.riskLevel?.toLowerCase() === "low"
          ? "low"
          : "medium") as "high" | "medium" | "low",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      assignedTo: client.assignedManager || "Unassigned",
      lastActivity: client.updatedAt
        ? formatRelativeTime(new Date(client.updatedAt))
        : "Recently",
    })
  );

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="ml-3">Loading active cases...</span>
        </div>
      </div>
    );
  }

  // Helper function for relative time formatting
  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return hours <= 1 ? "1 hour ago" : `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Active Cases</h1>
            <p className="mt-2 text-muted-foreground">
              Monitor and manage ongoing client cases
            </p>
          </div>
          <Link to="/clients/new">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              New Client
            </Button>
          </Link>
        </div>
      </header>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search cases..." />
        </div>
        <Button variant="outline">
          <FolderOpen className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{activeCases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-destructive">
              {activeCases.filter((c) => c.priority === "high").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Awaiting Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {
                activeCases.filter((c) => c.status === "awaiting-documents")
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">2</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {activeCases.map((activeCase) => (
          <Card className="transition-all hover:shadow-md" key={activeCase.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {activeCase.clientName}
                    </CardTitle>
                    <CardDescription>{activeCase.caseType}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={priorityConfig[activeCase.priority].variant}>
                    {priorityConfig[activeCase.priority].label}
                  </Badge>
                  <Badge variant={statusConfig[activeCase.status].variant}>
                    {statusConfig[activeCase.status].label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{activeCase.assignedTo}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {activeCase.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{activeCase.lastActivity}</span>
                  </div>
                </div>
                <Link to={`/clients/${activeCase.id}`}>
                  <Button size="sm" variant="ghost">
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeCases.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold text-lg">No Active Cases</h3>
            <p className="text-muted-foreground">
              All client cases have been completed or are not yet started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
