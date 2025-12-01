import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  FileText,
  Handshake,
  HelpCircle,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Star,
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
import { orpc } from "@/utils/orpc";

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
    <Handshake className="mb-4 h-12 w-12 text-muted-foreground" />
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const partnerTypes = [
  "LAW_FIRM",
  "ACCOUNTING",
  "CONSULTING",
  "REAL_ESTATE",
  "FINANCIAL_SERVICES",
  "INSURANCE",
  "IMMIGRATION",
  "HR_SERVICES",
  "IT_SERVICES",
  "OTHER",
] as const;

const agreementTypes = [
  "REFERRAL",
  "COLLABORATION",
  "RESELLER",
  "AFFILIATE",
  "STRATEGIC",
] as const;

function PartnerNetworkPage() {
  const [activeTab, setActiveTab] = useState("partners");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddPartnerDialog, setShowAddPartnerDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch partners
  const partnersQuery = useQuery({
    queryKey: [
      "partners",
      {
        search: searchTerm,
        type: typeFilter !== "all" ? typeFilter : undefined,
      },
    ],
    queryFn: () =>
      orpc.partnerNetwork.partners.list({
        search: searchTerm || undefined,
        partnerType:
          typeFilter !== "all"
            ? (typeFilter as (typeof partnerTypes)[number])
            : undefined,
        page: 1,
        limit: 50,
      }),
  });

  // Fetch referrals
  const referralsQuery = useQuery({
    queryKey: ["referrals"],
    queryFn: () =>
      orpc.partnerNetwork.referrals.list({
        page: 1,
        limit: 50,
      }),
  });

  // Fetch agreements
  const agreementsQuery = useQuery({
    queryKey: ["agreements"],
    queryFn: () =>
      orpc.partnerNetwork.agreements.list({
        page: 1,
        limit: 50,
      }),
  });

  // Fetch stats
  const statsQuery = useQuery({
    queryKey: ["partnerStats"],
    queryFn: () => orpc.partnerNetwork.partners.stats(),
  });

  // Create partner mutation
  const createPartnerMutation = useMutation({
    mutationFn: (data: {
      companyName: string;
      tradeName?: string;
      partnerType: (typeof partnerTypes)[number];
      specialties?: string[];
      contactPerson?: string;
      contactEmail?: string;
      contactPhone?: string;
      address?: string;
      city?: string;
      country?: string;
      notes?: string;
    }) => orpc.partnerNetwork.partners.create(data),
    onSuccess: () => {
      toast.success("Partner created successfully");
      setShowAddPartnerDialog(false);
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["partnerStats"] });
    },
    onError: (error) => {
      toast.error(`Failed to create partner: ${error.message}`);
    },
  });

  // Update partner status mutation
  const updatePartnerStatusMutation = useMutation({
    mutationFn: (data: {
      id: string;
      status: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "TERMINATED";
    }) =>
      orpc.partnerNetwork.partners.update({
        id: data.id,
        data: { status: data.status },
      }),
    onSuccess: () => {
      toast.success("Partner status updated");
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["partnerStats"] });
    },
    onError: (error) => {
      toast.error(`Failed to update partner: ${error.message}`);
    },
  });

  const handleCreatePartner = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const specialtiesRaw = formData.get("specialties") as string;
    const specialties = specialtiesRaw
      ? specialtiesRaw.split(",").map((s) => s.trim())
      : undefined;

    createPartnerMutation.mutate({
      companyName: formData.get("companyName") as string,
      tradeName: (formData.get("tradeName") as string) || undefined,
      partnerType: formData.get("partnerType") as (typeof partnerTypes)[number],
      specialties,
      contactPerson: (formData.get("contactPerson") as string) || undefined,
      contactEmail: (formData.get("contactEmail") as string) || undefined,
      contactPhone: (formData.get("contactPhone") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      country: (formData.get("country") as string) || "Guyana",
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      PENDING: "outline",
      SUSPENDED: "destructive",
      TERMINATED: "destructive",
      SIGNED: "default",
      EXPIRED: "destructive",
      PENDING_RENEWAL: "outline",
      ACCEPTED: "default",
      COMPLETED: "secondary",
      REJECTED: "destructive",
      PAID: "default",
      PROCESSING: "outline",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      LAW_FIRM: "bg-blue-100 text-blue-800",
      ACCOUNTING: "bg-green-100 text-green-800",
      IMMIGRATION: "bg-purple-100 text-purple-800",
      CONSULTING: "bg-orange-100 text-orange-800",
      REAL_ESTATE: "bg-cyan-100 text-cyan-800",
      FINANCIAL_SERVICES: "bg-indigo-100 text-indigo-800",
      INSURANCE: "bg-pink-100 text-pink-800",
      HR_SERVICES: "bg-teal-100 text-teal-800",
      IT_SERVICES: "bg-yellow-100 text-yellow-800",
      REFERRAL: "bg-blue-100 text-blue-800",
      COLLABORATION: "bg-green-100 text-green-800",
      RESELLER: "bg-purple-100 text-purple-800",
      AFFILIATE: "bg-orange-100 text-orange-800",
      STRATEGIC: "bg-cyan-100 text-cyan-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[type] || "bg-gray-100 text-gray-800"}`}
      >
        {type.replace(/_/g, " ")}
      </span>
    );
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = typeof amount === "string" ? Number(amount) : amount || 0;
    return new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

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

  const renderStars = (rating: number | string | null | undefined) => {
    const numRating = typeof rating === "string" ? Number(rating) : rating || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
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
          ({numRating.toFixed(1)})
        </span>
      </div>
    );
  };

  const stats = statsQuery.data?.data;
  const partners = partnersQuery.data?.data?.items || [];
  const referrals = referralsQuery.data?.data?.items || [];
  const agreements = agreementsQuery.data?.data?.items || [];

  // Calculate stats from the data
  const totalActivePartners =
    stats?.byStatus?.find((s) => s.status === "ACTIVE")?.count || 0;
  const totalReferrals = referrals.length;
  const activeAgreements = agreements.filter(
    (a) => a.status === "ACTIVE"
  ).length;
  const totalCommissions = referrals
    .filter((r) => r.commissionStatus === "PAID")
    .reduce((sum, r) => sum + Number(r.commissionAmount || 0), 0);

  return (
    <TooltipProvider>
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
            <Dialog
              onOpenChange={setShowAddPartnerDialog}
              open={showAddPartnerDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Partner</DialogTitle>
                  <DialogDescription>
                    Add a new partner to your network. Fill in the details
                    below.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreatePartner}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder="Legal company name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tradeName">Trade Name</Label>
                      <Input
                        id="tradeName"
                        name="tradeName"
                        placeholder="Doing business as"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="partnerType">Partner Type</Label>
                      <Select defaultValue="CONSULTING" name="partnerType">
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {partnerTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="e.g., Georgetown"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialties">
                      Specialties (comma-separated)
                    </Label>
                    <Input
                      id="specialties"
                      name="specialties"
                      placeholder="e.g., Tax Advisory, Corporate Law"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        name="contactPerson"
                        placeholder="Contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        placeholder="+592 xxx-xxxx"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      placeholder="email@partner.com"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      placeholder="Business address"
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
                      onClick={() => setShowAddPartnerDialog(false)}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={createPartnerMutation.isPending}
                      type="submit"
                    >
                      {createPartnerMutation.isPending
                        ? "Adding..."
                        : "Add Partner"}
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
                      Active Partners
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Total active partners in your network
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{totalActivePartners}</p>
                  )}
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Total Referrals
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Referrals sent to and received from partners
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {referralsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{totalReferrals}</p>
                  )}
                </div>
                <Share2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Active Agreements
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Current partnership agreements in effect
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {agreementsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{activeAgreements}</p>
                  )}
                </div>
                <Handshake className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Commissions Paid
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Total referral commissions paid out
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {referralsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">
                      {formatCurrency(totalCommissions)}
                    </p>
                  )}
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Partner Management</CardTitle>
                <CardDescription>
                  Manage partner relationships, track referrals, and handle
                  agreements.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="w-64 pl-9"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search partners..."
                    value={searchTerm}
                  />
                </div>
                <Select onValueChange={setTypeFilter} value={typeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {partnerTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ")}
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
                {partnersQuery.isLoading ? (
                  <TableSkeleton />
                ) : partnersQuery.isError ? (
                  <ErrorDisplay
                    message={
                      partnersQuery.error?.message || "Failed to load partners"
                    }
                    onRetry={() => partnersQuery.refetch()}
                  />
                ) : partners.length === 0 ? (
                  <EmptyState
                    action={
                      <Button onClick={() => setShowAddPartnerDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Partner
                      </Button>
                    }
                    description="Start building your partner network."
                    title="No Partners"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Referrals</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell className="font-medium">
                            {partner.partnerCode}
                          </TableCell>
                          <TableCell>{partner.companyName}</TableCell>
                          <TableCell>
                            {getTypeBadge(partner.partnerType)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(partner.status)}
                          </TableCell>
                          <TableCell>
                            {partner.rating && Number(partner.rating) > 0
                              ? renderStars(partner.rating)
                              : "-"}
                          </TableCell>
                          <TableCell>{partner.totalReferrals || 0}</TableCell>
                          <TableCell>{partner.city || "N/A"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Edit Partner
                                </DropdownMenuItem>
                                {partner.status === "PENDING" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updatePartnerStatusMutation.mutate({
                                        id: partner.id,
                                        status: "ACTIVE",
                                      })
                                    }
                                  >
                                    Activate Partner
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  View Agreement
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Send Referral
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

              <TabsContent value="referrals">
                {referralsQuery.isLoading ? (
                  <TableSkeleton />
                ) : referralsQuery.isError ? (
                  <ErrorDisplay
                    message={
                      referralsQuery.error?.message ||
                      "Failed to load referrals"
                    }
                    onRetry={() => referralsQuery.refetch()}
                  />
                ) : referrals.length === 0 ? (
                  <EmptyState
                    description="No referrals have been made yet."
                    title="No Referrals"
                  />
                ) : (
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
                      {referrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell className="font-medium">
                            {referral.referralCode}
                          </TableCell>
                          <TableCell>{referral.partnerId}</TableCell>
                          <TableCell>{referral.clientName || "N/A"}</TableCell>
                          <TableCell>{referral.serviceType || "N/A"}</TableCell>
                          <TableCell>
                            {getStatusBadge(referral.status)}
                          </TableCell>
                          <TableCell>
                            {referral.referralDate
                              ? new Date(
                                  referral.referralDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(referral.commissionAmount)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(
                              referral.commissionStatus || "PENDING"
                            )}
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
                                  Update Status
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Process Payment
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

              <TabsContent value="agreements">
                {agreementsQuery.isLoading ? (
                  <TableSkeleton />
                ) : agreementsQuery.isError ? (
                  <ErrorDisplay
                    message={
                      agreementsQuery.error?.message ||
                      "Failed to load agreements"
                    }
                    onRetry={() => agreementsQuery.refetch()}
                  />
                ) : agreements.length === 0 ? (
                  <EmptyState
                    description="No partnership agreements yet."
                    title="No Agreements"
                  />
                ) : (
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
                      {agreements.map((agreement) => (
                        <TableRow key={agreement.id}>
                          <TableCell className="font-medium">
                            {agreement.agreementCode}
                          </TableCell>
                          <TableCell>{agreement.partnerId}</TableCell>
                          <TableCell>
                            {getTypeBadge(agreement.agreementType)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(agreement.status)}
                          </TableCell>
                          <TableCell>
                            {agreement.startDate
                              ? new Date(
                                  agreement.startDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {agreement.endDate
                              ? new Date(agreement.endDate).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {agreement.commissionRate || 0}%
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
                                  View Agreement
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem>Renew</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="communications">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">
                    Partner Communications
                  </h3>
                  <p className="text-muted-foreground">
                    View and manage all communications with your partner
                    network.
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
    </TooltipProvider>
  );
}
