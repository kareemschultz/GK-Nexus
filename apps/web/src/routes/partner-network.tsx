import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  FileText,
  Handshake,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Share2,
  Star,
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

export const Route = createFileRoute("/partner-network")({
  component: PartnerNetworkPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

type Partner = {
  id: string;
  partnerCode: string;
  name: string;
  type: string;
  specialty: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";
  rating: number;
  referralsCount: number;
  agreementStatus: "SIGNED" | "PENDING" | "EXPIRED";
  location: string;
};

type Referral = {
  id: string;
  referralNumber: string;
  partnerName: string;
  clientName: string;
  serviceType: string;
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "REJECTED";
  referralDate: string;
  commission: number;
  commissionStatus: "PENDING" | "PAID" | "PROCESSING";
};

type Agreement = {
  id: string;
  agreementCode: string;
  partnerName: string;
  type: string;
  status: "ACTIVE" | "EXPIRED" | "PENDING_RENEWAL";
  startDate: string;
  endDate: string;
  commissionRate: number;
};

const mockPartners: Partner[] = [
  {
    id: "1",
    partnerCode: "PTR-2024-001",
    name: "Georgetown Legal Associates",
    type: "LAW_FIRM",
    specialty: "Corporate Law",
    status: "ACTIVE",
    rating: 4.8,
    referralsCount: 45,
    agreementStatus: "SIGNED",
    location: "Georgetown",
  },
  {
    id: "2",
    partnerCode: "PTR-2024-002",
    name: "Demerara Accounting Services",
    type: "ACCOUNTING",
    specialty: "Tax Advisory",
    status: "ACTIVE",
    rating: 4.5,
    referralsCount: 32,
    agreementStatus: "SIGNED",
    location: "Georgetown",
  },
  {
    id: "3",
    partnerCode: "PTR-2024-003",
    name: "Berbice Immigration Consultants",
    type: "IMMIGRATION",
    specialty: "Work Permits",
    status: "ACTIVE",
    rating: 4.2,
    referralsCount: 18,
    agreementStatus: "PENDING",
    location: "New Amsterdam",
  },
  {
    id: "4",
    partnerCode: "PTR-2024-004",
    name: "Linden Business Advisors",
    type: "CONSULTING",
    specialty: "Business Registration",
    status: "PENDING",
    rating: 0,
    referralsCount: 0,
    agreementStatus: "PENDING",
    location: "Linden",
  },
  {
    id: "5",
    partnerCode: "PTR-2024-005",
    name: "Essequibo Property Managers",
    type: "REAL_ESTATE",
    specialty: "Property Management",
    status: "INACTIVE",
    rating: 3.8,
    referralsCount: 12,
    agreementStatus: "EXPIRED",
    location: "Anna Regina",
  },
];

const mockReferrals: Referral[] = [
  {
    id: "1",
    referralNumber: "REF-2024-001",
    partnerName: "Georgetown Legal Associates",
    clientName: "Guyana Mining Corp",
    serviceType: "Corporate Registration",
    status: "COMPLETED",
    referralDate: "2024-10-15",
    commission: 150_000,
    commissionStatus: "PAID",
  },
  {
    id: "2",
    referralNumber: "REF-2024-002",
    partnerName: "Demerara Accounting Services",
    clientName: "Atlantic Trading Ltd",
    serviceType: "Tax Compliance",
    status: "ACCEPTED",
    referralDate: "2024-11-01",
    commission: 120_000,
    commissionStatus: "PENDING",
  },
  {
    id: "3",
    referralNumber: "REF-2024-003",
    partnerName: "Berbice Immigration Consultants",
    clientName: "Tech Solutions Guyana",
    serviceType: "Work Permit Processing",
    status: "PENDING",
    referralDate: "2024-11-20",
    commission: 80_000,
    commissionStatus: "PENDING",
  },
  {
    id: "4",
    referralNumber: "REF-2024-004",
    partnerName: "Georgetown Legal Associates",
    clientName: "Green Energy Inc",
    serviceType: "Environmental Compliance",
    status: "COMPLETED",
    referralDate: "2024-09-25",
    commission: 200_000,
    commissionStatus: "PROCESSING",
  },
];

const mockAgreements: Agreement[] = [
  {
    id: "1",
    agreementCode: "AGR-2024-001",
    partnerName: "Georgetown Legal Associates",
    type: "REFERRAL",
    status: "ACTIVE",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    commissionRate: 15,
  },
  {
    id: "2",
    agreementCode: "AGR-2024-002",
    partnerName: "Demerara Accounting Services",
    type: "COLLABORATION",
    status: "ACTIVE",
    startDate: "2024-03-15",
    endDate: "2025-03-14",
    commissionRate: 12,
  },
  {
    id: "3",
    agreementCode: "AGR-2024-003",
    partnerName: "Berbice Immigration Consultants",
    type: "REFERRAL",
    status: "PENDING_RENEWAL",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    commissionRate: 10,
  },
  {
    id: "4",
    agreementCode: "AGR-2023-015",
    partnerName: "Essequibo Property Managers",
    type: "REFERRAL",
    status: "EXPIRED",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    commissionRate: 8,
  },
];

function PartnerNetworkPage() {
  const [activeTab, setActiveTab] = useState("partners");

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      PENDING: "outline",
      SUSPENDED: "destructive",
      SIGNED: "default",
      EXPIRED: "destructive",
      PENDING_RENEWAL: "outline",
      ACCEPTED: "default",
      COMPLETED: "secondary",
      REJECTED: "destructive",
      PAID: "default",
      PROCESSING: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      LAW_FIRM: "bg-blue-100 text-blue-800",
      ACCOUNTING: "bg-green-100 text-green-800",
      IMMIGRATION: "bg-purple-100 text-purple-800",
      CONSULTING: "bg-orange-100 text-orange-800",
      REAL_ESTATE: "bg-cyan-100 text-cyan-800",
      REFERRAL: "bg-blue-100 text-blue-800",
      COLLABORATION: "bg-green-100 text-green-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[type] || "bg-gray-100 text-gray-800"}`}
      >
        {type.replace("_", " ")}
      </span>
    );
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
    }).format(amount);

  const getStarClassName = (
    index: number,
    fullStars: number,
    hasHalfStar: boolean
  ) => {
    if (index < fullStars) {
      return "fill-yellow-400 text-yellow-400";
    }
    if (index === fullStars && hasHalfStar) {
      return "fill-yellow-200 text-yellow-400";
    }
    return "text-gray-300";
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const starKeys = ["star-1", "star-2", "star-3", "star-4", "star-5"];
    return (
      <div className="flex items-center gap-1">
        {starKeys.map((key, i) => (
          <Star
            className={`h-4 w-4 ${getStarClassName(i, fullStars, hasHalfStar)}`}
            key={key}
          />
        ))}
        <span className="ml-1 text-muted-foreground text-sm">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  const totalPartners = mockPartners.filter(
    (p) => p.status === "ACTIVE"
  ).length;
  const totalReferrals = mockReferrals.length;
  const activeAgreements = mockAgreements.filter(
    (a) => a.status === "ACTIVE"
  ).length;
  const totalCommissions = mockReferrals
    .filter((r) => r.commissionStatus === "PAID")
    .reduce((sum, r) => sum + r.commission, 0);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Partner Network
            </h1>
            <p className="text-muted-foreground">
              Manage professional partnerships, referrals, and collaboration
              agreements.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Partner
          </Button>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Active Partners
                </p>
                <p className="font-bold text-2xl">{totalPartners}</p>
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
                  Total Referrals
                </p>
                <p className="font-bold text-2xl">{totalReferrals}</p>
              </div>
              <Share2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Active Agreements
                </p>
                <p className="font-bold text-2xl">{activeAgreements}</p>
              </div>
              <Handshake className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Commissions Paid
                </p>
                <p className="font-bold text-2xl">
                  {formatCurrency(totalCommissions)}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Partner Management</CardTitle>
          <CardDescription>
            Manage partner relationships, track referrals, and handle
            agreements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="partners">
                <Users className="mr-2 h-4 w-4" />
                Partners
              </TabsTrigger>
              <TabsTrigger value="referrals">
                <Share2 className="mr-2 h-4 w-4" />
                Referrals
              </TabsTrigger>
              <TabsTrigger value="agreements">
                <FileText className="mr-2 h-4 w-4" />
                Agreements
              </TabsTrigger>
              <TabsTrigger value="communications">
                <MessageSquare className="mr-2 h-4 w-4" />
                Communications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="partners">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">
                        {partner.partnerCode}
                      </TableCell>
                      <TableCell>{partner.name}</TableCell>
                      <TableCell>{getTypeBadge(partner.type)}</TableCell>
                      <TableCell>{partner.specialty}</TableCell>
                      <TableCell>{getStatusBadge(partner.status)}</TableCell>
                      <TableCell>
                        {partner.rating > 0 ? renderStars(partner.rating) : "-"}
                      </TableCell>
                      <TableCell>{partner.referralsCount}</TableCell>
                      <TableCell>{partner.location}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit Partner</DropdownMenuItem>
                            <DropdownMenuItem>View Agreement</DropdownMenuItem>
                            <DropdownMenuItem>Send Referral</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="referrals">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referral #</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">
                        {referral.referralNumber}
                      </TableCell>
                      <TableCell>{referral.partnerName}</TableCell>
                      <TableCell>{referral.clientName}</TableCell>
                      <TableCell>{referral.serviceType}</TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell>{referral.referralDate}</TableCell>
                      <TableCell>
                        {formatCurrency(referral.commission)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(referral.commissionStatus)}
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
                            <DropdownMenuItem>Process Payment</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="agreements">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agreement Code</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAgreements.map((agreement) => (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-medium">
                        {agreement.agreementCode}
                      </TableCell>
                      <TableCell>{agreement.partnerName}</TableCell>
                      <TableCell>{getTypeBadge(agreement.type)}</TableCell>
                      <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                      <TableCell>{agreement.startDate}</TableCell>
                      <TableCell>{agreement.endDate}</TableCell>
                      <TableCell>{agreement.commissionRate}%</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Agreement</DropdownMenuItem>
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

            <TabsContent value="communications">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-semibold text-lg">
                  Partner Communications
                </h3>
                <p className="text-muted-foreground">
                  View and manage all communications with your partner network.
                </p>
                <Button className="mt-4" variant="outline">
                  View Messages
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
