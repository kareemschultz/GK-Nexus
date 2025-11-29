import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/users")({
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

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "suspended" | "pending";
  department?: string | null;
  phoneNumber?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Query for users list
  const {
    data: usersResponse,
    isLoading,
    error,
  } = useQuery(
    orpc.users.list.queryOptions({
      search: searchTerm || undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      page: 1,
      limit: 50,
    })
  );

  // Query for user statistics
  const { data: statsResponse } = useQuery(orpc.users.stats.queryOptions());

  // Query for roles and permissions
  const { data: rolesResponse } = useQuery(
    orpc.users.rolesAndPermissions.queryOptions()
  );

  const users = usersResponse?.data?.items || [];
  const stats = statsResponse?.data;
  const availableRoles = rolesResponse?.data?.roles || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "suspended":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
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

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Never";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return "Never";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-lg">Loading users...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-4 font-semibold text-lg">Error loading users</h3>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions for your
              organization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate({ to: "/users/roles" })}
              variant="outline"
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage Roles
            </Button>
            <Button onClick={() => navigate({ to: "/users/invite" })}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>
        </div>
      </header>

      {/* User Statistics */}
      {stats && (
        <section aria-label="User statistics" className="mb-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Total Users
                    </p>
                    <p className="font-bold text-2xl">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Active Users
                    </p>
                    <p className="font-bold text-2xl">
                      {stats.byStatus.find((s) => s.status === "active")
                        ?.count || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Pending Users
                    </p>
                    <p className="font-bold text-2xl">
                      {stats.byStatus.find((s) => s.status === "pending")
                        ?.count || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Administrators
                    </p>
                    <p className="font-bold text-2xl">
                      {(stats.byRole.find((r) => r.role === "admin")?.count ||
                        0) +
                        (stats.byRole.find((r) => r.role === "super_admin")
                          ?.count || 0)}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Filters and Search */}
      <section aria-label="User filters and search" className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by name, email, or department..."
                  value={searchTerm}
                />
              </div>
              <div className="flex gap-2">
                <Select onValueChange={setRoleFilter} value={roleFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Users Table */}
      <section aria-label="Users listing table">
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
            <CardDescription>
              Comprehensive view of all user accounts and their current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow className="hover:bg-muted/50" key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(user.status)}
                        {getStatusBadge(user.status)}
                      </div>
                    </TableCell>
                    <TableCell>{user.department || "—"}</TableCell>
                    <TableCell>
                      <div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{user.phoneNumber}</span>
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(user.lastLoginAt)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetails(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Manage Permissions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.length === 0 && (
              <div className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold text-lg">No users found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => navigate({ to: "/users/invite" })}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite First User
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* User Details Dialog */}
      <Dialog onOpenChange={setShowUserDetails} open={showUserDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed information and permissions for this user.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="grid gap-6">
              {/* User Overview */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedUser.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser.email}</span>
                    </div>
                    {selectedUser.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedUser.phoneNumber}</span>
                      </div>
                    )}
                    {selectedUser.department && (
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedUser.department}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      {getRoleBadge(selectedUser.role)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedUser.status)}
                        {getStatusBadge(selectedUser.status)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Login:</span>
                      <span className="font-medium">
                        {formatDateTime(selectedUser.lastLoginAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">
                        {formatDate(selectedUser.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowUserDetails(false)}
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </Button>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Permissions
                </Button>
                <Button>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
