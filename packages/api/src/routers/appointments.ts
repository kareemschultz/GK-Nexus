import { authSchema, businessSchema, db } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  requirePermission,
} from "../index";

const { appointment } = businessSchema;
const { user } = authSchema;

// Input schemas
const createAppointmentSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
  scheduledDate: z.string().datetime(),
  duration: z.number().min(15).max(480).default(60), // Duration in minutes
  location: z.string().max(255).optional(),
  meetingLink: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  id: z.string().uuid(),
  status: z
    .enum([
      "SCHEDULED",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ])
    .optional(),
});

const appointmentQuerySchema = z.object({
  clientId: z.string().uuid().optional(),
  status: z
    .enum([
      "SCHEDULED",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ])
    .optional(),
  staffId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z
    .enum(["scheduledDate", "createdAt", "status"])
    .default("scheduledDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const rescheduleSchema = z.object({
  appointmentId: z.string().uuid(),
  newScheduledDate: z.string().datetime(),
  newDuration: z.number().min(15).max(480).optional(),
  reason: z.string().max(500).optional(),
});

// ============================================================================
// FLAT APPOINTMENT PROCEDURES
// ============================================================================

// Create new appointment
export const appointmentCreate = protectedProcedure
  .use(requirePermission("appointments.create"))
  .input(createAppointmentSchema)
  .handler(async ({ input, context }) => {
    const user = context.user;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    // Validate scheduled date is not in the past
    const scheduledDate = new Date(input.scheduledDate);
    if (scheduledDate < new Date()) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Cannot schedule appointments in the past",
      });
    }

    try {
      const [newAppointment] = await db
        .insert(appointment)
        .values({
          clientId: input.clientId,
          staffId: user.id,
          title: input.title,
          description: input.description || null,
          scheduledDate: new Date(input.scheduledDate),
          duration: input.duration,
          location: input.location || null,
          meetingLink: input.meetingLink || null,
          notes: input.notes || null,
          status: "SCHEDULED",
          createdBy: user.id,
        })
        .returning();

      return {
        success: true,
        data: newAppointment,
        message: "Appointment created successfully",
      };
    } catch (_error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create appointment",
      });
    }
  });

// Create external appointment (public endpoint for client portal)
export const appointmentCreateExternal = publicProcedure
  .input(
    z.object({
      clientId: z.string().uuid(),
      title: z.string().min(1, "Title is required").max(255),
      description: z.string().max(1000).optional(),
      scheduledDate: z.string().datetime(),
      duration: z.number().min(15).max(480).default(60),
      location: z.string().max(255).optional(),
      notes: z.string().max(2000).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    // Validate scheduled date
    const scheduledDate = new Date(input.scheduledDate);
    if (scheduledDate < new Date()) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Cannot schedule appointments in the past",
      });
    }

    // Check if it's within business hours (9 AM - 5 PM, Monday-Friday)
    const dayOfWeek = scheduledDate.getDay();
    const hour = scheduledDate.getHours();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Appointments only available Monday through Friday",
      });
    }

    if (hour < 9 || hour >= 17) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Appointments only available between 9 AM and 5 PM",
      });
    }

    try {
      // Get a default staff member for assignment
      const [defaultStaff] = await context.db.select().from(user).limit(1);

      if (!defaultStaff) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "No staff available for appointment",
        });
      }

      const [newAppointment] = await context.db
        .insert(appointment)
        .values({
          clientId: input.clientId,
          staffId: defaultStaff.id,
          title: input.title,
          description: input.description || null,
          scheduledDate: new Date(input.scheduledDate),
          duration: input.duration,
          location: input.location || null,
          notes: input.notes || null,
          status: "SCHEDULED",
          createdBy: defaultStaff.id,
        })
        .returning();

      return {
        success: true,
        data: newAppointment,
        message:
          "Appointment request submitted successfully. We will contact you to confirm.",
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create appointment",
      });
    }
  });

// List appointments with filtering
export const appointmentList = protectedProcedure
  .use(requirePermission("appointments.read"))
  .input(appointmentQuerySchema)
  .handler(async ({ input, context }) => {
    const {
      page,
      limit,
      clientId,
      status,
      staffId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = input;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (clientId) {
      conditions.push(eq(appointment.clientId, clientId));
    }

    if (status) {
      conditions.push(eq(appointment.status, status));
    }

    if (staffId) {
      conditions.push(eq(appointment.staffId, staffId));
    }

    if (startDate) {
      conditions.push(gte(appointment.scheduledDate, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(appointment.scheduledDate, new Date(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await context.db
      .select({ count: count() })
      .from(appointment)
      .where(whereClause);

    const sortColumnMap = {
      scheduledDate: appointment.scheduledDate,
      createdAt: appointment.createdAt,
      status: appointment.status,
    };
    const sortColumn = sortColumnMap[sortBy as keyof typeof sortColumnMap];
    const orderClause =
      sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    const appointments = await context.db
      .select()
      .from(appointment)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    const total = totalResult?.count ?? 0;
    const pages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        items: appointments,
        pagination: {
          page,
          limit,
          total,
          pages,
        },
      },
    };
  });

// Get appointment by ID
export const appointmentGetById = protectedProcedure
  .use(requirePermission("appointments.read"))
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const [appt] = await context.db
      .select()
      .from(appointment)
      .where(eq(appointment.id, input.id))
      .limit(1);

    if (!appt) {
      throw new ORPCError("NOT_FOUND", { message: "Appointment not found" });
    }

    return {
      success: true,
      data: appt,
    };
  });

// Update appointment
export const appointmentUpdate = protectedProcedure
  .use(requirePermission("appointments.update"))
  .input(updateAppointmentSchema)
  .handler(async ({ input, context }) => {
    const { id, ...updateData } = input;

    // Check if appointment exists
    const [existing] = await context.db
      .select()
      .from(appointment)
      .where(eq(appointment.id, id))
      .limit(1);

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Appointment not found" });
    }

    // Validate scheduled date if being updated
    if (updateData.scheduledDate) {
      const scheduledDate = new Date(updateData.scheduledDate);
      if (scheduledDate < new Date()) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cannot schedule appointments in the past",
        });
      }
    }

    try {
      const [updatedAppointment] = await context.db
        .update(appointment)
        .set({
          ...updateData,
          scheduledDate: updateData.scheduledDate
            ? new Date(updateData.scheduledDate)
            : undefined,
        })
        .where(eq(appointment.id, id))
        .returning();

      return {
        success: true,
        data: updatedAppointment,
        message: "Appointment updated successfully",
      };
    } catch (_error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update appointment",
      });
    }
  });

// Cancel appointment
export const appointmentCancel = protectedProcedure
  .use(requirePermission("appointments.update"))
  .input(
    z.object({
      id: z.string().uuid(),
      reason: z.string().max(500).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    try {
      const [cancelledAppointment] = await context.db
        .update(appointment)
        .set({
          status: "CANCELLED",
          notes: input.reason
            ? `Cancelled: ${input.reason}`
            : "Cancelled by user",
        })
        .where(eq(appointment.id, input.id))
        .returning();

      if (!cancelledAppointment) {
        throw new ORPCError("NOT_FOUND", { message: "Appointment not found" });
      }

      return {
        success: true,
        data: cancelledAppointment,
        message: "Appointment cancelled successfully",
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to cancel appointment",
      });
    }
  });

// Reschedule appointment
export const appointmentReschedule = protectedProcedure
  .use(requirePermission("appointments.update"))
  .input(rescheduleSchema)
  .handler(async ({ input, context }) => {
    const { appointmentId, newScheduledDate, newDuration, reason } = input;

    // Validate new scheduled date
    const scheduledDate = new Date(newScheduledDate);
    if (scheduledDate < new Date()) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Cannot reschedule to past time",
      });
    }

    try {
      const updateData: Record<string, unknown> = {
        scheduledDate: new Date(newScheduledDate),
        notes: reason ? `Rescheduled: ${reason}` : "Rescheduled",
      };

      if (newDuration) {
        updateData.duration = newDuration;
      }

      const [rescheduledAppointment] = await context.db
        .update(appointment)
        .set(updateData)
        .where(eq(appointment.id, appointmentId))
        .returning();

      if (!rescheduledAppointment) {
        throw new ORPCError("NOT_FOUND", { message: "Appointment not found" });
      }

      return {
        success: true,
        data: rescheduledAppointment,
        message: "Appointment rescheduled successfully",
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to reschedule appointment",
      });
    }
  });

// Check availability for scheduling
export const appointmentCheckAvailability = protectedProcedure
  .use(requirePermission("appointments.read"))
  .input(
    z.object({
      staffId: z.string().uuid().optional(),
      date: z.string().date(),
      duration: z.number().min(15).max(480).default(60),
    })
  )
  .handler(async ({ input, context }) => {
    const { staffId, date, duration } = input;

    const startOfDay = new Date(`${date}T09:00:00.000Z`);
    const endOfDay = new Date(`${date}T17:00:00.000Z`);

    // Build query conditions
    const conditions = [
      gte(appointment.scheduledDate, startOfDay),
      lte(appointment.scheduledDate, endOfDay),
      eq(appointment.status, "SCHEDULED"),
    ];

    if (staffId) {
      conditions.push(eq(appointment.staffId, staffId));
    }

    const existingAppointments = await context.db
      .select({
        scheduledDate: appointment.scheduledDate,
        duration: appointment.duration,
      })
      .from(appointment)
      .where(and(...conditions))
      .orderBy(asc(appointment.scheduledDate));

    // Calculate available time slots
    const availableSlots = [];
    const workStart = startOfDay.getTime();
    const workEnd = endOfDay.getTime();
    const slotDuration = duration * 60 * 1000;

    let currentTime = workStart;

    for (const appt of existingAppointments) {
      const appointmentStart = new Date(appt.scheduledDate).getTime();
      const appointmentEnd =
        appointmentStart + (appt.duration || 60) * 60 * 1000;

      // Check if there's a gap before this appointment
      if (currentTime + slotDuration <= appointmentStart) {
        while (currentTime + slotDuration <= appointmentStart) {
          availableSlots.push({
            startTime: new Date(currentTime).toISOString(),
            endTime: new Date(currentTime + slotDuration).toISOString(),
          });
          currentTime += 30 * 60 * 1000; // 30-minute intervals
        }
      }
      currentTime = Math.max(currentTime, appointmentEnd);
    }

    // Check remaining time after last appointment
    while (currentTime + slotDuration <= workEnd) {
      availableSlots.push({
        startTime: new Date(currentTime).toISOString(),
        endTime: new Date(currentTime + slotDuration).toISOString(),
      });
      currentTime += 30 * 60 * 1000;
    }

    return {
      success: true,
      data: {
        date,
        duration,
        staffId,
        availableSlots,
      },
    };
  });

// Get appointment statistics
export const appointmentGetStats = adminProcedure
  .input(
    z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { startDate, endDate } = input;

    const conditions = [];
    if (startDate) {
      conditions.push(gte(appointment.scheduledDate, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(appointment.scheduledDate, new Date(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalStats] = await context.db
      .select({
        total: count(),
        scheduled: sql<number>`COUNT(*) FILTER (WHERE status = 'SCHEDULED')`,
        completed: sql<number>`COUNT(*) FILTER (WHERE status = 'COMPLETED')`,
        cancelled: sql<number>`COUNT(*) FILTER (WHERE status = 'CANCELLED')`,
        noShow: sql<number>`COUNT(*) FILTER (WHERE status = 'NO_SHOW')`,
      })
      .from(appointment)
      .where(whereClause);

    return {
      success: true,
      data: {
        overview: totalStats,
      },
    };
  });
