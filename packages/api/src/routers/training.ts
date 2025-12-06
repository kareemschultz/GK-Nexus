import { trainingSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, gte, ilike, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure } from "../index";

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

// ========================================
// COURSES (FLAT PROCEDURES)
// ========================================

export const trainingCoursesList = protectedProcedure
  // .use(requirePermission("training.read"))
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
          ${ilike(trainingSchema.trainingCourses.title, `%${search}%`)} OR
          ${ilike(trainingSchema.trainingCourses.courseCode, `%${search}%`)} OR
          ${ilike(trainingSchema.trainingCourses.fullDescription, `%${search}%`)}
        )`
      );
    }

    if (category) {
      conditions.push(
        eq(trainingSchema.trainingCourses.category, category as never)
      );
    }

    if (deliveryMode) {
      conditions.push(
        eq(trainingSchema.trainingCourses.deliveryMode, deliveryMode as never)
      );
    }

    if (status) {
      conditions.push(
        eq(trainingSchema.trainingCourses.status, status as never)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(trainingSchema.trainingCourses)
      .where(whereClause);

    const sortColumn =
      (trainingSchema.trainingCourses as never)[sortBy] ||
      trainingSchema.trainingCourses.createdAt;
    const orderClause =
      sortOrder === "asc"
        ? asc(sortColumn as never)
        : desc(sortColumn as never);

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
          total: totalResult?.count ?? 0,
          pages: Math.ceil((totalResult?.count ?? 0) / limit),
        },
      },
    };
  });

export const trainingCoursesGetById = protectedProcedure
  // .use(requirePermission("training.read"))
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
      throw new ORPCError("NOT_FOUND", { message: "Course not found" });
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
  });

export const trainingCoursesCreate = protectedProcedure
  // .use(requirePermission("training.create"))
  .input(createCourseSchema)
  .handler(async ({ input, context }) => {
    const { db, user } = context;

    // Map input to schema columns
    const courseData = {
      id: nanoid(),
      courseCode: generateCourseCode(),
      organizationId: "default", // No organizationId in User type
      title: input.name,
      fullDescription: input.description || null,
      shortDescription: input.shortDescription || null,
      category: input.category,
      deliveryMode: input.deliveryMode,
      durationHours: input.durationHours.toString(),
      maxParticipants: input.maxParticipants || null,
      minParticipants: input.minParticipants || null,
      price: input.price || null,
      currency: input.currency,
      learningObjectives: input.objectives || null,
      prerequisites: input.prerequisites
        ? input.prerequisites.join(", ")
        : null,
      targetAudience: input.targetAudience
        ? input.targetAudience.join(", ")
        : null,
      syllabus: input.syllabus || null,
      materials: input.materials || null,
      certificateAwarded: input.certificateOffered,
      cpdPoints: input.cpdPoints || null,
      defaultInstructorId: input.instructorId || null,
      tags: input.tags || null,
      status: "DRAFT" as const,
      createdBy: user?.id || null,
    };

    const [newCourse] = await db
      .insert(trainingSchema.trainingCourses)
      .values(courseData as never)
      .returning();

    return {
      success: true,
      data: newCourse,
      message: "Course created successfully",
    };
  });

export const trainingCoursesUpdate = protectedProcedure
  // .use(requirePermission("training.update"))
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

    // Map input to schema columns with proper typing
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.title = data.name;
    if (data.description !== undefined)
      updateData.fullDescription = data.description;
    if (data.shortDescription !== undefined)
      updateData.shortDescription = data.shortDescription;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.deliveryMode !== undefined)
      updateData.deliveryMode = data.deliveryMode;
    if (data.durationHours !== undefined)
      updateData.durationHours = data.durationHours.toString();
    if (data.maxParticipants !== undefined)
      updateData.maxParticipants = data.maxParticipants;
    if (data.minParticipants !== undefined)
      updateData.minParticipants = data.minParticipants;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.objectives !== undefined)
      updateData.learningObjectives = data.objectives;
    if (data.prerequisites !== undefined)
      updateData.prerequisites = data.prerequisites.join(", ");
    if (data.targetAudience !== undefined)
      updateData.targetAudience = data.targetAudience.join(", ");
    if (data.syllabus !== undefined) updateData.syllabus = data.syllabus;
    if (data.materials !== undefined) updateData.materials = data.materials;
    if (data.certificateOffered !== undefined)
      updateData.certificateAwarded = data.certificateOffered;
    if (data.cpdPoints !== undefined) updateData.cpdPoints = data.cpdPoints;
    if (data.instructorId !== undefined)
      updateData.defaultInstructorId = data.instructorId;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.status !== undefined) updateData.status = data.status;

    const [updatedCourse] = await db
      .update(trainingSchema.trainingCourses)
      .set(updateData)
      .where(eq(trainingSchema.trainingCourses.id, id))
      .returning();

    if (!updatedCourse) {
      throw new ORPCError("NOT_FOUND", { message: "Course not found" });
    }

    return {
      success: true,
      data: updatedCourse,
      message: "Course updated successfully",
    };
  });

export const trainingCoursesPublish = protectedProcedure
  // .use(requirePermission("training.update"))
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
      throw new ORPCError("NOT_FOUND", { message: "Course not found" });
    }

    return {
      success: true,
      data: updatedCourse,
      message: "Course published successfully",
    };
  });

export const trainingCoursesStats = protectedProcedure
  // .use(requirePermission("training.read"))
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
        total: totalResult?.total ?? 0,
        byCategory: categoryStats,
        byStatus: statusStats,
      },
    };
  });

// ========================================
// SESSIONS (FLAT PROCEDURES)
// ========================================

export const trainingSessionsList = protectedProcedure
  // .use(requirePermission("training.read"))
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
      conditions.push(eq(trainingSchema.trainingSessions.courseId, courseId));
    }

    if (status) {
      conditions.push(
        eq(trainingSchema.trainingSessions.status, status as never)
      );
    }

    if (upcoming) {
      conditions.push(
        gte(trainingSchema.trainingSessions.startDate, new Date())
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
          total: totalResult?.count ?? 0,
          pages: Math.ceil((totalResult?.count ?? 0) / limit),
        },
      },
    };
  });

export const trainingSessionsGetById = protectedProcedure
  // .use(requirePermission("training.read"))
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
      throw new ORPCError("NOT_FOUND", { message: "Session not found" });
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
  });

export const trainingSessionsCreate = protectedProcedure
  // .use(requirePermission("training.create"))
  .input(createSessionSchema)
  .handler(async ({ input, context }) => {
    const { db, user } = context;

    // Map input to schema columns
    const sessionData = {
      id: nanoid(),
      sessionCode: generateSessionCode(),
      organizationId: "default", // No organizationId in User type
      courseId: input.courseId,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      deliveryMode: "IN_PERSON" as const, // Default, should come from course
      registrationCloses: input.registrationDeadline
        ? new Date(input.registrationDeadline)
        : null,
      earlyBirdDeadline: input.earlyBirdDeadline
        ? new Date(input.earlyBirdDeadline)
        : null,
      maxParticipants: input.maxParticipants || null,
      venueName: input.venue || null,
      venueAddress: input.venueAddress || null,
      virtualMeetingUrl: input.onlineLink || null,
      virtualPlatform: input.onlinePlatform || null,
      instructorId: input.instructorId || null,
      priceOverride: input.price || null,
      publicNotes: input.notes || null,
      status: "SCHEDULED" as const,
      createdBy: user?.id || null,
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
  });

export const trainingSessionsUpdate = protectedProcedure
  // .use(requirePermission("training.update"))
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

    // Map input to schema columns with proper typing
    const updateData: Record<string, unknown> = {};

    if (data.courseId !== undefined) updateData.courseId = data.courseId;
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.registrationDeadline !== undefined)
      updateData.registrationCloses = new Date(data.registrationDeadline);
    if (data.earlyBirdDeadline !== undefined)
      updateData.earlyBirdDeadline = new Date(data.earlyBirdDeadline);
    if (data.maxParticipants !== undefined)
      updateData.maxParticipants = data.maxParticipants;
    if (data.venue !== undefined) updateData.venueName = data.venue;
    if (data.venueAddress !== undefined)
      updateData.venueAddress = data.venueAddress;
    if (data.onlineLink !== undefined)
      updateData.virtualMeetingUrl = data.onlineLink;
    if (data.onlinePlatform !== undefined)
      updateData.virtualPlatform = data.onlinePlatform;
    if (data.instructorId !== undefined)
      updateData.instructorId = data.instructorId;
    if (data.price !== undefined) updateData.priceOverride = data.price;
    if (data.notes !== undefined) updateData.publicNotes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;

    const [updatedSession] = await db
      .update(trainingSchema.trainingSessions)
      .set(updateData)
      .where(eq(trainingSchema.trainingSessions.id, id))
      .returning();

    if (!updatedSession) {
      throw new ORPCError("NOT_FOUND", { message: "Session not found" });
    }

    return {
      success: true,
      data: updatedSession,
      message: "Session updated successfully",
    };
  });

export const trainingSessionsOpenRegistration = protectedProcedure
  // .use(requirePermission("training.update"))
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { id } = input;

    const [updatedSession] = await db
      .update(trainingSchema.trainingSessions)
      .set({ status: "SCHEDULED", isRegistrationOpen: true })
      .where(eq(trainingSchema.trainingSessions.id, id))
      .returning();

    if (!updatedSession) {
      throw new ORPCError("NOT_FOUND", { message: "Session not found" });
    }

    return {
      success: true,
      data: updatedSession,
      message: "Registration opened successfully",
    };
  });

// ========================================
// REGISTRATIONS (FLAT PROCEDURES)
// ========================================

export const trainingRegistrationsList = protectedProcedure
  // .use(requirePermission("training.read"))
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
      conditions.push(eq(trainingSchema.trainingRegistrations.status, status));
    }

    if (clientId) {
      conditions.push(
        eq(trainingSchema.trainingRegistrations.clientId, clientId)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
          total: totalResult?.count ?? 0,
          pages: Math.ceil((totalResult?.count ?? 0) / limit),
        },
      },
    };
  });

export const trainingRegistrationsCreate = protectedProcedure
  // .use(requirePermission("training.create"))
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
      throw new ORPCError("NOT_FOUND", { message: "Session not found" });
    }

    const [registrationCount] = await db
      .select({ count: count() })
      .from(trainingSchema.trainingRegistrations)
      .where(
        and(
          eq(trainingSchema.trainingRegistrations.sessionId, input.sessionId),
          eq(trainingSchema.trainingRegistrations.status, "CONFIRMED")
        )
      );

    const isWaitlisted =
      session.maxParticipants &&
      (registrationCount?.count ?? 0) >= session.maxParticipants;

    const registrationData = {
      id: nanoid(),
      organizationId: "default", // No organizationId in User type
      sessionId: input.sessionId,
      clientId: input.clientId || null,
      registrationNumber: generateRegistrationNumber(),
      participantName: input.participantName,
      participantEmail: input.participantEmail,
      participantPhone: input.participantPhone || null,
      participantOrganization: input.participantOrganization || null,
      participantTitle: input.participantJobTitle || null,
      dietaryRequirements: input.dietaryRequirements || null,
      specialRequests: input.specialNeeds || null,
      amountDue: input.paymentAmount || "0",
      status: isWaitlisted ? ("WAITLISTED" as const) : ("CONFIRMED" as const),
      registeredBy: user?.id || null,
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
  });

export const trainingRegistrationsUpdateStatus = protectedProcedure
  // .use(requirePermission("training.update"))
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
      throw new ORPCError("NOT_FOUND", { message: "Registration not found" });
    }

    return {
      success: true,
      data: updatedRegistration,
      message: "Registration status updated successfully",
    };
  });

export const trainingRegistrationsMarkAttendance = protectedProcedure
  // .use(requirePermission("training.update"))
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
        attendanceStatus: attended ? "present" : "absent",
        checkInTime: attended ? new Date() : null,
        status: attended ? "COMPLETED" : "NO_SHOW",
        notes: attendanceNotes || null,
      })
      .where(eq(trainingSchema.trainingRegistrations.id, id))
      .returning();

    if (!updatedRegistration) {
      throw new ORPCError("NOT_FOUND", { message: "Registration not found" });
    }

    return {
      success: true,
      data: updatedRegistration,
      message: "Attendance recorded successfully",
    };
  });

// ========================================
// CERTIFICATES (FLAT PROCEDURES)
// ========================================

export const trainingCertificatesList = protectedProcedure
  // .use(requirePermission("training.read"))
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
        eq(trainingSchema.trainingCertificates.registrationId, registrationId)
      );
    }

    if (status) {
      conditions.push(eq(trainingSchema.trainingCertificates.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(trainingSchema.trainingCertificates)
      .where(whereClause);

    const certificates = await db
      .select()
      .from(trainingSchema.trainingCertificates)
      .where(whereClause)
      .orderBy(desc(trainingSchema.trainingCertificates.issueDate))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        items: certificates,
        pagination: {
          page,
          limit,
          total: totalResult?.count ?? 0,
          pages: Math.ceil((totalResult?.count ?? 0) / limit),
        },
      },
    };
  });

export const trainingCertificatesIssue = protectedProcedure
  // .use(requirePermission("training.create"))
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
      id: nanoid(),
      organizationId: "default", // No organizationId in User type
      registrationId: input.registrationId,
      courseId: input.courseId,
      sessionId: input.sessionId,
      certificateNumber: generateCertificateNumber(),
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail || null,
      courseTitle: "Training Course", // Should be fetched from course
      completionDate: new Date(),
      issueDate: new Date(),
      expiryDate: input.validUntil ? new Date(input.validUntil) : null,
      finalScore: input.score?.toString() || null,
      grade: input.grade || null,
      cpdPoints: input.cpdPoints || null,
      status: "ISSUED" as const,
      issuedBy: user?.id || null,
    };

    const [newCertificate] = await db
      .insert(trainingSchema.trainingCertificates)
      .values(certificateData)
      .returning();

    if (!newCertificate) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to issue certificate",
      });
    }

    // Update registration with certificate ID
    await db
      .update(trainingSchema.trainingRegistrations)
      .set({
        certificateId: newCertificate.id,
        certificateIssued: true,
        certificateIssuedDate: new Date(),
      })
      .where(eq(trainingSchema.trainingRegistrations.id, input.registrationId));

    return {
      success: true,
      data: newCertificate,
      message: "Certificate issued successfully",
    };
  });

export const trainingCertificatesVerify = protectedProcedure
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
      (!certificate.expiryDate ||
        new Date(certificate.expiryDate) > new Date());

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
  });

// ========================================
// INSTRUCTORS (FLAT PROCEDURES)
// ========================================

export const trainingInstructorsList = protectedProcedure
  // .use(requirePermission("training.read"))
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
          ${ilike(trainingSchema.trainingInstructors.firstName, `%${search}%`)} OR
          ${ilike(trainingSchema.trainingInstructors.lastName, `%${search}%`)} OR
          ${ilike(trainingSchema.trainingInstructors.email, `%${search}%`)}
        )`
      );
    }

    if (isActive !== undefined) {
      conditions.push(
        eq(trainingSchema.trainingInstructors.isActive, isActive)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const instructors = await db
      .select()
      .from(trainingSchema.trainingInstructors)
      .where(whereClause)
      .orderBy(asc(trainingSchema.trainingInstructors.firstName));

    return { success: true, data: instructors };
  });

export const trainingInstructorsCreate = protectedProcedure
  // .use(requirePermission("training.create"))
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

    // Split name into first and last
    const nameParts = input.name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const instructorData = {
      id: nanoid(),
      organizationId: "default", // No organizationId in User type
      userId: input.userId || null,
      firstName,
      lastName,
      email: input.email || `instructor-${nanoid()}@temp.com`,
      phone: input.phone || null,
      biography: input.bio || null,
      qualifications: input.qualifications || null,
      specializations: input.specializations || null,
      hourlyRate: input.hourlyRate || null,
      currency: input.currency,
      createdBy: user?.id || null,
    };

    const [newInstructor] = await db
      .insert(trainingSchema.trainingInstructors)
      .values(instructorData as never)
      .returning();

    return {
      success: true,
      data: newInstructor,
      message: "Instructor created successfully",
    };
  });

export const trainingInstructorsUpdate = protectedProcedure
  // .use(requirePermission("training.update"))
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

    // Map input to schema columns with proper typing
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      const nameParts = data.name.trim().split(" ");
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(" ") || nameParts[0];
    }
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.bio !== undefined) updateData.biography = data.bio;
    if (data.qualifications !== undefined)
      updateData.qualifications = data.qualifications;
    if (data.specializations !== undefined)
      updateData.specializations = data.specializations;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedInstructor] = await db
      .update(trainingSchema.trainingInstructors)
      .set(updateData)
      .where(eq(trainingSchema.trainingInstructors.id, id))
      .returning();

    if (!updatedInstructor) {
      throw new ORPCError("NOT_FOUND", { message: "Instructor not found" });
    }

    return {
      success: true,
      data: updatedInstructor,
      message: "Instructor updated successfully",
    };
  });
