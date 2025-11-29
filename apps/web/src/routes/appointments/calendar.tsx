import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  Plus,
  User,
  Users,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/appointments/calendar")({
  component: CalendarPage,
});

// Mock appointment data for the calendar
const mockAppointments = [
  {
    id: "1",
    title: "Tax Consultation",
    client: "Acme Corp",
    time: "10:00",
    duration: 60,
    status: "SCHEDULED",
    priority: "MEDIUM",
    assignedTo: "Sarah Johnson",
    location: "Office",
    department: "KAJ",
  },
  {
    id: "2",
    title: "VAT Return Review",
    client: "TechStart Inc",
    time: "14:00",
    duration: 90,
    status: "CONFIRMED",
    priority: "HIGH",
    assignedTo: "Michael Chen",
    location: "Online",
    department: "KAJ",
  },
  {
    id: "3",
    title: "Compliance Check",
    client: "Local Business Ltd",
    time: "11:00",
    duration: 45,
    status: "COMPLETED",
    priority: "LOW",
    assignedTo: "Emily Davis",
    location: "Client Site",
    department: "COMPLIANCE",
  },
  {
    id: "4",
    title: "Business Registration",
    client: "StartUp Co",
    time: "09:00",
    duration: 120,
    status: "IN_PROGRESS",
    priority: "URGENT",
    assignedTo: "Sarah Johnson",
    location: "Office",
    department: "GCMC",
  },
  {
    id: "5",
    title: "Advisory Meeting",
    client: "Growth Corp",
    time: "16:00",
    duration: 60,
    status: "SCHEDULED",
    priority: "MEDIUM",
    assignedTo: "Michael Chen",
    location: "Office",
    department: "ADVISORY",
  },
];

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

const departmentColors = {
  KAJ: "bg-blue-100 text-blue-800 border-blue-200",
  GCMC: "bg-green-100 text-green-800 border-green-200",
  COMPLIANCE: "bg-orange-100 text-orange-800 border-orange-200",
  ADVISORY: "bg-purple-100 text-purple-800 border-purple-200",
};

const statusColors = {
  SCHEDULED: "border-l-gray-400",
  CONFIRMED: "border-l-blue-500",
  IN_PROGRESS: "border-l-yellow-500",
  COMPLETED: "border-l-green-500",
  CANCELLED: "border-l-red-500",
  NO_SHOW: "border-l-red-300",
  RESCHEDULED: "border-l-purple-500",
};

const priorityColors = {
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
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = generateCalendarDays(year, month);

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

  // Filter appointments based on selected filters
  const filteredAppointments = mockAppointments.filter((appointment) => {
    if (
      filterDepartment !== "all" &&
      appointment.department !== filterDepartment
    ) {
      return false;
    }
    if (filterStatus !== "all" && appointment.status !== filterStatus) {
      return false;
    }
    return true;
  });

  // Get appointments for a specific date (today's date for demo)
  const todaysAppointments = filteredAppointments;

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

  const getDepartmentBadgeVariant = (department: string) => {
    switch (department) {
      case "KAJ":
        return "default";
      case "GCMC":
        return "secondary";
      case "COMPLIANCE":
        return "outline";
      case "ADVISORY":
        return "destructive";
      default:
        return "default";
    }
  };

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
                    {calendarDays.map((day, index) => (
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

                        {/* Sample appointments for today only */}
                        {day.isToday && (
                          <div className="space-y-1">
                            {filteredAppointments
                              .slice(0, 3)
                              .map((appointment) => (
                                <div
                                  className={`cursor-pointer rounded border-l-2 p-1 text-xs ${departmentColors[appointment.department as keyof typeof departmentColors]}
                                  ${statusColors[appointment.status as keyof typeof statusColors]}hover:opacity-80`}
                                  key={appointment.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate({
                                      to: `/appointments/${appointment.id}`,
                                    });
                                  }}
                                >
                                  <div className="truncate font-medium">
                                    {appointment.time} {appointment.title}
                                  </div>
                                  <div className="truncate text-xs opacity-75">
                                    {appointment.client}
                                  </div>
                                </div>
                              ))}
                            {filteredAppointments.length > 3 && (
                              <div className="p-1 text-muted-foreground text-xs">
                                +{filteredAppointments.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
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
                      const appointment = todaysAppointments.find(
                        (apt) => apt.time === time
                      );
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
                                className={`cursor-pointer rounded-lg border border-r-4 border-l-4 p-3 transition-all hover:shadow-md ${departmentColors[appointment.department as keyof typeof departmentColors]}
                                  ${statusColors[appointment.status as keyof typeof statusColors]}
                                  ${priorityColors[appointment.priority as keyof typeof priorityColors]}
                                `}
                                onClick={() =>
                                  navigate({
                                    to: `/appointments/${appointment.id}`,
                                  })
                                }
                              >
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      {appointment.title}
                                    </div>
                                    <div className="text-muted-foreground text-sm">
                                      {appointment.client}
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground text-xs">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {appointment.duration}min
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {appointment.location}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {appointment.assignedTo}
                                      </span>
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
                <label className="mb-2 block font-medium text-sm">
                  Department
                </label>
                <Select
                  onValueChange={setFilterDepartment}
                  value={filterDepartment}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="KAJ">KAJ (Tax & Accounting)</SelectItem>
                    <SelectItem value="GCMC">GCMC (Legal & Visa)</SelectItem>
                    <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                    <SelectItem value="ADVISORY">Advisory</SelectItem>
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
                  setFilterDepartment("all");
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
              <div className="space-y-3">
                {todaysAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No appointments scheduled
                  </p>
                ) : (
                  todaysAppointments.map((appointment) => (
                    <div
                      className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/30"
                      key={appointment.id}
                      onClick={() =>
                        navigate({ to: `/appointments/${appointment.id}` })
                      }
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="font-medium text-sm">
                          {appointment.title}
                        </div>
                        <div className="flex gap-1">
                          <Badge
                            className="text-xs"
                            variant={getDepartmentBadgeVariant(
                              appointment.department
                            )}
                          >
                            {appointment.department}
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
                          {appointment.time} ({appointment.duration}min)
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {appointment.client}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {appointment.assignedTo}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium text-sm">Departments</h4>
                <div className="space-y-2">
                  {Object.entries(departmentColors).map(([dept, color]) => (
                    <div className="flex items-center gap-2" key={dept}>
                      <div className={`h-3 w-3 rounded border ${color}`} />
                      <span className="text-xs">{dept}</span>
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
