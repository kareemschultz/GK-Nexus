import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Crown,
  Eye,
  FileText,
  Lock,
  Shield,
  User,
  UserCheck,
  Users,
  X,
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
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/users/roles")({
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

interface RolePermissions {
  [key: string]: string[];
}

interface Permission {
  category: string;
  permissions: string[];
}

function RouteComponent() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showRoleDetails, setShowRoleDetails] = useState(false);

  // Query for roles and permissions
  const {
    data: rolesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users", "rolesAndPermissions"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.userRolesAndPermissions();
    },
  });

  // Query for user statistics
  const { data: statsResponse } = useQuery({
    queryKey: ["users", "stats"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.userStats();
    },
  });

  const rolePermissions = rolesResponse?.data?.rolePermissions || {};
  const roles = rolesResponse?.data?.roles || [];
  const stats = statsResponse?.data;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Crown className="h-5 w-5 text-red-500" />;
      case "admin":
        return <Shield className="h-5 w-5 text-blue-500" />;
      case "manager":
        return <UserCheck className="h-5 w-5 text-green-500" />;
      case "accountant":
        return <FileText className="h-5 w-5 text-purple-500" />;
      case "client_service":
        return <User className="h-5 w-5 text-orange-500" />;
      case "read_only":
        return <Eye className="h-5 w-5 text-gray-500" />;
      default:
        return <User className="h-5 w-5 text-gray-500" />;
    }
  };

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
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getRoleDisplayName = (role: string) =>
    role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Full system access with all administrative privileges";
      case "admin":
        return "Administrative access to manage users, clients, and system settings";
      case "manager":
        return "Management access to oversee operations and team members";
      case "accountant":
        return "Access to financial data, tax calculations, and accounting features";
      case "client_service":
        return "Client-focused access to manage relationships and communications";
      case "read_only":
        return "View-only access to most system information";
      default:
        return "Custom role with specific permissions";
    }
  };

  const getUserCountForRole = (role: string) =>
    stats?.byRole.find((r) => r.role === role)?.count || 0;

  const organizePermissions = (permissions: string[]): Permission[] => {
    const categories: { [key: string]: string[] } = {};

    for (const permission of permissions) {
      const [category, action] = permission.split(".");
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(action);
    }

    return Object.entries(categories).map(([category, perms]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      permissions: perms,
    }));
  };

  const getPermissionBadgeVariant = (permission: string) => {
    if (permission.includes("delete") || permission.includes("manage")) {
      return "destructive" as const;
    }
    if (permission.includes("create") || permission.includes("update")) {
      return "default" as const;
    }
    return "secondary" as const;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-lg">Loading roles...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <X className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-4 font-semibold text-lg">Error loading roles</h3>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
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
            <h1 className="font-bold text-3xl tracking-tight">
              Role Management
            </h1>
            <p className="text-muted-foreground">
              Configure user roles and their associated permissions for your
              organization.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8">
        {/* Roles Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Roles
            </CardTitle>
            <CardDescription>
              Predefined roles with specific permission sets. Click on a role to
              view detailed permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {roles.map((role) => (
                <div
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  key={role}
                  onClick={() => {
                    setSelectedRole(role);
                    setShowRoleDetails(true);
                  }}
                >
                  <div className="flex items-center gap-4">
                    {getRoleIcon(role)}
                    <div>
                      <h3 className="font-medium">
                        {getRoleDisplayName(role)}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {getRoleDescription(role)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-medium text-sm">
                        {getUserCountForRole(role)}
                      </p>
                      <p className="text-muted-foreground text-xs">users</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">
                        {rolePermissions[role]?.length || 0}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        permissions
                      </p>
                    </div>
                    {getRoleBadge(role)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permission Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Permission Matrix
            </CardTitle>
            <CardDescription>
              Overview of permissions granted to each role across different
              system areas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Appointments</TableHead>
                    <TableHead>Dashboard</TableHead>
                    <TableHead>Total Permissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => {
                    const permissions = rolePermissions[role] || [];
                    const permissionsByCategory = {
                      users: permissions.filter((p) => p.startsWith("users."))
                        .length,
                      clients: permissions.filter((p) =>
                        p.startsWith("clients.")
                      ).length,
                      documents: permissions.filter((p) =>
                        p.startsWith("documents.")
                      ).length,
                      tax: permissions.filter((p) => p.startsWith("tax."))
                        .length,
                      appointments: permissions.filter((p) =>
                        p.startsWith("appointments.")
                      ).length,
                      dashboard: permissions.filter((p) =>
                        p.startsWith("dashboard.")
                      ).length,
                    };

                    return (
                      <TableRow key={role}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(role)}
                            <span className="font-medium">
                              {getRoleDisplayName(role)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {permissionsByCategory.users > 0 ? (
                            <Badge variant="default">
                              {permissionsByCategory.users}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {permissionsByCategory.clients > 0 ? (
                            <Badge variant="default">
                              {permissionsByCategory.clients}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {permissionsByCategory.documents > 0 ? (
                            <Badge variant="default">
                              {permissionsByCategory.documents}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {permissionsByCategory.tax > 0 ? (
                            <Badge variant="default">
                              {permissionsByCategory.tax}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {permissionsByCategory.appointments > 0 ? (
                            <Badge variant="default">
                              {permissionsByCategory.appointments}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {permissionsByCategory.dashboard > 0 ? (
                            <Badge variant="default">
                              {permissionsByCategory.dashboard}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{permissions.length}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Role Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Role Guidelines
            </CardTitle>
            <CardDescription>
              Best practices for assigning roles to users in your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-medium">
                  <Crown className="h-4 w-4 text-red-500" />
                  Super Admin & Admin
                </h4>
                <p className="text-muted-foreground text-sm">
                  Reserve for trusted personnel who need full system access.
                  Super Admins should be limited to organization owners, while
                  Admins can be department heads or IT personnel.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-medium">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  Manager
                </h4>
                <p className="text-muted-foreground text-sm">
                  Ideal for team leads who need oversight capabilities without
                  full administrative access. Can manage team members and client
                  relationships.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Accountant
                </h4>
                <p className="text-muted-foreground text-sm">
                  Specialized role for financial personnel with access to tax
                  calculations, financial documents, and accounting features
                  while maintaining data security.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-orange-500" />
                  Client Service & Read-Only
                </h4>
                <p className="text-muted-foreground text-sm">
                  Client Service for customer-facing roles with communication
                  and basic management access. Read-Only for interns or
                  contractors who need visibility without modification rights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Details Dialog */}
      <Dialog onOpenChange={setShowRoleDetails} open={showRoleDetails}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRole && getRoleIcon(selectedRole)}
              {selectedRole && getRoleDisplayName(selectedRole)} Permissions
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of permissions granted to this role.
            </DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <div className="space-y-6">
              {/* Role Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(selectedRole)}
                        <span className="font-medium">
                          {getUserCountForRole(selectedRole)} users assigned
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {getRoleDescription(selectedRole)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl">
                        {rolePermissions[selectedRole]?.length || 0}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Total Permissions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Permissions by Category */}
              <div className="space-y-4">
                {organizePermissions(rolePermissions[selectedRole] || []).map(
                  (category) => (
                    <Card key={category.category}>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                          {category.category} Permissions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {category.permissions.map((permission) => (
                            <Badge
                              className="capitalize"
                              key={permission}
                              variant={getPermissionBadgeVariant(permission)}
                            >
                              {permission.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>

              {rolePermissions[selectedRole]?.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 font-semibold">No Permissions</h3>
                    <p className="text-muted-foreground">
                      This role has no specific permissions assigned.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Separator />

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowRoleDetails(false)}
                  variant="outline"
                >
                  Close
                </Button>
                <Button onClick={() => navigate({ to: "/users" })}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
