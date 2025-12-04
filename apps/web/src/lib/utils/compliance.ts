/**
 * Client Compliance Score Calculation
 * Calculates compliance scores based on TIN, NIS, VAT registration and filing status
 */

export type ComplianceStatus = "compliant" | "at-risk" | "non-compliant";

export interface ComplianceCheck {
  name: string;
  status: "compliant" | "warning" | "non-compliant" | "unknown";
  details?: string;
  dueDate?: Date;
  weight: number;
}

export interface ClientComplianceResult {
  score: number; // 0-100
  status: ComplianceStatus;
  checks: ComplianceCheck[];
  summary: string;
}

interface ClientData {
  tinNumber?: string | null;
  nisNumber?: string | null;
  vatNumber?: string | null;
  businessRegistration?: string | null;
  filings?: Array<{
    type: string;
    status: string;
    dueDate: Date | string;
  }>;
  documents?: Array<{
    type: string;
    expiryDate?: Date | string;
  }>;
}

export function calculateClientCompliance(
  client: ClientData
): ClientComplianceResult {
  const checks: ComplianceCheck[] = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  // TIN Registration Check (25 points)
  const tinWeight = 25;
  totalWeight += tinWeight;
  if (client.tinNumber && client.tinNumber.length >= 8) {
    earnedWeight += tinWeight;
    checks.push({
      name: "TIN Registration",
      status: "compliant",
      details: `TIN: ${client.tinNumber}`,
      weight: tinWeight,
    });
  } else {
    checks.push({
      name: "TIN Registration",
      status: "non-compliant",
      details: "No TIN registered",
      weight: tinWeight,
    });
  }

  // NIS Registration Check (20 points)
  const nisWeight = 20;
  totalWeight += nisWeight;
  if (client.nisNumber && client.nisNumber.length >= 6) {
    earnedWeight += nisWeight;
    checks.push({
      name: "NIS Registration",
      status: "compliant",
      details: `NIS: ${client.nisNumber}`,
      weight: nisWeight,
    });
  } else {
    checks.push({
      name: "NIS Registration",
      status: "warning",
      details: "NIS number not provided",
      weight: nisWeight,
    });
  }

  // VAT Registration Check (15 points)
  const vatWeight = 15;
  totalWeight += vatWeight;
  if (client.vatNumber && client.vatNumber.length >= 6) {
    earnedWeight += vatWeight;
    checks.push({
      name: "VAT Registration",
      status: "compliant",
      details: `VAT: ${client.vatNumber}`,
      weight: vatWeight,
    });
  } else {
    // VAT is not always required, so this is a warning not failure
    earnedWeight += vatWeight / 2; // Partial credit
    checks.push({
      name: "VAT Registration",
      status: "warning",
      details: "Not VAT registered (may not be required)",
      weight: vatWeight,
    });
  }

  // Business Registration Check (10 points)
  const busRegWeight = 10;
  totalWeight += busRegWeight;
  if (client.businessRegistration && client.businessRegistration.length >= 4) {
    earnedWeight += busRegWeight;
    checks.push({
      name: "Business Registration",
      status: "compliant",
      details: `Reg: ${client.businessRegistration}`,
      weight: busRegWeight,
    });
  } else {
    checks.push({
      name: "Business Registration",
      status: "warning",
      details: "Business registration not on file",
      weight: busRegWeight,
    });
  }

  // Filing Compliance Check (30 points)
  const filingWeight = 30;
  totalWeight += filingWeight;

  if (client.filings && client.filings.length > 0) {
    const today = new Date();
    const overdueFilings = client.filings.filter((f) => {
      const dueDate = new Date(f.dueDate);
      return (
        f.status !== "submitted" && f.status !== "approved" && dueDate < today
      );
    });

    const pendingFilings = client.filings.filter((f) => {
      const dueDate = new Date(f.dueDate);
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return (
        f.status !== "submitted" &&
        f.status !== "approved" &&
        daysUntilDue >= 0 &&
        daysUntilDue <= 7
      );
    });

    if (overdueFilings.length === 0 && pendingFilings.length === 0) {
      earnedWeight += filingWeight;
      checks.push({
        name: "Filings Up to Date",
        status: "compliant",
        details: "All filings current",
        weight: filingWeight,
      });
    } else if (overdueFilings.length > 0) {
      const deduction = Math.min(filingWeight, overdueFilings.length * 10);
      earnedWeight += filingWeight - deduction;
      checks.push({
        name: "Filings",
        status: "non-compliant",
        details: `${overdueFilings.length} overdue filing(s)`,
        weight: filingWeight,
      });
    } else {
      earnedWeight += filingWeight * 0.75;
      checks.push({
        name: "Filings",
        status: "warning",
        details: `${pendingFilings.length} filing(s) due soon`,
        weight: filingWeight,
      });
    }
  } else {
    // No filings tracked yet - neutral
    earnedWeight += filingWeight * 0.5;
    checks.push({
      name: "Filings",
      status: "unknown",
      details: "No filings tracked",
      weight: filingWeight,
    });
  }

  // Calculate final score
  const score =
    totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Determine status
  let status: ComplianceStatus;
  if (score >= 80) {
    status = "compliant";
  } else if (score >= 50) {
    status = "at-risk";
  } else {
    status = "non-compliant";
  }

  // Generate summary
  const compliantCount = checks.filter((c) => c.status === "compliant").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const nonCompliantCount = checks.filter(
    (c) => c.status === "non-compliant"
  ).length;

  let summary = "";
  if (status === "compliant") {
    summary = `Good standing - ${compliantCount} of ${checks.length} requirements met`;
  } else if (status === "at-risk") {
    summary = `At risk - ${warningCount} warning(s), ${nonCompliantCount} issue(s) to address`;
  } else {
    summary = `Non-compliant - ${nonCompliantCount} critical issue(s) requiring attention`;
  }

  return {
    score,
    status,
    checks,
    summary,
  };
}

// Get status configuration for UI
export function getComplianceStatusConfig(status: ComplianceStatus): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: "check" | "alert-triangle" | "x-circle";
} {
  switch (status) {
    case "compliant":
      return {
        label: "Compliant",
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800",
        icon: "check",
      };
    case "at-risk":
      return {
        label: "At Risk",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        icon: "alert-triangle",
      };
    case "non-compliant":
      return {
        label: "Non-Compliant",
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
        icon: "x-circle",
      };
    default:
      return {
        label: "Unknown",
        color: "text-gray-600",
        bgColor: "bg-gray-50 dark:bg-gray-900/20",
        borderColor: "border-gray-200 dark:border-gray-800",
        icon: "alert-triangle",
      };
  }
}

// Get check status configuration for UI
export function getCheckStatusConfig(status: ComplianceCheck["status"]): {
  color: string;
  bgColor: string;
  icon: "check" | "alert-triangle" | "x-circle" | "help-circle";
} {
  switch (status) {
    case "compliant":
      return {
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/20",
        icon: "check",
      };
    case "warning":
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
        icon: "alert-triangle",
      };
    case "non-compliant":
      return {
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-900/20",
        icon: "x-circle",
      };
    default:
      return {
        color: "text-gray-600",
        bgColor: "bg-gray-100 dark:bg-gray-900/20",
        icon: "help-circle",
      };
  }
}
