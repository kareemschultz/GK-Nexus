import { businessSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  adminProcedure,
  protectedProcedure,
  requirePermission,
} from "../index";

// Enhanced input schemas building on existing foundation
const createImmigrationCaseSchema = z.object({
  clientId: z.string().uuid(),
  caseType: z.enum([
    "work_permit_initial",
    "work_permit_renewal",
    "work_permit_extension",
    "work_permit_amendment",
    "temporary_residence",
    "permanent_residence",
    "residence_renewal",
    "residence_extension",
    "investor_visa",
    "business_permit",
    "entrepreneur_permit",
    "business_registration",
    "family_reunification",
    "spousal_visa",
    "dependent_visa",
    "adoption_visa",
    "naturalization",
    "citizenship_by_descent",
    "citizenship_certificate",
    "student_visa",
    "research_permit",
    "volunteer_permit",
    "diplomatic_visa",
    "transit_visa",
    "status_change",
    "appeal",
    "judicial_review",
    "reactivation",
    "document_authentication",
    "verification_service",
    "travel_document",
    "other",
  ]),
  subCategory: z.string().optional(),
  priority: z
    .enum(["routine", "expedited", "urgent", "emergency"])
    .default("routine"),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  summary: z.string().optional(),
  objectives: z.string().optional(),
  purposeOfApplication: z.string().optional(),
  intendedStayDuration: z.string().optional(),
  dependentApplicants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        relationship: z.string(),
        passportNumber: z.string(),
        nationality: z.string(),
        dateOfBirth: z.string().date(),
        includeInApplication: z.boolean(),
      })
    )
    .optional(),
  employerInformation: z
    .object({
      companyName: z.string(),
      businessRegistrationNumber: z.string(),
      address: z.string(),
      contactPerson: z.string(),
      phoneNumber: z.string(),
      email: z.string().email(),
      jobTitle: z.string(),
      salaryOffered: z.number(),
      currency: z.string().default("GYD"),
      startDate: z.string().date(),
    })
    .optional(),
  applicationDate: z.string().date().optional(),
  targetDecisionDate: z.string().date().optional(),
  isExpedited: z.boolean().default(false),
  expeditionReason: z.string().optional(),
  governmentDepartment: z.string().optional(),
  processingOffice: z.string().optional(),
  applicationFee: z.string().optional(),
  expediteFee: z.string().optional(),
  additionalFees: z
    .array(
      z.object({
        description: z.string(),
        amount: z.string(),
        currency: z.string(),
        dueDate: z.string().date().optional(),
        paymentReference: z.string().optional(),
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

const updateImmigrationCaseSchema = createImmigrationCaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
    status: z
      .enum([
        "draft",
        "submitted",
        "under_review",
        "additional_docs_required",
        "interview_scheduled",
        "interview_completed",
        "decision_pending",
        "approved",
        "approved_with_conditions",
        "refused",
        "withdrawn",
        "cancelled",
        "expired",
        "appealed",
        "appeal_pending",
        "appeal_approved",
        "appeal_refused",
        "reactivated",
        "transferred",
      ])
      .optional(),
    decisionType: z.string().optional(),
    decisionReason: z.string().optional(),
    decisionNotes: z.string().optional(),
    conditions: z
      .array(
        z.object({
          condition: z.string(),
          description: z.string(),
          mustComplyBy: z.string().date(),
          isComplied: z.boolean(),
          complianceNotes: z.string().optional(),
        })
      )
      .optional(),
    assignedTo: z.string().uuid().optional(),
    assignedTeam: z.string().optional(),
    consultingLawyer: z.string().optional(),
    internalNotes: z.string().optional(),
    clientCommunication: z.string().optional(),
    governmentCorrespondence: z.string().optional(),
  });

const immigrationCaseQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  clientId: z.string().uuid().optional(),
  caseType: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  governmentDepartment: z.string().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  tags: z.string().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  sortBy: z
    .enum([
      "caseNumber",
      "title",
      "status",
      "priority",
      "applicationDate",
      "submissionDate",
      "targetDecisionDate",
      "createdAt",
      "updatedAt",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createDocumentRequirementSchema = z.object({
  caseId: z.string().uuid(),
  documentType: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  instructions: z.string().optional(),
  isRequired: z.boolean().default(true),
  isConditional: z.boolean().default(false),
  conditionalLogic: z.string().optional(),
  dueDate: z.string().date().optional(),
  acceptedFormats: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(),
  expiryValidationRequired: z.boolean().default(false),
  minimumValidityPeriod: z.number().optional(),
  sortOrder: z.number().default(0),
  isUrgent: z.boolean().default(false),
});

const updateDocumentRequirementSchema = createDocumentRequirementSchema
  .partial()
  .extend({
    id: z.string().uuid(),
    status: z
      .enum([
        "not_required",
        "required",
        "submitted",
        "verified",
        "rejected",
        "expired",
        "waived",
      ])
      .optional(),
    submittedDocumentId: z.string().uuid().optional(),
    verificationNotes: z.string().optional(),
    rejectionReason: z.string().optional(),
  });

const createTimelineEventSchema = z.object({
  caseId: z.string().uuid(),
  eventType: z.string().min(1),
  eventTitle: z.string().min(1),
  eventDescription: z.string().optional(),
  previousStatus: z.string().optional(),
  newStatus: z.string().optional(),
  statusReason: z.string().optional(),
  eventDate: z.string().datetime().optional(),
  scheduledDate: z.string().datetime().optional(),
  isScheduled: z.boolean().default(false),
  isCompleted: z.boolean().default(true),
  isMilestone: z.boolean().default(false),
  documentIds: z.array(z.string().uuid()).optional(),
  relatedCommunication: z.string().optional(),
  externalReference: z.string().optional(),
  involvedParties: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        organization: z.string().optional(),
        contactInfo: z.string().optional(),
      })
    )
    .optional(),
  impact: z.string().optional(),
  nextSteps: z.string().optional(),
  actionRequired: z.boolean().default(false),
  actionDueDate: z.string().date().optional(),
  responsiblePerson: z.string().uuid().optional(),
  governmentCorrespondence: z.boolean().default(false),
  clientNotified: z.boolean().default(false),
  internalNote: z.string().optional(),
  publicNote: z.string().optional(),
});

const createInterviewSchema = z.object({
  caseId: z.string().uuid(),
  interviewType: z.enum([
    "eligibility_assessment",
    "background_verification",
    "document_verification",
    "compliance_check",
    "appeal_hearing",
    "follow_up",
    "virtual",
    "in_person",
  ]),
  title: z.string().min(1),
  description: z.string().optional(),
  purpose: z.string().optional(),
  scheduledDateTime: z.string().datetime(),
  duration: z.number().default(60),
  location: z.string().optional(),
  isVirtual: z.boolean().default(false),
  meetingLink: z.string().url().optional(),
  meetingPassword: z.string().optional(),
  interviewer: z.string().optional(),
  interviewerTitle: z.string().optional(),
  interviewerContact: z.string().optional(),
  attendees: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        attendance: z.enum(["required", "optional"]),
        confirmed: z.boolean(),
        actualAttendance: z.enum(["attended", "absent", "late"]).optional(),
      })
    )
    .optional(),
  requiredDocuments: z.array(z.string()).optional(),
  preparationInstructions: z.string().optional(),
  languageSupport: z.string().optional(),
  specialAccommodations: z.string().optional(),
});

const updateInterviewSchema = createInterviewSchema.partial().extend({
  id: z.string().uuid(),
  status: z
    .enum(["scheduled", "confirmed", "completed", "cancelled", "rescheduled"])
    .optional(),
  isCompleted: z.boolean().optional(),
  completedAt: z.string().datetime().optional(),
  actualDuration: z.number().optional(),
  outcome: z.string().optional(),
  interviewNotes: z.string().optional(),
  interviewerRecommendation: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().date().optional(),
  followUpNotes: z.string().optional(),
  additionalDocsRequired: z.array(z.string()).optional(),
  cancellationReason: z.string().optional(),
  reminderSent: z.boolean().optional(),
  confirmationReceived: z.boolean().optional(),
});

const createCorrespondenceSchema = z.object({
  caseId: z.string().uuid(),
  correspondenceType: z.enum(["email", "letter", "phone", "fax", "in_person"]),
  direction: z.enum(["inbound", "outbound"]),
  subject: z.string().min(1),
  content: z.string().optional(),
  summary: z.string().optional(),
  fromParty: z.string().min(1),
  toParty: z.string().min(1),
  ccParties: z.array(z.string()).optional(),
  isGovernmentCorrespondence: z.boolean().default(false),
  governmentOfficer: z.string().optional(),
  sentDateTime: z.string().datetime().optional(),
  receivedDateTime: z.string().datetime().optional(),
  deliveryMethod: z.string().optional(),
  trackingNumber: z.string().optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  hasAttachments: z.boolean().default(false),
  requiresResponse: z.boolean().default(false),
  responseDeadline: z.string().date().optional(),
  hasBeenResponded: z.boolean().default(false),
  inResponseToId: z.string().uuid().optional(),
  isUrgent: z.boolean().default(false),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  impactOnCase: z.string().optional(),
  actionRequired: z.boolean().default(false),
  actionTaken: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isConfidential: z.boolean().default(false),
  isClientVisible: z.boolean().default(true),
});

// Helper function to generate case number
function generateCaseNumber(): string {
  const prefix = "IMM";
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const random = nanoid(6).toUpperCase();
  return `${prefix}${year}${month}${random}`;
}

export const immigrationRouter = {
  // Immigration Case Management

  // Create new immigration case
  createCase: protectedProcedure
    .use(requirePermission("immigration.create"))
    .input(createImmigrationCaseSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      try {
        const caseData = {
          id: nanoid(),
          organizationId: user?.organizationId!,
          caseNumber: generateCaseNumber(),
          internalReference: `INT-${nanoid(8).toUpperCase()}`,
          ...input,
          status: "draft",
          dependentApplicants: input.dependentApplicants
            ? JSON.stringify(input.dependentApplicants)
            : null,
          employerInformation: input.employerInformation
            ? JSON.stringify(input.employerInformation)
            : null,
          additionalFees: input.additionalFees
            ? JSON.stringify(input.additionalFees)
            : null,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          customFields: input.customFields
            ? JSON.stringify(input.customFields)
            : null,
          createdBy: user?.id!,
          updatedBy: user?.id,
        };

        const [newCase] = await db
          .insert(businessSchema.immigrationCase)
          .values(caseData)
          .returning({
            id: businessSchema.immigrationCase.id,
            caseNumber: businessSchema.immigrationCase.caseNumber,
            internalReference: businessSchema.immigrationCase.internalReference,
            title: businessSchema.immigrationCase.title,
            caseType: businessSchema.immigrationCase.caseType,
            status: businessSchema.immigrationCase.status,
            priority: businessSchema.immigrationCase.priority,
            createdAt: businessSchema.immigrationCase.createdAt,
          });

        // Create initial timeline event
        await db.insert(businessSchema.immigrationTimeline).values({
          id: nanoid(),
          caseId: newCase.id,
          organizationId: user?.organizationId!,
          eventType: "case_created",
          eventTitle: "Immigration Case Created",
          eventDescription: `New ${input.caseType} case created for client`,
          newStatus: "draft",
          isMilestone: true,
          clientNotified: true,
          publicNote:
            "Your immigration case has been created and is under initial review.",
          createdBy: user?.id!,
        });

        return {
          success: true,
          data: newCase,
          message: "Immigration case created successfully",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to create immigration case"
        );
      }
    }),

  // List immigration cases with filtering
  listCases: protectedProcedure
    .use(requirePermission("immigration.read"))
    .input(immigrationCaseQuerySchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const {
        page,
        limit,
        search,
        clientId,
        caseType,
        status,
        priority,
        assignedTo,
        governmentDepartment,
        startDate,
        endDate,
        tags,
        isActive,
        isArchived,
        sortBy,
        sortOrder,
      } = input;

      const offset = (page - 1) * limit;
      const conditions = [];

      if (search) {
        conditions.push(
          sql`(
            ${ilike(businessSchema.immigrationCase.caseNumber, `%${search}%`)} OR
            ${ilike(businessSchema.immigrationCase.title, `%${search}%`)} OR
            ${ilike(businessSchema.immigrationCase.description, `%${search}%`)} OR
            ${ilike(businessSchema.immigrationCase.internalReference, `%${search}%`)} OR
            ${ilike(businessSchema.immigrationCase.governmentFileNumber, `%${search}%`)}
          )`
        );
      }

      if (clientId) {
        conditions.push(eq(businessSchema.immigrationCase.clientId, clientId));
      }

      if (caseType) {
        conditions.push(
          eq(businessSchema.immigrationCase.caseType, caseType as any)
        );
      }

      if (status) {
        conditions.push(
          eq(businessSchema.immigrationCase.status, status as any)
        );
      }

      if (priority) {
        conditions.push(
          eq(businessSchema.immigrationCase.priority, priority as any)
        );
      }

      if (assignedTo) {
        conditions.push(
          eq(businessSchema.immigrationCase.assignedTo, assignedTo)
        );
      }

      if (governmentDepartment) {
        conditions.push(
          eq(
            businessSchema.immigrationCase.governmentDepartment,
            governmentDepartment
          )
        );
      }

      if (startDate) {
        conditions.push(
          gte(businessSchema.immigrationCase.applicationDate, startDate)
        );
      }

      if (endDate) {
        conditions.push(
          lte(businessSchema.immigrationCase.applicationDate, endDate)
        );
      }

      if (tags) {
        conditions.push(
          sql`${businessSchema.immigrationCase.tags}::text LIKE ${`%"${tags}"%`}`
        );
      }

      if (isActive !== undefined) {
        conditions.push(eq(businessSchema.immigrationCase.isActive, isActive));
      }

      if (isArchived !== undefined) {
        conditions.push(
          eq(businessSchema.immigrationCase.isArchived, isArchived)
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(businessSchema.immigrationCase)
        .where(whereClause);

      // Get cases with sorting
      const sortColumn =
        businessSchema.immigrationCase[
          sortBy as keyof typeof businessSchema.immigrationCase
        ];
      const orderClause =
        sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      const cases = await db
        .select({
          id: businessSchema.immigrationCase.id,
          caseNumber: businessSchema.immigrationCase.caseNumber,
          internalReference: businessSchema.immigrationCase.internalReference,
          governmentFileNumber:
            businessSchema.immigrationCase.governmentFileNumber,
          title: businessSchema.immigrationCase.title,
          caseType: businessSchema.immigrationCase.caseType,
          subCategory: businessSchema.immigrationCase.subCategory,
          status: businessSchema.immigrationCase.status,
          priority: businessSchema.immigrationCase.priority,
          clientId: businessSchema.immigrationCase.clientId,
          assignedTo: businessSchema.immigrationCase.assignedTo,
          assignedTeam: businessSchema.immigrationCase.assignedTeam,
          applicationDate: businessSchema.immigrationCase.applicationDate,
          submissionDate: businessSchema.immigrationCase.submissionDate,
          targetDecisionDate: businessSchema.immigrationCase.targetDecisionDate,
          actualDecisionDate: businessSchema.immigrationCase.actualDecisionDate,
          decisionMade: businessSchema.immigrationCase.decisionMade,
          decisionType: businessSchema.immigrationCase.decisionType,
          isExpedited: businessSchema.immigrationCase.isExpedited,
          governmentDepartment:
            businessSchema.immigrationCase.governmentDepartment,
          processingOffice: businessSchema.immigrationCase.processingOffice,
          tags: businessSchema.immigrationCase.tags,
          isActive: businessSchema.immigrationCase.isActive,
          isArchived: businessSchema.immigrationCase.isArchived,
          createdAt: businessSchema.immigrationCase.createdAt,
          updatedAt: businessSchema.immigrationCase.updatedAt,
        })
        .from(businessSchema.immigrationCase)
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset);

      // Parse JSON fields
      const parsedCases = cases.map((case_) => ({
        ...case_,
        tags: case_.tags ? JSON.parse(case_.tags) : [],
      }));

      const total = totalResult.count;
      const pages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          items: parsedCases,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
        },
      };
    }),

  // Get immigration case by ID
  getCaseById: protectedProcedure
    .use(requirePermission("immigration.read"))
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [immigrationCase] = await db
        .select()
        .from(businessSchema.immigrationCase)
        .where(
          and(
            eq(businessSchema.immigrationCase.id, input.id),
            eq(businessSchema.immigrationCase.isActive, true)
          )
        )
        .limit(1);

      if (!immigrationCase) {
        throw new ORPCError("NOT_FOUND", "Immigration case not found");
      }

      // Parse JSON fields
      const parsedCase = {
        ...immigrationCase,
        dependentApplicants: immigrationCase.dependentApplicants
          ? JSON.parse(immigrationCase.dependentApplicants)
          : [],
        employerInformation: immigrationCase.employerInformation
          ? JSON.parse(immigrationCase.employerInformation)
          : null,
        conditions: immigrationCase.conditions
          ? JSON.parse(immigrationCase.conditions)
          : [],
        additionalFees: immigrationCase.additionalFees
          ? JSON.parse(immigrationCase.additionalFees)
          : [],
        complianceChecks: immigrationCase.complianceChecks
          ? JSON.parse(immigrationCase.complianceChecks)
          : [],
        riskFactors: immigrationCase.riskFactors
          ? JSON.parse(immigrationCase.riskFactors)
          : [],
        customFields: immigrationCase.customFields
          ? JSON.parse(immigrationCase.customFields)
          : {},
        tags: immigrationCase.tags ? JSON.parse(immigrationCase.tags) : [],
      };

      return {
        success: true,
        data: parsedCase,
      };
    }),

  // Update immigration case
  updateCase: protectedProcedure
    .use(requirePermission("immigration.update"))
    .input(updateImmigrationCaseSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { id, ...updateData } = input;

      // Check if case exists
      const [existingCase] = await db
        .select()
        .from(businessSchema.immigrationCase)
        .where(
          and(
            eq(businessSchema.immigrationCase.id, id),
            eq(businessSchema.immigrationCase.isActive, true)
          )
        )
        .limit(1);

      if (!existingCase) {
        throw new ORPCError("NOT_FOUND", "Immigration case not found");
      }

      // Prepare update data
      const processedUpdateData: any = { ...updateData };
      if (updateData.dependentApplicants) {
        processedUpdateData.dependentApplicants = JSON.stringify(
          updateData.dependentApplicants
        );
      }
      if (updateData.employerInformation) {
        processedUpdateData.employerInformation = JSON.stringify(
          updateData.employerInformation
        );
      }
      if (updateData.conditions) {
        processedUpdateData.conditions = JSON.stringify(updateData.conditions);
      }
      if (updateData.tags) {
        processedUpdateData.tags = JSON.stringify(updateData.tags);
      }
      if (updateData.customFields) {
        processedUpdateData.customFields = JSON.stringify(
          updateData.customFields
        );
      }
      processedUpdateData.updatedBy = user?.id;

      try {
        const [updatedCase] = await db
          .update(businessSchema.immigrationCase)
          .set(processedUpdateData)
          .where(eq(businessSchema.immigrationCase.id, id))
          .returning({
            id: businessSchema.immigrationCase.id,
            caseNumber: businessSchema.immigrationCase.caseNumber,
            title: businessSchema.immigrationCase.title,
            status: businessSchema.immigrationCase.status,
            updatedAt: businessSchema.immigrationCase.updatedAt,
          });

        // Create timeline event if status changed
        if (updateData.status && updateData.status !== existingCase.status) {
          await db.insert(businessSchema.immigrationTimeline).values({
            id: nanoid(),
            caseId: id,
            organizationId: user?.organizationId!,
            eventType: "status_change",
            eventTitle: "Case Status Updated",
            eventDescription: `Status changed from ${existingCase.status} to ${updateData.status}`,
            previousStatus: existingCase.status as any,
            newStatus: updateData.status as any,
            statusReason:
              updateData.internalNotes || "Status updated via system",
            isMilestone: true,
            clientNotified: true,
            publicNote: `Your case status has been updated to: ${updateData.status}`,
            createdBy: user?.id!,
          });
        }

        return {
          success: true,
          data: updatedCase,
          message: "Immigration case updated successfully",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to update immigration case"
        );
      }
    }),

  // Archive immigration case
  archiveCase: protectedProcedure
    .use(requirePermission("immigration.delete"))
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().max(500).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      try {
        const [archivedCase] = await db
          .update(businessSchema.immigrationCase)
          .set({
            isArchived: true,
            archivedAt: new Date(),
            archivedBy: user?.id,
            updatedBy: user?.id,
          })
          .where(
            and(
              eq(businessSchema.immigrationCase.id, input.id),
              eq(businessSchema.immigrationCase.isActive, true)
            )
          )
          .returning({
            id: businessSchema.immigrationCase.id,
            caseNumber: businessSchema.immigrationCase.caseNumber,
            title: businessSchema.immigrationCase.title,
            isArchived: businessSchema.immigrationCase.isArchived,
          });

        if (!archivedCase) {
          throw new ORPCError("NOT_FOUND", "Immigration case not found");
        }

        // Create timeline event
        await db.insert(businessSchema.immigrationTimeline).values({
          id: nanoid(),
          caseId: input.id,
          organizationId: user?.organizationId!,
          eventType: "case_archived",
          eventTitle: "Case Archived",
          eventDescription: `Case archived by ${user?.name}`,
          statusReason: input.reason,
          isMilestone: true,
          clientNotified: true,
          publicNote: "Your case has been archived.",
          createdBy: user?.id!,
        });

        return {
          success: true,
          data: archivedCase,
          message: "Immigration case archived successfully",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to archive immigration case"
        );
      }
    }),

  // Document Requirements Management

  // Get document requirements for a case
  getDocumentRequirements: protectedProcedure
    .use(requirePermission("immigration.read"))
    .input(z.object({ caseId: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const requirements = await db
        .select()
        .from(businessSchema.immigrationDocumentRequirement)
        .where(
          eq(businessSchema.immigrationDocumentRequirement.caseId, input.caseId)
        )
        .orderBy(
          asc(businessSchema.immigrationDocumentRequirement.sortOrder),
          asc(businessSchema.immigrationDocumentRequirement.displayName)
        );

      // Parse JSON fields
      const parsedRequirements = requirements.map((req) => ({
        ...req,
        alternateDocuments: req.alternateDocuments
          ? JSON.parse(req.alternateDocuments)
          : [],
        acceptedFormats: req.acceptedFormats
          ? JSON.parse(req.acceptedFormats)
          : [],
      }));

      return {
        success: true,
        data: parsedRequirements,
      };
    }),

  // Create document requirement
  createDocumentRequirement: protectedProcedure
    .use(requirePermission("immigration.update"))
    .input(createDocumentRequirementSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      try {
        const [requirement] = await db
          .insert(businessSchema.immigrationDocumentRequirement)
          .values({
            id: nanoid(),
            organizationId: user?.organizationId!,
            ...input,
            acceptedFormats: input.acceptedFormats
              ? JSON.stringify(input.acceptedFormats)
              : null,
            createdBy: user?.id,
          })
          .returning({
            id: businessSchema.immigrationDocumentRequirement.id,
            documentType:
              businessSchema.immigrationDocumentRequirement.documentType,
            displayName:
              businessSchema.immigrationDocumentRequirement.displayName,
            isRequired:
              businessSchema.immigrationDocumentRequirement.isRequired,
            status: businessSchema.immigrationDocumentRequirement.status,
          });

        return {
          success: true,
          data: requirement,
          message: "Document requirement created successfully",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to create document requirement"
        );
      }
    }),

  // Update document requirement
  updateDocumentRequirement: protectedProcedure
    .use(requirePermission("immigration.update"))
    .input(updateDocumentRequirementSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { id, ...updateData } = input;

      // Prepare update data
      const processedUpdateData: any = { ...updateData };
      if (updateData.acceptedFormats) {
        processedUpdateData.acceptedFormats = JSON.stringify(
          updateData.acceptedFormats
        );
      }
      processedUpdateData.updatedBy = user?.id;

      // Handle verification
      if (updateData.status === "verified") {
        processedUpdateData.verifiedBy = user?.id;
        processedUpdateData.verifiedAt = new Date();
      }

      try {
        const [updatedRequirement] = await db
          .update(businessSchema.immigrationDocumentRequirement)
          .set(processedUpdateData)
          .where(eq(businessSchema.immigrationDocumentRequirement.id, id))
          .returning({
            id: businessSchema.immigrationDocumentRequirement.id,
            documentType:
              businessSchema.immigrationDocumentRequirement.documentType,
            status: businessSchema.immigrationDocumentRequirement.status,
            updatedAt: businessSchema.immigrationDocumentRequirement.updatedAt,
          });

        if (!updatedRequirement) {
          throw new ORPCError("NOT_FOUND", "Document requirement not found");
        }

        return {
          success: true,
          data: updatedRequirement,
          message: "Document requirement updated successfully",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to update document requirement"
        );
      }
    }),

  // Timeline and Events Management

  // Get case timeline
  getCaseTimeline: protectedProcedure
    .use(requirePermission("immigration.read"))
    .input(
      z.object({
        caseId: z.string().uuid(),
        includeInternal: z.boolean().default(false),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const conditions = [
        eq(businessSchema.immigrationTimeline.caseId, input.caseId),
      ];

      // Filter out internal notes unless specifically requested
      if (!input.includeInternal) {
        conditions.push(
          isNull(businessSchema.immigrationTimeline.internalNote)
        );
      }

      const timeline = await db
        .select()
        .from(businessSchema.immigrationTimeline)
        .where(and(...conditions))
        .orderBy(desc(businessSchema.immigrationTimeline.eventDate));

      // Parse JSON fields
      const parsedTimeline = timeline.map((event) => ({
        ...event,
        documentIds: event.documentIds ? JSON.parse(event.documentIds) : [],
        involvedParties: event.involvedParties
          ? JSON.parse(event.involvedParties)
          : [],
      }));

      return {
        success: true,
        data: parsedTimeline,
      };
    }),

  // Create timeline event
  createTimelineEvent: protectedProcedure
    .use(requirePermission("immigration.update"))
    .input(createTimelineEventSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      try {
        const [event] = await db
          .insert(businessSchema.immigrationTimeline)
          .values({
            id: nanoid(),
            organizationId: user?.organizationId!,
            ...input,
            eventDate: input.eventDate ? new Date(input.eventDate) : new Date(),
            scheduledDate: input.scheduledDate
              ? new Date(input.scheduledDate)
              : null,
            documentIds: input.documentIds
              ? JSON.stringify(input.documentIds)
              : null,
            involvedParties: input.involvedParties
              ? JSON.stringify(input.involvedParties)
              : null,
            createdBy: user?.id!,
          })
          .returning({
            id: businessSchema.immigrationTimeline.id,
            eventTitle: businessSchema.immigrationTimeline.eventTitle,
            eventType: businessSchema.immigrationTimeline.eventType,
            eventDate: businessSchema.immigrationTimeline.eventDate,
            isMilestone: businessSchema.immigrationTimeline.isMilestone,
          });

        return {
          success: true,
          data: event,
          message: "Timeline event created successfully",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to create timeline event"
        );
      }
    }),

  // Interview Management

  // Get case interviews
  getCaseInterviews: protectedProcedure
    .use(requirePermission("immigration.read"))
    .input(z.object({ caseId: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const interviews = await db
        .select()
        .from(businessSchema.immigrationInterview)
        .where(eq(businessSchema.immigrationInterview.caseId, input.caseId))
        .orderBy(asc(businessSchema.immigrationInterview.scheduledDateTime));

      // Parse JSON fields
      const parsedInterviews = interviews.map((interview) => ({
        ...interview,
        attendees: interview.attendees ? JSON.parse(interview.attendees) : [],
        requiredDocuments: interview.requiredDocuments
          ? JSON.parse(interview.requiredDocuments)
          : [],
        additionalDocsRequired: interview.additionalDocsRequired
          ? JSON.parse(interview.additionalDocsRequired)
          : [],
      }));

      return {
        success: true,
        data: parsedInterviews,
      };
    }),

  // Schedule interview
  scheduleInterview: protectedProcedure
    .use(requirePermission("immigration.update"))
    .input(createInterviewSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      try {
        const [interview] = await db
          .insert(businessSchema.immigrationInterview)
          .values({
            id: nanoid(),
            organizationId: user?.organizationId!,
            ...input,
            scheduledDateTime: new Date(input.scheduledDateTime),
            attendees: input.attendees ? JSON.stringify(input.attendees) : null,
            requiredDocuments: input.requiredDocuments
              ? JSON.stringify(input.requiredDocuments)
              : null,
            status: "scheduled",
            createdBy: user?.id!,
          })
          .returning({
            id: businessSchema.immigrationInterview.id,
            title: businessSchema.immigrationInterview.title,
            interviewType: businessSchema.immigrationInterview.interviewType,
            scheduledDateTime:
              businessSchema.immigrationInterview.scheduledDateTime,
            status: businessSchema.immigrationInterview.status,
          });

        // Create timeline event
        await db.insert(businessSchema.immigrationTimeline).values({
          id: nanoid(),
          caseId: input.caseId,
          organizationId: user?.organizationId!,
          eventType: "interview_scheduled",
          eventTitle: "Interview Scheduled",
          eventDescription: `${input.title} scheduled for ${input.scheduledDateTime}`,
          scheduledDate: new Date(input.scheduledDateTime),
          isScheduled: true,
          isMilestone: true,
          actionRequired: true,
          actionDueDate: input.scheduledDateTime.split("T")[0],
          clientNotified: true,
          publicNote: `Your interview has been scheduled for ${new Date(input.scheduledDateTime).toLocaleString()}`,
          createdBy: user?.id!,
        });

        return {
          success: true,
          data: interview,
          message: "Interview scheduled successfully",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to schedule interview"
        );
      }
    }),

  // Update interview
  updateInterview: protectedProcedure
    .use(requirePermission("immigration.update"))
    .input(updateInterviewSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { id, ...updateData } = input;

      // Prepare update data
      const processedUpdateData: any = { ...updateData };
      if (updateData.attendees) {
        processedUpdateData.attendees = JSON.stringify(updateData.attendees);
      }
      if (updateData.requiredDocuments) {
        processedUpdateData.requiredDocuments = JSON.stringify(
          updateData.requiredDocuments
        );
      }
      if (updateData.additionalDocsRequired) {
        processedUpdateData.additionalDocsRequired = JSON.stringify(
          updateData.additionalDocsRequired
        );
      }
      if (updateData.completedAt) {
        processedUpdateData.completedAt = new Date(updateData.completedAt);
      }
      if (updateData.scheduledDateTime) {
        processedUpdateData.scheduledDateTime = new Date(
          updateData.scheduledDateTime
        );
      }
      processedUpdateData.updatedBy = user?.id;

      try {
        const [updatedInterview] = await db
          .update(businessSchema.immigrationInterview)
          .set(processedUpdateData)
          .where(eq(businessSchema.immigrationInterview.id, id))
          .returning({
            id: businessSchema.immigrationInterview.id,
            title: businessSchema.immigrationInterview.title,
            status: businessSchema.immigrationInterview.status,
            outcome: businessSchema.immigrationInterview.outcome,
            updatedAt: businessSchema.immigrationInterview.updatedAt,
          });

        if (!updatedInterview) {
          throw new ORPCError("NOT_FOUND", "Interview not found");
        }

        return {
          success: true,
          data: updatedInterview,
          message: "Interview updated successfully",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to update interview"
        );
      }
    }),

  // Correspondence Management

  // Get case correspondence
  getCaseCorrespondence: protectedProcedure
    .use(requirePermission("immigration.read"))
    .input(
      z.object({
        caseId: z.string().uuid(),
        includeConfidential: z.boolean().default(false),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const conditions = [
        eq(businessSchema.immigrationCorrespondence.caseId, input.caseId),
      ];

      // Filter out confidential correspondence unless specifically requested
      if (!input.includeConfidential) {
        conditions.push(
          eq(businessSchema.immigrationCorrespondence.isConfidential, false)
        );
      }

      const correspondence = await db
        .select()
        .from(businessSchema.immigrationCorrespondence)
        .where(and(...conditions))
        .orderBy(desc(businessSchema.immigrationCorrespondence.sentDateTime));

      // Parse JSON fields
      const parsedCorrespondence = correspondence.map((corr) => ({
        ...corr,
        ccParties: corr.ccParties ? JSON.parse(corr.ccParties) : [],
        attachmentIds: corr.attachmentIds ? JSON.parse(corr.attachmentIds) : [],
        tags: corr.tags ? JSON.parse(corr.tags) : [],
      }));

      return {
        success: true,
        data: parsedCorrespondence,
      };
    }),

  // Create correspondence
  createCorrespondence: protectedProcedure
    .use(requirePermission("immigration.update"))
    .input(createCorrespondenceSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      try {
        const [correspondence] = await db
          .insert(businessSchema.immigrationCorrespondence)
          .values({
            id: nanoid(),
            organizationId: user?.organizationId!,
            ...input,
            sentDateTime: input.sentDateTime
              ? new Date(input.sentDateTime)
              : null,
            receivedDateTime: input.receivedDateTime
              ? new Date(input.receivedDateTime)
              : null,
            ccParties: input.ccParties ? JSON.stringify(input.ccParties) : null,
            attachmentIds: input.attachmentIds
              ? JSON.stringify(input.attachmentIds)
              : null,
            tags: input.tags ? JSON.stringify(input.tags) : null,
            createdBy: user?.id!,
          })
          .returning({
            id: businessSchema.immigrationCorrespondence.id,
            subject: businessSchema.immigrationCorrespondence.subject,
            correspondenceType:
              businessSchema.immigrationCorrespondence.correspondenceType,
            direction: businessSchema.immigrationCorrespondence.direction,
            isGovernmentCorrespondence:
              businessSchema.immigrationCorrespondence
                .isGovernmentCorrespondence,
            createdAt: businessSchema.immigrationCorrespondence.createdAt,
          });

        return {
          success: true,
          data: correspondence,
          message: "Correspondence created successfully",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to create correspondence"
        );
      }
    }),

  // Statistics and Reporting

  // Get immigration statistics
  getImmigrationStats: adminProcedure
    .input(
      z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        caseType: z.string().optional(),
        assignedTo: z.string().uuid().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { startDate, endDate, caseType, assignedTo } = input;

      const conditions = [eq(businessSchema.immigrationCase.isActive, true)];

      if (startDate) {
        conditions.push(
          gte(businessSchema.immigrationCase.createdAt, new Date(startDate))
        );
      }
      if (endDate) {
        conditions.push(
          lte(businessSchema.immigrationCase.createdAt, new Date(endDate))
        );
      }
      if (caseType) {
        conditions.push(
          eq(businessSchema.immigrationCase.caseType, caseType as any)
        );
      }
      if (assignedTo) {
        conditions.push(
          eq(businessSchema.immigrationCase.assignedTo, assignedTo)
        );
      }

      const whereClause = and(...conditions);

      const [overallStats] = await db
        .select({
          total: count(),
          submitted: sql<number>`COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review'))`,
          approved: sql<number>`COUNT(*) FILTER (WHERE status IN ('approved', 'approved_with_conditions'))`,
          refused: sql<number>`COUNT(*) FILTER (WHERE status = 'refused')`,
          pending: sql<number>`COUNT(*) FILTER (WHERE status IN ('draft', 'additional_docs_required'))`,
          expedited: sql<number>`COUNT(*) FILTER (WHERE is_expedited = true)`,
        })
        .from(businessSchema.immigrationCase)
        .where(whereClause);

      const statusStats = await db
        .select({
          status: businessSchema.immigrationCase.status,
          count: count(),
        })
        .from(businessSchema.immigrationCase)
        .where(whereClause)
        .groupBy(businessSchema.immigrationCase.status);

      const caseTypeStats = await db
        .select({
          caseType: businessSchema.immigrationCase.caseType,
          count: count(),
        })
        .from(businessSchema.immigrationCase)
        .where(whereClause)
        .groupBy(businessSchema.immigrationCase.caseType);

      const priorityStats = await db
        .select({
          priority: businessSchema.immigrationCase.priority,
          count: count(),
        })
        .from(businessSchema.immigrationCase)
        .where(whereClause)
        .groupBy(businessSchema.immigrationCase.priority);

      return {
        success: true,
        data: {
          overview: overallStats,
          byStatus: statusStats,
          byCaseType: caseTypeStats,
          byPriority: priorityStats,
        },
      };
    }),

  // Get upcoming deadlines
  getUpcomingDeadlines: protectedProcedure
    .use(requirePermission("immigration.read"))
    .input(
      z.object({
        daysAhead: z.number().min(1).max(365).default(30),
        clientId: z.string().uuid().optional(),
        priority: z
          .enum(["routine", "expedited", "urgent", "emergency"])
          .optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { daysAhead, clientId, priority } = input;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const conditions = [
        eq(businessSchema.immigrationCase.isActive, true),
        gte(
          businessSchema.immigrationCase.targetDecisionDate,
          new Date().toISOString().split("T")[0]
        ),
        lte(
          businessSchema.immigrationCase.targetDecisionDate,
          futureDate.toISOString().split("T")[0]
        ),
      ];

      if (clientId) {
        conditions.push(eq(businessSchema.immigrationCase.clientId, clientId));
      }
      if (priority) {
        conditions.push(
          eq(businessSchema.immigrationCase.priority, priority as any)
        );
      }

      const deadlines = await db
        .select({
          id: businessSchema.immigrationCase.id,
          caseNumber: businessSchema.immigrationCase.caseNumber,
          title: businessSchema.immigrationCase.title,
          caseType: businessSchema.immigrationCase.caseType,
          priority: businessSchema.immigrationCase.priority,
          clientId: businessSchema.immigrationCase.clientId,
          targetDecisionDate: businessSchema.immigrationCase.targetDecisionDate,
          status: businessSchema.immigrationCase.status,
        })
        .from(businessSchema.immigrationCase)
        .where(and(...conditions))
        .orderBy(asc(businessSchema.immigrationCase.targetDecisionDate));

      const deadlinesWithDaysLeft = deadlines.map((deadline) => ({
        ...deadline,
        daysUntilDeadline: Math.ceil(
          (new Date(deadline.targetDecisionDate!).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        urgencyLevel: (() => {
          const days = Math.ceil(
            (new Date(deadline.targetDecisionDate!).getTime() -
              new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (days <= 7) return "critical";
          if (days <= 14) return "high";
          if (days <= 30) return "medium";
          return "low";
        })(),
      }));

      return {
        success: true,
        data: deadlinesWithDaysLeft,
      };
    }),
};
