import { useForm } from "@tanstack/react-form";
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

export const Route = createFileRoute("/appointments/new")({
  component: NewAppointmentPage,
});

// Mock data for clients and services - in real app, these would come from API
const mockClients = [
  { id: "1", name: "Acme Corp", type: "COMPANY", tin: "123456789" },
  { id: "2", name: "John Doe", type: "INDIVIDUAL", tin: "987654321" },
  { id: "3", name: "TechStart Inc", type: "COMPANY", tin: "456789123" },
];

const mockServices = [
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

const mockStaff = [
  { id: "1", name: "Sarah Johnson", role: "Senior Tax Advisor" },
  { id: "2", name: "Michael Chen", role: "Compliance Manager" },
  { id: "3", name: "Emily Davis", role: "Business Consultant" },
];

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

function NewAppointmentPage() {
  const navigate = useNavigate();

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
      try {
        // In a real app, this would make an API call
        console.log("Creating appointment:", value);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast.success("Appointment created successfully!");
        navigate({ to: "/appointments" });
      } catch (error) {
        toast.error("Failed to create appointment. Please try again.");
      }
    },
    validators: {
      onSubmit: appointmentSchema,
    },
  });

  const selectedService = mockServices.find(
    (service) => service.id === form.state.values.serviceId
  );

  const selectedClient = mockClients.find(
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
                        {field.state.meta.errors.map((error, index) => (
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
                            {mockClients.map((client) => (
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
                        {field.state.meta.errors.map((error, index) => (
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
                            {mockServices.map((service) => (
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
                        {field.state.meta.errors.map((error, index) => (
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
                            {mockStaff.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                <div className="flex flex-col">
                                  <span>{staff.name}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {staff.role}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors.map((error, index) => (
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
                          {field.state.meta.errors.map((error, index) => (
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
                          {field.state.meta.errors.map((error, index) => (
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
                        {field.state.meta.errors.map((error, index) => (
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
                        disabled={!state.canSubmit || state.isSubmitting}
                        type="submit"
                      >
                        {state.isSubmitting
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
                <span className="text-muted-foreground">•</span>
                <span>
                  Appointments require confirmation from assigned staff
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span>Reminders are automatically sent 24 hours before</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span>
                  High priority appointments will show in red on calendar
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">•</span>
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
