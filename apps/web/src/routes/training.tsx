import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  GraduationCap,
  HelpCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/training")({
  component: TrainingPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

// Loading skeleton component
const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton className="h-12 w-full" key={`skeleton-${i}`} />
    ))}
  </div>
);

// Error display component
const ErrorDisplay = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
    <h3 className="font-semibold text-lg">Error Loading Data</h3>
    <p className="text-muted-foreground">{message}</p>
    <Button className="mt-4" onClick={onRetry} variant="outline">
      <RefreshCw className="mr-2 h-4 w-4" />
      Try Again
    </Button>
  </div>
);

// Empty state component
const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const trainingCategories = [
  "ACCOUNTING_FINANCE",
  "TAX_COMPLIANCE",
  "BUSINESS_MANAGEMENT",
  "LEGAL_REGULATORY",
  "TECHNOLOGY_IT",
  "SOFT_SKILLS",
  "INDUSTRY_SPECIFIC",
  "CERTIFICATION_PREP",
  "PROFESSIONAL_DEVELOPMENT",
  "OTHER",
] as const;

const deliveryModes = [
  "IN_PERSON",
  "ONLINE_LIVE",
  "ONLINE_SELF_PACED",
  "HYBRID",
  "WORKSHOP",
] as const;

function TrainingPage() {
  const [activeTab, setActiveTab] = useState("programs");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showNewCourseDialog, setShowNewCourseDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch courses
  const coursesQuery = useQuery({
    queryKey: [
      "trainingCourses",
      {
        search: searchTerm,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
      },
    ],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.training.courses.list({
        search: searchTerm || undefined,
        category:
          categoryFilter !== "all"
            ? (categoryFilter as (typeof trainingCategories)[number])
            : undefined,
        page: 1,
        limit: 50,
      });
    },
  });

  // Fetch sessions
  const sessionsQuery = useQuery({
    queryKey: ["trainingSessions"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.training.sessions.list({
        page: 1,
        limit: 50,
        upcoming: true,
      });
    },
  });

  // Fetch registrations
  const registrationsQuery = useQuery({
    queryKey: ["trainingRegistrations"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.training.registrations.list({
        page: 1,
        limit: 50,
      });
    },
  });

  // Fetch certificates
  const certificatesQuery = useQuery({
    queryKey: ["trainingCertificates"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.training.certificates.list({
        page: 1,
        limit: 50,
      });
    },
  });

  // Fetch stats
  const statsQuery = useQuery({
    queryKey: ["trainingStats"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.training.courses.stats({});
    },
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      category: (typeof trainingCategories)[number];
      deliveryMode: (typeof deliveryModes)[number];
      durationHours: number;
      maxParticipants?: number;
      price?: string;
      certificateOffered?: boolean;
      notes?: string;
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.training.courses.create(data);
    },
    onSuccess: () => {
      toast.success("Course created successfully");
      setShowNewCourseDialog(false);
      queryClient.invalidateQueries({ queryKey: ["trainingCourses"] });
      queryClient.invalidateQueries({ queryKey: ["trainingStats"] });
    },
    onError: (error) => {
      toast.error(`Failed to create course: ${error.message}`);
    },
  });

  // Publish course mutation
  const publishCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { client } = await import("@/utils/orpc");
      return client.training.courses.publish({ id });
    },
    onSuccess: () => {
      toast.success("Course published successfully");
      queryClient.invalidateQueries({ queryKey: ["trainingCourses"] });
      queryClient.invalidateQueries({ queryKey: ["trainingStats"] });
    },
    onError: (error) => {
      toast.error(`Failed to publish course: ${error.message}`);
    },
  });

  const handleCreateCourse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCourseMutation.mutate({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      category: formData.get("category") as (typeof trainingCategories)[number],
      deliveryMode: formData.get(
        "deliveryMode"
      ) as (typeof deliveryModes)[number],
      durationHours: Number(formData.get("durationHours")),
      maxParticipants: formData.get("maxParticipants")
        ? Number(formData.get("maxParticipants"))
        : undefined,
      price: (formData.get("price") as string) || undefined,
      certificateOffered: formData.get("certificateOffered") === "true",
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      DRAFT: "outline",
      PUBLISHED: "default",
      ARCHIVED: "secondary",
      DISCONTINUED: "destructive",
      PENDING: "outline",
      CONFIRMED: "default",
      WAITLISTED: "secondary",
      CANCELLED: "destructive",
      NO_SHOW: "destructive",
      COMPLETED: "secondary",
      ISSUED: "default",
      REVOKED: "destructive",
      EXPIRED: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      ACCOUNTING_FINANCE: "bg-blue-100 text-blue-800",
      TAX_COMPLIANCE: "bg-green-100 text-green-800",
      BUSINESS_MANAGEMENT: "bg-purple-100 text-purple-800",
      LEGAL_REGULATORY: "bg-orange-100 text-orange-800",
      TECHNOLOGY_IT: "bg-cyan-100 text-cyan-800",
      SOFT_SKILLS: "bg-pink-100 text-pink-800",
      INDUSTRY_SPECIFIC: "bg-yellow-100 text-yellow-800",
      CERTIFICATION_PREP: "bg-indigo-100 text-indigo-800",
      PROFESSIONAL_DEVELOPMENT: "bg-teal-100 text-teal-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[category] || "bg-gray-100 text-gray-800"}`}
      >
        {category.replace(/_/g, " ")}
      </span>
    );
  };

  const stats = statsQuery.data?.data;
  const courses = coursesQuery.data?.data?.items || [];
  const sessions = sessionsQuery.data?.data?.items || [];
  const registrations = registrationsQuery.data?.data?.items || [];
  const certificates = certificatesQuery.data?.data?.items || [];

  // Calculate stats from the data
  const totalPublished =
    stats?.byStatus?.find((s: any) => s.status === "PUBLISHED")?.count || 0;
  const totalRegistrations = registrations.length;
  const completedRegistrations = registrations.filter(
    (r: any) => r.status === "COMPLETED"
  ).length;
  const activeCertificates = certificates.filter(
    (c: any) => c.status === "ISSUED"
  ).length;

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl tracking-tight">
                Training Management
              </h1>
              <p className="text-muted-foreground">
                Manage training programs, enrollments, and certifications.
              </p>
            </div>
            <Dialog
              onOpenChange={setShowNewCourseDialog}
              open={showNewCourseDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Training Course</DialogTitle>
                  <DialogDescription>
                    Create a new training course. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateCourse}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Course Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter course name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select defaultValue="TAX_COMPLIANCE" name="category">
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainingCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryMode">Delivery Mode</Label>
                      <Select defaultValue="IN_PERSON" name="deliveryMode">
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryModes.map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {mode.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="durationHours">Duration (Hours)</Label>
                      <Input
                        defaultValue="8"
                        id="durationHours"
                        min="0.5"
                        name="durationHours"
                        required
                        step="0.5"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxParticipants">Max Participants</Label>
                      <Input
                        id="maxParticipants"
                        min="1"
                        name="maxParticipants"
                        placeholder="e.g., 25"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (GYD)</Label>
                      <Input
                        id="price"
                        name="price"
                        placeholder="e.g., 25000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certificateOffered">Certificate</Label>
                      <Select defaultValue="true" name="certificateOffered">
                        <SelectTrigger>
                          <SelectValue placeholder="Certificate offered?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Course description..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Additional notes..."
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => setShowNewCourseDialog(false)}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={createCourseMutation.isPending}
                      type="submit"
                    >
                      {createCourseMutation.isPending
                        ? "Creating..."
                        : "Create Course"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Active Courses
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Published training courses available for enrollment
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{totalPublished}</p>
                  )}
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Registrations
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Total participant registrations for training sessions
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {registrationsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{totalRegistrations}</p>
                  )}
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Completed
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Participants who completed their training
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {registrationsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">
                      {completedRegistrations}
                    </p>
                  )}
                </div>
                <GraduationCap className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Certificates
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Active certificates issued to participants
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {certificatesQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{activeCertificates}</p>
                  )}
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Training Dashboard</CardTitle>
                <CardDescription>
                  Manage all training programs, track enrollments, and issue
                  certifications.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="w-64 pl-9"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search courses..."
                    value={searchTerm}
                  />
                </div>
                <Select
                  onValueChange={setCategoryFilter}
                  value={categoryFilter}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {trainingCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="programs">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Courses
                </TabsTrigger>
                <TabsTrigger value="sessions">
                  <Calendar className="mr-2 h-4 w-4" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger value="enrollments">
                  <Users className="mr-2 h-4 w-4" />
                  Registrations
                </TabsTrigger>
                <TabsTrigger value="certifications">
                  <Award className="mr-2 h-4 w-4" />
                  Certificates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="programs">
                {coursesQuery.isLoading ? (
                  <TableSkeleton />
                ) : coursesQuery.isError ? (
                  <ErrorDisplay
                    message={
                      coursesQuery.error?.message || "Failed to load courses"
                    }
                    onRetry={() => coursesQuery.refetch()}
                  />
                ) : courses.length === 0 ? (
                  <EmptyState
                    action={
                      <Button onClick={() => setShowNewCourseDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Course
                      </Button>
                    }
                    description="Get started by creating your first training course."
                    title="No Training Courses"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Delivery Mode</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course: any) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">
                            {course.courseCode}
                          </TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell>
                            {getCategoryBadge(course.category)}
                          </TableCell>
                          <TableCell>{getStatusBadge(course.status)}</TableCell>
                          <TableCell>{course.durationHours} hours</TableCell>
                          <TableCell>
                            {course.deliveryMode.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>
                            {course.price
                              ? `${course.currency || "GYD"} ${course.price}`
                              : "Free"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>Edit Course</DropdownMenuItem>
                                {course.status === "DRAFT" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      publishCourseMutation.mutate(course.id)
                                    }
                                  >
                                    Publish Course
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  Schedule Session
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="sessions">
                {sessionsQuery.isLoading ? (
                  <TableSkeleton />
                ) : sessionsQuery.isError ? (
                  <ErrorDisplay
                    message={
                      sessionsQuery.error?.message || "Failed to load sessions"
                    }
                    onRetry={() => sessionsQuery.refetch()}
                  />
                ) : sessions.length === 0 ? (
                  <EmptyState
                    description="No upcoming training sessions scheduled."
                    title="No Sessions"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session Code</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enrollment</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session: any) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            {session.sessionCode}
                          </TableCell>
                          <TableCell>{session.courseId}</TableCell>
                          <TableCell>
                            {new Date(session.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(session.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(session.status)}
                          </TableCell>
                          <TableCell>
                            {session.currentEnrollment || 0}/
                            {session.maxParticipants || "∞"}
                          </TableCell>
                          <TableCell>
                            {session.venue || session.onlinePlatform || "TBD"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  View Registrations
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Edit Session
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="enrollments">
                {registrationsQuery.isLoading ? (
                  <TableSkeleton />
                ) : registrationsQuery.isError ? (
                  <ErrorDisplay
                    message={
                      registrationsQuery.error?.message ||
                      "Failed to load registrations"
                    }
                    onRetry={() => registrationsQuery.refetch()}
                  />
                ) : registrations.length === 0 ? (
                  <EmptyState
                    description="No participant registrations yet."
                    title="No Registrations"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Registration #</TableHead>
                        <TableHead>Participant</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Session</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Attended</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((reg: any) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">
                            {reg.registrationNumber}
                          </TableCell>
                          <TableCell>{reg.participantName}</TableCell>
                          <TableCell>{reg.participantEmail}</TableCell>
                          <TableCell>{reg.sessionId}</TableCell>
                          <TableCell>{getStatusBadge(reg.status)}</TableCell>
                          <TableCell>
                            {reg.attended === true
                              ? "Yes"
                              : reg.attended === false
                                ? "No"
                                : "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Mark Attendance
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Issue Certificate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="certifications">
                {certificatesQuery.isLoading ? (
                  <TableSkeleton />
                ) : certificatesQuery.isError ? (
                  <ErrorDisplay
                    message={
                      certificatesQuery.error?.message ||
                      "Failed to load certificates"
                    }
                    onRetry={() => certificatesQuery.refetch()}
                  />
                ) : certificates.length === 0 ? (
                  <EmptyState
                    description="No certificates issued yet."
                    title="No Certificates"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certificate #</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Issued Date</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificates.map((cert: any) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium">
                            {cert.certificateNumber}
                          </TableCell>
                          <TableCell>{cert.recipientName}</TableCell>
                          <TableCell>{cert.courseId}</TableCell>
                          <TableCell>
                            {cert.issuedAt
                              ? new Date(cert.issuedAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {cert.validUntil
                              ? new Date(cert.validUntil).toLocaleDateString()
                              : "No Expiry"}
                          </TableCell>
                          <TableCell>{getStatusBadge(cert.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  View Certificate
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Verify Certificate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
