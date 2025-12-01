import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { aiRouter } from "./ai";
import { appointmentsRouter } from "./appointments";
import { clientsRouter } from "./clients";
import { complianceRouter } from "./compliance";
import { dashboardRouter } from "./dashboard";
import { documentsRouter } from "./documents";
import { graIntegrationRouter } from "./gra-integration";
import { immigrationRouter } from "./immigration";
import { invoicesRouter } from "./invoices";
import { notificationsRouter } from "./notifications";
import { ocrRouter } from "./ocr";
import { taxRouter } from "./tax";
import { usersRouter } from "./users";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.user,
  })),
  ai: aiRouter,
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
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
