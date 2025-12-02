import { businessSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  adminProcedure,
  protectedProcedure,
  requirePermission,
} from "../index";

// Input schemas
const dashboardQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  clientId: z.string().uuid().optional(),
  timeRange: z.enum(["7d", "30d", "90d", "1y", "custom"]).default("30d"),
});

const kpiQuerySchema = z.object({
  period: z
    .enum(["daily", "weekly", "monthly", "quarterly", "yearly"])
    .default("monthly"),
  year: z.number().min(2020).max(2030).default(new Date().getFullYear()),
  month: z.number().min(1).max(12).optional(),
  quarter: z.number().min(1).max(4).optional(),
});

const revenueAnalysisSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(["day", "week", "month", "quarter"]).default("month"),
  clientIds: z.array(z.string().uuid()).optional(),
});

const complianceReportSchema = z.object({
  year: z.number().min(2020).max(2030),
  month: z.number().min(1).max(12).optional(),
  clientIds: z.array(z.string().uuid()).optional(),
});

export const dashboardRouter = {
  // Get main dashboard overview
  overview: protectedProcedure
    .use(requirePermission("dashboard.read"))
    .input(dashboardQuerySchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      let { startDate, endDate, clientId, timeRange } = input;

      // Calculate date range based on timeRange
      const now = new Date();
      if (!endDate) {
        endDate = now.toISOString();
      }

      if (!startDate) {
        switch (timeRange) {
          case "7d":
            startDate = new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
          case "30d":
            startDate = new Date(
              now.getTime() - 30 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
          case "90d":
            startDate = new Date(
              now.getTime() - 90 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
          case "1y":
            startDate = new Date(
              now.getTime() - 365 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
          default:
            startDate = new Date(
              now.getTime() - 30 * 24 * 60 * 60 * 1000
            ).toISOString();
        }
      }

      const dateCondition = and(
        gte(sql`created_at`, startDate),
        lte(sql`created_at`, endDate)
      );

      const clientCondition = clientId
        ? eq(sql`client_id`, clientId)
        : undefined;
      const _whereCondition = clientCondition
        ? and(dateCondition, clientCondition)
        : dateCondition;

      try {
        // Client statistics
        const [clientStats] = await db
          .select({
            total: count(),
            active: sql<number>`COUNT(*) FILTER (WHERE status = 'ACTIVE')`,
            inactive: sql<number>`COUNT(*) FILTER (WHERE status = 'INACTIVE')`,
            newThisPeriod: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${startDate})`,
          })
          .from(businessSchema.client)
          .where(clientCondition);

        // Revenue statistics
        const revenueConditions = [
          gte(businessSchema.invoice.issueDate, startDate),
          lte(businessSchema.invoice.issueDate, endDate),
        ];
        if (clientId) {
          revenueConditions.push(eq(businessSchema.invoice.clientId, clientId));
        }
        const [revenueStats] = await db
          .select({
            totalRevenue: sql<number>`COALESCE(SUM(total), 0)`,
            paidAmount: sql<number>`COALESCE(SUM(total) FILTER (WHERE status = 'PAID'), 0)`,
            pendingAmount: sql<number>`COALESCE(SUM(total) FILTER (WHERE status = 'PENDING'), 0)`,
            overdueAmount: sql<number>`COALESCE(SUM(total) FILTER (WHERE status = 'OVERDUE'), 0)`,
            invoiceCount: count(),
          })
          .from(businessSchema.invoice)
          .where(and(...revenueConditions));

        // Tax statistics
        const taxConditions = [
          sql`period >= ${startDate.substring(0, 7)}`, // YYYY-MM format
          sql`period <= ${endDate.substring(0, 7)}`,
        ];
        if (clientId) {
          taxConditions.push(
            eq(businessSchema.payrollRecord.clientId, clientId)
          );
        }
        const [taxStats] = await db
          .select({
            totalPayroll: sql<number>`COALESCE(SUM(gross_salary), 0)`,
            totalPayeTax: sql<number>`COALESCE(SUM(paye_tax), 0)`,
            totalNisContributions: sql<number>`COALESCE(SUM(nis_employee + nis_employer), 0)`,
            payrollRecords: count(),
          })
          .from(businessSchema.payrollRecord)
          .where(and(...taxConditions));

        // Appointment statistics
        const appointmentConditions = [
          gte(businessSchema.appointment.createdAt, startDate),
          lte(businessSchema.appointment.createdAt, endDate),
        ];
        if (clientId) {
          appointmentConditions.push(
            eq(businessSchema.appointment.clientId, clientId)
          );
        }
        const [appointmentStats] = await db
          .select({
            total: count(),
            scheduled: sql<number>`COUNT(*) FILTER (WHERE status = 'SCHEDULED')`,
            completed: sql<number>`COUNT(*) FILTER (WHERE status = 'COMPLETED')`,
            cancelled: sql<number>`COUNT(*) FILTER (WHERE status = 'CANCELLED')`,
          })
          .from(businessSchema.appointment)
          .where(and(...appointmentConditions));

        // Document statistics
        const documentConditions = [
          gte(businessSchema.document.uploadedAt, startDate),
          lte(businessSchema.document.uploadedAt, endDate),
          eq(businessSchema.document.status, "ACTIVE"),
        ];
        if (clientId) {
          documentConditions.push(
            eq(businessSchema.document.clientId, clientId)
          );
        }
        const [documentStats] = await db
          .select({
            total: count(),
            confidential: sql<number>`COUNT(*) FILTER (WHERE is_confidential = true)`,
            totalSize: sql<number>`COALESCE(SUM(file_size), 0)`,
          })
          .from(businessSchema.document)
          .where(and(...documentConditions));

        // Compliance alerts
        const alertConditions = [
          eq(businessSchema.complianceAlert.status, "ACTIVE"),
          lte(
            businessSchema.complianceAlert.dueDate,
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          ),
        ];
        if (clientId) {
          alertConditions.push(
            eq(businessSchema.complianceAlert.clientId, clientId)
          );
        }
        const complianceAlerts = await db
          .select({
            id: businessSchema.complianceAlert.id,
            type: businessSchema.complianceAlert.type,
            severity: businessSchema.complianceAlert.severity,
            title: businessSchema.complianceAlert.title,
            dueDate: businessSchema.complianceAlert.dueDate,
            clientId: businessSchema.complianceAlert.clientId,
          })
          .from(businessSchema.complianceAlert)
          .where(and(...alertConditions))
          .orderBy(businessSchema.complianceAlert.dueDate)
          .limit(10);

        return {
          success: true,
          data: {
            period: {
              startDate,
              endDate,
              timeRange,
            },
            clients: clientStats || {
              total: 0,
              active: 0,
              inactive: 0,
              newThisPeriod: 0,
            },
            revenue: revenueStats || {
              totalRevenue: 0,
              paidAmount: 0,
              pendingAmount: 0,
              overdueAmount: 0,
              invoiceCount: 0,
            },
            tax: taxStats || {
              totalPayroll: 0,
              totalPayeTax: 0,
              totalNisContributions: 0,
              payrollRecords: 0,
            },
            appointments: appointmentStats || {
              total: 0,
              scheduled: 0,
              completed: 0,
              cancelled: 0,
            },
            documents: documentStats || {
              total: 0,
              confidential: 0,
              totalSize: 0,
            },
            complianceAlerts: complianceAlerts || [],
          },
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to generate dashboard overview"
        );
      }
    }),

  // Get KPI metrics
  kpis: protectedProcedure
    .use(requirePermission("dashboard.read"))
    .input(kpiQuerySchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { period, year, month, quarter } = input;

      try {
        let dateCondition: any;
        let groupBy: any;

        switch (period) {
          case "daily":
            if (!month) {
              throw new ORPCError(
                "BAD_REQUEST",
                "Month is required for daily KPIs"
              );
            }
            dateCondition = sql`EXTRACT(YEAR FROM created_at) = ${year} AND EXTRACT(MONTH FROM created_at) = ${month}`;
            groupBy = sql`EXTRACT(DAY FROM created_at)`;
            break;
          case "weekly":
            dateCondition = sql`EXTRACT(YEAR FROM created_at) = ${year}`;
            groupBy = sql`EXTRACT(WEEK FROM created_at)`;
            break;
          case "monthly":
            dateCondition = sql`EXTRACT(YEAR FROM created_at) = ${year}`;
            groupBy = sql`EXTRACT(MONTH FROM created_at)`;
            break;
          case "quarterly":
            dateCondition = sql`EXTRACT(YEAR FROM created_at) = ${year}`;
            groupBy = sql`EXTRACT(QUARTER FROM created_at)`;
            break;
          case "yearly":
            dateCondition = sql`EXTRACT(YEAR FROM created_at) >= ${year - 5} AND EXTRACT(YEAR FROM created_at) <= ${year}`;
            groupBy = sql`EXTRACT(YEAR FROM created_at)`;
            break;
        }

        // Revenue KPIs by period
        const revenueKpis = await db
          .select({
            period: groupBy,
            revenue: sql<number>`COALESCE(SUM(total), 0)`,
            invoiceCount: count(),
            averageInvoice: sql<number>`COALESCE(AVG(total), 0)`,
            paidRevenue: sql<number>`COALESCE(SUM(total) FILTER (WHERE status = 'PAID'), 0)`,
          })
          .from(businessSchema.invoice)
          .where(dateCondition)
          .groupBy(groupBy)
          .orderBy(groupBy);

        // Client acquisition KPIs
        const clientKpis = await db
          .select({
            period: groupBy,
            newClients: count(),
            totalRevenue: sql<number>`COALESCE(SUM((SELECT SUM(total) FROM ${businessSchema.invoice} WHERE client_id = ${businessSchema.client.id})), 0)`,
          })
          .from(businessSchema.client)
          .where(dateCondition)
          .groupBy(groupBy)
          .orderBy(groupBy);

        // Calculate growth rates
        const calculateGrowthRate = (data: any[], valueKey: string) =>
          data.map((item, index) => {
            if (index === 0) {
              return { ...item, growthRate: 0 };
            }
            const current = Number(item[valueKey]);
            const previous = Number(data[index - 1][valueKey]);
            const growthRate =
              previous === 0 ? 0 : ((current - previous) / previous) * 100;
            return { ...item, growthRate: Math.round(growthRate * 100) / 100 };
          });

        const enhancedRevenueKpis = calculateGrowthRate(revenueKpis, "revenue");
        const enhancedClientKpis = calculateGrowthRate(
          clientKpis,
          "newClients"
        );

        return {
          success: true,
          data: {
            period,
            year,
            month,
            quarter,
            revenue: enhancedRevenueKpis,
            clients: enhancedClientKpis,
          },
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to generate KPI metrics"
        );
      }
    }),

  // Get revenue analysis
  revenueAnalysis: protectedProcedure
    .use(requirePermission("dashboard.read"))
    .input(revenueAnalysisSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { startDate, endDate, groupBy, clientIds } = input;

      try {
        let groupByClause: any;
        let _orderByClause: any;

        switch (groupBy) {
          case "day":
            groupByClause = sql`DATE_TRUNC('day', issue_date)`;
            break;
          case "week":
            groupByClause = sql`DATE_TRUNC('week', issue_date)`;
            break;
          case "month":
            groupByClause = sql`DATE_TRUNC('month', issue_date)`;
            break;
          case "quarter":
            groupByClause = sql`DATE_TRUNC('quarter', issue_date)`;
            break;
        }

        let whereCondition = and(
          gte(businessSchema.invoice.issueDate, startDate),
          lte(businessSchema.invoice.issueDate, endDate)
        );

        if (clientIds && clientIds.length > 0) {
          whereCondition = and(
            whereCondition,
            sql`${businessSchema.invoice.clientId} = ANY(${clientIds})`
          );
        }

        const revenueAnalysis = await db
          .select({
            period: groupByClause,
            totalRevenue: sql<number>`COALESCE(SUM(total), 0)`,
            paidRevenue: sql<number>`COALESCE(SUM(total) FILTER (WHERE status = 'PAID'), 0)`,
            pendingRevenue: sql<number>`COALESCE(SUM(total) FILTER (WHERE status = 'PENDING'), 0)`,
            overdueRevenue: sql<number>`COALESCE(SUM(total) FILTER (WHERE status = 'OVERDUE'), 0)`,
            invoiceCount: count(),
            averageInvoiceValue: sql<number>`COALESCE(AVG(total), 0)`,
            vatCollected: sql<number>`COALESCE(SUM(vat_amount), 0)`,
          })
          .from(businessSchema.invoice)
          .where(whereCondition)
          .groupBy(groupByClause)
          .orderBy(groupByClause);

        // Calculate period-over-period growth
        const analysisWithGrowth = revenueAnalysis.map((item, index) => {
          if (index === 0) {
            return { ...item, revenueGrowth: 0, volumeGrowth: 0 };
          }

          const current = Number(item.totalRevenue);
          const previous = Number(revenueAnalysis[index - 1].totalRevenue);
          const revenueGrowth =
            previous === 0 ? 0 : ((current - previous) / previous) * 100;

          const currentVolume = Number(item.invoiceCount);
          const previousVolume = Number(
            revenueAnalysis[index - 1].invoiceCount
          );
          const volumeGrowth =
            previousVolume === 0
              ? 0
              : ((currentVolume - previousVolume) / previousVolume) * 100;

          return {
            ...item,
            revenueGrowth: Math.round(revenueGrowth * 100) / 100,
            volumeGrowth: Math.round(volumeGrowth * 100) / 100,
          };
        });

        return {
          success: true,
          data: {
            startDate,
            endDate,
            groupBy,
            analysis: analysisWithGrowth,
            summary: {
              totalRevenue: analysisWithGrowth.reduce(
                (sum, item) => sum + Number(item.totalRevenue),
                0
              ),
              totalInvoices: analysisWithGrowth.reduce(
                (sum, item) => sum + Number(item.invoiceCount),
                0
              ),
              averageGrowthRate:
                analysisWithGrowth.length > 1
                  ? analysisWithGrowth
                      .slice(1)
                      .reduce((sum, item) => sum + item.revenueGrowth, 0) /
                    (analysisWithGrowth.length - 1)
                  : 0,
            },
          },
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to generate revenue analysis"
        );
      }
    }),

  // Get compliance dashboard
  complianceReport: protectedProcedure
    .use(requirePermission("compliance.read"))
    .input(complianceReportSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { year, month, clientIds } = input;

      try {
        let whereCondition = sql`EXTRACT(YEAR FROM due_date) = ${year}`;
        if (month) {
          whereCondition = sql`${whereCondition} AND EXTRACT(MONTH FROM due_date) = ${month}`;
        }
        if (clientIds && clientIds.length > 0) {
          whereCondition = sql`${whereCondition} AND client_id = ANY(${clientIds})`;
        }

        // Compliance alerts overview
        const [alertsOverview] = await db
          .select({
            total: count(),
            active: sql<number>`COUNT(*) FILTER (WHERE status = 'ACTIVE')`,
            resolved: sql<number>`COUNT(*) FILTER (WHERE status = 'RESOLVED')`,
            overdue: sql<number>`COUNT(*) FILTER (WHERE status = 'ACTIVE' AND due_date < NOW())`,
            high: sql<number>`COUNT(*) FILTER (WHERE severity = 'HIGH')`,
            medium: sql<number>`COUNT(*) FILTER (WHERE severity = 'MEDIUM')`,
            low: sql<number>`COUNT(*) FILTER (WHERE severity = 'LOW')`,
          })
          .from(businessSchema.complianceAlert)
          .where(whereCondition);

        // Alerts by type
        const alertsByType = await db
          .select({
            type: businessSchema.complianceAlert.type,
            count: count(),
            activeCount: sql<number>`COUNT(*) FILTER (WHERE status = 'ACTIVE')`,
            overdueCount: sql<number>`COUNT(*) FILTER (WHERE status = 'ACTIVE' AND due_date < NOW())`,
          })
          .from(businessSchema.complianceAlert)
          .where(whereCondition)
          .groupBy(businessSchema.complianceAlert.type);

        // Upcoming deadlines (next 30 days)
        const upcomingConditions = [
          eq(businessSchema.complianceAlert.status, "ACTIVE"),
          gte(businessSchema.complianceAlert.dueDate, new Date().toISOString()),
          lte(
            businessSchema.complianceAlert.dueDate,
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          ),
        ];
        if (clientIds && clientIds.length > 0) {
          upcomingConditions.push(sql`client_id = ANY(${clientIds})`);
        }
        const upcomingDeadlines = await db
          .select({
            id: businessSchema.complianceAlert.id,
            title: businessSchema.complianceAlert.title,
            type: businessSchema.complianceAlert.type,
            severity: businessSchema.complianceAlert.severity,
            dueDate: businessSchema.complianceAlert.dueDate,
            clientId: businessSchema.complianceAlert.clientId,
          })
          .from(businessSchema.complianceAlert)
          .where(and(...upcomingConditions))
          .orderBy(businessSchema.complianceAlert.dueDate)
          .limit(20);

        // Client compliance scores
        const clientComplianceConditions = [
          eq(businessSchema.client.status, "ACTIVE"),
        ];
        if (clientIds && clientIds.length > 0) {
          clientComplianceConditions.push(sql`id = ANY(${clientIds})`);
        }
        const clientCompliance = await db
          .select({
            clientId: businessSchema.client.id,
            clientName: businessSchema.client.name,
            complianceStatus: businessSchema.client.complianceStatus,
            complianceScore: businessSchema.client.complianceScore,
            activeAlerts: sql<number>`(
              SELECT COUNT(*)
              FROM ${businessSchema.complianceAlert}
              WHERE client_id = ${businessSchema.client.id}
              AND status = 'ACTIVE'
            )`,
          })
          .from(businessSchema.client)
          .where(and(...clientComplianceConditions))
          .orderBy(desc(businessSchema.client.complianceScore));

        return {
          success: true,
          data: {
            period: { year, month },
            overview: alertsOverview || {
              total: 0,
              active: 0,
              resolved: 0,
              overdue: 0,
              high: 0,
              medium: 0,
              low: 0,
            },
            byType: alertsByType || [],
            upcomingDeadlines: upcomingDeadlines || [],
            clientCompliance: clientCompliance || [],
          },
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to generate compliance report"
        );
      }
    }),

  // Get client performance metrics
  clientPerformance: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        sortBy: z
          .enum(["revenue", "invoiceCount", "complianceScore", "lastActivity"])
          .default("revenue"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        timeRange: z.enum(["30d", "90d", "1y"]).default("1y"),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { limit, sortBy, sortOrder, timeRange } = input;

      try {
        const now = new Date();
        let startDate: string;

        switch (timeRange) {
          case "30d":
            startDate = new Date(
              now.getTime() - 30 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
          case "90d":
            startDate = new Date(
              now.getTime() - 90 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
          case "1y":
            startDate = new Date(
              now.getTime() - 365 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
        }

        const clientPerformance = await db
          .select({
            clientId: businessSchema.client.id,
            clientName: businessSchema.client.name,
            entityType: businessSchema.client.entityType,
            status: businessSchema.client.status,
            complianceStatus: businessSchema.client.complianceStatus,
            complianceScore: businessSchema.client.complianceScore,
            revenue: sql<number>`COALESCE((
              SELECT SUM(total)
              FROM ${businessSchema.invoice}
              WHERE client_id = ${businessSchema.client.id}
              AND issue_date >= ${startDate}
            ), 0)`,
            invoiceCount: sql<number>`COALESCE((
              SELECT COUNT(*)
              FROM ${businessSchema.invoice}
              WHERE client_id = ${businessSchema.client.id}
              AND issue_date >= ${startDate}
            ), 0)`,
            lastInvoiceDate: sql<string>`(
              SELECT MAX(issue_date)
              FROM ${businessSchema.invoice}
              WHERE client_id = ${businessSchema.client.id}
            )`,
            activeAlerts: sql<number>`COALESCE((
              SELECT COUNT(*)
              FROM ${businessSchema.complianceAlert}
              WHERE client_id = ${businessSchema.client.id}
              AND status = 'ACTIVE'
            ), 0)`,
            lastActivity: businessSchema.client.updatedAt,
          })
          .from(businessSchema.client)
          .where(eq(businessSchema.client.status, "ACTIVE"))
          .orderBy(
            sortOrder === "desc"
              ? desc(sql.identifier(sortBy))
              : sql.identifier(sortBy)
          )
          .limit(limit);

        return {
          success: true,
          data: {
            timeRange,
            clients: clientPerformance,
            summary: {
              totalClients: clientPerformance.length,
              averageRevenue:
                clientPerformance.reduce(
                  (sum, client) => sum + Number(client.revenue),
                  0
                ) / clientPerformance.length,
              averageComplianceScore:
                clientPerformance.reduce(
                  (sum, client) => sum + Number(client.complianceScore || 0),
                  0
                ) / clientPerformance.length,
              clientsWithAlerts: clientPerformance.filter(
                (client) => Number(client.activeAlerts) > 0
              ).length,
            },
          },
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to generate client performance metrics"
        );
      }
    }),

  // Get financial summary
  financialSummary: protectedProcedure
    .use(requirePermission("dashboard.read"))
    .input(dashboardQuerySchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { timeRange, clientId } = input;

      try {
        const now = new Date();
        let startDate: string;
        const endDate = now.toISOString();

        switch (timeRange) {
          case "7d":
            startDate = new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
          case "30d":
            startDate = new Date(
              now.getTime() - 30 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
          case "90d":
            startDate = new Date(
              now.getTime() - 90 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
          case "1y":
            startDate = new Date(
              now.getTime() - 365 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
          default:
            startDate = new Date(
              now.getTime() - 30 * 24 * 60 * 60 * 1000
            ).toISOString();
        }

        // Invoice summary
        const [invoiceSummary] = await db
          .select({
            totalRevenue: sql<number>`COALESCE(SUM(total), 0)`,
            totalInvoices: count(),
            paidAmount: sql<number>`COALESCE(SUM(total) FILTER (WHERE status = 'PAID'), 0)`,
            pendingAmount: sql<number>`COALESCE(SUM(total) FILTER (WHERE status = 'PENDING'), 0)`,
            overdueAmount: sql<number>`COALESCE(SUM(total) FILTER (WHERE status = 'OVERDUE'), 0)`,
            vatCollected: sql<number>`COALESCE(SUM(vat_amount), 0)`,
            averageInvoice: sql<number>`COALESCE(AVG(total), 0)`,
          })
          .from(businessSchema.invoice)
          .where(() => {
            const invoiceConditions = [
              gte(businessSchema.invoice.issueDate, startDate),
              lte(businessSchema.invoice.issueDate, endDate),
            ];
            if (clientId) {
              invoiceConditions.push(
                eq(businessSchema.invoice.clientId, clientId)
              );
            }
            return and(...invoiceConditions);
          });

        // Cash flow projection (next 90 days)
        const cashFlowConditions = [
          gte(businessSchema.invoice.dueDate, now.toISOString()),
          lte(
            businessSchema.invoice.dueDate,
            new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
          ),
          sql`status IN ('PENDING', 'OVERDUE')`,
        ];
        if (clientId) {
          cashFlowConditions.push(
            eq(businessSchema.invoice.clientId, clientId)
          );
        }

        const upcomingInvoices = await db
          .select({
            dueDate: businessSchema.invoice.dueDate,
            amount: sql<number>`SUM(total)`,
            status: businessSchema.invoice.status,
          })
          .from(businessSchema.invoice)
          .where(and(...cashFlowConditions))
          .groupBy(
            businessSchema.invoice.dueDate,
            businessSchema.invoice.status
          )
          .orderBy(businessSchema.invoice.dueDate);

        return {
          success: true,
          data: {
            period: { startDate, endDate, timeRange },
            invoiceSummary: invoiceSummary || {
              totalRevenue: 0,
              totalInvoices: 0,
              paidAmount: 0,
              pendingAmount: 0,
              overdueAmount: 0,
              vatCollected: 0,
              averageInvoice: 0,
            },
            cashFlow: upcomingInvoices || [],
          },
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to generate financial summary"
        );
      }
    }),
};
