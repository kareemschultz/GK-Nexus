import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/clients/$id/edit")({
  component: RouteComponent,
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

type Client = {
  id: string;
  name: string;
  type: "enterprise" | "mid-market" | "smb";
  status: "active" | "inactive" | "onboarding" | "suspended";
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  revenue: number;
  employees: number;
  joinDate: string;
  lastActivity: string;
  complianceScore: number;
  documents: number;
  taxYear: string;
  filingStatus: string;
  nextDeadline: string;
  riskLevel: "low" | "medium" | "high";
  accountManager: string;
};

const clientSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  type: z.enum(["enterprise", "mid-market", "smb"], {
    required_error: "Please select a client type",
  }),
  status: z.enum(["active", "inactive", "onboarding", "suspended"], {
    required_error: "Please select a status",
  }),
  industry: z.string().min(2, "Industry must be at least 2 characters"),
  contactPerson: z
    .string()
    .min(2, "Contact person must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  revenue: z.number().min(0, "Revenue must be a positive number"),
  employees: z.number().min(1, "Employee count must be at least 1"),
  riskLevel: z.enum(["low", "medium", "high"], {
    required_error: "Please select a risk level",
  }),
  accountManager: z
    .string()
    .min(2, "Account manager must be at least 2 characters"),
});

type ClientFormData = z.infer<typeof clientSchema>;

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // Fetch client data from API
  const { data: clientResponse, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => orpc.clients.getById({ id }),
  });

  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: (data: ClientFormData) =>
      orpc.clients.update({
        id,
        data: {
          name: data.name,
          status: data.status,
          industry: data.industry,
          contactPerson: data.contactPerson,
          email: data.email,
          phoneNumber: data.phone,
          address: data.address,
          riskLevel: data.riskLevel,
          assignedManager: data.accountManager,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client updated successfully!", {
        description: "The client information has been updated.",
      });
      navigate({ to: `/clients/${id}` });
    },
    onError: () => {
      toast.error("Failed to update client", {
        description:
          "Please try again or contact support if the problem persists.",
      });
    },
  });

  // Map API response to Client type for display
  const client: Client | null = clientResponse?.data
    ? {
        id: clientResponse.data.id,
        name: clientResponse.data.name || "",
        type: (clientResponse.data.entityType?.toLowerCase() === "individual"
          ? "smb"
          : clientResponse.data.entityType?.toLowerCase() === "corporation"
            ? "enterprise"
            : "mid-market") as Client["type"],
        status: (clientResponse.data.status?.toLowerCase() ||
          "active") as Client["status"],
        industry: clientResponse.data.industry || "",
        contactPerson: clientResponse.data.contactPerson || "",
        email: clientResponse.data.email || "",
        phone: clientResponse.data.phoneNumber || "",
        address: clientResponse.data.address || "",
        revenue: 0,
        employees: 0,
        joinDate:
          clientResponse.data.clientSince?.toString() ||
          new Date().toISOString(),
        lastActivity:
          clientResponse.data.updatedAt?.toString() || new Date().toISOString(),
        complianceScore: 0,
        documents: 0,
        taxYear: "",
        filingStatus: "",
        nextDeadline: "",
        riskLevel: (clientResponse.data.riskLevel?.toLowerCase() ||
          "medium") as Client["riskLevel"],
        accountManager: clientResponse.data.assignedManager || "",
      }
    : null;

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client
      ? {
          name: client.name,
          type: client.type,
          status: client.status,
          industry: client.industry,
          contactPerson: client.contactPerson,
          email: client.email,
          phone: client.phone,
          address: client.address,
          revenue: client.revenue,
          employees: client.employees,
          riskLevel: client.riskLevel,
          accountManager: client.accountManager,
        }
      : {
          name: "",
          type: "smb",
          status: "onboarding",
          industry: "",
          contactPerson: "",
          email: "",
          phone: "",
          address: "",
          revenue: 0,
          employees: 1,
          riskLevel: "low",
          accountManager: "",
        },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="ml-3">Loading client...</span>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-bold text-2xl">Client Not Found</h1>
          <p className="text-muted-foreground">
            The client you're looking for doesn't exist or has been removed.
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate({ to: "/clients" })}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ClientFormData) => {
    updateMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "onboarding":
        return <Badge variant="outline">Onboarding</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "enterprise":
        return <Badge variant="default">Enterprise</Badge>;
      case "mid-market":
        return <Badge variant="outline">Mid-Market</Badge>;
      case "smb":
        return <Badge variant="secondary">SMB</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate({ to: `/clients/${id}` })}
            size="icon"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Edit Client: {client.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {getTypeBadge(client.type)}
              {getStatusBadge(client.status)}
            </div>
          </div>
        </div>
      </header>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic company details and business information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Technology, Healthcare"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                          <SelectItem value="mid-market">Mid-Market</SelectItem>
                          <SelectItem value="smb">
                            Small & Medium Business
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="onboarding">Onboarding</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="riskLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium Risk</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="revenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Revenue (USD)</FormLabel>
                      <FormControl>
                        <Input
                          min="0"
                          placeholder="Enter annual revenue"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the annual revenue in USD
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Employees</FormLabel>
                      <FormControl>
                        <Input
                          min="1"
                          placeholder="Enter employee count"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Total number of employees
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Primary contact details for this client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter contact person name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountManager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Manager</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter account manager name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter email address"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none"
                        placeholder="Enter complete business address"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => navigate({ to: `/clients/${id}` })}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
              <Save className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
