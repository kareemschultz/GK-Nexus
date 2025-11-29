import { drizzle } from "drizzle-orm/node-postgres";
import * as analyticsReportingSchema from "./schema/analytics-reporting";
import * as appointmentsSchema from "./schema/appointments";
import * as auditLogsSchema from "./schema/audit-logs";
import * as authSchema from "./schema/auth";
import * as businessSchema from "./schema/business";
import * as clientsSchema from "./schema/clients";
import * as complianceSchema from "./schema/compliance";
import * as documentManagementSchema from "./schema/document-management";
import * as documentsSchema from "./schema/documents";
import * as enhancedAuditSchema from "./schema/enhanced-audit";
import * as enterpriseInfrastructureSchema from "./schema/enterprise-infrastructure";
import * as graIntegrationSchema from "./schema/gra-integration";
import * as immigrationSchema from "./schema/immigration";
import * as notificationsSchema from "./schema/notifications";
// Phase 3 infrastructure schemas
import * as ocrProcessingSchema from "./schema/ocr-processing";
import * as organizationsSchema from "./schema/organizations";
import * as queueProcessingSchema from "./schema/queue-processing";
import * as rbacSchema from "./schema/rbac";
import * as searchSchema from "./schema/search";
import * as taxCalculationsSchema from "./schema/tax-calculations";
import * as usersSchema from "./schema/users";

const schema = {
  ...authSchema,
  ...businessSchema,
  ...organizationsSchema,
  ...clientsSchema,
  ...usersSchema,
  ...rbacSchema,
  ...appointmentsSchema,
  ...taxCalculationsSchema,
  ...documentsSchema,
  ...documentManagementSchema,
  ...auditLogsSchema,
  ...enhancedAuditSchema,
  ...complianceSchema,
  ...immigrationSchema,
  ...graIntegrationSchema,
  ...notificationsSchema,
  ...searchSchema,
  // Phase 3 infrastructure
  ...ocrProcessingSchema,
  ...analyticsReportingSchema,
  ...enterpriseInfrastructureSchema,
  ...queueProcessingSchema,
};

export const db = drizzle(process.env.DATABASE_URL || "", { schema });

// Export all schemas for use in other parts of the application
export {
  authSchema,
  businessSchema,
  organizationsSchema,
  clientsSchema,
  usersSchema,
  rbacSchema,
  appointmentsSchema,
  taxCalculationsSchema,
  documentsSchema,
  documentManagementSchema,
  auditLogsSchema,
  enhancedAuditSchema,
  complianceSchema,
  immigrationSchema,
  graIntegrationSchema,
  notificationsSchema,
  searchSchema,
  // Phase 3 infrastructure schemas
  ocrProcessingSchema,
  analyticsReportingSchema,
  enterpriseInfrastructureSchema,
  queueProcessingSchema,
};

// Export the combined schema
export { schema };
