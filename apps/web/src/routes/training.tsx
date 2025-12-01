import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  Calendar,
  GraduationCap,
  MoreHorizontal,
  Plus,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type TrainingProgram = {
  id: string;
  programCode: string;
  title: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  duration: string;
  maxParticipants: number;
  enrolledCount: number;
  instructor: string;
  nextSession: string;
};

type Enrollment = {
  id: string;
  enrollmentCode: string;
  participantName: string;
  email: string;
  programTitle: string;
  status: "ENROLLED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  enrolledDate: string;
  completionDate?: string;
  score?: number;
};

type Certification = {
  id: string;
  certificationCode: string;
  participantName: string;
  programTitle: string;
  issuedDate: string;
  expiryDate: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
};

const mockPrograms: TrainingProgram[] = [
  {
    id: "1",
    programCode: "TRN-2024-001",
    title: "Tax Compliance Fundamentals",
    category: "TAX",
    status: "PUBLISHED",
    duration: "8 hours",
    maxParticipants: 25,
    enrolledCount: 18,
    instructor: "Dr. Patricia Williams",
    nextSession: "2024-12-15",
  },
  {
    id: "2",
    programCode: "TRN-2024-002",
    title: "Local Content Regulations Workshop",
    category: "COMPLIANCE",
    status: "PUBLISHED",
    duration: "16 hours",
    maxParticipants: 30,
    enrolledCount: 25,
    instructor: "Mr. James Singh",
    nextSession: "2024-12-20",
  },
  {
    id: "3",
    programCode: "TRN-2024-003",
    title: "Immigration Law Updates 2024",
    category: "IMMIGRATION",
    status: "DRAFT",
    duration: "4 hours",
    maxParticipants: 20,
    enrolledCount: 0,
    instructor: "Ms. Sarah Thomas",
    nextSession: "2025-01-10",
  },
  {
    id: "4",
    programCode: "TRN-2024-004",
    title: "Business Registration Procedures",
    category: "BUSINESS",
    status: "PUBLISHED",
    duration: "6 hours",
    maxParticipants: 35,
    enrolledCount: 30,
    instructor: "Mr. Andrew Brown",
    nextSession: "2024-12-18",
  },
  {
    id: "5",
    programCode: "TRN-2024-005",
    title: "Environmental Compliance Certification",
    category: "COMPLIANCE",
    status: "ARCHIVED",
    duration: "24 hours",
    maxParticipants: 15,
    enrolledCount: 15,
    instructor: "Dr. Marcus Jones",
    nextSession: "-",
  },
];

const mockEnrollments: Enrollment[] = [
  {
    id: "1",
    enrollmentCode: "ENR-2024-001",
    participantName: "John Smith",
    email: "john.smith@company.gy",
    programTitle: "Tax Compliance Fundamentals",
    status: "IN_PROGRESS",
    enrolledDate: "2024-11-01",
  },
  {
    id: "2",
    enrollmentCode: "ENR-2024-002",
    participantName: "Sarah Johnson",
    email: "sarah.j@business.gy",
    programTitle: "Local Content Regulations Workshop",
    status: "COMPLETED",
    enrolledDate: "2024-10-15",
    completionDate: "2024-11-15",
    score: 92,
  },
  {
    id: "3",
    enrollmentCode: "ENR-2024-003",
    participantName: "Michael Davis",
    email: "m.davis@corp.gy",
    programTitle: "Business Registration Procedures",
    status: "ENROLLED",
    enrolledDate: "2024-11-25",
  },
  {
    id: "4",
    enrollmentCode: "ENR-2024-004",
    participantName: "Lisa Williams",
    email: "lisa.w@firm.gy",
    programTitle: "Tax Compliance Fundamentals",
    status: "COMPLETED",
    enrolledDate: "2024-09-01",
    completionDate: "2024-09-30",
    score: 88,
  },
];

const mockCertifications: Certification[] = [
  {
    id: "1",
    certificationCode: "CERT-2024-001",
    participantName: "Sarah Johnson",
    programTitle: "Local Content Regulations Workshop",
    issuedDate: "2024-11-15",
    expiryDate: "2025-11-15",
    status: "ACTIVE",
  },
  {
    id: "2",
    certificationCode: "CERT-2024-002",
    participantName: "Lisa Williams",
    programTitle: "Tax Compliance Fundamentals",
    issuedDate: "2024-09-30",
    expiryDate: "2025-09-30",
    status: "ACTIVE",
  },
  {
    id: "3",
    certificationCode: "CERT-2023-015",
    participantName: "Robert Chen",
    programTitle: "Environmental Compliance Certification",
    issuedDate: "2023-06-15",
    expiryDate: "2024-06-15",
    status: "EXPIRED",
  },
];

function TrainingPage() {
  const [activeTab, setActiveTab] = useState("programs");

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      DRAFT: "outline",
      PUBLISHED: "default",
      ARCHIVED: "secondary",
      ENROLLED: "outline",
      IN_PROGRESS: "default",
      COMPLETED: "secondary",
      CANCELLED: "destructive",
      ACTIVE: "default",
      EXPIRED: "destructive",
      REVOKED: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      TAX: "bg-blue-100 text-blue-800",
      COMPLIANCE: "bg-green-100 text-green-800",
      IMMIGRATION: "bg-purple-100 text-purple-800",
      BUSINESS: "bg-orange-100 text-orange-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[category] || "bg-gray-100 text-gray-800"}`}
      >
        {category}
      </span>
    );
  };

  const totalPrograms = mockPrograms.filter(
    (p) => p.status === "PUBLISHED"
  ).length;
  const totalEnrollments = mockEnrollments.length;
  const completedTrainings = mockEnrollments.filter(
    (e) => e.status === "COMPLETED"
  ).length;
  const activeCertifications = mockCertifications.filter(
    (c) => c.status === "ACTIVE"
  ).length;

  return (
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Program
          </Button>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Active Programs
                </p>
                <p className="font-bold text-2xl">{totalPrograms}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Total Enrollments
                </p>
                <p className="font-bold text-2xl">{totalEnrollments}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Completed
                </p>
                <p className="font-bold text-2xl">{completedTrainings}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Certifications
                </p>
                <p className="font-bold text-2xl">{activeCertifications}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Training Dashboard</CardTitle>
          <CardDescription>
            Manage all training programs, track enrollments, and issue
            certifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="programs">
                <BookOpen className="mr-2 h-4 w-4" />
                Programs
              </TabsTrigger>
              <TabsTrigger value="enrollments">
                <Users className="mr-2 h-4 w-4" />
                Enrollments
              </TabsTrigger>
              <TabsTrigger value="certifications">
                <Award className="mr-2 h-4 w-4" />
                Certifications
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="programs">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Next Session</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPrograms.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">
                        {program.programCode}
                      </TableCell>
                      <TableCell>{program.title}</TableCell>
                      <TableCell>
                        {getCategoryBadge(program.category)}
                      </TableCell>
                      <TableCell>{getStatusBadge(program.status)}</TableCell>
                      <TableCell>{program.duration}</TableCell>
                      <TableCell>
                        {program.enrolledCount}/{program.maxParticipants}
                      </TableCell>
                      <TableCell>{program.instructor}</TableCell>
                      <TableCell>{program.nextSession}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Program</DropdownMenuItem>
                            <DropdownMenuItem>
                              View Enrollments
                            </DropdownMenuItem>
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
            </TabsContent>

            <TabsContent value="enrollments">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enrollment Code</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.enrollmentCode}
                      </TableCell>
                      <TableCell>{enrollment.participantName}</TableCell>
                      <TableCell>{enrollment.email}</TableCell>
                      <TableCell>{enrollment.programTitle}</TableCell>
                      <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                      <TableCell>{enrollment.enrolledDate}</TableCell>
                      <TableCell>
                        {enrollment.score ? `${enrollment.score}%` : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Update Status</DropdownMenuItem>
                            <DropdownMenuItem>Record Score</DropdownMenuItem>
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
            </TabsContent>

            <TabsContent value="certifications">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certification Code</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCertifications.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">
                        {cert.certificationCode}
                      </TableCell>
                      <TableCell>{cert.participantName}</TableCell>
                      <TableCell>{cert.programTitle}</TableCell>
                      <TableCell>{cert.issuedDate}</TableCell>
                      <TableCell>{cert.expiryDate}</TableCell>
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
                            <DropdownMenuItem>Download PDF</DropdownMenuItem>
                            <DropdownMenuItem>Renew</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="calendar">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Training Calendar</h3>
                <p className="text-muted-foreground">
                  View upcoming training sessions and schedule new ones.
                </p>
                <Button className="mt-4" variant="outline">
                  View Full Calendar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
