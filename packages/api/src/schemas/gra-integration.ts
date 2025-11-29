import { z } from "zod";

// GRA Authentication schemas
export const graAuthenticationSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  tin: z.string().min(1, "TIN is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const graAuthResponseSchema = z.object({
  authenticated: z.boolean(),
  sessionExpiry: z.date(),
  supportedForms: z.array(
    z.enum([
      "VAT_RETURN",
      "PAYE_RETURN",
      "CORPORATE_TAX",
      "BUSINESS_REGISTRATION",
    ])
  ),
});

// GRA Sync schemas
export const graSyncRequestSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  tin: z.string().min(1, "TIN is required"),
  syncType: z.enum(["BASIC_INFO", "TAX_HISTORY", "COMPLIANCE_STATUS"], {
    errorMap: () => ({ message: "Invalid sync type" }),
  }),
});

export const graBasicInfoSchema = z.object({
  tin: z.string(),
  businessName: z.string(),
  registrationDate: z.string(),
  businessType: z.enum([
    "SOLE_PROPRIETORSHIP",
    "PARTNERSHIP",
    "LIMITED_LIABILITY",
    "CORPORATION",
  ]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "DISSOLVED"]),
  address: z.string(),
  phone: z.string().optional(),
});

export const graTaxHistorySchema = z.object({
  filings: z.array(
    z.object({
      period: z.string(),
      formType: z.enum(["VAT_RETURN", "PAYE_RETURN", "CORPORATE_TAX"]),
      submittedDate: z.string(),
      status: z.enum(["PROCESSED", "PENDING", "REJECTED"]),
      amountPaid: z.number().optional(),
      amountDue: z.number().optional(),
    })
  ),
  totalTaxPaid: z.number(),
  outstandingBalance: z.number(),
});

export const graComplianceStatusSchema = z.object({
  vatRegistrationStatus: z.enum(["REGISTERED", "NOT_REGISTERED", "SUSPENDED"]),
  payeRegistrationStatus: z.enum(["REGISTERED", "NOT_REGISTERED", "SUSPENDED"]),
  complianceRating: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR"]),
  lastAuditDate: z.string().optional(),
  outstandingReturns: z.array(
    z.object({
      formType: z.enum(["VAT_RETURN", "PAYE_RETURN", "CORPORATE_TAX"]),
      period: z.string(),
      dueDate: z.string(),
      daysOverdue: z.number(),
    })
  ),
  penalties: z.array(
    z.object({
      type: z.enum(["LATE_FILING", "LATE_PAYMENT", "INCORRECT_FILING"]),
      amount: z.number(),
      period: z.string(),
      status: z.enum(["PAID", "UNPAID", "CONTESTED"]),
    })
  ),
});

// GRA Filing schemas
export const graFilingSubmissionSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID"),
  formType: z.enum(["VAT_RETURN", "PAYE_RETURN", "CORPORATE_TAX"], {
    errorMap: () => ({ message: "Invalid form type" }),
  }),
  priority: z.enum(["NORMAL", "URGENT"]).default("NORMAL"),
  notifyOnCompletion: z.boolean().default(true),
});

export const graSubmissionStatusSchema = z.object({
  submissionId: z.string().uuid().optional(),
  graReference: z.string().optional(),
  clientId: z.string().uuid().optional(),
});

export const graSubmissionResponseSchema = z.object({
  graReference: z.string(),
  status: z.enum(["SUBMITTED_TO_GRA", "UNDER_REVIEW", "APPROVED", "REJECTED"]),
  submittedAt: z.date(),
  expectedCompletionDate: z.date().optional(),
  trackingUrl: z.string().url(),
  priority: z.enum(["NORMAL", "URGENT"]),
  notifyOnCompletion: z.boolean(),
});

// GRA Status schemas
export const graStatusCheckSchema = z.object({
  graReference: z.string().min(1, "GRA reference is required"),
  updateLocal: z.boolean().default(true),
});

export const graStatusResponseSchema = z.object({
  graReference: z.string(),
  status: z.enum([
    "SUBMITTED_TO_GRA",
    "UNDER_REVIEW",
    "ADDITIONAL_INFO_REQUIRED",
    "APPROVED",
    "REJECTED",
  ]),
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

export const graTaxDeadlineSchema = z.object({
  id: z.string(),
  type: z.enum(["VAT_RETURN", "PAYE_RETURN", "CORPORATE_TAX", "BUSINESS_LEVY"]),
  title: z.string(),
  period: z.string(),
  dueDate: z.date(),
  description: z.string(),
  lateFilingPenalty: z.number(),
  applicableToAll: z.boolean(),
  requirements: z.array(z.string()).optional(),
  daysUntilDue: z.number(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
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
export const graExportRequestSchema = z.object({
  clientIds: z.array(z.string().uuid()).min(1, "At least one client required"),
  exportType: z.enum(
    ["ANNUAL_SUMMARY", "MONTHLY_BREAKDOWN", "TRANSACTION_DETAIL"],
    {
      errorMap: () => ({ message: "Invalid export type" }),
    }
  ),
  period: z.object({
    startDate: z.string().datetime("Invalid start date"),
    endDate: z.string().datetime("Invalid end date"),
  }),
  includeAttachments: z.boolean().default(false),
});

export const graExportResponseSchema = z.object({
  exportType: z.enum([
    "ANNUAL_SUMMARY",
    "MONTHLY_BREAKDOWN",
    "TRANSACTION_DETAIL",
  ]),
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
