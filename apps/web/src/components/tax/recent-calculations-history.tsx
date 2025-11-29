"use client";

import {
  Building2,
  Calculator,
  Clock,
  Download,
  FileText,
  MoreHorizontal,
  Receipt,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { formatGuyanacurrency } from "@/lib/tax-calculations";

interface TaxCalculation {
  id: string;
  type: "PAYE" | "VAT" | "CIT" | "WHT" | "NIS";
  clientName: string;
  clientType: "Individual" | "Corporation" | "Partnership" | "SME";
  calculatedDate: string;
  period: string;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  status: "draft" | "submitted" | "paid" | "overdue";
  calculatedBy: string;
  notes?: string;
}

interface RecentCalculationsHistoryProps {
  calculations?: TaxCalculation[];
  onViewCalculation?: (calculationId: string) => void;
  onDownloadReport?: (calculationId: string) => void;
  onDuplicateCalculation?: (calculationId: string) => void;
  isLoading?: boolean;
  showFilters?: boolean;
}

export function RecentCalculationsHistory({
  calculations = [],
  onViewCalculation,
  onDownloadReport,
  onDuplicateCalculation,
  isLoading = false,
  showFilters = true,
}: RecentCalculationsHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Mock data for demonstration
  const mockCalculations: TaxCalculation[] = [
    {
      id: "calc-1",
      type: "PAYE",
      clientName: "TechCorp Solutions Ltd",
      clientType: "Corporation",
      calculatedDate: "2024-12-15T10:30:00Z",
      period: "December 2024",
      grossAmount: 125_000,
      taxAmount: 18_750,
      netAmount: 106_250,
      status: "submitted",
      calculatedBy: "Sarah Johnson",
      notes: "Monthly payroll calculation for 15 employees",
    },
    {
      id: "calc-2",
      type: "VAT",
      clientName: "DataFlow Enterprises",
      clientType: "SME",
      calculatedDate: "2024-12-14T14:15:00Z",
      period: "Q4 2024",
      grossAmount: 450_000,
      taxAmount: 56_250,
      netAmount: 393_750,
      status: "draft",
      calculatedBy: "Mike Chen",
      notes: "Quarterly VAT return - pending client review",
    },
    {
      id: "calc-3",
      type: "PAYE",
      clientName: "John Smith Consultancy",
      clientType: "Individual",
      calculatedDate: "2024-12-13T09:45:00Z",
      period: "December 2024",
      grossAmount: 85_000,
      taxAmount: 8500,
      netAmount: 76_500,
      status: "paid",
      calculatedBy: "Sarah Johnson",
    },
    {
      id: "calc-4",
      type: "CIT",
      clientName: "Georgetown Manufacturing",
      clientType: "Corporation",
      calculatedDate: "2024-12-12T16:20:00Z",
      period: "2024",
      grossAmount: 2_500_000,
      taxAmount: 375_000,
      netAmount: 2_125_000,
      status: "overdue",
      calculatedBy: "John Williams",
      notes: "Annual corporation tax - payment overdue",
    },
    {
      id: "calc-5",
      type: "VAT",
      clientName: "Coastal Trading Inc",
      clientType: "Corporation",
      calculatedDate: "2024-12-11T11:00:00Z",
      period: "November 2024",
      grossAmount: 320_000,
      taxAmount: 40_000,
      netAmount: 280_000,
      status: "submitted",
      calculatedBy: "Mike Chen",
    },
    {
      id: "calc-6",
      type: "WHT",
      clientName: "Professional Services LLC",
      clientType: "Partnership",
      calculatedDate: "2024-12-10T13:30:00Z",
      period: "December 2024",
      grossAmount: 150_000,
      taxAmount: 15_000,
      netAmount: 135_000,
      status: "paid",
      calculatedBy: "Lisa Wong",
      notes: "Withholding tax on professional services",
    },
  ];

  const displayCalculations =
    calculations.length > 0 ? calculations : mockCalculations;

  // Filter calculations based on search and filters
  const filteredCalculations = useMemo(
    () =>
      displayCalculations.filter((calc) => {
        const matchesSearch =
          calc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          calc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          calc.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
          calc.calculatedBy.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === "all" || calc.type === filterType;
        const matchesStatus =
          filterStatus === "all" || calc.status === filterStatus;

        return matchesSearch && matchesType && matchesStatus;
      }),
    [displayCalculations, searchTerm, filterType, filterStatus]
  );

  // Calculate summary statistics
  const summary = useMemo(() => {
    const stats = {
      totalCalculations: filteredCalculations.length,
      totalTaxAmount: 0,
      submittedCount: 0,
      draftCount: 0,
      paidCount: 0,
      overdueCount: 0,
    };

    filteredCalculations.forEach((calc) => {
      stats.totalTaxAmount += calc.taxAmount;
      stats[`${calc.status}Count`]++;
    });

    return stats;
  }, [filteredCalculations]);

  const getCalculationIcon = (type: string) => {
    switch (type) {
      case "PAYE":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "VAT":
        return <Receipt className="h-4 w-4 text-green-500" />;
      case "CIT":
        return <Building2 className="h-4 w-4 text-purple-500" />;
      case "WHT":
        return <FileText className="h-4 w-4 text-orange-500" />;
      case "NIS":
        return <Users className="h-4 w-4 text-teal-500" />;
      default:
        return <Calculator className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default" as const;
      case "submitted":
        return "secondary" as const;
      case "draft":
        return "outline" as const;
      case "overdue":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600";
      case "submitted":
        return "text-blue-600";
      case "draft":
        return "text-gray-600";
      case "overdue":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} min ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) {
      return "Yesterday";
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Recent Calculations
          </CardTitle>
          <CardDescription>Loading calculation history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                className="h-16 animate-pulse rounded-lg bg-muted/50"
                key={i}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <CardTitle>Recent Calculations</CardTitle>
          </div>
          <Badge className="text-xs" variant="outline">
            {summary.totalCalculations} calculations
          </Badge>
        </div>
        <CardDescription>
          Tax calculations and submissions history with status tracking
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <div className="font-bold text-green-600 text-lg">
              {summary.paidCount}
            </div>
            <div className="text-muted-foreground text-xs">Paid</div>
          </div>
          <div className="space-y-1">
            <div className="font-bold text-blue-600 text-lg">
              {summary.submittedCount}
            </div>
            <div className="text-muted-foreground text-xs">Submitted</div>
          </div>
          <div className="space-y-1">
            <div className="font-bold text-gray-600 text-lg">
              {summary.draftCount}
            </div>
            <div className="text-muted-foreground text-xs">Drafts</div>
          </div>
          <div className="space-y-1">
            <div className="font-bold text-lg text-red-600">
              {summary.overdueCount}
            </div>
            <div className="text-muted-foreground text-xs">Overdue</div>
          </div>
        </div>

        <div className="text-center">
          <div className="font-bold text-2xl text-primary">
            {formatGuyanacurrency(summary.totalTaxAmount)}
          </div>
          <div className="text-muted-foreground text-sm">
            Total tax calculated
          </div>
        </div>

        {/* Search and Filters */}
        {showFilters && (
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              className="md:max-w-xs"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search calculations..."
              value={searchTerm}
            />
            <Select onValueChange={setFilterType} value={filterType}>
              <SelectTrigger className="md:w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PAYE">PAYE</SelectItem>
                <SelectItem value="VAT">VAT</SelectItem>
                <SelectItem value="CIT">CIT</SelectItem>
                <SelectItem value="WHT">WHT</SelectItem>
                <SelectItem value="NIS">NIS</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setFilterStatus} value={filterStatus}>
              <SelectTrigger className="md:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Calculations List */}
        <div className="space-y-2">
          {filteredCalculations.map((calculation) => (
            <div
              className="flex items-center justify-between rounded-lg border p-4 transition-all hover:shadow-sm"
              key={calculation.id}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getCalculationIcon(calculation.type)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {calculation.clientName}
                      </p>
                      <Badge className="text-xs" variant="outline">
                        {calculation.type}
                      </Badge>
                      <Badge className="text-xs" variant="outline">
                        {calculation.clientType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs">
                      <span>{calculation.period}</span>
                      <span>•</span>
                      <span>By {calculation.calculatedBy}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(calculation.calculatedDate)}
                      </span>
                    </div>
                    {calculation.notes && (
                      <p className="max-w-md truncate text-muted-foreground text-xs">
                        {calculation.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-medium text-sm">
                    Tax: {formatGuyanacurrency(calculation.taxAmount)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Gross: {formatGuyanacurrency(calculation.grossAmount)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs ${getStatusColor(calculation.status)}`}
                    variant={getStatusBadgeVariant(calculation.status)}
                  >
                    {calculation.status}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onViewCalculation?.(calculation.id)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDownloadReport?.(calculation.id)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                      </DropdownMenuItem>
                      {onDuplicateCalculation && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              onDuplicateCalculation(calculation.id)
                            }
                          >
                            <Calculator className="mr-2 h-4 w-4" />
                            Duplicate Calculation
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCalculations.length === 0 && (
          <div className="py-8 text-center">
            <Calculator className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
            <p className="font-medium text-sm">No calculations found</p>
            <p className="text-muted-foreground text-xs">
              {searchTerm || filterType !== "all" || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Start by creating your first tax calculation"}
            </p>
          </div>
        )}

        {filteredCalculations.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-muted-foreground text-xs">
              Showing {filteredCalculations.length} of{" "}
              {displayCalculations.length} calculations
            </p>
            <Button size="sm" variant="outline">
              View All History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
