import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  Edit,
  FileText,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Save,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/appointments/$id")({
  component: AppointmentDetailPage,
});

const statusOptions = [
  { value: "SCHEDULED", label: "Scheduled", variant: "default" as const },
  { value: "CONFIRMED", label: "Confirmed", variant: "secondary" as const },
  { value: "IN_PROGRESS", label: "In Progress", variant: "default" as const },
  { value: "COMPLETED", label: "Completed", variant: "secondary" as const },
  { value: "CANCELLED", label: "Cancelled", variant: "destructive" as const },
  { value: "NO_SHOW", label: "No Show", variant: "destructive" as const },
];

const priorityOptions = [
  { value: "LOW", label: "Low", variant: "secondary" as const },
  { value: "MEDIUM", label: "Medium", variant: "outline" as const },
  { value: "HIGH", label: "High", variant: "default" as const },
  { value: "URGENT", label: "Urgent", variant: "destructive" as const },
];

interface AppointmentView {
  id: string;
  appointmentNumber: string;
  title: string;
  status: string;
  priority: string;
  client: {
    id: string;
    name: string;
    type: string;
    email: string;
    phone: string;
    tin: string;
  };
  service: {
    id: string;
    name: string;
    department: string;
    serviceType: string;
    duration: number;
    price: number;
  };
  assignedTo: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
  scheduling: {
    scheduledAt: string;
    estimatedEndTime: string;
    location: string;
    meetingLink: string | null;
  };
  description: string;
  clientNotes: string;
  internalNotes: string;
  isChargeable: boolean;
  chargedAmount: number;
  paymentStatus: string;
  requiresFollowUp: boolean;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
}

function AppointmentDetailPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  // Fetch appointment from API
  const {
    data: appointmentResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["appointment", id],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.appointments.getById({ id });
    },
  });

  const [appointment, setAppointment] = useState<AppointmentView | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState({
    clientNotes: "",
    internalNotes: "",
  });
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Update local state when API data changes
  useEffect(() => {
    if (appointmentResponse?.data && !appointment) {
      const data = appointmentResponse.data;
      const mappedAppointment: AppointmentView = {
        id: data.id,
        appointmentNumber: "APT-" + data.id.slice(0, 8).toUpperCase(),
        title: data.title || "Untitled Appointment",
        status: data.status || "SCHEDULED",
        priority: "MEDIUM",
        client: {
          id: data.clientId || "",
          name: "Unknown Client",
          type: "COMPANY",
          email: "",
          phone: "",
          tin: "",
        },
        service: {
          id: "1",
          name: "Consultation",
          department: "KAJ",
          serviceType: "CONSULTATION",
          duration: data.duration || 60,
          price: 150.0,
        },
        assignedTo: {
          id: data.staffId || "",
          name: "Staff Member",
          role: "Advisor",
          email: "",
        },
        scheduling: {
          scheduledAt:
            data.scheduledDate?.toString() || new Date().toISOString(),
          estimatedEndTime:
            data.scheduledDate?.toString() || new Date().toISOString(),
          location: data.location || "Office",
          meetingLink: data.meetingLink || null,
        },
        description: data.description || "",
        clientNotes: data.notes || "",
        internalNotes: "",
        isChargeable: true,
        chargedAmount: 150.0,
        paymentStatus: "PENDING",
        requiresFollowUp: false,
        followUpDate: null,
        createdAt: data.createdAt?.toString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toString() || new Date().toISOString(),
      };
      setAppointment(mappedAppointment);
      setEditedNotes({
        clientNotes: mappedAppointment.clientNotes,
        internalNotes: mappedAppointment.internalNotes,
      });
    }
  }, [appointmentResponse, appointment]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: {
      status?: string;
      priority?: string;
      notes?: string;
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.appointments.update({
        id,
        status: data.status as any,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      const { client } = await import("@/utils/orpc");
      return client.appointments.cancel({
        id,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      setShowCancelDialog(false);
      setCancelReason("");
      toast.success("Appointment cancelled successfully");
    },
    onError: () => {
      toast.error("Failed to cancel appointment");
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "CANCELLED") {
      setShowCancelDialog(true);
      return;
    }

    updateMutation.mutate(
      { status: newStatus },
      {
        onSuccess: () => {
          if (appointment) {
            setAppointment({ ...appointment, status: newStatus });
          }
          toast.success(
            "Appointment status updated to " + newStatus.toLowerCase()
          );
        },
        onError: () => {
          toast.error("Failed to update appointment status");
        },
      }
    );
  };

  const handleCancelAppointment = () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }
    cancelMutation.mutate(cancelReason);
  };

  const handlePriorityChange = (newPriority: string) => {
    updateMutation.mutate(
      { priority: newPriority },
      {
        onSuccess: () => {
          if (appointment) {
            setAppointment({ ...appointment, priority: newPriority });
          }
          toast.success("Priority updated to " + newPriority.toLowerCase());
        },
        onError: () => {
          toast.error("Failed to update priority");
        },
      }
    );
  };

  const handleSaveNotes = () => {
    updateMutation.mutate(
      { notes: editedNotes.clientNotes },
      {
        onSuccess: () => {
          if (appointment) {
            setAppointment({
              ...appointment,
              clientNotes: editedNotes.clientNotes,
              internalNotes: editedNotes.internalNotes,
            });
          }
          setIsEditingNotes(false);
          toast.success("Notes updated successfully");
        },
        onError: () => {
          toast.error("Failed to update notes");
        },
      }
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusOption = statusOptions.find(
      (option) => option.value === status
    );
    return statusOption?.variant || "default";
  };

  const getPriorityBadgeVariant = (priority: string) => {
    const priorityOption = priorityOptions.find(
      (option) => option.value === priority
    );
    return priorityOption?.variant || "default";
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

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="ml-3">Loading appointment...</span>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !appointment) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Card className="py-12 text-center">
          <CardContent>
            <h3 className="font-semibold text-lg">Appointment Not Found</h3>
            <p className="text-muted-foreground">
              The appointment you are looking for does not exist or has been
              removed.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate({ to: "/appointments" })}
            >
              Back to Appointments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h1 className="font-bold text-3xl tracking-tight">
                {appointment.title}
              </h1>
              <Badge variant={getStatusBadgeVariant(appointment.status)}>
                {appointment.status.replace("_", " ")}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(appointment.priority)}>
                {appointment.priority}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Appointment #{appointment.appointmentNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate({ to: "/appointments/new" })}
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/appointments/new" })}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Appointment
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Invoice
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reminder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Appointment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => navigate({ to: "/appointments" })}
              variant="outline"
            >
              Back to Appointments
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    onValueChange={handleStatusChange}
                    value={appointment.status}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <Badge variant={option.variant}>{option.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    onValueChange={handlePriorityChange}
                    value={appointment.priority}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <Badge variant={option.variant}>{option.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scheduling Information */}
              <div>
                <h3 className="mb-4 font-semibold">Scheduling</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Date</p>
                      <p className="text-muted-foreground">
                        {formatDate(appointment.scheduling.scheduledAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Time</p>
                      <p className="text-muted-foreground">
                        {formatTime(appointment.scheduling.scheduledAt)} -{" "}
                        {formatTime(appointment.scheduling.estimatedEndTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Location</p>
                      <p className="text-muted-foreground">
                        {appointment.scheduling.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Assigned To</p>
                      <p className="text-muted-foreground">
                        {appointment.assignedTo.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {appointment.assignedTo.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Service Information */}
              <div>
                <h3 className="mb-4 font-semibold">Service Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm">Service</p>
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">
                        {appointment.service.name}
                      </p>
                      <Badge
                        variant={getDepartmentBadgeVariant(
                          appointment.service.department
                        )}
                      >
                        {appointment.service.department}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="font-medium text-sm">Duration</p>
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {appointment.service.duration} minutes
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Fee</p>
                      <p className="text-muted-foreground">
                        GYD ${appointment.service.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Payment Status</p>
                      <Badge
                        variant={
                          appointment.paymentStatus === "PAID"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {appointment.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              {appointment.description && (
                <div>
                  <h3 className="mb-2 font-semibold">Description</h3>
                  <p className="text-muted-foreground">
                    {appointment.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </div>
                <Button
                  onClick={() => setIsEditingNotes(!isEditingNotes)}
                  size="sm"
                  variant="outline"
                >
                  {isEditingNotes ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingNotes ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="clientNotes">Client Notes</Label>
                    <Textarea
                      id="clientNotes"
                      onChange={(e) =>
                        setEditedNotes({
                          ...editedNotes,
                          clientNotes: e.target.value,
                        })
                      }
                      placeholder="Notes visible to the client..."
                      rows={3}
                      value={editedNotes.clientNotes}
                    />
                  </div>
                  <div>
                    <Label htmlFor="internalNotes">Internal Notes</Label>
                    <Textarea
                      id="internalNotes"
                      onChange={(e) =>
                        setEditedNotes({
                          ...editedNotes,
                          internalNotes: e.target.value,
                        })
                      }
                      placeholder="Internal notes for staff..."
                      rows={3}
                      value={editedNotes.internalNotes}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNotes}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => setIsEditingNotes(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium">Client Notes</h4>
                    <p className="text-muted-foreground">
                      {appointment.clientNotes || "No client notes available."}
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Internal Notes</h4>
                    <p className="text-muted-foreground">
                      {appointment.internalNotes ||
                        "No internal notes available."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{appointment.client.name}</p>
                <Badge className="mt-1" variant="outline">
                  {appointment.client.type}
                </Badge>
              </div>
              <div className="space-y-2">
                {appointment.client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      className="text-muted-foreground text-sm hover:text-foreground"
                      href={"mailto:" + appointment.client.email}
                    >
                      {appointment.client.email}
                    </a>
                  </div>
                )}
                {appointment.client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      className="text-muted-foreground text-sm hover:text-foreground"
                      href={"tel:" + appointment.client.phone}
                    >
                      {appointment.client.phone}
                    </a>
                  </div>
                )}
              </div>
              {appointment.client.tin && (
                <div>
                  <p className="font-medium text-sm">TIN Number</p>
                  <p className="text-muted-foreground text-sm">
                    {appointment.client.tin}
                  </p>
                </div>
              )}
              {appointment.client.id && (
                <Button
                  className="w-full"
                  onClick={() =>
                    navigate({ to: "/clients/" + appointment.client.id })
                  }
                  size="sm"
                  variant="outline"
                >
                  View Client Profile
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Staff Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{appointment.assignedTo.name}</p>
                <p className="text-muted-foreground text-sm">
                  {appointment.assignedTo.role}
                </p>
              </div>
              {appointment.assignedTo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    className="text-muted-foreground text-sm hover:text-foreground"
                    href={"mailto:" + appointment.assignedTo.email}
                  >
                    {appointment.assignedTo.email}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-up Information */}
          {appointment.requiresFollowUp && appointment.followUpDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Follow-up</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium text-sm">Required</p>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(appointment.followUpDate)} at{" "}
                    {formatTime(appointment.followUpDate)}
                  </p>
                  <Button className="w-full" size="sm" variant="outline">
                    Schedule Follow-up
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(appointment.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(appointment.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Appointment Dialog */}
      <Dialog onOpenChange={setShowCancelDialog} open={showCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this appointment. This will
              be recorded for future reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancelReason">Cancellation Reason</Label>
              <Textarea
                id="cancelReason"
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Client requested reschedule, Emergency, etc."
                rows={3}
                value={cancelReason}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowCancelDialog(false)}
              variant="outline"
            >
              Keep Appointment
            </Button>
            <Button onClick={handleCancelAppointment} variant="destructive">
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
