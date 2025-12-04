import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  MapPin,
  Plus,
  User,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/appointments/calendar")({
  component: CalendarPage,
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

// Generate calendar days
const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // End on Saturday

  const days = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    days.push({
      date: new Date(currentDate),
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: currentDate.toDateString() === new Date().toDateString(),
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};

const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const typeColors: Record<string, string> = {
  CONSULTATION: "bg-blue-100 text-blue-800 border-blue-200",
  DOCUMENT_REVIEW: "bg-green-100 text-green-800 border-green-200",
  TAX_PREPARATION: "bg-orange-100 text-orange-800 border-orange-200",
  COMPLIANCE_MEETING: "bg-purple-100 text-purple-800 border-purple-200",
  OTHER: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusColors: Record<string, string> = {
  SCHEDULED: "border-l-gray-400",
  CONFIRMED: "border-l-blue-500",
  IN_PROGRESS: "border-l-yellow-500",
  COMPLETED: "border-l-green-500",
  CANCELLED: "border-l-red-500",
  NO_SHOW: "border-l-red-300",
};

const priorityColors: Record<string, string> = {
  LOW: "border-r-gray-300",
  MEDIUM: "border-r-yellow-400",
  HIGH: "border-r-orange-500",
  URGENT: "border-r-red-600",
};

function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = generateCalendarDays(year, month);

  // Fetch appointments from API
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ["appointments", "calendar", filterStatus, filterType],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.appointments.list({
        page: 1,
        limit: 100,
        status:
          filterStatus !== "all"
            ? (filterStatus as
                | "SCHEDULED"
                | "CONFIRMED"
                | "IN_PROGRESS"
                | "COMPLETED"
                | "CANCELLED"
                | "NO_SHOW")
            : undefined,
        type:
          filterType !== "all"
            ? (filterType as
                | "CONSULTATION"
                | "DOCUMENT_REVIEW"
                | "TAX_PREPARATION"
                | "COMPLIANCE_MEETING"
                | "OTHER")
            : undefined,
      });
    },
  });

  const appointments = appointmentsData?.data?.items || [];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(month - 1);
    } else {
      newDate.setMonth(month + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  // Get appointments for today
  const today = new Date().toISOString().split("T")[0];
  const todaysAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startTime).toISOString().split("T")[0];
    return aptDate === today;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "secondary";
      case "CONFIRMED":
        return "default";
      case "IN_PROGRESS":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "default";
      case "MEDIUM":
        return "outline";
      case "LOW":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "CONSULTATION":
        return "default";
      case "TAX_PREPARATION":
        return "secondary";
      case "COMPLIANCE_MEETING":
        return "outline";
      default:
        return "default";
    }
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return Math.round((end - start) / (1000 * 60)); // minutes
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              View and manage appointment scheduling
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate({ to: "/appointments/new" })}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
            <Button
              onClick={() => navigate({ to: "/appointments" })}
              variant="outline"
            >
              Back to Appointments
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Calendar Section */}
        <div className="lg:flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {monthNames[month]} {year}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => navigateMonth("prev")}
                      size="sm"
                      variant="outline"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={navigateToToday}
                      size="sm"
                      variant="outline"
                    >
                      Today
                    </Button>
                    <Button
                      onClick={() => navigateMonth("next")}
                      size="sm"
                      variant="outline"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(value: "month" | "week" | "day") =>
                      setViewMode(value)
                    }
                    value={viewMode}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === "month" && (
                <div className="space-y-4">
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day Headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          className="p-2 text-center font-medium text-muted-foreground text-sm"
                          key={day}
                        >
                          {day}
                        </div>
                      )
                    )}

                    {/* Calendar Days */}
                    {calendarDays.map((day, index) => {
                      const dateStr = day.date.toISOString().split("T")[0];
                      const dayAppointments = appointments.filter((apt) => {
                        const aptDate = new Date(apt.startTime)
                          .toISOString()
                          .split("T")[0];
                        return aptDate === dateStr;
                      });

                      return (
                        <div
                          className={`min-h-[100px] cursor-pointer rounded-lg border p-2 transition-colors ${day.isCurrentMonth ? "bg-background" : "bg-muted/30"}
                            ${day.isToday ? "ring-2 ring-primary" : ""}hover:bg-muted/50`}
                          key={index}
                          onClick={() => setSelectedDate(day.date)}
                        >
                          <div
                            className={`mb-1 font-medium text-sm ${day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"}
                            ${day.isToday ? "font-bold text-primary" : ""}
                          `}
                          >
                            {day.date.getDate()}
                          </div>

                          {dayAppointments.length > 0 && (
                            <div className="space-y-1">
                              {dayAppointments
                                .slice(0, 3)
                                .map((appointment) => (
                                  <div
                                    className={`cursor-pointer rounded border-l-2 p-1 text-xs ${typeColors[appointment.type] || typeColors.OTHER}
                                    ${statusColors[appointment.status]}hover:opacity-80`}
                                    key={appointment.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate({
                                        to: "/appointments/$id",
                                        params: { id: appointment.id },
                                      });
                                    }}
                                  >
                                    <div className="truncate font-medium">
                                      {formatTime(appointment.startTime)}{" "}
                                      {appointment.title}
                                    </div>
                                    <div className="truncate text-xs opacity-75">
                                      {appointment.externalClientName ||
                                        "Client"}
                                    </div>
                                  </div>
                                ))}
                              {dayAppointments.length > 3 && (
                                <div className="p-1 text-muted-foreground text-xs">
                                  +{dayAppointments.length - 3} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === "day" && (
                <div className="space-y-4">
                  <div className="mb-4 font-semibold text-lg">
                    {selectedDate
                      ? selectedDate.toDateString()
                      : new Date().toDateString()}
                  </div>
                  <div className="grid gap-2">
                    {timeSlots.map((time) => {
                      const selectedDateStr =
                        selectedDate?.toISOString().split("T")[0] || today;
                      const appointment = appointments.find((apt) => {
                        const aptDate = new Date(apt.startTime)
                          .toISOString()
                          .split("T")[0];
                        const aptTime = formatTime(apt.startTime);
                        return aptDate === selectedDateStr && aptTime === time;
                      });

                      return (
                        <div
                          className="flex items-start gap-4 border-b p-2"
                          key={time}
                        >
                          <div className="w-16 font-mono text-muted-foreground text-sm">
                            {time}
                          </div>
                          <div className="flex-1">
                            {appointment ? (
                              <div
                                className={`cursor-pointer rounded-lg border border-r-4 border-l-4 p-3 transition-all hover:shadow-md ${typeColors[appointment.type] || typeColors.OTHER}
                                    ${statusColors[appointment.status]}
                                    ${priorityColors[appointment.priority]}
                                  `}
                                onClick={() =>
                                  navigate({
                                    to: "/appointments/$id",
                                    params: { id: appointment.id },
                                  })
                                }
                              >
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      {appointment.title}
                                    </div>
                                    <div className="text-muted-foreground text-sm">
                                      {appointment.externalClientName ||
                                        "Client"}
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground text-xs">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {getDuration(
                                          appointment.startTime,
                                          appointment.endTime
                                        )}
                                        min
                                      </span>
                                      {appointment.location && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {appointment.location}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Badge
                                      className="text-xs"
                                      variant={getStatusBadgeVariant(
                                        appointment.status
                                      )}
                                    >
                                      {appointment.status}
                                    </Badge>
                                    <Badge
                                      className="text-xs"
                                      variant={getPriorityBadgeVariant(
                                        appointment.priority
                                      )}
                                    >
                                      {appointment.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <div className="cursor-pointer rounded-lg border border-dashed p-3 text-center text-muted-foreground transition-all hover:border-solid hover:bg-muted/30">
                                    <Plus className="mx-auto mb-1 h-4 w-4" />
                                    <span className="text-sm">
                                      Book appointment
                                    </span>
                                  </div>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Book Appointment</DialogTitle>
                                    <DialogDescription>
                                      Schedule a new appointment for {time} on{" "}
                                      {selectedDate
                                        ? selectedDate.toDateString()
                                        : new Date().toDateString()}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex gap-4 pt-4">
                                    <Button
                                      className="flex-1"
                                      onClick={() =>
                                        navigate({
                                          to: "/appointments/new",
                                          search: {
                                            date: selectedDate
                                              ? selectedDate
                                                  .toISOString()
                                                  .split("T")[0]
                                              : new Date()
                                                  .toISOString()
                                                  .split("T")[0],
                                            time,
                                          },
                                        })
                                      }
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      New Appointment
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:w-80">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block font-medium text-sm">Type</label>
                <Select onValueChange={setFilterType} value={filterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="CONSULTATION">Consultation</SelectItem>
                    <SelectItem value="DOCUMENT_REVIEW">
                      Document Review
                    </SelectItem>
                    <SelectItem value="TAX_PREPARATION">
                      Tax Preparation
                    </SelectItem>
                    <SelectItem value="COMPLIANCE_MEETING">
                      Compliance Meeting
                    </SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block font-medium text-sm">Status</label>
                <Select onValueChange={setFilterStatus} value={filterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setFilterType("all");
                  setFilterStatus("all");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>

          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>{new Date().toDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              {todaysAppointments.length === 0 ? (
                <EmptyState
                  description="No appointments scheduled for today"
                  icon={<CalendarIcon className="h-8 w-8" />}
                  title="Free day"
                />
              ) : (
                <div className="space-y-3">
                  {todaysAppointments.map((appointment) => (
                    <div
                      className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/30"
                      key={appointment.id}
                      onClick={() =>
                        navigate({
                          to: "/appointments/$id",
                          params: { id: appointment.id },
                        })
                      }
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="font-medium text-sm">
                          {appointment.title}
                        </div>
                        <div className="flex gap-1">
                          <Badge
                            className="text-xs"
                            variant={getTypeBadgeVariant(appointment.type)}
                          >
                            {appointment.type}
                          </Badge>
                          <Badge
                            className="text-xs"
                            variant={getStatusBadgeVariant(appointment.status)}
                          >
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1 text-muted-foreground text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(appointment.startTime)} (
                          {getDuration(
                            appointment.startTime,
                            appointment.endTime
                          )}
                          min)
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {appointment.externalClientName || "Client"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium text-sm">Types</h4>
                <div className="space-y-2">
                  {Object.entries(typeColors).map(([type, color]) => (
                    <div className="flex items-center gap-2" key={type}>
                      <div className={`h-3 w-3 rounded border ${color}`} />
                      <span className="text-xs">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-sm">
                  Status (Left Border)
                </h4>
                <div className="space-y-2">
                  {Object.entries(statusColors).map(([status, color]) => (
                    <div className="flex items-center gap-2" key={status}>
                      <div className={`h-3 w-3 rounded border-l-4 ${color}`} />
                      <span className="text-xs">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-sm">
                  Priority (Right Border)
                </h4>
                <div className="space-y-2">
                  {Object.entries(priorityColors).map(([priority, color]) => (
                    <div className="flex items-center gap-2" key={priority}>
                      <div className={`h-3 w-3 rounded border-r-4 ${color}`} />
                      <span className="text-xs">{priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
