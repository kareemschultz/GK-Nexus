import { trainingSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, gte, ilike, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, requirePermission } from "../index";

// Helper functions
function generateCourseCode(): string {
  const prefix = "CRS";
  const random = nanoid(6).toUpperCase();
  return `${prefix}-${random}`;
}

function generateSessionCode(): string {
  const prefix = "SES";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = nanoid(4).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

function generateRegistrationNumber(): string {
  const prefix = "REG";
  const year = new Date().getFullYear();
  const random = nanoid(6).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

function generateCertificateNumber(): string {
  const prefix = "CERT";
  const year = new Date().getFullYear();
  const random = nanoid(8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

// Enums
const trainingCategories = [
  "ACCOUNTING_FINANCE",
  "TAX_COMPLIANCE",
  "BUSINESS_MANAGEMENT",
  "LEGAL_REGULATORY",
  "TECHNOLOGY_IT",
  "SOFT_SKILLS",
  "INDUSTRY_SPECIFIC",
  "CERTIFICATION_PREP",
  "PROFESSIONAL_DEVELOPMENT",
  "OTHER",
] as const;

const deliveryModes = [
  "IN_PERSON",
  "ONLINE_LIVE",
  "ONLINE_SELF_PACED",
  "HYBRID",
  "WORKSHOP",
] as const;

const courseStatuses = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
  "DISCONTINUED",
] as const;

const sessionStatuses = [
  "SCHEDULED",
  "OPEN_FOR_REGISTRATION",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "POSTPONED",
] as const;

const registrationStatuses = [
  "PENDING",
  "CONFIRMED",
  "WAITLISTED",
  "CANCELLED",
  "NO_SHOW",
  "COMPLETED",
] as const;

const certificateStatuses = [
  "PENDING",
  "ISSUED",
  "REVOKED",
  "EXPIRED",
] as const;

// Zod schemas
const courseQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.enum(trainingCategories).optional(),
  deliveryMode: z.enum(deliveryModes).optional(),
  status: z.enum(courseStatuses).optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createCourseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  category: z.enum(trainingCategories),
  deliveryMode: z.enum(deliveryModes),
  durationHours: z.number().min(0.5),
  maxParticipants: z.number().min(1).optional(),
  minParticipants: z.number().min(1).optional(),
  price: z.string().optional(),
  currency: z.string().default("GYD"),
  objectives: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
  syllabus: z
    .array(
      z.object({
        topic: z.string(),
        duration: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  materials: z.array(z.string()).optional(),
  certificateOffered: z.boolean().default(false),
  cpdPoints: z.number().optional(),
  instructorId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const createSessionSchema = z.object({
  courseId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  registrationDeadline: z.string().datetime().optional(),
  maxParticipants: z.number().min(1).optional(),
  venue: z.string().optional(),
  venueAddress: z.string().optional(),
  onlineLink: z.string().url().optional(),
  onlinePlatform: z.string().optional(),
  instructorId: z.string().optional(),
  price: z.string().optional(),
  earlyBirdPrice: z.string().optional(),
  earlyBirdDeadline: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const createRegistrationSchema = z.object({
  sessionId: z.string().min(1),
  participantName: z.string().min(1),
  participantEmail: z.string().email(),
  participantPhone: z.string().optional(),
  participantOrganization: z.string().optional(),
  participantJobTitle: z.string().optional(),
  clientId: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  specialNeeds: z.string().optional(),
  paymentAmount: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const trainingRouter = {
  // ===== COURSES =====
  courses: {
    list: protectedProcedure
      .use(requirePermission("training.read"))
      .input(courseQuerySchema)
      .handler(async ({ input, context }) => {
        const {
          page,
          limit,
          search,
          category,
          deliveryMode,
          status,
          sortBy,
          sortOrder,
        } = input;
        const { db } = context;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (search) {
          conditions.push(
            sql`(
              ${ilike(trainingSchema.trainingCourses.name, `%${search}%`)} OR
              ${ilike(trainingSchema.trainingCourses.courseCode, `%${search}%`)} OR
              ${ilike(trainingSchema.trainingCourses.description, `%${search}%`)}
            )`
          );
        }

        if (category) {
          conditions.push(
            eq(trainingSchema.trainingCourses.category, category)
          );
        }

        if (deliveryMode) {
          conditions.push(
            eq(trainingSchema.trainingCourses.deliveryMode, deliveryMode)
          );
        }

        if (status) {
          conditions.push(eq(trainingSchema.trainingCourses.status, status));
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const [totalResult] = await db
          .select({ count: count() })
          .from(trainingSchema.trainingCourses)
          .where(whereClause);

        const sortColumn =
          trainingSchema.trainingCourses[
            sortBy as keyof typeof trainingSchema.trainingCourses
          ] || trainingSchema.trainingCourses.createdAt;
        const orderClause =
          sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

        const courses = await db
          .select()
          .from(trainingSchema.trainingCourses)
          .where(whereClause)
          .orderBy(orderClause)
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          data: {
            items: courses,
            pagination: {
              page,
              limit,
              total: totalResult.count,
              pages: Math.ceil(totalResult.count / limit),
            },
          },
        };
      }),

    getById: protectedProcedure
      .use(requirePermission("training.read"))
      .input(z.object({ id: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id } = input;

        const [course] = await db
          .select()
          .from(trainingSchema.trainingCourses)
          .where(eq(trainingSchema.trainingCourses.id, id))
          .limit(1);

        if (!course) {
          throw new ORPCError("NOT_FOUND", "Course not found");
        }

        // Get upcoming sessions
        const sessions = await db
          .select()
          .from(trainingSchema.trainingSessions)
          .where(
            and(
              eq(trainingSchema.trainingSessions.courseId, id),
              gte(trainingSchema.trainingSessions.startDate, new Date())
            )
          )
          .orderBy(asc(trainingSchema.trainingSessions.startDate));

        return {
          success: true,
          data: {
            ...course,
            upcomingSessions: sessions,
          },
        };
      }),

    create: protectedProcedure
      .use(requirePermission("training.create"))
      .input(createCourseSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const courseData = {
          ...input,
          id: nanoid(),
          courseCode: generateCourseCode(),
          organizationId: user?.organizationId || "default",
          objectives: input.objectives
            ? JSON.stringify(input.objectives)
            : null,
          prerequisites: input.prerequisites
            ? JSON.stringify(input.prerequisites)
            : null,
          targetAudience: input.targetAudience
            ? JSON.stringify(input.targetAudience)
            : null,
          syllabus: input.syllabus ? JSON.stringify(input.syllabus) : null,
          materials: input.materials ? JSON.stringify(input.materials) : null,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          status: "DRAFT" as const,
          createdBy: user?.id,
        };

        const [newCourse] = await db
          .insert(trainingSchema.trainingCourses)
          .values(courseData)
          .returning();

        return {
          success: true,
          data: newCourse,
          message: "Course created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("training.update"))
      .input(
        z.object({
          id: z.string().min(1),
          data: createCourseSchema.partial().extend({
            status: z.enum(courseStatuses).optional(),
          }),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, data } = input;

        const updateData = {
          ...data,
          objectives: data.objectives
            ? JSON.stringify(data.objectives)
            : undefined,
          prerequisites: data.prerequisites
            ? JSON.stringify(data.prerequisites)
            : undefined,
          targetAudience: data.targetAudience
            ? JSON.stringify(data.targetAudience)
            : undefined,
          syllabus: data.syllabus ? JSON.stringify(data.syllabus) : undefined,
          materials: data.materials
            ? JSON.stringify(data.materials)
            : undefined,
          tags: data.tags ? JSON.stringify(data.tags) : undefined,
        };

        const [updatedCourse] = await db
          .update(trainingSchema.trainingCourses)
          .set(updateData)
          .where(eq(trainingSchema.trainingCourses.id, id))
          .returning();

        if (!updatedCourse) {
          throw new ORPCError("NOT_FOUND", "Course not found");
        }

        return {
          success: true,
          data: updatedCourse,
          message: "Course updated successfully",
        };
      }),

    publish: protectedProcedure
      .use(requirePermission("training.update"))
      .input(z.object({ id: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id } = input;

        const [updatedCourse] = await db
          .update(trainingSchema.trainingCourses)
          .set({ status: "PUBLISHED" })
          .where(eq(trainingSchema.trainingCourses.id, id))
          .returning();

        if (!updatedCourse) {
          throw new ORPCError("NOT_FOUND", "Course not found");
        }

        return {
          success: true,
          data: updatedCourse,
          message: "Course published successfully",
        };
      }),

    stats: protectedProcedure
      .use(requirePermission("training.read"))
      .handler(async ({ context }) => {
        const { db } = context;

        const categoryStats = await db
          .select({
            category: trainingSchema.trainingCourses.category,
            count: count(),
          })
          .from(trainingSchema.trainingCourses)
          .groupBy(trainingSchema.trainingCourses.category);

        const statusStats = await db
          .select({
            status: trainingSchema.trainingCourses.status,
            count: count(),
          })
          .from(trainingSchema.trainingCourses)
          .groupBy(trainingSchema.trainingCourses.status);

        const [totalResult] = await db
          .select({ total: count() })
          .from(trainingSchema.trainingCourses);

        return {
          success: true,
          data: {
            total: totalResult.total,
            byCategory: categoryStats,
            byStatus: statusStats,
          },
        };
      }),
  },

  // ===== SESSIONS =====
  sessions: {
    list: protectedProcedure
      .use(requirePermission("training.read"))
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          courseId: z.string().optional(),
          status: z.enum(sessionStatuses).optional(),
          upcoming: z.boolean().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { page, limit, courseId, status, upcoming } = input;
        const { db } = context;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (courseId) {
          conditions.push(
            eq(trainingSchema.trainingSessions.courseId, courseId)
          );
        }

        if (status) {
          conditions.push(eq(trainingSchema.trainingSessions.status, status));
        }

        if (upcoming) {
          conditions.push(
            gte(trainingSchema.trainingSessions.startDate, new Date())
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const [totalResult] = await db
          .select({ count: count() })
          .from(trainingSchema.trainingSessions)
          .where(whereClause);

        const sessions = await db
          .select()
          .from(trainingSchema.trainingSessions)
          .where(whereClause)
          .orderBy(asc(trainingSchema.trainingSessions.startDate))
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          data: {
            items: sessions,
            pagination: {
              page,
              limit,
              total: totalResult.count,
              pages: Math.ceil(totalResult.count / limit),
            },
          },
        };
      }),

    getById: protectedProcedure
      .use(requirePermission("training.read"))
      .input(z.object({ id: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id } = input;

        const [session] = await db
          .select()
          .from(trainingSchema.trainingSessions)
          .where(eq(trainingSchema.trainingSessions.id, id))
          .limit(1);

        if (!session) {
          throw new ORPCError("NOT_FOUND", "Session not found");
        }

        // Get registrations
        const registrations = await db
          .select()
          .from(trainingSchema.trainingRegistrations)
          .where(eq(trainingSchema.trainingRegistrations.sessionId, id))
          .orderBy(asc(trainingSchema.trainingRegistrations.createdAt));

        return {
          success: true,
          data: {
            ...session,
            registrations,
            registrationCount: registrations.length,
          },
        };
      }),

    create: protectedProcedure
      .use(requirePermission("training.create"))
      .input(createSessionSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const sessionData = {
          ...input,
          id: nanoid(),
          sessionCode: generateSessionCode(),
          organizationId: user?.organizationId || "default",
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          registrationDeadline: input.registrationDeadline
            ? new Date(input.registrationDeadline)
            : null,
          earlyBirdDeadline: input.earlyBirdDeadline
            ? new Date(input.earlyBirdDeadline)
            : null,
          status: "SCHEDULED" as const,
          createdBy: user?.id,
        };

        const [newSession] = await db
          .insert(trainingSchema.trainingSessions)
          .values(sessionData)
          .returning();

        return {
          success: true,
          data: newSession,
          message: "Session created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("training.update"))
      .input(
        z.object({
          id: z.string().min(1),
          data: createSessionSchema.partial().extend({
            status: z.enum(sessionStatuses).optional(),
          }),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, data } = input;

        const updateData = {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          registrationDeadline: data.registrationDeadline
            ? new Date(data.registrationDeadline)
            : undefined,
          earlyBirdDeadline: data.earlyBirdDeadline
            ? new Date(data.earlyBirdDeadline)
            : undefined,
        };

        const [updatedSession] = await db
          .update(trainingSchema.trainingSessions)
          .set(updateData)
          .where(eq(trainingSchema.trainingSessions.id, id))
          .returning();

        if (!updatedSession) {
          throw new ORPCError("NOT_FOUND", "Session not found");
        }

        return {
          success: true,
          data: updatedSession,
          message: "Session updated successfully",
        };
      }),

    openRegistration: protectedProcedure
      .use(requirePermission("training.update"))
      .input(z.object({ id: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id } = input;

        const [updatedSession] = await db
          .update(trainingSchema.trainingSessions)
          .set({ status: "OPEN_FOR_REGISTRATION" })
          .where(eq(trainingSchema.trainingSessions.id, id))
          .returning();

        if (!updatedSession) {
          throw new ORPCError("NOT_FOUND", "Session not found");
        }

        return {
          success: true,
          data: updatedSession,
          message: "Registration opened successfully",
        };
      }),
  },

  // ===== REGISTRATIONS =====
  registrations: {
    list: protectedProcedure
      .use(requirePermission("training.read"))
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          sessionId: z.string().optional(),
          status: z.enum(registrationStatuses).optional(),
          clientId: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { page, limit, sessionId, status, clientId } = input;
        const { db } = context;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (sessionId) {
          conditions.push(
            eq(trainingSchema.trainingRegistrations.sessionId, sessionId)
          );
        }

        if (status) {
          conditions.push(
            eq(trainingSchema.trainingRegistrations.status, status)
          );
        }

        if (clientId) {
          conditions.push(
            eq(trainingSchema.trainingRegistrations.clientId, clientId)
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const [totalResult] = await db
          .select({ count: count() })
          .from(trainingSchema.trainingRegistrations)
          .where(whereClause);

        const registrations = await db
          .select()
          .from(trainingSchema.trainingRegistrations)
          .where(whereClause)
          .orderBy(desc(trainingSchema.trainingRegistrations.createdAt))
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          data: {
            items: registrations,
            pagination: {
              page,
              limit,
              total: totalResult.count,
              pages: Math.ceil(totalResult.count / limit),
            },
          },
        };
      }),

    create: protectedProcedure
      .use(requirePermission("training.create"))
      .input(createRegistrationSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        // Check session capacity
        const [session] = await db
          .select()
          .from(trainingSchema.trainingSessions)
          .where(eq(trainingSchema.trainingSessions.id, input.sessionId))
          .limit(1);

        if (!session) {
          throw new ORPCError("NOT_FOUND", "Session not found");
        }

        const [registrationCount] = await db
          .select({ count: count() })
          .from(trainingSchema.trainingRegistrations)
          .where(
            and(
              eq(
                trainingSchema.trainingRegistrations.sessionId,
                input.sessionId
              ),
              eq(trainingSchema.trainingRegistrations.status, "CONFIRMED")
            )
          );

        const isWaitlisted =
          session.maxParticipants &&
          registrationCount.count >= session.maxParticipants;

        const registrationData = {
          ...input,
          id: nanoid(),
          registrationNumber: generateRegistrationNumber(),
          organizationId: user?.organizationId || "default",
          status: isWaitlisted
            ? ("WAITLISTED" as const)
            : ("CONFIRMED" as const),
          registeredBy: user?.id,
        };

        const [newRegistration] = await db
          .insert(trainingSchema.trainingRegistrations)
          .values(registrationData)
          .returning();

        // Update session current enrollment
        await db
          .update(trainingSchema.trainingSessions)
          .set({
            currentEnrollment: sql`COALESCE(current_enrollment, 0) + 1`,
          })
          .where(eq(trainingSchema.trainingSessions.id, input.sessionId));

        return {
          success: true,
          data: newRegistration,
          message: isWaitlisted
            ? "Added to waitlist - session is full"
            : "Registration confirmed successfully",
        };
      }),

    updateStatus: protectedProcedure
      .use(requirePermission("training.update"))
      .input(
        z.object({
          id: z.string().min(1),
          status: z.enum(registrationStatuses),
          notes: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, status, notes } = input;

        const updateData: Record<string, unknown> = { status };
        if (status === "COMPLETED") {
          updateData.completedAt = new Date();
        }
        if (notes) {
          updateData.notes = notes;
        }

        const [updatedRegistration] = await db
          .update(trainingSchema.trainingRegistrations)
          .set(updateData)
          .where(eq(trainingSchema.trainingRegistrations.id, id))
          .returning();

        if (!updatedRegistration) {
          throw new ORPCError("NOT_FOUND", "Registration not found");
        }

        return {
          success: true,
          data: updatedRegistration,
          message: "Registration status updated successfully",
        };
      }),

    markAttendance: protectedProcedure
      .use(requirePermission("training.update"))
      .input(
        z.object({
          id: z.string().min(1),
          attended: z.boolean(),
          attendanceNotes: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, attended, attendanceNotes } = input;

        const [updatedRegistration] = await db
          .update(trainingSchema.trainingRegistrations)
          .set({
            attended,
            attendanceMarkedAt: new Date(),
            status: attended ? "COMPLETED" : "NO_SHOW",
            completedAt: attended ? new Date() : null,
            notes: attendanceNotes,
          })
          .where(eq(trainingSchema.trainingRegistrations.id, id))
          .returning();

        if (!updatedRegistration) {
          throw new ORPCError("NOT_FOUND", "Registration not found");
        }

        return {
          success: true,
          data: updatedRegistration,
          message: "Attendance recorded successfully",
        };
      }),
  },

  // ===== CERTIFICATES =====
  certificates: {
    list: protectedProcedure
      .use(requirePermission("training.read"))
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          registrationId: z.string().optional(),
          status: z.enum(certificateStatuses).optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { page, limit, registrationId, status } = input;
        const { db } = context;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (registrationId) {
          conditions.push(
            eq(
              trainingSchema.trainingCertificates.registrationId,
              registrationId
            )
          );
        }

        if (status) {
          conditions.push(
            eq(trainingSchema.trainingCertificates.status, status)
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const [totalResult] = await db
          .select({ count: count() })
          .from(trainingSchema.trainingCertificates)
          .where(whereClause);

        const certificates = await db
          .select()
          .from(trainingSchema.trainingCertificates)
          .where(whereClause)
          .orderBy(desc(trainingSchema.trainingCertificates.issuedAt))
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          data: {
            items: certificates,
            pagination: {
              page,
              limit,
              total: totalResult.count,
              pages: Math.ceil(totalResult.count / limit),
            },
          },
        };
      }),

    issue: protectedProcedure
      .use(requirePermission("training.create"))
      .input(
        z.object({
          registrationId: z.string().min(1),
          courseId: z.string().min(1),
          sessionId: z.string().min(1),
          recipientName: z.string().min(1),
          recipientEmail: z.string().email().optional(),
          grade: z.string().optional(),
          score: z.number().optional(),
          cpdPoints: z.number().optional(),
          validUntil: z.string().datetime().optional(),
          notes: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const certificateData = {
          ...input,
          id: nanoid(),
          certificateNumber: generateCertificateNumber(),
          organizationId: user?.organizationId || "default",
          status: "ISSUED" as const,
          issuedAt: new Date(),
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          issuedBy: user?.id,
        };

        const [newCertificate] = await db
          .insert(trainingSchema.trainingCertificates)
          .values(certificateData)
          .returning();

        // Update registration with certificate ID
        await db
          .update(trainingSchema.trainingRegistrations)
          .set({ certificateId: newCertificate.id })
          .where(
            eq(trainingSchema.trainingRegistrations.id, input.registrationId)
          );

        return {
          success: true,
          data: newCertificate,
          message: "Certificate issued successfully",
        };
      }),

    verify: protectedProcedure
      .input(z.object({ certificateNumber: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { certificateNumber } = input;

        const [certificate] = await db
          .select()
          .from(trainingSchema.trainingCertificates)
          .where(
            eq(
              trainingSchema.trainingCertificates.certificateNumber,
              certificateNumber
            )
          )
          .limit(1);

        if (!certificate) {
          return {
            success: false,
            data: null,
            message: "Certificate not found",
          };
        }

        const isValid =
          certificate.status === "ISSUED" &&
          (!certificate.validUntil ||
            new Date(certificate.validUntil) > new Date());

        return {
          success: true,
          data: {
            ...certificate,
            isValid,
          },
          message: isValid
            ? "Certificate is valid"
            : "Certificate is invalid or expired",
        };
      }),
  },

  // ===== INSTRUCTORS =====
  instructors: {
    list: protectedProcedure
      .use(requirePermission("training.read"))
      .input(
        z.object({
          search: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { search, isActive } = input;
        const { db } = context;

        const conditions = [];

        if (search) {
          conditions.push(
            sql`(
              ${ilike(trainingSchema.trainingInstructors.name, `%${search}%`)} OR
              ${ilike(trainingSchema.trainingInstructors.email, `%${search}%`)}
            )`
          );
        }

        if (isActive !== undefined) {
          conditions.push(
            eq(trainingSchema.trainingInstructors.isActive, isActive)
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const instructors = await db
          .select()
          .from(trainingSchema.trainingInstructors)
          .where(whereClause)
          .orderBy(asc(trainingSchema.trainingInstructors.name));

        return { success: true, data: instructors };
      }),

    create: protectedProcedure
      .use(requirePermission("training.create"))
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          bio: z.string().optional(),
          qualifications: z.array(z.string()).optional(),
          specializations: z.array(z.string()).optional(),
          hourlyRate: z.string().optional(),
          currency: z.string().default("GYD"),
          userId: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const instructorData = {
          ...input,
          id: nanoid(),
          organizationId: user?.organizationId || "default",
          qualifications: input.qualifications
            ? JSON.stringify(input.qualifications)
            : null,
          specializations: input.specializations
            ? JSON.stringify(input.specializations)
            : null,
          createdBy: user?.id,
        };

        const [newInstructor] = await db
          .insert(trainingSchema.trainingInstructors)
          .values(instructorData)
          .returning();

        return {
          success: true,
          data: newInstructor,
          message: "Instructor created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("training.update"))
      .input(
        z.object({
          id: z.string().min(1),
          data: z.object({
            name: z.string().min(1).optional(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
            bio: z.string().optional(),
            qualifications: z.array(z.string()).optional(),
            specializations: z.array(z.string()).optional(),
            hourlyRate: z.string().optional(),
            isActive: z.boolean().optional(),
          }),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, data } = input;

        const updateData = {
          ...data,
          qualifications: data.qualifications
            ? JSON.stringify(data.qualifications)
            : undefined,
          specializations: data.specializations
            ? JSON.stringify(data.specializations)
            : undefined,
        };

        const [updatedInstructor] = await db
          .update(trainingSchema.trainingInstructors)
          .set(updateData)
          .where(eq(trainingSchema.trainingInstructors.id, id))
          .returning();

        if (!updatedInstructor) {
          throw new ORPCError("NOT_FOUND", "Instructor not found");
        }

        return {
          success: true,
          data: updatedInstructor,
          message: "Instructor updated successfully",
        };
      }),
  },
};
