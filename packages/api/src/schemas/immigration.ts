import { z } from "zod";

// Immigration status enums
export const immigrationStatusSchema = z.enum(
  [
    "APPLICATION_SUBMITTED",
    "UNDER_REVIEW",
    "ADDITIONAL_DOCS_REQUESTED",
    "INTERVIEW_SCHEDULED",
    "APPROVED",
    "REJECTED",
    "APPEAL_IN_PROGRESS",
    "VISA_ISSUED",
    "RENEWAL_REQUIRED",
    "EXPIRED",
  ],
  {
    errorMap: () => ({ message: "Invalid immigration status" }),
  }
);

export const visaTypeSchema = z.enum(
  [
    "WORK_PERMIT",
    "STUDENT_VISA",
    "BUSINESS_VISA",
    "INVESTOR_VISA",
    "FAMILY_REUNIFICATION",
    "PERMANENT_RESIDENCE",
    "CITIZENSHIP",
    "OTHER",
  ],
  {
    errorMap: () => ({ message: "Invalid visa type" }),
  }
);

export const documentTypeSchema = z.enum(
  [
    "PASSPORT",
    "BIRTH_CERTIFICATE",
    "MARRIAGE_CERTIFICATE",
    "EDUCATIONAL_CREDENTIALS",
    "EMPLOYMENT_LETTER",
    "FINANCIAL_STATEMENTS",
    "MEDICAL_EXAMINATION",
    "POLICE_CLEARANCE",
    "SPONSOR_DOCUMENTS",
    "OTHER",
  ],
  {
    errorMap: () => ({ message: "Invalid document type" }),
  }
);

// Immigration status schemas
export const getImmigrationStatusSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
});

export const immigrationStatusResponseSchema = z.object({
  id: z.string(),
  currentStatus: immigrationStatusSchema,
  visaType: visaTypeSchema.optional(),
  applicationDate: z.date().optional(),
  expiryDate: z.date().optional(),
  documents: z.array(
    z.object({
      documentType: documentTypeSchema,
      documentId: z.string(),
      isRequired: z.boolean(),
      submittedAt: z.date().optional(),
      notes: z.string().optional(),
    })
  ),
  notes: z.array(
    z.object({
      date: z.date(),
      note: z.string(),
      addedBy: z.string(),
    })
  ),
  nextAction: z.string().optional(),
  nextActionDate: z.date().optional(),
  assignedOfficer: z.string().optional(),
  timeline: z.array(
    z.object({
      status: immigrationStatusSchema,
      changedAt: z.date(),
      changedBy: z.string(),
      notes: z.string().optional(),
    })
  ),
  daysUntilExpiry: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateImmigrationStatusSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  status: immigrationStatusSchema,
  visaType: visaTypeSchema.optional(),
  expiryDate: z.string().datetime().optional(),
  nextAction: z.string().max(500).optional(),
  nextActionDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  documentsRequired: z.array(z.string()).optional(),
});

// Immigration document submission
export const immigrationDocumentSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  documentType: documentTypeSchema,
  isRequired: z.boolean(),
  submittedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const submitImmigrationDocumentsSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  documents: z.array(immigrationDocumentSchema),
});

export const immigrationDocumentResponseSchema = z.object({
  documentsSubmitted: z.number(),
  totalDocuments: z.number(),
});

// Immigration workflow templates
export const getWorkflowTemplatesSchema = z.object({
  visaType: visaTypeSchema.optional(),
});

export const workflowStepSchema = z.object({
  step: z.number(),
  name: z.string(),
  estimatedDays: z.number(),
});

export const workflowFeesSchema = z.object({
  applicationFee: z.number(),
  processingFee: z.number(),
  consultationFee: z.number(),
});

export const immigrationWorkflowTemplateSchema = z.object({
  name: z.string(),
  requiredDocuments: z.array(documentTypeSchema),
  workflow: z.array(workflowStepSchema),
  totalEstimatedDays: z.number(),
  fees: workflowFeesSchema,
});

export const workflowTemplatesResponseSchema = z.object({
  WORK_PERMIT: immigrationWorkflowTemplateSchema.optional(),
  STUDENT_VISA: immigrationWorkflowTemplateSchema.optional(),
  BUSINESS_VISA: immigrationWorkflowTemplateSchema.optional(),
  INVESTOR_VISA: immigrationWorkflowTemplateSchema.optional(),
  FAMILY_REUNIFICATION: immigrationWorkflowTemplateSchema.optional(),
  PERMANENT_RESIDENCE: immigrationWorkflowTemplateSchema.optional(),
  CITIZENSHIP: immigrationWorkflowTemplateSchema.optional(),
});

// Immigration statistics
export const immigrationStatsRequestSchema = z.object({
  clientId: z.string().uuid().optional(),
  visaType: visaTypeSchema.optional(),
  dateRange: z
    .object({
      startDate: z.string().datetime("Invalid start date"),
      endDate: z.string().datetime("Invalid end date"),
    })
    .optional(),
});

export const immigrationStatsResponseSchema = z.object({
  overview: z.object({
    totalApplications: z.number(),
    approvedApplications: z.number(),
    rejectedApplications: z.number(),
    pendingApplications: z.number(),
    averageProcessingDays: z.number(),
    successRate: z.number(),
  }),
  statusBreakdown: z.array(
    z.object({
      status: immigrationStatusSchema,
      count: z.number(),
    })
  ),
  visaTypeBreakdown: z.array(
    z.object({
      visaType: visaTypeSchema,
      count: z.number(),
      averageProcessingDays: z.number(),
      successRate: z.number(),
    })
  ),
  monthlyTrends: z.array(
    z.object({
      month: z.string(),
      applications: z.number(),
      approvals: z.number(),
      rejections: z.number(),
    })
  ),
});

// Immigration deadlines and reminders
export const immigrationDeadlinesSchema = z.object({
  clientId: z.string().uuid().optional(),
  upcomingOnly: z.boolean().default(true),
  daysAhead: z.number().min(1).max(365).default(90),
});

export const immigrationDeadlineSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  type: z.enum([
    "VISA_EXPIRY",
    "RENEWAL_DUE",
    "DOCUMENT_SUBMISSION",
    "INTERVIEW",
    "STATUS_CHECK",
  ]),
  title: z.string(),
  description: z.string(),
  dueDate: z.date(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["PENDING", "COMPLETED", "OVERDUE"]),
  daysUntilDue: z.number(),
  warningLevel: z.enum(["NORMAL", "WARNING", "CRITICAL"]),
});

export const immigrationDeadlinesResponseSchema = z.object({
  deadlines: z.array(immigrationDeadlineSchema),
  summary: z.object({
    total: z.number(),
    overdue: z.number(),
    critical: z.number(),
    warning: z.number(),
    completed: z.number(),
  }),
});

// Immigration document checklist
export const documentChecklistSchema = z.object({
  visaType: visaTypeSchema,
  clientId: z.string().uuid(),
});

export const checklistItemSchema = z.object({
  id: z.string(),
  documentType: documentTypeSchema,
  title: z.string(),
  description: z.string(),
  isRequired: z.boolean(),
  isSubmitted: z.boolean(),
  submittedAt: z.date().optional(),
  expiryDate: z.date().optional(),
  status: z.enum([
    "NOT_SUBMITTED",
    "SUBMITTED",
    "APPROVED",
    "REJECTED",
    "EXPIRED",
  ]),
  notes: z.string().optional(),
});

export const documentChecklistResponseSchema = z.object({
  visaType: visaTypeSchema,
  checklist: z.array(checklistItemSchema),
  progress: z.object({
    totalItems: z.number(),
    completedItems: z.number(),
    requiredItems: z.number(),
    completedRequired: z.number(),
    progressPercentage: z.number(),
    readyForSubmission: z.boolean(),
  }),
});

// Immigration interview scheduling
export const scheduleInterviewSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  interviewDate: z.string().datetime("Invalid interview date"),
  interviewTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  location: z.string().min(1, "Location is required"),
  interviewType: z.enum(["INITIAL", "FOLLOW_UP", "APPEAL", "RENEWAL"]),
  notes: z.string().max(1000).optional(),
  reminderDays: z.array(z.number()).default([7, 3, 1]),
});

export const interviewScheduleResponseSchema = z.object({
  interviewId: z.string(),
  scheduledDate: z.date(),
  scheduledTime: z.string(),
  location: z.string(),
  confirmationNumber: z.string(),
  status: z.enum([
    "SCHEDULED",
    "CONFIRMED",
    "RESCHEDULED",
    "CANCELLED",
    "COMPLETED",
  ]),
  reminders: z.array(
    z.object({
      reminderDate: z.date(),
      sent: z.boolean(),
    })
  ),
});

// Type exports
export type ImmigrationStatus = z.infer<typeof immigrationStatusSchema>;
export type VisaType = z.infer<typeof visaTypeSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type GetImmigrationStatusRequest = z.infer<
  typeof getImmigrationStatusSchema
>;
export type ImmigrationStatusResponse = z.infer<
  typeof immigrationStatusResponseSchema
>;
export type UpdateImmigrationStatusRequest = z.infer<
  typeof updateImmigrationStatusSchema
>;
export type ImmigrationDocument = z.infer<typeof immigrationDocumentSchema>;
export type SubmitImmigrationDocumentsRequest = z.infer<
  typeof submitImmigrationDocumentsSchema
>;
export type ImmigrationDocumentResponse = z.infer<
  typeof immigrationDocumentResponseSchema
>;
export type GetWorkflowTemplatesRequest = z.infer<
  typeof getWorkflowTemplatesSchema
>;
export type WorkflowStep = z.infer<typeof workflowStepSchema>;
export type WorkflowFees = z.infer<typeof workflowFeesSchema>;
export type ImmigrationWorkflowTemplate = z.infer<
  typeof immigrationWorkflowTemplateSchema
>;
export type WorkflowTemplatesResponse = z.infer<
  typeof workflowTemplatesResponseSchema
>;
export type ImmigrationStatsRequest = z.infer<
  typeof immigrationStatsRequestSchema
>;
export type ImmigrationStatsResponse = z.infer<
  typeof immigrationStatsResponseSchema
>;
export type ImmigrationDeadlinesRequest = z.infer<
  typeof immigrationDeadlinesSchema
>;
export type ImmigrationDeadline = z.infer<typeof immigrationDeadlineSchema>;
export type ImmigrationDeadlinesResponse = z.infer<
  typeof immigrationDeadlinesResponseSchema
>;
export type DocumentChecklistRequest = z.infer<typeof documentChecklistSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type DocumentChecklistResponse = z.infer<
  typeof documentChecklistResponseSchema
>;
export type ScheduleInterviewRequest = z.infer<typeof scheduleInterviewSchema>;
export type InterviewScheduleResponse = z.infer<
  typeof interviewScheduleResponseSchema
>;
