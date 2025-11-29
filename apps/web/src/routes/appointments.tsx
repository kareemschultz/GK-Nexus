import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Clock, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/appointments")({
  component: AppointmentsPage,
});

function AppointmentsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Appointments</h1>
            <p className="text-muted-foreground">
              Manage client appointments and scheduling
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </div>
      </header>

      <div className="mb-8 grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">67</div>
            <p className="text-muted-foreground text-xs">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">23</div>
            <p className="text-muted-foreground text-xs">Upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">38</div>
            <p className="text-muted-foreground text-xs">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Cancelled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">6</div>
            <p className="text-muted-foreground text-xs">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
          <CardDescription>
            Latest scheduled and completed appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: "1",
                client: "Acme Corp",
                date: "2024-01-15",
                time: "10:00 AM",
                type: "Tax Consultation",
                status: "scheduled",
              },
              {
                id: "2",
                client: "TechStart Inc",
                date: "2024-01-14",
                time: "2:00 PM",
                type: "Payroll Review",
                status: "completed",
              },
              {
                id: "3",
                client: "Local Business Ltd",
                date: "2024-01-13",
                time: "11:00 AM",
                type: "Compliance Check",
                status: "completed",
              },
            ].map((appointment) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4"
                key={appointment.id}
              >
                <div className="flex items-center space-x-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{appointment.client}</p>
                    <p className="text-muted-foreground text-sm">
                      {appointment.type} • {appointment.date} at{" "}
                      {appointment.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      appointment.status === "completed"
                        ? "secondary"
                        : "default"
                    }
                  >
                    {appointment.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
