import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Filter,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Video,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/portal/appointments")({
  component: AppointmentsPage,
});

const mockAppointments = [
  {
    id: 1,
    title: "Quarterly Tax Review",
    type: "Tax Consultation",
    consultant: "Sarah Johnson",
    consultantAvatar: "",
    consultantTitle: "Senior Tax Advisor",
    date: "2024-12-05",
    time: "10:00 AM",
    duration: 60,
    mode: "video",
    status: "confirmed",
    description: "Review Q4 2024 tax obligations and planning for 2025",
    location: "Video Call - Zoom",
    notes: "Please have your financial statements ready for review",
  },
  {
    id: 2,
    title: "Compliance Strategy Meeting",
    type: "Compliance Review",
    consultant: "Michael Chen",
    consultantAvatar: "",
    consultantTitle: "Compliance Specialist",
    date: "2024-12-12",
    time: "2:00 PM",
    duration: 90,
    mode: "in-person",
    status: "confirmed",
    description:
      "Discuss upcoming GRA compliance requirements and filing deadlines",
    location: "GK-Nexus Office, Georgetown",
    notes: "Bring all pending compliance documents",
  },
  {
    id: 3,
    title: "Financial Planning Session",
    type: "Financial Advisory",
    consultant: "Jennifer Williams",
    consultantAvatar: "",
    consultantTitle: "Financial Planner",
    date: "2024-11-30",
    time: "11:00 AM",
    duration: 45,
    mode: "phone",
    status: "completed",
    description: "Business financial health assessment and growth planning",
    location: "Phone Call",
    notes: "Completed - Follow-up email sent with recommendations",
  },
  {
    id: 4,
    title: "VAT Registration Consultation",
    type: "Business Setup",
    consultant: "David Rodriguez",
    consultantAvatar: "",
    consultantTitle: "Business Consultant",
    date: "2024-12-20",
    time: "3:30 PM",
    duration: 60,
    mode: "video",
    status: "pending",
    description:
      "Guide through VAT registration process for business expansion",
    location: "Video Call - Teams",
    notes: "Awaiting client confirmation",
  },
];

const consultants = [
  {
    id: 1,
    name: "Sarah Johnson",
    title: "Senior Tax Advisor",
    specialties: ["Tax Planning", "Business Tax", "Personal Tax"],
    avatar: "",
    rating: 4.9,
    experience: "8+ years",
  },
  {
    id: 2,
    name: "Michael Chen",
    title: "Compliance Specialist",
    specialties: ["GRA Compliance", "Regulatory Filing", "Audit Support"],
    avatar: "",
    rating: 4.8,
    experience: "6+ years",
  },
  {
    id: 3,
    name: "Jennifer Williams",
    title: "Financial Planner",
    specialties: ["Financial Planning", "Investment Advice", "Business Growth"],
    avatar: "",
    rating: 4.9,
    experience: "10+ years",
  },
  {
    id: 4,
    name: "David Rodriguez",
    title: "Business Consultant",
    specialties: ["Business Registration", "Licensing", "Corporate Setup"],
    avatar: "",
    rating: 4.7,
    experience: "5+ years",
  },
];

const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];

function getStatusColor(status: string) {
  switch (status) {
    case "confirmed":
      return "default";
    case "completed":
      return "secondary";
    case "pending":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "confirmed":
      return <CheckCircle2 aria-hidden="true" className="h-4 w-4" />;
    case "completed":
      return <CheckCircle2 aria-hidden="true" className="h-4 w-4" />;
    case "pending":
      return <AlertCircle aria-hidden="true" className="h-4 w-4" />;
    case "cancelled":
      return <XCircle aria-hidden="true" className="h-4 w-4" />;
    default:
      return <Clock aria-hidden="true" className="h-4 w-4" />;
  }
}

function getModeIcon(mode: string) {
  switch (mode) {
    case "video":
      return <Video aria-hidden="true" className="h-4 w-4" />;
    case "phone":
      return <Phone aria-hidden="true" className="h-4 w-4" />;
    case "in-person":
      return <MapPin aria-hidden="true" className="h-4 w-4" />;
    default:
      return <Calendar aria-hidden="true" className="h-4 w-4" />;
  }
}

function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedConsultant, setSelectedConsultant] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [appointmentMode, setAppointmentMode] = useState("");
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentDescription, setAppointmentDescription] = useState("");

  const filteredAppointments = mockAppointments.filter((appointment) => {
    const matchesSearch =
      appointment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.consultant
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      appointment.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || appointment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const upcomingAppointments = filteredAppointments.filter(
    (apt) => apt.status === "confirmed" || apt.status === "pending"
  );
  const pastAppointments = filteredAppointments.filter(
    (apt) => apt.status === "completed" || apt.status === "cancelled"
  );

  const handleBookAppointment = () => {
    // In real app, this would create the appointment via API
    console.log("Booking appointment:", {
      date: selectedDate,
      time: selectedTime,
      consultant: selectedConsultant,
      type: appointmentType,
      mode: appointmentMode,
      title: appointmentTitle,
      description: appointmentDescription,
    });
    setIsBookingDialogOpen(false);
    // Reset form
    setSelectedDate("");
    setSelectedTime("");
    setSelectedConsultant("");
    setAppointmentType("");
    setAppointmentMode("");
    setAppointmentTitle("");
    setAppointmentDescription("");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <h1 className="font-bold text-3xl text-foreground">Appointments</h1>
          <p className="text-muted-foreground">
            Schedule meetings with our tax and business consultants
          </p>
        </div>
        <Dialog
          onOpenChange={setIsBookingDialogOpen}
          open={isBookingDialogOpen}
        >
          <DialogTrigger asChild>
            <Button aria-label="Book new appointment">
              <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>
                Schedule a consultation with one of our experts.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointment-title">Title</Label>
                  <Input
                    id="appointment-title"
                    onChange={(e) => setAppointmentTitle(e.target.value)}
                    placeholder="Meeting title"
                    value={appointmentTitle}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-type">Type</Label>
                  <Select
                    onValueChange={setAppointmentType}
                    value={appointmentType}
                  >
                    <SelectTrigger id="appointment-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tax Consultation">
                        Tax Consultation
                      </SelectItem>
                      <SelectItem value="Compliance Review">
                        Compliance Review
                      </SelectItem>
                      <SelectItem value="Financial Advisory">
                        Financial Advisory
                      </SelectItem>
                      <SelectItem value="Business Setup">
                        Business Setup
                      </SelectItem>
                      <SelectItem value="General Inquiry">
                        General Inquiry
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultant-select">Preferred Consultant</Label>
                <Select
                  onValueChange={setSelectedConsultant}
                  value={selectedConsultant}
                >
                  <SelectTrigger id="consultant-select">
                    <SelectValue placeholder="Choose a consultant" />
                  </SelectTrigger>
                  <SelectContent>
                    {consultants.map((consultant) => (
                      <SelectItem key={consultant.id} value={consultant.name}>
                        <div className="flex items-center space-x-2">
                          <span>{consultant.name}</span>
                          <span className="text-muted-foreground text-sm">
                            - {consultant.title}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointment-date">Date</Label>
                  <Input
                    id="appointment-date"
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    type="date"
                    value={selectedDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-time">Time</Label>
                  <Select onValueChange={setSelectedTime} value={selectedTime}>
                    <SelectTrigger id="appointment-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment-mode">Meeting Mode</Label>
                <Select
                  onValueChange={setAppointmentMode}
                  value={appointmentMode}
                >
                  <SelectTrigger id="appointment-mode">
                    <SelectValue placeholder="How would you like to meet?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="in-person">In-Person Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment-description">
                  Description (Optional)
                </Label>
                <Textarea
                  id="appointment-description"
                  onChange={(e) => setAppointmentDescription(e.target.value)}
                  placeholder="Describe what you'd like to discuss..."
                  rows={3}
                  value={appointmentDescription}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsBookingDialogOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={handleBookAppointment}>Book Appointment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-blue-50 p-2 dark:bg-blue-950">
                <Calendar
                  aria-hidden="true"
                  className="h-4 w-4 text-blue-600"
                />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {upcomingAppointments.length}
                </p>
                <p className="text-muted-foreground text-xs">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  {
                    mockAppointments.filter((a) => a.status === "completed")
                      .length
                  }
                </p>
                <p className="text-muted-foreground text-xs">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-amber-50 p-2 dark:bg-amber-950">
                <AlertCircle
                  aria-hidden="true"
                  className="h-4 w-4 text-amber-600"
                />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {
                    mockAppointments.filter((a) => a.status === "pending")
                      .length
                  }
                </p>
                <p className="text-muted-foreground text-xs">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-purple-50 p-2 dark:bg-purple-950">
                <User aria-hidden="true" className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {consultants.length}
                </p>
                <p className="text-muted-foreground text-xs">Consultants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Your Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground"
              />
              <Input
                aria-label="Search appointments"
                className="pl-10"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search appointments..."
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
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs className="space-y-6" defaultValue="upcoming">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            <TabsContent className="space-y-4" value="upcoming">
              {upcomingAppointments.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar
                    aria-hidden="true"
                    className="mx-auto mb-4 h-12 w-12 text-muted-foreground"
                  />
                  <h3 className="mb-2 font-medium text-foreground text-lg">
                    No upcoming appointments
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    Book a consultation with one of our experts to get started.
                  </p>
                  <Button onClick={() => setIsBookingDialogOpen(true)}>
                    <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <Card
                      className="transition-shadow hover:shadow-md"
                      key={appointment.id}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                alt={appointment.consultant}
                                src={appointment.consultantAvatar}
                              />
                              <AvatarFallback>
                                {appointment.consultant
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-foreground text-lg">
                                  {appointment.title}
                                </h3>
                                <Badge
                                  variant={getStatusColor(appointment.status)}
                                >
                                  {getStatusIcon(appointment.status)}
                                  <span className="ml-1">
                                    {appointment.status}
                                  </span>
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-muted-foreground text-sm">
                                <div className="flex items-center space-x-1">
                                  <Calendar
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                  />
                                  <span>
                                    {new Date(
                                      appointment.date
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                  />
                                  <span>{appointment.time}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {getModeIcon(appointment.mode)}
                                  <span className="capitalize">
                                    {appointment.mode.replace("-", " ")}
                                  </span>
                                </div>
                              </div>
                              <p className="text-foreground text-sm">
                                {appointment.description}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-foreground text-sm">
                                  {appointment.consultant}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                  •
                                </span>
                                <Badge variant="outline">
                                  {appointment.type}
                                </Badge>
                              </div>
                              {appointment.notes && (
                                <p className="text-muted-foreground text-sm italic">
                                  {appointment.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              aria-label="Edit appointment"
                              size="sm"
                              variant="ghost"
                            >
                              <Edit aria-hidden="true" className="h-4 w-4" />
                            </Button>
                            <Button
                              aria-label="Cancel appointment"
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 aria-hidden="true" className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent className="space-y-4" value="past">
              {pastAppointments.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mx-auto mb-4 h-12 w-12 text-muted-foreground"
                  />
                  <h3 className="mb-2 font-medium text-foreground text-lg">
                    No past appointments
                  </h3>
                  <p className="text-muted-foreground">
                    Your completed and cancelled appointments will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <Card className="opacity-75" key={appointment.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                alt={appointment.consultant}
                                src={appointment.consultantAvatar}
                              />
                              <AvatarFallback>
                                {appointment.consultant
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-foreground text-lg">
                                  {appointment.title}
                                </h3>
                                <Badge
                                  variant={getStatusColor(appointment.status)}
                                >
                                  {getStatusIcon(appointment.status)}
                                  <span className="ml-1">
                                    {appointment.status}
                                  </span>
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-muted-foreground text-sm">
                                <div className="flex items-center space-x-1">
                                  <Calendar
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                  />
                                  <span>
                                    {new Date(
                                      appointment.date
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                  />
                                  <span>{appointment.time}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {getModeIcon(appointment.mode)}
                                  <span className="capitalize">
                                    {appointment.mode.replace("-", " ")}
                                  </span>
                                </div>
                              </div>
                              <p className="text-foreground text-sm">
                                {appointment.description}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-foreground text-sm">
                                  {appointment.consultant}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                  •
                                </span>
                                <Badge variant="outline">
                                  {appointment.type}
                                </Badge>
                              </div>
                              {appointment.notes && (
                                <p className="text-muted-foreground text-sm italic">
                                  {appointment.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Our Consultants */}
      <Card>
        <CardHeader>
          <CardTitle>Our Consultants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {consultants.map((consultant) => (
              <Card
                className="transition-shadow hover:shadow-md"
                key={consultant.id}
              >
                <CardContent className="p-4 text-center">
                  <Avatar className="mx-auto mb-4 h-16 w-16">
                    <AvatarImage
                      alt={consultant.name}
                      src={consultant.avatar}
                    />
                    <AvatarFallback className="text-lg">
                      {consultant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mb-1 font-semibold text-foreground">
                    {consultant.name}
                  </h3>
                  <p className="mb-2 text-muted-foreground text-sm">
                    {consultant.title}
                  </p>
                  <p className="mb-3 text-muted-foreground text-xs">
                    {consultant.experience}
                  </p>
                  <div className="space-y-2">
                    <div className="flex flex-wrap justify-center gap-1">
                      {consultant.specialties.slice(0, 2).map((specialty) => (
                        <Badge
                          className="text-xs"
                          key={specialty}
                          variant="secondary"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedConsultant(consultant.name);
                        setIsBookingDialogOpen(true);
                      }}
                      size="sm"
                    >
                      Book with {consultant.name.split(" ")[0]}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
