import { businessSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  requirePermission,
} from "../index";

// Input schemas
const createAppointmentSchema = z.object({
  clientId: z.string().uuid().optional(), // Optional for external bookings
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.enum([
    "CONSULTATION",
    "DOCUMENT_REVIEW",
    "TAX_PREPARATION",
    "COMPLIANCE_MEETING",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  location: z.string().max(500).optional(),
  isVirtual: z.boolean().default(false),
  meetingLink: z.string().url().optional(),
  // External booking fields
  externalClientName: z.string().min(1).max(255).optional(),
  externalClientEmail: z.string().email().optional(),
  externalClientPhone: z.string().max(50).optional(),
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
  cancelReason: z.string().max(500).optional(),
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
  type: z
    .enum([
      "CONSULTATION",
      "DOCUMENT_REVIEW",
      "TAX_PREPARATION",
      "COMPLIANCE_MEETING",
      "OTHER",
    ])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  assignedTo: z.string().uuid().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z
    .enum(["startTime", "endTime", "createdAt", "status", "priority"])
    .default("startTime"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const availabilityQuerySchema = z.object({
  assignedTo: z.string().uuid().optional(),
  date: z.string().date(),
  duration: z.number().min(15).max(480).default(60), // Duration in minutes
});

const rescheduleSchema = z.object({
  appointmentId: z.string().uuid(),
  newStartTime: z.string().datetime(),
  newEndTime: z.string().datetime(),
  reason: z.string().max(500).optional(),
});

export const appointmentsRouter = {
  // Create new appointment (both internal and external)
  create: protectedProcedure
    .use(requirePermission("appointments.create"))
    .input(createAppointmentSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      // Validate time slots
      const startTime = new Date(input.startTime);
      const endTime = new Date(input.endTime);

      if (startTime >= endTime) {
        throw new ORPCError("BAD_REQUEST", "End time must be after start time");
      }

      if (startTime < new Date()) {
        throw new ORPCError(
          "BAD_REQUEST",
          "Cannot schedule appointments in the past"
        );
      }

      // Check for conflicts if assigned to someone
      const assignedTo = user?.id; // Default to current user
      if (assignedTo) {
        const conflicts = await db
          .select({ id: businessSchema.appointment.id })
          .from(businessSchema.appointment)
          .where(
            and(
              eq(businessSchema.appointment.assignedTo, assignedTo),
              eq(businessSchema.appointment.status, "SCHEDULED"),
              sql`(
                (${businessSchema.appointment.startTime} <= ${input.startTime} AND ${businessSchema.appointment.endTime} > ${input.startTime}) OR
                (${businessSchema.appointment.startTime} < ${input.endTime} AND ${businessSchema.appointment.endTime} >= ${input.endTime}) OR
                (${businessSchema.appointment.startTime} >= ${input.startTime} AND ${businessSchema.appointment.endTime} <= ${input.endTime})
              )`
            )
          )
          .limit(1);

        if (conflicts.length > 0) {
          throw new ORPCError(
            "CONFLICT",
            "Time slot conflicts with existing appointment"
          );
        }
      }

      try {
        const [appointment] = await db
          .insert(businessSchema.appointment)
          .values({
            ...input,
            assignedTo,
            createdBy: user?.id!,
            status: "SCHEDULED",
          })
          .returning({
            id: businessSchema.appointment.id,
            title: businessSchema.appointment.title,
            startTime: businessSchema.appointment.startTime,
            endTime: businessSchema.appointment.endTime,
            type: businessSchema.appointment.type,
            status: businessSchema.appointment.status,
            createdAt: businessSchema.appointment.createdAt,
          });

        return {
          success: true,
          data: appointment,
          message: "Appointment created successfully",
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to create appointment"
        );
      }
    }),

  // Create external appointment (public endpoint for client portal)
  createExternal: publicProcedure
    .input(
      createAppointmentSchema.omit({ clientId: true }).extend({
        externalClientName: z.string().min(1, "Name is required"),
        externalClientEmail: z.string().email("Valid email is required"),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      // Validate time slots
      const startTime = new Date(input.startTime);
      const endTime = new Date(input.endTime);

      if (startTime >= endTime) {
        throw new ORPCError("BAD_REQUEST", "End time must be after start time");
      }

      if (startTime < new Date()) {
        throw new ORPCError(
          "BAD_REQUEST",
          "Cannot schedule appointments in the past"
        );
      }

      // Check if it's within business hours (9 AM - 5 PM, Monday-Friday)
      const dayOfWeek = startTime.getDay();
      const hour = startTime.getHours();

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw new ORPCError(
          "BAD_REQUEST",
          "Appointments only available Monday through Friday"
        );
      }

      if (hour < 9 || hour >= 17) {
        throw new ORPCError(
          "BAD_REQUEST",
          "Appointments only available between 9 AM and 5 PM"
        );
      }

      try {
        const [appointment] = await db
          .insert(businessSchema.appointment)
          .values({
            ...input,
            status: "SCHEDULED",
            // Will be assigned later by staff
          })
          .returning({
            id: businessSchema.appointment.id,
            title: businessSchema.appointment.title,
            startTime: businessSchema.appointment.startTime,
            endTime: businessSchema.appointment.endTime,
            type: businessSchema.appointment.type,
            status: businessSchema.appointment.status,
            externalClientName: businessSchema.appointment.externalClientName,
            externalClientEmail: businessSchema.appointment.externalClientEmail,
            createdAt: businessSchema.appointment.createdAt,
          });

        return {
          success: true,
          data: appointment,
          message:
            "Appointment request submitted successfully. We will contact you to confirm.",
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to create appointment"
        );
      }
    }),

  // List appointments with filtering
  list: protectedProcedure
    .use(requirePermission("appointments.read"))
    .input(appointmentQuerySchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const {
        page,
        limit,
        clientId,
        status,
        type,
        priority,
        startDate,
        endDate,
        assignedTo,
        sortBy,
        sortOrder,
      } = input;

      const offset = (page - 1) * limit;
      const conditions = [];

      if (clientId) {
        conditions.push(eq(businessSchema.appointment.clientId, clientId));
      }

      if (status) {
        conditions.push(eq(businessSchema.appointment.status, status));
      }

      if (type) {
        conditions.push(eq(businessSchema.appointment.type, type));
      }

      if (priority) {
        conditions.push(eq(businessSchema.appointment.priority, priority));
      }

      if (assignedTo) {
        conditions.push(eq(businessSchema.appointment.assignedTo, assignedTo));
      }

      if (startDate) {
        conditions.push(gte(businessSchema.appointment.startTime, startDate));
      }

      if (endDate) {
        conditions.push(lte(businessSchema.appointment.endTime, endDate));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(businessSchema.appointment)
        .where(whereClause);

      // Get appointments with sorting
      const sortColumn =
        businessSchema.appointment[
          sortBy as keyof typeof businessSchema.appointment
        ];
      const orderClause =
        sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      const appointments = await db
        .select({
          id: businessSchema.appointment.id,
          title: businessSchema.appointment.title,
          description: businessSchema.appointment.description,
          startTime: businessSchema.appointment.startTime,
          endTime: businessSchema.appointment.endTime,
          type: businessSchema.appointment.type,
          status: businessSchema.appointment.status,
          priority: businessSchema.appointment.priority,
          location: businessSchema.appointment.location,
          isVirtual: businessSchema.appointment.isVirtual,
          meetingLink: businessSchema.appointment.meetingLink,
          clientId: businessSchema.appointment.clientId,
          assignedTo: businessSchema.appointment.assignedTo,
          externalClientName: businessSchema.appointment.externalClientName,
          externalClientEmail: businessSchema.appointment.externalClientEmail,
          externalClientPhone: businessSchema.appointment.externalClientPhone,
          createdAt: businessSchema.appointment.createdAt,
          updatedAt: businessSchema.appointment.updatedAt,
        })
        .from(businessSchema.appointment)
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset);

      const total = totalResult.count;
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
    }),

  // Get appointment by ID
  getById: protectedProcedure
    .use(requirePermission("appointments.read"))
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [appointment] = await db
        .select()
        .from(businessSchema.appointment)
        .where(eq(businessSchema.appointment.id, input.id))
        .limit(1);

      if (!appointment) {
        throw new ORPCError("NOT_FOUND", "Appointment not found");
      }

      return {
        success: true,
        data: appointment,
      };
    }),

  // Update appointment
  update: protectedProcedure
    .use(requirePermission("appointments.update"))
    .input(updateAppointmentSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { id, ...updateData } = input;

      // Check if appointment exists
      const [existing] = await db
        .select()
        .from(businessSchema.appointment)
        .where(eq(businessSchema.appointment.id, id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", "Appointment not found");
      }

      // Validate time slots if being updated
      if (updateData.startTime || updateData.endTime) {
        const startTime = new Date(updateData.startTime || existing.startTime);
        const endTime = new Date(updateData.endTime || existing.endTime);

        if (startTime >= endTime) {
          throw new ORPCError(
            "BAD_REQUEST",
            "End time must be after start time"
          );
        }
      }

      try {
        const [updatedAppointment] = await db
          .update(businessSchema.appointment)
          .set({
            ...updateData,
            updatedBy: user?.id,
          })
          .where(eq(businessSchema.appointment.id, id))
          .returning({
            id: businessSchema.appointment.id,
            title: businessSchema.appointment.title,
            startTime: businessSchema.appointment.startTime,
            endTime: businessSchema.appointment.endTime,
            type: businessSchema.appointment.type,
            status: businessSchema.appointment.status,
            updatedAt: businessSchema.appointment.updatedAt,
          });

        return {
          success: true,
          data: updatedAppointment,
          message: "Appointment updated successfully",
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to update appointment"
        );
      }
    }),

  // Cancel appointment
  cancel: protectedProcedure
    .use(requirePermission("appointments.update"))
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().max(500).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      try {
        const [cancelledAppointment] = await db
          .update(businessSchema.appointment)
          .set({
            status: "CANCELLED",
            cancelReason: input.reason,
            updatedBy: user?.id,
          })
          .where(eq(businessSchema.appointment.id, input.id))
          .returning({
            id: businessSchema.appointment.id,
            title: businessSchema.appointment.title,
            status: businessSchema.appointment.status,
            startTime: businessSchema.appointment.startTime,
          });

        if (!cancelledAppointment) {
          throw new ORPCError("NOT_FOUND", "Appointment not found");
        }

        return {
          success: true,
          data: cancelledAppointment,
          message: "Appointment cancelled successfully",
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to cancel appointment"
        );
      }
    }),

  // Reschedule appointment
  reschedule: protectedProcedure
    .use(requirePermission("appointments.update"))
    .input(rescheduleSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { appointmentId, newStartTime, newEndTime, reason } = input;

      // Validate new time slots
      const startTime = new Date(newStartTime);
      const endTime = new Date(newEndTime);

      if (startTime >= endTime) {
        throw new ORPCError("BAD_REQUEST", "End time must be after start time");
      }

      if (startTime < new Date()) {
        throw new ORPCError("BAD_REQUEST", "Cannot reschedule to past time");
      }

      // Check for conflicts
      const conflicts = await db
        .select({ id: businessSchema.appointment.id })
        .from(businessSchema.appointment)
        .where(
          and(
            eq(businessSchema.appointment.status, "SCHEDULED"),
            sql`${businessSchema.appointment.id} != ${appointmentId}`,
            sql`(
              (${businessSchema.appointment.startTime} <= ${newStartTime} AND ${businessSchema.appointment.endTime} > ${newStartTime}) OR
              (${businessSchema.appointment.startTime} < ${newEndTime} AND ${businessSchema.appointment.endTime} >= ${newEndTime}) OR
              (${businessSchema.appointment.startTime} >= ${newStartTime} AND ${businessSchema.appointment.endTime} <= ${newEndTime})
            )`
          )
        )
        .limit(1);

      if (conflicts.length > 0) {
        throw new ORPCError(
          "CONFLICT",
          "New time slot conflicts with existing appointment"
        );
      }

      try {
        const [rescheduledAppointment] = await db
          .update(businessSchema.appointment)
          .set({
            startTime: newStartTime,
            endTime: newEndTime,
            notes: reason ? `Rescheduled: ${reason}` : "Rescheduled",
            updatedBy: user?.id,
          })
          .where(eq(businessSchema.appointment.id, appointmentId))
          .returning({
            id: businessSchema.appointment.id,
            title: businessSchema.appointment.title,
            startTime: businessSchema.appointment.startTime,
            endTime: businessSchema.appointment.endTime,
            status: businessSchema.appointment.status,
          });

        if (!rescheduledAppointment) {
          throw new ORPCError("NOT_FOUND", "Appointment not found");
        }

        return {
          success: true,
          data: rescheduledAppointment,
          message: "Appointment rescheduled successfully",
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to reschedule appointment"
        );
      }
    }),

  // Check availability for scheduling
  checkAvailability: protectedProcedure
    .use(requirePermission("appointments.read"))
    .input(availabilityQuerySchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { assignedTo, date, duration } = input;

      const startOfDay = `${date}T09:00:00.000Z`;
      const endOfDay = `${date}T17:00:00.000Z`;

      // Get existing appointments for the day
      let whereClause = and(
        gte(businessSchema.appointment.startTime, startOfDay),
        lte(businessSchema.appointment.startTime, endOfDay),
        eq(businessSchema.appointment.status, "SCHEDULED")
      );

      if (assignedTo) {
        whereClause = and(
          whereClause,
          eq(businessSchema.appointment.assignedTo, assignedTo)
        );
      }

      const existingAppointments = await db
        .select({
          startTime: businessSchema.appointment.startTime,
          endTime: businessSchema.appointment.endTime,
        })
        .from(businessSchema.appointment)
        .where(whereClause)
        .orderBy(asc(businessSchema.appointment.startTime));

      // Calculate available time slots
      const availableSlots = [];
      const workStart = new Date(`${date}T09:00:00.000Z`);
      const workEnd = new Date(`${date}T17:00:00.000Z`);
      const slotDuration = duration * 60 * 1000; // Convert minutes to milliseconds

      let currentTime = workStart.getTime();

      for (const appointment of existingAppointments) {
        const appointmentStart = new Date(appointment.startTime).getTime();
        const appointmentEnd = new Date(appointment.endTime).getTime();

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
      while (currentTime + slotDuration <= workEnd.getTime()) {
        availableSlots.push({
          startTime: new Date(currentTime).toISOString(),
          endTime: new Date(currentTime + slotDuration).toISOString(),
        });
        currentTime += 30 * 60 * 1000; // 30-minute intervals
      }

      return {
        success: true,
        data: {
          date,
          duration,
          assignedTo,
          availableSlots,
        },
      };
    }),

  // Get appointment statistics
  getStats: adminProcedure
    .input(
      z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { startDate, endDate } = input;

      let whereClause;
      if (startDate || endDate) {
        const conditions = [];
        if (startDate) {
          conditions.push(gte(businessSchema.appointment.startTime, startDate));
        }
        if (endDate) {
          conditions.push(lte(businessSchema.appointment.startTime, endDate));
        }
        whereClause = and(...conditions);
      }

      const [totalStats] = await db
        .select({
          total: count(),
          scheduled: sql<number>`COUNT(*) FILTER (WHERE status = 'SCHEDULED')`,
          completed: sql<number>`COUNT(*) FILTER (WHERE status = 'COMPLETED')`,
          cancelled: sql<number>`COUNT(*) FILTER (WHERE status = 'CANCELLED')`,
          noShow: sql<number>`COUNT(*) FILTER (WHERE status = 'NO_SHOW')`,
        })
        .from(businessSchema.appointment)
        .where(whereClause);

      const typeStats = await db
        .select({
          type: businessSchema.appointment.type,
          count: count(),
        })
        .from(businessSchema.appointment)
        .where(whereClause)
        .groupBy(businessSchema.appointment.type);

      const priorityStats = await db
        .select({
          priority: businessSchema.appointment.priority,
          count: count(),
        })
        .from(businessSchema.appointment)
        .where(whereClause)
        .groupBy(businessSchema.appointment.priority);

      return {
        success: true,
        data: {
          overview: totalStats,
          byType: typeStats,
          byPriority: priorityStats,
        },
      };
    }),
};
