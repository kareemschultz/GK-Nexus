import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { aiRouter } from "./ai";
import { appointmentsRouter } from "./appointments";
// TEMPORARILY DISABLED - audit and rbac routers have incompatible architecture
// import { auditRouter } from "./audit";
// import { rbacRouter } from "./rbac";
import { backupRouter } from "./backup";
import { clientsRouter } from "./clients";
import { complianceRouter } from "./compliance";
import { dashboardRouter } from "./dashboard";
import { documentsRouter } from "./documents";
import { expeditingRouter } from "./expediting";
import { graIntegrationRouter } from "./gra-integration";
import { immigrationRouter } from "./immigration";
import { invoicesRouter } from "./invoices";
import { localContentRouter } from "./local-content";
import { notificationsRouter } from "./notifications";
import { ocrRouter } from "./ocr";
import { partnerNetworkRouter } from "./partner-network";
import { payrollRouter } from "./payroll";
import { propertyManagementRouter } from "./property-management";
import { serviceCatalogRouter } from "./service-catalog";
import { taxRouter } from "./tax";
import { trainingRouter } from "./training";
import { usersRouter } from "./users";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.user,
  })),
  ai: aiRouter,
  // TEMPORARILY DISABLED - incompatible router architecture
  // audit: auditRouter,
  // rbac: rbacRouter,
  backup: backupRouter,
  clients: clientsRouter,
  users: usersRouter,
  tax: taxRouter,
  appointments: appointmentsRouter,
  documents: documentsRouter,
  dashboard: dashboardRouter,
  invoices: invoicesRouter,
  compliance: complianceRouter,
  immigration: immigrationRouter,
  gra: graIntegrationRouter,
  ocr: ocrRouter,
  notifications: notificationsRouter,
  payroll: payrollRouter,
  // Phase 5: Extended Business Modules
  propertyManagement: propertyManagementRouter,
  expediting: expeditingRouter,
  training: trainingRouter,
  localContent: localContentRouter,
  partnerNetwork: partnerNetworkRouter,
  serviceCatalog: serviceCatalogRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
