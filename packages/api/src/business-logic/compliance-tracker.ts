import {
  COMPLIANCE_CONSTANTS,
  type ComplianceStatus,
  type TaxType,
} from "./tax-constants";

/**
 * Tax Compliance Tracking System for Guyana
 * Monitors compliance status across all tax types and filing requirements
 */

export type FilingFrequency =
  | "monthly"
  | "quarterly"
  | "annually"
  | "as_needed";
export type FilingType =
  | "return"
  | "payment"
  | "certificate"
  | "registration"
  | "application";

export type ComplianceRequirement = {
  id: string;
  taxType: TaxType;
  filingType: FilingType;
  frequency: FilingFrequency;
  dueDate: Date;
  description: string;
  isRequired: boolean;
  penaltyRate?: number;
  gracePeriodDays?: number;
  minimumThreshold?: number;
};

export type ComplianceRecord = {
  id: string;
  requirementId: string;
  businessId: string;
  dueDate: Date;
  filedDate?: Date;
  paidDate?: Date;
  amount?: number;
  status: ComplianceStatus;
  penaltyAmount: number;
  interestAmount: number;
  totalDue: number;
  documents: string[];
  notes?: string;
  lastUpdated: Date;
};

export type ComplianceAssessment = {
  businessId: string;
  assessmentDate: Date;
  overallStatus: ComplianceStatus;
  complianceScore: number;
  totalOutstanding: number;
  overdueCount: number;
  upcomingCount: number;
  requirements: ComplianceRecord[];
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  nextActions: Array<{
    description: string;
    dueDate: Date;
    priority: "low" | "medium" | "high" | "urgent";
  }>;
};

/**
 * Standard compliance requirements for Guyana businesses
 */
export const STANDARD_COMPLIANCE_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: "paye-monthly",
    taxType: "paye",
    filingType: "return",
    frequency: "monthly",
    dueDate: new Date(), // Will be calculated dynamically
    description: "PAYE Monthly Return (Form P.35)",
    isRequired: true,
    penaltyRate: COMPLIANCE_CONSTANTS.PENALTIES.LATE_FILING_RATE,
    gracePeriodDays: 7,
  },
  {
    id: "paye-payment",
    taxType: "paye",
    filingType: "payment",
    frequency: "monthly",
    dueDate: new Date(),
    description: "PAYE Monthly Payment",
    isRequired: true,
    penaltyRate: COMPLIANCE_CONSTANTS.PENALTIES.LATE_PAYMENT_RATE,
    gracePeriodDays: 0,
  },
  {
    id: "nis-monthly",
    taxType: "nis",
    filingType: "return",
    frequency: "monthly",
    dueDate: new Date(),
    description: "NIS Monthly Return",
    isRequired: true,
    penaltyRate: 0.05, // 5% per month
    gracePeriodDays: 7,
  },
  {
    id: "vat-monthly",
    taxType: "vat",
    filingType: "return",
    frequency: "monthly",
    dueDate: new Date(),
    description: "VAT Monthly Return",
    isRequired: true,
    penaltyRate: COMPLIANCE_CONSTANTS.PENALTIES.LATE_FILING_RATE,
    gracePeriodDays: 0,
    minimumThreshold: 15_000_000, // VAT registration threshold
  },
  {
    id: "withholding-monthly",
    taxType: "withholding",
    filingType: "return",
    frequency: "monthly",
    dueDate: new Date(),
    description: "Withholding Tax Monthly Return (Form 7B)",
    isRequired: true,
    penaltyRate: COMPLIANCE_CONSTANTS.PENALTIES.LATE_FILING_RATE,
    gracePeriodDays: 0,
  },
  {
    id: "corporate-annual",
    taxType: "corporate",
    filingType: "return",
    frequency: "annually",
    dueDate: new Date(),
    description: "Corporate Income Tax Return",
    isRequired: true,
    penaltyRate: COMPLIANCE_CONSTANTS.PENALTIES.LATE_FILING_RATE,
    gracePeriodDays: 30,
  },
  {
    id: "corporate-quarterly",
    taxType: "corporate",
    filingType: "payment",
    frequency: "quarterly",
    dueDate: new Date(),
    description: "Corporate Quarterly Advance Payment",
    isRequired: true,
    penaltyRate: COMPLIANCE_CONSTANTS.PENALTIES.LATE_PAYMENT_RATE,
    gracePeriodDays: 15,
  },
];

/**
 * Calculate compliance status for a business
 */
export function assessBusinessCompliance(
  businessId: string,
  records: ComplianceRecord[],
  businessData: {
    registrationDate: Date;
    annualTurnover: number;
    employeeCount: number;
    businessType: string;
    isVatRegistered: boolean;
  },
  assessmentDate: Date = new Date()
): ComplianceAssessment {
  const businessRecords = records.filter(
    (record) => record.businessId === businessId
  );

  // Generate required compliance records if they don't exist
  const requiredRecords = generateRequiredRecords(
    businessId,
    businessData,
    assessmentDate
  );

  // Merge existing records with required records
  const allRecords = mergeComplianceRecords(businessRecords, requiredRecords);

  // Update statuses and calculate penalties
  const updatedRecords = allRecords.map((record) =>
    updateComplianceRecord(record, assessmentDate)
  );

  // Calculate overall metrics
  const overdueRecords = updatedRecords.filter(
    (record) => record.status === "overdue" || record.status === "delinquent"
  );
  const upcomingRecords = updatedRecords.filter(
    (record) =>
      record.status === "compliant" &&
      record.dueDate > assessmentDate &&
      record.dueDate <=
        new Date(assessmentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
  );

  const totalOutstanding = updatedRecords.reduce(
    (sum, record) => sum + record.totalDue,
    0
  );

  // Calculate compliance score (0-100)
  const totalRecords = updatedRecords.length;
  const compliantRecords = updatedRecords.filter(
    (record) => record.status === "compliant"
  ).length;
  const complianceScore =
    totalRecords > 0 ? (compliantRecords / totalRecords) * 100 : 100;

  // Determine overall status
  const overallStatus = determineOverallStatus(updatedRecords, complianceScore);

  // Assess risk level
  const riskLevel = assessRiskLevel(
    complianceScore,
    totalOutstanding,
    overdueRecords.length,
    businessData.annualTurnover
  );

  // Generate recommendations and next actions
  const recommendations = generateRecommendations(
    updatedRecords,
    complianceScore,
    riskLevel
  );
  const nextActions = generateNextActions(updatedRecords, assessmentDate);

  return {
    businessId,
    assessmentDate,
    overallStatus,
    complianceScore: Math.round(complianceScore),
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    overdueCount: overdueRecords.length,
    upcomingCount: upcomingRecords.length,
    requirements: updatedRecords,
    riskLevel,
    recommendations,
    nextActions,
  };
}

/**
 * Generate required compliance records for a business
 */
function generateRequiredRecords(
  businessId: string,
  businessData: {
    registrationDate: Date;
    annualTurnover: number;
    employeeCount: number;
    businessType: string;
    isVatRegistered: boolean;
  },
  currentDate: Date
): ComplianceRecord[] {
  const records: ComplianceRecord[] = [];

  for (const requirement of STANDARD_COMPLIANCE_REQUIREMENTS) {
    // Skip if requirement doesn't apply to this business
    if (!isRequirementApplicable(requirement, businessData)) {
      continue;
    }

    // Generate records based on frequency
    const dueDates = calculateDueDates(
      requirement,
      businessData.registrationDate,
      currentDate
    );

    for (const dueDate of dueDates) {
      const recordId = `${requirement.id}-${businessId}-${dueDate.getTime()}`;

      records.push({
        id: recordId,
        requirementId: requirement.id,
        businessId,
        dueDate,
        status: "compliant",
        penaltyAmount: 0,
        interestAmount: 0,
        totalDue: 0,
        documents: [],
        lastUpdated: currentDate,
      });
    }
  }

  return records;
}

/**
 * Check if a compliance requirement applies to a business
 */
function isRequirementApplicable(
  requirement: ComplianceRequirement,
  businessData: {
    annualTurnover: number;
    employeeCount: number;
    isVatRegistered: boolean;
  }
): boolean {
  switch (requirement.taxType) {
    case "paye":
      return businessData.employeeCount > 0;
    case "nis":
      return businessData.employeeCount > 0;
    case "vat":
      return (
        businessData.isVatRegistered ||
        businessData.annualTurnover >= (requirement.minimumThreshold || 0)
      );
    case "corporate":
      return true; // All businesses must file corporate tax
    case "withholding":
      return businessData.annualTurnover > 1_000_000; // Threshold for withholding obligations
    default:
      return true;
  }
}

/**
 * Calculate due dates for a requirement based on frequency
 */
function calculateDueDates(
  requirement: ComplianceRequirement,
  registrationDate: Date,
  currentDate: Date
): Date[] {
  const dueDates: Date[] = [];
  const startDate = new Date(
    Math.max(
      registrationDate.getTime(),
      currentDate.getTime() - 365 * 24 * 60 * 60 * 1000
    )
  );

  switch (requirement.frequency) {
    case "monthly":
      for (let month = 0; month <= 12; month++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + month);

        if (requirement.taxType === "paye" || requirement.taxType === "nis") {
          dueDate.setDate(COMPLIANCE_CONSTANTS.PAYE_DUE_DATE);
        } else if (requirement.taxType === "vat") {
          dueDate.setDate(COMPLIANCE_CONSTANTS.VAT_DUE_DATE);
        } else {
          dueDate.setDate(15); // Default to 15th
        }

        if (dueDate <= currentDate) {
          dueDates.push(dueDate);
        }
      }
      break;

    case "quarterly":
      for (let quarter = 0; quarter <= 4; quarter++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + quarter * 3);
        dueDate.setDate(15);

        if (dueDate <= currentDate) {
          dueDates.push(dueDate);
        }
      }
      break;

    case "annually": {
      const annualDueDate = new Date(registrationDate);
      annualDueDate.setMonth(
        annualDueDate.getMonth() + COMPLIANCE_CONSTANTS.CORPORATE_TAX_DUE_MONTHS
      );

      if (annualDueDate <= currentDate) {
        dueDates.push(annualDueDate);
      }
      break;
    }
  }

  return dueDates;
}

/**
 * Merge existing compliance records with required records
 */
function mergeComplianceRecords(
  existingRecords: ComplianceRecord[],
  requiredRecords: ComplianceRecord[]
): ComplianceRecord[] {
  const existingMap = new Map(
    existingRecords.map((record) => [record.id, record])
  );
  const merged: ComplianceRecord[] = [];

  // Add all required records, using existing data where available
  for (const required of requiredRecords) {
    const existing = existingMap.get(required.id);
    merged.push(existing || required);
    existingMap.delete(required.id);
  }

  // Add any remaining existing records
  merged.push(...existingMap.values());

  return merged;
}

/**
 * Update compliance record status and calculate penalties
 */
function updateComplianceRecord(
  record: ComplianceRecord,
  currentDate: Date
): ComplianceRecord {
  const updatedRecord = { ...record };

  // Determine current status
  if (record.filedDate && record.paidDate) {
    updatedRecord.status = "compliant";
  } else if (currentDate > record.dueDate) {
    const daysOverdue = Math.ceil(
      (currentDate.getTime() - record.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue > 90) {
      updatedRecord.status = "delinquent";
    } else {
      updatedRecord.status = "overdue";
    }
  } else {
    updatedRecord.status = "compliant";
  }

  // Calculate penalties and interest if overdue
  if (
    updatedRecord.status === "overdue" ||
    updatedRecord.status === "delinquent"
  ) {
    const daysOverdue = Math.ceil(
      (currentDate.getTime() - record.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const monthsOverdue = Math.ceil(daysOverdue / 30);

    // Calculate penalties
    if (record.amount) {
      updatedRecord.penaltyAmount =
        record.amount *
        (COMPLIANCE_CONSTANTS.PENALTIES.LATE_FILING_RATE * monthsOverdue);

      // Calculate interest on late payments
      const annualInterestRate =
        COMPLIANCE_CONSTANTS.INTEREST_RATES.LATE_PAYMENT;
      const dailyInterestRate = annualInterestRate / 365;
      updatedRecord.interestAmount =
        record.amount * dailyInterestRate * daysOverdue;
    }

    // Cap penalties at maximum rate
    const maxPenalty =
      (record.amount || 0) *
      COMPLIANCE_CONSTANTS.PENALTIES.MAXIMUM_PENALTY_RATE;
    updatedRecord.penaltyAmount = Math.min(
      updatedRecord.penaltyAmount,
      maxPenalty
    );
  }

  updatedRecord.totalDue =
    (record.amount || 0) +
    updatedRecord.penaltyAmount +
    updatedRecord.interestAmount;

  updatedRecord.lastUpdated = currentDate;

  return updatedRecord;
}

/**
 * Determine overall compliance status
 */
function determineOverallStatus(
  records: ComplianceRecord[],
  complianceScore: number
): ComplianceStatus {
  const hasDelinquent = records.some(
    (record) => record.status === "delinquent"
  );
  const hasOverdue = records.some((record) => record.status === "overdue");

  if (hasDelinquent || complianceScore < 50) {
    return "delinquent";
  }
  if (hasOverdue || complianceScore < 80) {
    return "overdue";
  }
  if (complianceScore < 95) {
    return "under_review";
  }
  return "compliant";
}

/**
 * Assess risk level based on compliance metrics
 */
function assessRiskLevel(
  complianceScore: number,
  totalOutstanding: number,
  overdueCount: number,
  annualTurnover: number
): "low" | "medium" | "high" | "critical" {
  const outstandingRatio =
    annualTurnover > 0 ? totalOutstanding / annualTurnover : 0;

  if (complianceScore < 50 || outstandingRatio > 0.1 || overdueCount > 6) {
    return "critical";
  }
  if (complianceScore < 75 || outstandingRatio > 0.05 || overdueCount > 3) {
    return "high";
  }
  if (complianceScore < 90 || outstandingRatio > 0.02 || overdueCount > 1) {
    return "medium";
  }
  return "low";
}

/**
 * Generate compliance recommendations
 */
function generateRecommendations(
  records: ComplianceRecord[],
  complianceScore: number,
  riskLevel: "low" | "medium" | "high" | "critical"
): string[] {
  const recommendations: string[] = [];

  const overdueRecords = records.filter(
    (record) => record.status === "overdue" || record.status === "delinquent"
  );

  if (overdueRecords.length > 0) {
    recommendations.push(
      `Immediately address ${overdueRecords.length} overdue compliance requirement(s).`
    );
  }

  if (riskLevel === "critical") {
    recommendations.push(
      "Engage a tax professional immediately to avoid severe penalties."
    );
    recommendations.push("Consider negotiating a payment plan with GRA.");
  } else if (riskLevel === "high") {
    recommendations.push("Implement monthly compliance review procedures.");
    recommendations.push("Set up automated filing and payment reminders.");
  } else if (riskLevel === "medium") {
    recommendations.push("Review and improve record-keeping procedures.");
  }

  if (complianceScore < 80) {
    recommendations.push("Establish a dedicated compliance management system.");
  }

  const totalOutstanding = records.reduce(
    (sum, record) => sum + record.totalDue,
    0
  );
  if (totalOutstanding > 0) {
    recommendations.push(
      `Pay outstanding tax liability of ${totalOutstanding.toFixed(2)} GYD.`
    );
  }

  return recommendations;
}

/**
 * Generate next actions with priorities and due dates
 */
function generateNextActions(
  records: ComplianceRecord[],
  currentDate: Date
): Array<{
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high" | "urgent";
}> {
  const nextActions = [];

  // Add overdue items as urgent
  const overdueRecords = records.filter(
    (record) =>
      (record.status === "overdue" || record.status === "delinquent") &&
      !record.filedDate
  );

  for (const record of overdueRecords) {
    nextActions.push({
      description: `File overdue ${getRequirementDescription(record.requirementId)}`,
      dueDate: new Date(), // Immediate
      priority: "urgent" as const,
    });
  }

  // Add upcoming items
  const upcomingRecords = records.filter((record) => {
    const daysUntilDue =
      (record.dueDate.getTime() - currentDate.getTime()) /
      (1000 * 60 * 60 * 24);
    return (
      daysUntilDue > 0 && daysUntilDue <= 30 && record.status === "compliant"
    );
  });

  for (const record of upcomingRecords) {
    const daysUntilDue =
      (record.dueDate.getTime() - currentDate.getTime()) /
      (1000 * 60 * 60 * 24);

    const priority: "low" | "medium" | "high" | "urgent" =
      daysUntilDue <= 7 ? "high" : daysUntilDue <= 14 ? "medium" : "low";

    nextActions.push({
      description: `Prepare ${getRequirementDescription(record.requirementId)}`,
      dueDate: record.dueDate,
      priority,
    });
  }

  return nextActions.sort((a, b) => {
    const priorityOrder: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });
}

/**
 * Get human-readable description for a requirement
 */
function getRequirementDescription(requirementId: string): string {
  const requirement = STANDARD_COMPLIANCE_REQUIREMENTS.find(
    (req) => req.id === requirementId
  );
  return requirement?.description || requirementId;
}

/**
 * Generate compliance calendar for upcoming requirements
 */
export function generateComplianceCalendar(
  _businessId: string,
  startDate: Date,
  endDate: Date,
  businessData: {
    registrationDate: Date;
    annualTurnover: number;
    employeeCount: number;
    businessType: string;
    isVatRegistered: boolean;
  }
): Array<{
  date: Date;
  requirements: Array<{
    id: string;
    description: string;
    taxType: TaxType;
    filingType: FilingType;
    priority: "low" | "medium" | "high";
  }>;
}> {
  const calendar = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayRequirements = [];

    for (const requirement of STANDARD_COMPLIANCE_REQUIREMENTS) {
      if (!isRequirementApplicable(requirement, businessData)) {
        continue;
      }

      // Check if this requirement is due on current date
      if (isDueOnDate(requirement, currentDate)) {
        const priority: "low" | "medium" | "high" =
          requirement.taxType === "corporate"
            ? "high"
            : requirement.taxType === "paye" || requirement.taxType === "vat"
              ? "medium"
              : "low";

        dayRequirements.push({
          id: requirement.id,
          description: requirement.description,
          taxType: requirement.taxType,
          filingType: requirement.filingType,
          priority,
        });
      }
    }

    if (dayRequirements.length > 0) {
      calendar.push({
        date: new Date(currentDate),
        requirements: dayRequirements,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return calendar;
}

/**
 * Check if a requirement is due on a specific date
 */
function isDueOnDate(requirement: ComplianceRequirement, date: Date): boolean {
  const day = date.getDate();

  switch (requirement.taxType) {
    case "paye":
    case "nis":
      return day === COMPLIANCE_CONSTANTS.PAYE_DUE_DATE;
    case "vat":
    case "withholding":
      return day === COMPLIANCE_CONSTANTS.VAT_DUE_DATE;
    case "corporate":
      // Corporate tax due 6 months after year-end
      return requirement.frequency === "quarterly" && [15].includes(day);
    default:
      return day === 15; // Default due date
  }
}
