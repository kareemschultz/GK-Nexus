import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, User, Users } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import FormError from "@/components/form-error";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/appointments/new")({
  component: NewAppointmentPage,
});

const appointmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  clientId: z.string().min(1, "Please select a client"),
  serviceId: z.string().min(1, "Please select a service"),
  assignedTo: z.string().min(1, "Please assign to a staff member"),
  scheduledDate: z.string().min(1, "Please select a date"),
  scheduledTime: z.string().min(1, "Please select a time"),
  location: z.string().min(1, "Please specify a location"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  description: z.string().optional(),
  clientNotes: z.string().optional(),
  internalNotes: z.string().optional(),
});

interface ClientOption {
  id: string;
  name: string;
  type: string;
  tin: string;
}

interface ServiceOption {
  id: string;
  name: string;
  department: string;
  serviceType: string;
  duration: number;
  price: number;
}

interface StaffOption {
  id: string;
  name: string;
  role: string;
}

function NewAppointmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch clients from API
  const { data: clientsResponse, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => orpc.clients.list({ page: 1, limit: 100 }),
  });

  // Fetch users/staff from API
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => orpc.users.list({ page: 1, limit: 100 }),
  });

  // Map API responses to component format
  const clients: ClientOption[] = (clientsResponse?.data?.items || []).map(
    (client: {
      id: string;
      name: string;
      clientType: string | null;
      tinNumber: string | null;
    }) => ({
      id: client.id,
      name: client.name,
      type: client.clientType || "INDIVIDUAL",
      tin: client.tinNumber || "",
    })
  );

  const staff: StaffOption[] = (usersResponse?.data?.items || []).map(
    (user: { id: string; name: string | null; role: string | null }) => ({
      id: user.id,
      name: user.name || "Unknown",
      role: user.role || "Staff",
    })
  );

  // Static services for now (since serviceCatalog requires organizationId)
  const services: ServiceOption[] = [
    {
      id: "1",
      name: "Tax Consultation",
      department: "KAJ",
      serviceType: "TAX_CONSULTATION",
      duration: 60,
      price: 150.0,
    },
    {
      id: "2",
      name: "VAT Return Preparation",
      department: "KAJ",
      serviceType: "VAT_RETURN",
      duration: 90,
      price: 200.0,
    },
    {
      id: "3",
      name: "Business Registration",
      department: "GCMC",
      serviceType: "BUSINESS_REGISTRATION",
      duration: 120,
      price: 300.0,
    },
    {
      id: "4",
      name: "Compliance Review",
      department: "COMPLIANCE",
      serviceType: "COMPLIANCE_REVIEW",
      duration: 75,
      price: 250.0,
    },
  ];

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      clientId: string;
      startTime: string;
      endTime: string;
      type: string;
      priority: string;
      location: string;
      description: string;
      notes: string;
    }) =>
      orpc.appointments.create({
        title: data.title,
        clientId: data.clientId,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type as
          | "CONSULTATION"
          | "DOCUMENT_REVIEW"
          | "TAX_PREPARATION"
          | "COMPLIANCE_MEETING"
          | "OTHER",
        priority: data.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        location: data.location,
        description: data.description,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment created successfully!");
      navigate({ to: "/appointments" });
    },
    onError: () => {
      toast.error("Failed to create appointment. Please try again.");
    },
  });

  const form = useForm({
    defaultValues: {
      title: "",
      clientId: "",
      serviceId: "",
      assignedTo: "",
      scheduledDate: "",
      scheduledTime: "",
      location: "Office",
      priority: "MEDIUM" as const,
      description: "",
      clientNotes: "",
      internalNotes: "",
    },
    onSubmit: async ({ value }) => {
      const selectedService = services.find((s) => s.id === value.serviceId);
      const startTime = new Date(
        value.scheduledDate + "T" + value.scheduledTime + ":00"
      ).toISOString();
      const endTime = new Date(
        new Date(startTime).getTime() +
          (selectedService?.duration || 60) * 60 * 1000
      ).toISOString();

      createMutation.mutate({
        title: value.title,
        clientId: value.clientId,
        startTime,
        endTime,
        type: selectedService?.serviceType || "CONSULTATION",
        priority: value.priority,
        location: value.location,
        description: value.description || "",
        notes: value.clientNotes || "",
      });
    },
    validators: {
      onSubmit: appointmentSchema,
    },
  });

  const selectedService = services.find(
    (service) => service.id === form.state.values.serviceId
  );

  const selectedClient = clients.find(
    (client) => client.id === form.state.values.clientId
  );

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

  const isLoading = isLoadingClients || isLoadingUsers;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="ml-3">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              New Appointment
            </h1>
            <p className="text-muted-foreground">
              Schedule a new client appointment
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: "/appointments" })}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Appointment Details
              </CardTitle>
              <CardDescription>
                Fill in the appointment information below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Basic Information</h3>

                  <form.Field name="title">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Appointment Title *</Label>
                        <Input
                          aria-invalid={field.state.meta.errors.length > 0}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g., Tax consultation meeting"
                          value={field.state.value}
                        />
                        {field.state.meta.errors.map((error) => (
                          <FormError
                            key={error?.message}
                            message={error?.message}
                          />
                        ))}
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="clientId">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Client *</Label>
                        <Select
                          onValueChange={(value) => field.handleChange(value)}
                          value={field.state.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                <div className="flex w-full items-center justify-between">
                                  <span>{client.name}</span>
                                  <Badge className="ml-2" variant="outline">
                                    {client.type}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors.map((error) => (
                          <FormError
                            key={error?.message}
                            message={error?.message}
                          />
                        ))}
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="serviceId">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Service *</Label>
                        <Select
                          onValueChange={(value) => field.handleChange(value)}
                          value={field.state.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span>{service.name}</span>
                                    <Badge
                                      variant={getDepartmentBadgeVariant(
                                        service.department
                                      )}
                                    >
                                      {service.department}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-muted-foreground text-xs">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {service.duration}min
                                    </span>
                                    <span>GYD ${service.price.toFixed(2)}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors.map((error) => (
                          <FormError
                            key={error?.message}
                            message={error?.message}
                          />
                        ))}
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="assignedTo">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Assigned Staff *</Label>
                        <Select
                          onValueChange={(value) => field.handleChange(value)}
                          value={field.state.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select staff member" />
                          </SelectTrigger>
                          <SelectContent>
                            {staff.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                <div className="flex flex-col">
                                  <span>{s.name}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {s.role}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors.map((error) => (
                          <FormError
                            key={error?.message}
                            message={error?.message}
                          />
                        ))}
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Scheduling */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Scheduling</h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <form.Field name="scheduledDate">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>Date *</Label>
                          <Input
                            aria-invalid={field.state.meta.errors.length > 0}
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            type="date"
                            value={field.state.value}
                          />
                          {field.state.meta.errors.map((error) => (
                            <FormError
                              key={error?.message}
                              message={error?.message}
                            />
                          ))}
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="scheduledTime">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>Time *</Label>
                          <Input
                            aria-invalid={field.state.meta.errors.length > 0}
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            type="time"
                            value={field.state.value}
                          />
                          {field.state.meta.errors.map((error) => (
                            <FormError
                              key={error?.message}
                              message={error?.message}
                            />
                          ))}
                        </div>
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="location">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Location *</Label>
                        <Select
                          onValueChange={(value) => field.handleChange(value)}
                          value={field.state.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Office">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Office
                              </div>
                            </SelectItem>
                            <SelectItem value="Online">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Online Meeting
                              </div>
                            </SelectItem>
                            <SelectItem value="Client Site">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Client Site
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors.map((error) => (
                          <FormError
                            key={error?.message}
                            message={error?.message}
                          />
                        ))}
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="priority">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Priority</Label>
                        <Select
                          onValueChange={(value) =>
                            field.handleChange(
                              value as "LOW" | "MEDIUM" | "HIGH" | "URGENT"
                            )
                          }
                          value={field.state.value}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">
                              <Badge variant="secondary">Low</Badge>
                            </SelectItem>
                            <SelectItem value="MEDIUM">
                              <Badge variant="outline">Medium</Badge>
                            </SelectItem>
                            <SelectItem value="HIGH">
                              <Badge variant="default">High</Badge>
                            </SelectItem>
                            <SelectItem value="URGENT">
                              <Badge variant="destructive">Urgent</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">
                    Additional Information
                  </h3>

                  <form.Field name="description">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Description</Label>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Describe the purpose and agenda of this appointment..."
                          rows={3}
                          value={field.state.value}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="clientNotes">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Client Notes</Label>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Notes visible to the client (preparation requirements, documents to bring, etc.)"
                          rows={2}
                          value={field.state.value}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="internalNotes">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Internal Notes</Label>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Internal notes for staff (not visible to client)"
                          rows={2}
                          value={field.state.value}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="flex gap-4 pt-6">
                  <form.Subscribe>
                    {(state) => (
                      <Button
                        className="min-w-[120px]"
                        disabled={
                          !state.canSubmit ||
                          state.isSubmitting ||
                          createMutation.isPending
                        }
                        type="submit"
                      >
                        {state.isSubmitting || createMutation.isPending
                          ? "Creating..."
                          : "Create Appointment"}
                      </Button>
                    )}
                  </form.Subscribe>
                  <Button
                    onClick={() => navigate({ to: "/appointments" })}
                    type="button"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Appointment Summary */}
          {(selectedClient || selectedService) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appointment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedClient && (
                  <div>
                    <p className="font-medium text-sm">Client</p>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">
                        {selectedClient.name}
                      </p>
                      <Badge variant="outline">{selectedClient.type}</Badge>
                    </div>
                  </div>
                )}

                {selectedService && (
                  <>
                    <div>
                      <p className="font-medium text-sm">Service</p>
                      <p className="text-muted-foreground">
                        {selectedService.name}
                      </p>
                      <Badge
                        className="mt-1"
                        variant={getDepartmentBadgeVariant(
                          selectedService.department
                        )}
                      >
                        {selectedService.department}
                      </Badge>
                    </div>

                    <div>
                      <p className="font-medium text-sm">Duration</p>
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {selectedService.duration} minutes
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-sm">Fee</p>
                      <p className="text-muted-foreground">
                        GYD ${selectedService.price.toFixed(2)}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground">-</span>
                <span>
                  Appointments require confirmation from assigned staff
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">-</span>
                <span>Reminders are automatically sent 24 hours before</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">-</span>
                <span>
                  High priority appointments will show in red on calendar
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">-</span>
                <span>
                  Online appointments automatically include meeting links
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
