"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatGuyanacurrency } from "@/lib/tax-calculations";

interface ClientTaxStatus {
  id: string;
  name: string;
  type: "Individual" | "Corporation" | "Partnership" | "SME";
  payeStatus: "current" | "overdue" | "pending" | "exempt";
  vatStatus: "current" | "overdue" | "pending" | "not_registered";
  cisStatus: "current" | "overdue" | "pending" | "not_applicable";
  lastFiling: string;
  nextDeadline: string;
  outstandingAmount: number;
  complianceScore: number;
  riskLevel: "low" | "medium" | "high";
}

interface ClientTaxStatusCardsProps {
  clients?: ClientTaxStatus[];
  onViewClient?: (clientId: string) => void;
  onUpdateStatus?: (clientId: string, status: Partial<ClientTaxStatus>) => void;
  isLoading?: boolean;
  showSummary?: boolean;
}

export function ClientTaxStatusCards({
  clients = [],
  onViewClient,
  onUpdateStatus,
  isLoading = false,
  showSummary = true,
}: ClientTaxStatusCardsProps) {
  // Mock data for demonstration
  const mockClients: ClientTaxStatus[] = [
    {
      id: "client-1",
      name: "TechCorp Solutions Ltd",
      type: "Corporation",
      payeStatus: "current",
      vatStatus: "overdue",
      cisStatus: "current",
      lastFiling: "2024-12-15",
      nextDeadline: "2025-01-31",
      outstandingAmount: 45_000,
      complianceScore: 78,
      riskLevel: "medium",
    },
    {
      id: "client-2",
      name: "DataFlow Enterprises",
      type: "SME",
      payeStatus: "pending",
      vatStatus: "current",
      cisStatus: "not_applicable",
      lastFiling: "2024-11-30",
      nextDeadline: "2025-01-15",
      outstandingAmount: 0,
      complianceScore: 95,
      riskLevel: "low",
    },
    {
      id: "client-3",
      name: "John Smith Consultancy",
      type: "Individual",
      payeStatus: "current",
      vatStatus: "not_registered",
      cisStatus: "pending",
      lastFiling: "2024-12-01",
      nextDeadline: "2025-02-28",
      outstandingAmount: 12_500,
      complianceScore: 85,
      riskLevel: "low",
    },
    {
      id: "client-4",
      name: "Georgetown Manufacturing",
      type: "Corporation",
      payeStatus: "overdue",
      vatStatus: "overdue",
      cisStatus: "overdue",
      lastFiling: "2024-10-15",
      nextDeadline: "2024-12-31",
      outstandingAmount: 125_000,
      complianceScore: 45,
      riskLevel: "high",
    },
  ];

  const displayClients = clients.length > 0 ? clients : mockClients;

  const summary = useMemo(() => {
    const stats = {
      totalClients: displayClients.length,
      currentClients: 0,
      overdueClients: 0,
      pendingClients: 0,
      totalOutstanding: 0,
      avgComplianceScore: 0,
      highRiskClients: 0,
      lowRiskClients: 0,
    };

    displayClients.forEach((client) => {
      // Count by overall status (most urgent status)
      if (
        client.payeStatus === "overdue" ||
        client.vatStatus === "overdue" ||
        client.cisStatus === "overdue"
      ) {
        stats.overdueClients++;
      } else if (
        client.payeStatus === "pending" ||
        client.vatStatus === "pending" ||
        client.cisStatus === "pending"
      ) {
        stats.pendingClients++;
      } else {
        stats.currentClients++;
      }

      stats.totalOutstanding += client.outstandingAmount;
      stats.avgComplianceScore += client.complianceScore;

      if (client.riskLevel === "high") {
        stats.highRiskClients++;
      } else if (client.riskLevel === "low") {
        stats.lowRiskClients++;
      }
    });

    stats.avgComplianceScore = Math.round(
      stats.avgComplianceScore / displayClients.length
    );

    return stats;
  }, [displayClients]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "current":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "not_registered":
      case "not_applicable":
      case "exempt":
        return <FileText className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "current":
        return "default" as const;
      case "overdue":
        return "destructive" as const;
      case "pending":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case "high":
        return "destructive" as const;
      case "medium":
        return "default" as const;
      case "low":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Corporation":
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case "Individual":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "Partnership":
        return <Users className="h-4 w-4 text-orange-500" />;
      case "SME":
        return <Building2 className="h-4 w-4 text-green-500" />;
      default:
        return <Building2 className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client Tax Status
          </CardTitle>
          <CardDescription>Loading client tax information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                className="h-20 animate-pulse rounded-lg bg-muted/50"
                key={i}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Portfolio Overview
            </CardTitle>
            <CardDescription>
              Tax compliance status across all clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Current</span>
                </div>
                <div className="font-bold text-2xl text-green-600">
                  {summary.currentClients}
                </div>
                <div className="text-muted-foreground text-xs">
                  Up to date clients
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-sm">Pending</span>
                </div>
                <div className="font-bold text-2xl text-yellow-600">
                  {summary.pendingClients}
                </div>
                <div className="text-muted-foreground text-xs">
                  Action required
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-sm">Overdue</span>
                </div>
                <div className="font-bold text-2xl text-red-600">
                  {summary.overdueClients}
                </div>
                <div className="text-muted-foreground text-xs">
                  Immediate attention
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Outstanding</span>
                </div>
                <div className="font-bold text-2xl text-blue-600">
                  {formatGuyanacurrency(summary.totalOutstanding)}
                </div>
                <div className="text-muted-foreground text-xs">
                  Total amount due
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  Portfolio Compliance Score
                </span>
                <span
                  className={`font-bold ${getComplianceScoreColor(summary.avgComplianceScore)}`}
                >
                  {summary.avgComplianceScore}%
                </span>
              </div>
              <Progress className="h-2" value={summary.avgComplianceScore} />
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>
                  {summary.highRiskClients} high risk • {summary.lowRiskClients}{" "}
                  low risk
                </span>
                <span>
                  {summary.currentClients}/{summary.totalClients} clients
                  current
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Client Tax Status</CardTitle>
            </div>
            <Badge className="text-xs" variant="outline">
              {summary.totalClients} clients
            </Badge>
          </div>
          <CardDescription>
            Individual client compliance status and upcoming deadlines
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {displayClients.map((client) => (
            <div
              className="rounded-lg border p-4 transition-all hover:shadow-md"
              key={client.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(client.type)}
                    <h3 className="font-medium text-sm">{client.name}</h3>
                    <Badge className="text-xs" variant="outline">
                      {client.type}
                    </Badge>
                    <Badge
                      className="text-xs"
                      variant={getRiskBadgeVariant(client.riskLevel)}
                    >
                      {client.riskLevel} risk
                    </Badge>
                  </div>

                  {/* Tax Status Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(client.payeStatus)}
                        <span className="font-medium text-xs">PAYE</span>
                      </div>
                      <Badge
                        className="text-xs"
                        variant={getStatusBadgeVariant(client.payeStatus)}
                      >
                        {client.payeStatus.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(client.vatStatus)}
                        <span className="font-medium text-xs">VAT</span>
                      </div>
                      <Badge
                        className="text-xs"
                        variant={getStatusBadgeVariant(client.vatStatus)}
                      >
                        {client.vatStatus.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(client.cisStatus)}
                        <span className="font-medium text-xs">CIT</span>
                      </div>
                      <Badge
                        className="text-xs"
                        variant={getStatusBadgeVariant(client.cisStatus)}
                      >
                        {client.cisStatus.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  {/* Client Details */}
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Last filing: {formatDate(client.lastFiling)}</span>
                    <span>
                      Next deadline: {formatDate(client.nextDeadline)}
                    </span>
                  </div>

                  {client.outstandingAmount > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 dark:bg-red-950/20">
                      <DollarSign className="h-4 w-4 text-red-500" />
                      <span className="text-red-700 text-sm dark:text-red-300">
                        Outstanding:{" "}
                        {formatGuyanacurrency(client.outstandingAmount)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <div
                      className={`font-bold text-sm ${getComplianceScoreColor(client.complianceScore)}`}
                    >
                      {client.complianceScore}%
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Compliance
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Button
                      className="h-7 px-3 text-xs"
                      onClick={() => onViewClient?.(client.id)}
                      size="sm"
                      variant="outline"
                    >
                      View Details
                    </Button>
                    {(client.payeStatus === "overdue" ||
                      client.vatStatus === "overdue" ||
                      client.cisStatus === "overdue") && (
                      <Button
                        className="h-7 px-3 text-xs"
                        size="sm"
                        variant="default"
                      >
                        Update Status
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {displayClients.length === 0 && (
            <div className="py-8 text-center">
              <Users className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-sm">No clients found</p>
              <p className="text-muted-foreground text-xs">
                Add clients to track their tax compliance status
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
