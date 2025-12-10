import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Mail,
  Plus,
  Send,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
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
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/users/invite")({
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

const inviteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type InviteForm = z.infer<typeof inviteSchema>;

interface InviteBatch {
  invites: InviteForm[];
  message?: string;
}

function RouteComponent() {
  const navigate = useNavigate();
  const [invites, setInvites] = useState<InviteForm[]>([
    {
      name: "",
      email: "",
      role: "",
      department: "",
      phoneNumber: "",
    },
  ]);
  const [customMessage, setCustomMessage] = useState("");

  // Query for roles and permissions
  const { data: rolesResponse } = useQuery({
    queryKey: ["users", "rolesAndPermissions"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.users.rolesAndPermissions();
    },
  });

  // Mutation for creating users
  const createUserMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      role:
        | "super_admin"
        | "admin"
        | "manager"
        | "accountant"
        | "client_service"
        | "read_only";
      department?: string;
      phoneNumber?: string;
      status: "active" | "inactive" | "suspended" | "pending";
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.users.create(data);
    },
  });

  const availableRoles = rolesResponse?.data?.roles || [];

  const addInviteRow = () => {
    setInvites([
      ...invites,
      {
        name: "",
        email: "",
        role: "",
        department: "",
        phoneNumber: "",
      },
    ]);
  };

  const removeInviteRow = (index: number) => {
    if (invites.length > 1) {
      setInvites(invites.filter((_, i) => i !== index));
    }
  };

  const updateInvite = (
    index: number,
    field: keyof InviteForm,
    value: string
  ) => {
    const updated = [...invites];
    updated[index] = { ...updated[index], [field]: value };
    setInvites(updated);
  };

  const validateInvites = () => {
    const errors: Record<number, Record<string, string>> = {};

    for (let i = 0; i < invites.length; i++) {
      const invite = invites[i];
      const result = inviteSchema.safeParse(invite);

      if (!result.success) {
        errors[i] = {};
        for (const issue of result.error.issues) {
          if (issue.path[0]) {
            errors[i][issue.path[0] as string] = issue.message;
          }
        }
      }
    }

    return errors;
  };

  const handleSendInvites = async () => {
    const errors = validateInvites();

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix validation errors before sending invites");
      return;
    }

    try {
      const promises = invites.map(async (invite) => {
        await createUserMutation.mutateAsync({
          name: invite.name,
          email: invite.email,
          role: invite.role as any,
          department: invite.department || undefined,
          phoneNumber: invite.phoneNumber || undefined,
          status: "pending",
        });
      });

      await Promise.all(promises);

      toast.success(
        `Successfully sent ${invites.length} invitation${invites.length > 1 ? "s" : ""}`
      );
      navigate({ to: "/users" });
    } catch (error) {
      toast.error("Failed to send invitations. Please try again.");
      console.error("Invitation error:", error);
    }
  };

  const getRoleDisplayName = (role: string) =>
    role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-red-500">Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-blue-500">Admin</Badge>;
      case "manager":
        return <Badge className="bg-green-500">Manager</Badge>;
      case "accountant":
        return <Badge className="bg-purple-500">Accountant</Badge>;
      case "client_service":
        return <Badge className="bg-orange-500">Client Service</Badge>;
      case "read_only":
        return <Badge variant="outline">Read Only</Badge>;
      default:
        return <Badge variant="secondary">{getRoleDisplayName(role)}</Badge>;
    }
  };

  const isFormValid = () => {
    const errors = validateInvites();
    return Object.keys(errors).length === 0 && invites.length > 0;
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate({ to: "/users" })}
            size="icon"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Invite Users</h1>
            <p className="text-muted-foreground">
              Send invitations to new team members to join your organization.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8">
        {/* Invite Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              User Invitations
            </CardTitle>
            <CardDescription>
              Fill in the details for each user you want to invite. They will
              receive an email with instructions to set up their account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {invites.map((invite, index) => (
              <div className="space-y-4 rounded-lg border p-4" key={index}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Invite #{index + 1}</h3>
                  {invites.length > 1 && (
                    <Button
                      onClick={() => removeInviteRow(index)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`}>Full Name *</Label>
                    <Input
                      id={`name-${index}`}
                      onChange={(e) =>
                        updateInvite(index, "name", e.target.value)
                      }
                      placeholder="Enter full name"
                      required
                      value={invite.name}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`email-${index}`}>Email Address *</Label>
                    <Input
                      id={`email-${index}`}
                      onChange={(e) =>
                        updateInvite(index, "email", e.target.value)
                      }
                      placeholder="user@example.com"
                      required
                      type="email"
                      value={invite.email}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`role-${index}`}>Role *</Label>
                    <Select
                      onValueChange={(value) =>
                        updateInvite(index, "role", value)
                      }
                      value={invite.role}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              {getRoleBadge(role)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`department-${index}`}>Department</Label>
                    <Input
                      id={`department-${index}`}
                      onChange={(e) =>
                        updateInvite(index, "department", e.target.value)
                      }
                      placeholder="e.g., Accounting, Legal"
                      value={invite.department}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`phone-${index}`}>Phone Number</Label>
                    <Input
                      id={`phone-${index}`}
                      onChange={(e) =>
                        updateInvite(index, "phoneNumber", e.target.value)
                      }
                      placeholder="+1 (555) 123-4567"
                      type="tel"
                      value={invite.phoneNumber}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center">
              <Button onClick={addInviteRow} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Another User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invitation Message
            </CardTitle>
            <CardDescription>
              Customize the message that will be sent with the invitation email
              (optional).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="message">Custom Message</Label>
              <Textarea
                id="message"
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Welcome to the team! We're excited to have you join us..."
                rows={4}
                value={customMessage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Invitation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Invitations:</span>
                <Badge variant="outline">{invites.length}</Badge>
              </div>

              {availableRoles.map((role) => {
                const count = invites.filter(
                  (invite) => invite.role === role
                ).length;
                if (count === 0) return null;

                return (
                  <div className="flex items-center justify-between" key={role}>
                    <span className="text-muted-foreground">
                      {getRoleDisplayName(role)}:
                    </span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                );
              })}

              <Separator />

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => navigate({ to: "/users" })}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!isFormValid() || createUserMutation.isPending}
                  onClick={handleSendInvites}
                >
                  {createUserMutation.isPending ? (
                    <>Sending Invites...</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send {invites.length} Invitation
                      {invites.length > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>How Invitations Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground text-sm">
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <p>
                Users will receive an email invitation with a secure link to set
                up their account.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <p>
                They will need to create a password and verify their email
                address.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <p>
                Once verified, they will have access based on their assigned
                role and permissions.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <p>
                You can manage their permissions and role assignments from the
                Users page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
