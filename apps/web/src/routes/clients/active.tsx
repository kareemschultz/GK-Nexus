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

const mockActiveCases: ActiveCase[] = [
  {
    id: "1",
    clientName: "Caribbean Holdings Ltd",
    caseType: "Tax Filing",
    status: "in-progress",
    priority: "high",
    dueDate: "2025-01-15",
    assignedTo: "John Smith",
    lastActivity: "2 hours ago",
  },
  {
    id: "2",
    clientName: "Guyana Mining Corp",
    caseType: "Corporate Registration",
    status: "pending-review",
    priority: "medium",
    dueDate: "2025-01-20",
    assignedTo: "Sarah Johnson",
    lastActivity: "1 day ago",
  },
  {
    id: "3",
    clientName: "Atlantic Shipping Inc",
    caseType: "Immigration Application",
    status: "awaiting-documents",
    priority: "high",
    dueDate: "2025-01-10",
    assignedTo: "Mike Brown",
    lastActivity: "3 hours ago",
  },
  {
    id: "4",
    clientName: "Georgetown Retail Ltd",
    caseType: "VAT Registration",
    status: "scheduled",
    priority: "low",
    dueDate: "2025-02-01",
    assignedTo: "Emily Davis",
    lastActivity: "5 days ago",
  },
];

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
            <div className="font-bold text-2xl">{mockActiveCases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-destructive">
              {mockActiveCases.filter((c) => c.priority === "high").length}
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
                mockActiveCases.filter((c) => c.status === "awaiting-documents")
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
        {mockActiveCases.map((activeCase) => (
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

      {mockActiveCases.length === 0 && (
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
