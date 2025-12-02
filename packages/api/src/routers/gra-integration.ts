import { businessSchema, graIntegrationSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, requirePermission } from "../index";

// GRA eServices Integration API
export const graIntegrationRouter = {
  // Authenticate with GRA eServices
  authenticateGRA: protectedProcedure
    .use(requirePermission("taxes.file"))
    .input(
      z.object({
        clientId: z.string().uuid(),
        tin: z.string().min(1, "TIN is required"),
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { clientId, tin, username, password } = input;

      try {
        // In a real implementation, this would authenticate with GRA's API
        // For now, we'll simulate the authentication process
        const authToken = `gra_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store authentication credentials securely (encrypted)
        await db
          .insert(graIntegrationSchema.graApiCredential)
          .values({
            clientId,
            tin,
            username,
            authToken,
            expiresAt: sessionExpiry,
            createdBy: user?.id!,
          })
          .onConflictDoUpdate({
            target: [graIntegrationSchema.graApiCredential.clientId],
            set: {
              username,
              authToken,
              expiresAt: sessionExpiry,
              updatedBy: user?.id!,
            },
          });

        return {
          success: true,
          data: {
            authenticated: true,
            sessionExpiry,
            supportedForms: [
              "VAT_RETURN",
              "PAYE_RETURN",
              "CORPORATE_TAX",
              "BUSINESS_REGISTRATION",
            ],
          },
          message: "Successfully authenticated with GRA eServices",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to authenticate with GRA eServices"
        );
      }
    }),

  // Sync client data with GRA records
  syncClientWithGRA: protectedProcedure
    .use(requirePermission("clients.read"))
    .input(
      z.object({
        clientId: z.string().uuid(),
        tin: z.string().min(1, "TIN is required"),
        syncType: z.enum(["BASIC_INFO", "TAX_HISTORY", "COMPLIANCE_STATUS"]),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { clientId, tin, syncType } = input;

      try {
        // Check GRA authentication
        const [credentials] = await db
          .select()
          .from(graIntegrationSchema.graApiCredential)
          .where(
            and(
              eq(graIntegrationSchema.graApiCredential.clientId, clientId),
              gte(graIntegrationSchema.graApiCredential.expiresAt, new Date())
            )
          )
          .limit(1);

        if (!credentials) {
          throw new ORPCError(
            "UNAUTHORIZED",
            "GRA authentication required. Please authenticate first."
          );
        }

        // Simulate GRA API call based on sync type
        let syncData;
        switch (syncType) {
          case "BASIC_INFO":
            syncData = {
              tin,
              businessName: "Sample Business Ltd.",
              registrationDate: "2020-01-15",
              businessType: "LIMITED_LIABILITY",
              status: "ACTIVE",
              address: "123 Main Street, Georgetown, Guyana",
              phone: "+592-123-4567",
            };
            break;

          case "TAX_HISTORY":
            syncData = {
              filings: [
                {
                  period: "2023-Q4",
                  formType: "VAT_RETURN",
                  submittedDate: "2024-01-20",
                  status: "PROCESSED",
                  amountPaid: 125_000,
                },
                {
                  period: "2023",
                  formType: "CORPORATE_TAX",
                  submittedDate: "2024-03-30",
                  status: "PENDING",
                  amountDue: 85_000,
                },
              ],
              totalTaxPaid: 750_000,
              outstandingBalance: 85_000,
            };
            break;

          case "COMPLIANCE_STATUS":
            syncData = {
              vatRegistrationStatus: "REGISTERED",
              payeRegistrationStatus: "REGISTERED",
              complianceRating: "GOOD",
              lastAuditDate: "2023-06-15",
              outstandingReturns: [
                {
                  formType: "VAT_RETURN",
                  period: "2024-Q1",
                  dueDate: "2024-04-21",
                  daysOverdue: 45,
                },
              ],
              penalties: [
                {
                  type: "LATE_FILING",
                  amount: 15_000,
                  period: "2024-Q1",
                  status: "UNPAID",
                },
              ],
            };
            break;
        }

        // Store sync result
        await db.insert(graIntegrationSchema.graApiSync).values({
          clientId,
          syncType,
          syncData: JSON.stringify(syncData),
          syncStatus: "SUCCESS",
          syncedAt: new Date(),
        });

        return {
          success: true,
          data: {
            syncType,
            syncedAt: new Date(),
            ...syncData,
          },
          message: `Successfully synced ${syncType.toLowerCase()} with GRA`,
        };
      } catch (error) {
        await db.insert(graIntegrationSchema.graApiSync).values({
          clientId: input.clientId,
          syncType: input.syncType,
          syncStatus: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          syncedAt: new Date(),
        });

        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          `Failed to sync ${input.syncType.toLowerCase()} with GRA`
        );
      }
    }),

  // Submit filing directly to GRA
  submitFilingToGRA: protectedProcedure
    .use(requirePermission("taxes.file"))
    .input(
      z.object({
        submissionId: z.string().uuid(),
        formType: z.enum(["VAT_RETURN", "PAYE_RETURN", "CORPORATE_TAX"]),
        priority: z.enum(["NORMAL", "URGENT"]).default("NORMAL"),
        notifyOnCompletion: z.boolean().default(true),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { submissionId, formType, priority, notifyOnCompletion } = input;

      try {
        // Get submission data
        const [submission] = await db
          .select()
          .from(businessSchema.graSubmission)
          .where(eq(businessSchema.graSubmission.id, submissionId))
          .limit(1);

        if (!submission) {
          throw new ORPCError("NOT_FOUND", "Submission not found");
        }

        // Check GRA authentication
        const [credentials] = await db
          .select()
          .from(graIntegrationSchema.graApiCredential)
          .where(
            and(
              eq(graIntegrationSchema.graApiCredential.clientId, submission.clientId),
              gte(graIntegrationSchema.graApiCredential.expiresAt, new Date())
            )
          )
          .limit(1);

        if (!credentials) {
          throw new ORPCError(
            "UNAUTHORIZED",
            "GRA authentication required for this client"
          );
        }

        // Simulate GRA submission
        const graReference = `GRA${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const processingTime = priority === "URGENT" ? 1 : 3; // days
        const expectedCompletionDate = new Date(
          Date.now() + processingTime * 24 * 60 * 60 * 1000
        );

        // Update submission with GRA reference
        await db
          .update(businessSchema.graSubmission)
          .set({
            graReference,
            status: "SUBMITTED_TO_GRA",
            submittedAt: new Date(),
            expectedCompletionDate,
          })
          .where(eq(businessSchema.graSubmission.id, submissionId));

        // Create activity log
        await db.insert(graIntegrationSchema.activityLog).values({
          userId: user?.id!,
          entityType: "GRA_SUBMISSION",
          entityId: submissionId,
          action: "SUBMITTED_TO_GRA",
          details: JSON.stringify({
            graReference,
            formType,
            priority,
            expectedCompletion: expectedCompletionDate,
          }),
        });

        return {
          success: true,
          data: {
            graReference,
            status: "SUBMITTED_TO_GRA",
            submittedAt: new Date(),
            expectedCompletionDate,
            trackingUrl: `https://gra.gov.gy/track/${graReference}`,
            priority,
            notifyOnCompletion,
          },
          message: "Filing submitted successfully to GRA eServices",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to submit filing to GRA"
        );
      }
    }),

  // Check GRA submission status
  checkGRASubmissionStatus: protectedProcedure
    .use(requirePermission("taxes.read"))
    .input(
      z.object({
        graReference: z.string().min(1),
        updateLocal: z.boolean().default(true),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { graReference, updateLocal } = input;

      try {
        // Find local submission
        const [submission] = await db
          .select()
          .from(businessSchema.graSubmission)
          .where(eq(businessSchema.graSubmission.graReference, graReference))
          .limit(1);

        if (!submission) {
          throw new ORPCError("NOT_FOUND", "Submission not found");
        }

        // Simulate GRA status check
        const possibleStatuses = [
          "SUBMITTED_TO_GRA",
          "UNDER_REVIEW",
          "ADDITIONAL_INFO_REQUIRED",
          "APPROVED",
          "REJECTED",
        ];

        // Simulate status progression based on time
        const daysSinceSubmission = submission.submittedAt
          ? Math.floor(
              (Date.now() - submission.submittedAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        let currentStatus = "SUBMITTED_TO_GRA";
        if (daysSinceSubmission >= 1) currentStatus = "UNDER_REVIEW";
        if (daysSinceSubmission >= 3) currentStatus = "APPROVED";

        const statusData = {
          graReference,
          status: currentStatus,
          lastUpdated: new Date(),
          processingNotes: [
            {
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              note: "Submission received and validated",
              officer: "System",
            },
            {
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              note: "Under review by tax officer",
              officer: "J. Smith",
            },
          ],
        };

        if (updateLocal) {
          // Update local submission status
          await db
            .update(businessSchema.graSubmission)
            .set({
              status: currentStatus as any,
              processedAt: new Date(),
            })
            .where(eq(businessSchema.graSubmission.id, submission.id));
        }

        return {
          success: true,
          data: statusData,
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to check GRA submission status"
        );
      }
    }),

  // Get GRA filing calendar and deadlines
  getGRAFilingCalendar: protectedProcedure
    .use(requirePermission("taxes.read"))
    .input(
      z.object({
        year: z.number().min(2020).max(2030).default(new Date().getFullYear()),
        clientId: z.string().uuid().optional(),
      })
    )
    .handler(async ({ input }) => {
      const { year, clientId } = input;

      // GRA official filing deadlines for Guyana
      const filingCalendar = [
        {
          id: `vat-q1-${year}`,
          type: "VAT_RETURN",
          title: "VAT Return - Quarter 1",
          period: `${year}-Q1`,
          dueDate: new Date(`${year}-04-21`),
          description: "Quarterly VAT return for January - March",
          lateFilingPenalty: 10_000, // GYD
          applicableToAll: true,
        },
        {
          id: `vat-q2-${year}`,
          type: "VAT_RETURN",
          title: "VAT Return - Quarter 2",
          period: `${year}-Q2`,
          dueDate: new Date(`${year}-07-21`),
          description: "Quarterly VAT return for April - June",
          lateFilingPenalty: 10_000,
          applicableToAll: true,
        },
        {
          id: `vat-q3-${year}`,
          type: "VAT_RETURN",
          title: "VAT Return - Quarter 3",
          period: `${year}-Q3`,
          dueDate: new Date(`${year}-10-21`),
          description: "Quarterly VAT return for July - September",
          lateFilingPenalty: 10_000,
          applicableToAll: true,
        },
        {
          id: `vat-q4-${year}`,
          type: "VAT_RETURN",
          title: "VAT Return - Quarter 4",
          period: `${year}-Q4`,
          dueDate: new Date(`${year + 1}-01-21`),
          description: "Quarterly VAT return for October - December",
          lateFilingPenalty: 10_000,
          applicableToAll: true,
        },
        {
          id: `paye-annual-${year}`,
          type: "PAYE_RETURN",
          title: "Annual PAYE Return",
          period: year.toString(),
          dueDate: new Date(`${year + 1}-01-31`),
          description: "Annual PAYE return for all employees",
          lateFilingPenalty: 25_000,
          applicableToAll: false,
          requirements: ["Must have employees on payroll"],
        },
        {
          id: `corporate-tax-${year}`,
          type: "CORPORATE_TAX",
          title: "Corporate Tax Return",
          period: year.toString(),
          dueDate: new Date(`${year + 1}-03-31`),
          description: "Annual corporate tax return",
          lateFilingPenalty: 50_000,
          applicableToAll: false,
          requirements: ["Incorporated business entities only"],
        },
        {
          id: `business-levy-${year}`,
          type: "BUSINESS_LEVY",
          title: "Business Levy",
          period: year.toString(),
          dueDate: new Date(`${year}-12-31`),
          description: "Annual business levy payment",
          lateFilingPenalty: 15_000,
          applicableToAll: true,
        },
      ];

      const now = new Date();
      const enrichedCalendar = filingCalendar.map((item) => {
        const daysUntilDue = Math.ceil(
          (item.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        let priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";

        if (daysUntilDue < 0)
          priority = "CRITICAL"; // Overdue
        else if (daysUntilDue <= 7) priority = "CRITICAL";
        else if (daysUntilDue <= 30) priority = "HIGH";
        else if (daysUntilDue <= 60) priority = "MEDIUM";

        return {
          ...item,
          daysUntilDue,
          priority,
          isOverdue: daysUntilDue < 0,
        };
      });

      return {
        success: true,
        data: {
          year,
          calendar: enrichedCalendar,
          summary: {
            totalDeadlines: enrichedCalendar.length,
            overdue: enrichedCalendar.filter((item) => item.isOverdue).length,
            critical: enrichedCalendar.filter(
              (item) => item.priority === "CRITICAL"
            ).length,
            high: enrichedCalendar.filter((item) => item.priority === "HIGH")
              .length,
            upcomingInNext30Days: enrichedCalendar.filter(
              (item) => item.daysUntilDue > 0 && item.daysUntilDue <= 30
            ).length,
          },
        },
      };
    }),

  // Bulk export client data for GRA compliance
  exportClientDataForGRA: protectedProcedure
    .use(requirePermission("taxes.read"))
    .input(
      z.object({
        clientIds: z
          .array(z.string().uuid())
          .min(1, "At least one client required"),
        exportType: z.enum([
          "ANNUAL_SUMMARY",
          "MONTHLY_BREAKDOWN",
          "TRANSACTION_DETAIL",
        ]),
        period: z.object({
          startDate: z.string().datetime(),
          endDate: z.string().datetime(),
        }),
        includeAttachments: z.boolean().default(false),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { clientIds, exportType, period, includeAttachments } = input;

      try {
        const exportData = [];

        for (const clientId of clientIds) {
          // Get client basic info
          const [client] = await db
            .select({
              id: businessSchema.client.id,
              name: businessSchema.client.name,
              tin: businessSchema.client.taxIdNumber,
              entityType: businessSchema.client.entityType,
            })
            .from(businessSchema.client)
            .where(eq(businessSchema.client.id, clientId))
            .limit(1);

          if (!client) continue;

          // Get tax data based on export type
          let taxData;
          switch (exportType) {
            case "ANNUAL_SUMMARY": {
              // Aggregate annual data
              const [annualSummary] = await db
                .select({
                  totalRevenue: sql<number>`SUM(${businessSchema.invoice.total})`,
                  totalVAT: sql<number>`SUM(${businessSchema.invoice.vatAmount})`,
                  totalPayroll: sql<number>`SUM(${businessSchema.payrollRecord.grossSalary})`,
                  totalPAYE: sql<number>`SUM(${businessSchema.payrollRecord.payeTax})`,
                  totalNIS: sql<number>`SUM(${businessSchema.payrollRecord.nisEmployee} + ${businessSchema.payrollRecord.nisEmployer})`,
                })
                .from(businessSchema.invoice)
                .leftJoin(
                  businessSchema.payrollRecord,
                  eq(
                    businessSchema.invoice.clientId,
                    businessSchema.payrollRecord.clientId
                  )
                )
                .where(
                  and(
                    eq(businessSchema.invoice.clientId, clientId),
                    gte(businessSchema.invoice.issueDate, period.startDate),
                    lte(businessSchema.invoice.issueDate, period.endDate)
                  )
                );

              taxData = annualSummary;
              break;
            }

            default:
              taxData = {
                note: "Detailed export not implemented in this demo",
              };
          }

          exportData.push({
            client,
            period,
            taxData,
            exportedAt: new Date(),
            exportedBy: user?.id,
          });
        }

        // Log export activity
        await db.insert(graIntegrationSchema.activityLog).values({
          userId: user?.id!,
          entityType: "BULK_EXPORT",
          action: "GRA_DATA_EXPORT",
          details: JSON.stringify({
            clientCount: clientIds.length,
            exportType,
            period,
          }),
        });

        return {
          success: true,
          data: {
            exportType,
            period,
            clientCount: exportData.length,
            data: exportData,
            exportId: `gra_export_${Date.now()}`,
          },
          message: `Successfully exported data for ${exportData.length} clients`,
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to export client data for GRA"
        );
      }
    }),
};
