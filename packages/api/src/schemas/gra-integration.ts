import { z } from "zod";

// GRA Authentication schemas
export const graAuthenticationSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  tin: z.string().min(1, "TIN is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const supportedFormTypes = [
  "VAT_RETURN",
  "PAYE_RETURN",
  "CORPORATE_TAX",
  "BUSINESS_REGISTRATION",
] as const;

export const graAuthResponseSchema = z.object({
  authenticated: z.boolean(),
  sessionExpiry: z.date(),
  supportedForms: z.array(z.enum(supportedFormTypes)),
});

// GRA Sync schemas
const syncTypes = ["BASIC_INFO", "TAX_HISTORY", "COMPLIANCE_STATUS"] as const;

export const graSyncRequestSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  tin: z.string().min(1, "TIN is required"),
  syncType: z.enum(syncTypes, "Invalid sync type"),
});

const businessTypes = [
  "SOLE_PROPRIETORSHIP",
  "PARTNERSHIP",
  "LIMITED_LIABILITY",
  "CORPORATION",
] as const;

const businessStatuses = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "DISSOLVED",
] as const;

export const graBasicInfoSchema = z.object({
  tin: z.string(),
  businessName: z.string(),
  registrationDate: z.string(),
  businessType: z.enum(businessTypes),
  status: z.enum(businessStatuses),
  address: z.string(),
  phone: z.string().optional(),
});

const formTypes = ["VAT_RETURN", "PAYE_RETURN", "CORPORATE_TAX"] as const;
const filingStatuses = ["PROCESSED", "PENDING", "REJECTED"] as const;

export const graTaxHistorySchema = z.object({
  filings: z.array(
    z.object({
      period: z.string(),
      formType: z.enum(formTypes),
      submittedDate: z.string(),
      status: z.enum(filingStatuses),
      amountPaid: z.number().optional(),
      amountDue: z.number().optional(),
    })
  ),
  totalTaxPaid: z.number(),
  outstandingBalance: z.number(),
});

const registrationStatuses = [
  "REGISTERED",
  "NOT_REGISTERED",
  "SUSPENDED",
] as const;
const complianceRatings = ["EXCELLENT", "GOOD", "FAIR", "POOR"] as const;
const penaltyTypes = [
  "LATE_FILING",
  "LATE_PAYMENT",
  "INCORRECT_FILING",
] as const;
const penaltyStatuses = ["PAID", "UNPAID", "CONTESTED"] as const;

export const graComplianceStatusSchema = z.object({
  vatRegistrationStatus: z.enum(registrationStatuses),
  payeRegistrationStatus: z.enum(registrationStatuses),
  complianceRating: z.enum(complianceRatings),
  lastAuditDate: z.string().optional(),
  outstandingReturns: z.array(
    z.object({
      formType: z.enum(formTypes),
      period: z.string(),
      dueDate: z.string(),
      daysOverdue: z.number(),
    })
  ),
  penalties: z.array(
    z.object({
      type: z.enum(penaltyTypes),
      amount: z.number(),
      period: z.string(),
      status: z.enum(penaltyStatuses),
    })
  ),
});

// GRA Filing schemas
const priorities = ["NORMAL", "URGENT"] as const;

export const graFilingSubmissionSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID"),
  formType: z.enum(formTypes, "Invalid form type"),
  priority: z.enum(priorities).default("NORMAL"),
  notifyOnCompletion: z.boolean().default(true),
});

export const graSubmissionStatusSchema = z.object({
  submissionId: z.string().uuid().optional(),
  graReference: z.string().optional(),
  clientId: z.string().uuid().optional(),
});

const submissionStatuses = [
  "SUBMITTED_TO_GRA",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;

export const graSubmissionResponseSchema = z.object({
  graReference: z.string(),
  status: z.enum(submissionStatuses),
  submittedAt: z.date(),
  expectedCompletionDate: z.date().optional(),
  trackingUrl: z.string().url(),
  priority: z.enum(priorities),
  notifyOnCompletion: z.boolean(),
});

// GRA Status schemas
export const graStatusCheckSchema = z.object({
  graReference: z.string().min(1, "GRA reference is required"),
  updateLocal: z.boolean().default(true),
});

const statusCheckStatuses = [
  "SUBMITTED_TO_GRA",
  "UNDER_REVIEW",
  "ADDITIONAL_INFO_REQUIRED",
  "APPROVED",
  "REJECTED",
] as const;

export const graStatusResponseSchema = z.object({
  graReference: z.string(),
  status: z.enum(statusCheckStatuses),
  lastUpdated: z.date(),
  processingNotes: z.array(
    z.object({
      date: z.date(),
      note: z.string(),
      officer: z.string(),
    })
  ),
});

// GRA Calendar schemas
export const graFilingCalendarSchema = z.object({
  year: z.number().min(2020).max(2030).default(new Date().getFullYear()),
  clientId: z.string().uuid().optional(),
});

const deadlineTypes = [
  "VAT_RETURN",
  "PAYE_RETURN",
  "CORPORATE_TAX",
  "BUSINESS_LEVY",
] as const;
const deadlinePriorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export const graTaxDeadlineSchema = z.object({
  id: z.string(),
  type: z.enum(deadlineTypes),
  title: z.string(),
  period: z.string(),
  dueDate: z.date(),
  description: z.string(),
  lateFilingPenalty: z.number(),
  applicableToAll: z.boolean(),
  requirements: z.array(z.string()).optional(),
  daysUntilDue: z.number(),
  priority: z.enum(deadlinePriorities),
  isOverdue: z.boolean(),
});

export const graCalendarResponseSchema = z.object({
  year: z.number(),
  calendar: z.array(graTaxDeadlineSchema),
  summary: z.object({
    totalDeadlines: z.number(),
    overdue: z.number(),
    critical: z.number(),
    high: z.number(),
    upcomingInNext30Days: z.number(),
  }),
});

// GRA Data Export schemas
const exportTypes = [
  "ANNUAL_SUMMARY",
  "MONTHLY_BREAKDOWN",
  "TRANSACTION_DETAIL",
] as const;

export const graExportRequestSchema = z.object({
  clientIds: z.array(z.string().uuid()).min(1, "At least one client required"),
  exportType: z.enum(exportTypes, "Invalid export type"),
  period: z.object({
    startDate: z.string().datetime("Invalid start date"),
    endDate: z.string().datetime("Invalid end date"),
  }),
  includeAttachments: z.boolean().default(false),
});

export const graExportResponseSchema = z.object({
  exportType: z.enum(exportTypes),
  period: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }),
  clientCount: z.number(),
  data: z.array(
    z.object({
      client: z.object({
        id: z.string(),
        name: z.string(),
        tin: z.string().optional(),
        entityType: z.string(),
      }),
      period: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
      taxData: z.any(),
      exportedAt: z.date(),
      exportedBy: z.string().optional(),
    })
  ),
  exportId: z.string(),
});

// Type exports
export type GRAAuthenticationInput = z.infer<typeof graAuthenticationSchema>;
export type GRAAuthResponse = z.infer<typeof graAuthResponseSchema>;
export type GRASyncRequest = z.infer<typeof graSyncRequestSchema>;
export type GRABasicInfo = z.infer<typeof graBasicInfoSchema>;
export type GRATaxHistory = z.infer<typeof graTaxHistorySchema>;
export type GRAComplianceStatus = z.infer<typeof graComplianceStatusSchema>;
export type GRAFilingSubmission = z.infer<typeof graFilingSubmissionSchema>;
export type GRASubmissionStatus = z.infer<typeof graSubmissionStatusSchema>;
export type GRASubmissionResponse = z.infer<typeof graSubmissionResponseSchema>;
export type GRAStatusCheck = z.infer<typeof graStatusCheckSchema>;
export type GRAStatusResponse = z.infer<typeof graStatusResponseSchema>;
export type GRAFilingCalendar = z.infer<typeof graFilingCalendarSchema>;
export type GRATaxDeadline = z.infer<typeof graTaxDeadlineSchema>;
export type GRACalendarResponse = z.infer<typeof graCalendarResponseSchema>;
export type GRAExportRequest = z.infer<typeof graExportRequestSchema>;
export type GRAExportResponse = z.infer<typeof graExportResponseSchema>;
