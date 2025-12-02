import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  User,
  XCircle,
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
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/appointments/requests")({
  component: AppointmentRequestsPage,
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

interface AppointmentRequest {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  requestedDate: string;
  requestedTime: string;
  serviceType: string;
  notes: string;
  status: "pending" | "approved" | "declined";
  submittedAt: string;
}

const appointmentRequests: AppointmentRequest[] = [
  {
    id: "1",
    clientName: "Maria Santos",
    clientEmail: "maria.santos@email.com",
    clientPhone: "+592 654-7890",
    requestedDate: "2025-01-15",
    requestedTime: "10:00 AM",
    serviceType: "Tax Consultation",
    notes: "Need help with corporate tax filing for 2024",
    status: "pending",
    submittedAt: "2025-01-10",
  },
  {
    id: "2",
    clientName: "Robert Chen",
    clientEmail: "robert.chen@company.com",
    clientPhone: "+592 555-1234",
    requestedDate: "2025-01-16",
    requestedTime: "2:00 PM",
    serviceType: "Immigration Services",
    notes: "Work permit application for expatriate employee",
    status: "pending",
    submittedAt: "2025-01-09",
  },
  {
    id: "3",
    clientName: "Aisha Williams",
    clientEmail: "aisha.w@business.gy",
    clientPhone: "+592 789-0123",
    requestedDate: "2025-01-14",
    requestedTime: "11:00 AM",
    serviceType: "Payroll Setup",
    notes: "Setting up payroll for new company with 15 employees",
    status: "approved",
    submittedAt: "2025-01-08",
  },
  {
    id: "4",
    clientName: "James Persaud",
    clientEmail: "james.p@email.com",
    clientPhone: "+592 456-7890",
    requestedDate: "2025-01-12",
    requestedTime: "3:00 PM",
    serviceType: "Document Review",
    notes: "Review of incorporation documents",
    status: "declined",
    submittedAt: "2025-01-05",
  },
];

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
  approved: {
    label: "Approved",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  declined: {
    label: "Declined",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

function AppointmentRequestsPage() {
  const pendingCount = appointmentRequests.filter(
    (r) => r.status === "pending"
  ).length;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">
          Appointment Requests
        </h1>
        <p className="mt-2 text-muted-foreground">
          Review and manage client appointment requests
        </p>
      </header>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-amber-500">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Approved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-600">
              {
                appointmentRequests.filter((r) => r.status === "approved")
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-red-600">
              {
                appointmentRequests.filter((r) => r.status === "declined")
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {appointmentRequests.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Requests</CardTitle>
          <CardDescription>
            Appointment requests submitted through the client portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointmentRequests.map((request) => {
              const StatusIcon = statusConfig[request.status].icon;
              return (
                <div
                  className={`rounded-lg border p-4 ${
                    request.status === "pending"
                      ? "ring-2 ring-amber-500/20"
                      : ""
                  }`}
                  key={request.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {request.clientName}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {request.serviceType}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{request.clientEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{request.clientPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {request.requestedDate} at {request.requestedTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Submitted: {request.submittedAt}</span>
                        </div>
                      </div>
                      {request.notes && (
                        <p className="mt-2 text-muted-foreground text-sm">
                          <span className="font-medium">Notes:</span>{" "}
                          {request.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={statusConfig[request.status].variant}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig[request.status].label}
                      </Badge>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Decline
                          </Button>
                          <Button size="sm">Approve</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
