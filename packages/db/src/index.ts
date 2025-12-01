import { drizzle } from "drizzle-orm/node-postgres";
import * as analyticsReportingSchema from "./schema/analytics-reporting";
import * as appointmentsSchema from "./schema/appointments";
import * as auditLogsSchema from "./schema/audit-logs";
import * as authSchema from "./schema/auth";
import * as backupSchema from "./schema/backup";
import * as businessSchema from "./schema/business";
import * as clientsSchema from "./schema/clients";
import * as complianceSchema from "./schema/compliance";
import * as documentManagementSchema from "./schema/document-management";
import * as documentsSchema from "./schema/documents";
import * as enhancedAuditSchema from "./schema/enhanced-audit";
import * as enterpriseInfrastructureSchema from "./schema/enterprise-infrastructure";
import * as expeditingSchema from "./schema/expediting";
import * as graIntegrationSchema from "./schema/gra-integration";
import * as immigrationSchema from "./schema/immigration";
import * as localContentSchema from "./schema/local-content";
import * as notificationsSchema from "./schema/notifications";
import * as ocrProcessingSchema from "./schema/ocr-processing";
import * as organizationsSchema from "./schema/organizations";
import * as partnerNetworkSchema from "./schema/partner-network";
import * as propertyManagementSchema from "./schema/property-management";
import * as queueProcessingSchema from "./schema/queue-processing";
import * as rbacSchema from "./schema/rbac";
import * as searchSchema from "./schema/search";
import * as serviceCatalogSchema from "./schema/service-catalog";
import * as taxCalculationsSchema from "./schema/tax-calculations";
import * as trainingSchema from "./schema/training";
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
  // Phase 4: Backup & Recovery, Service Catalog
  ...backupSchema,
  ...serviceCatalogSchema,
  // Phase 5: Extended Business Modules
  ...propertyManagementSchema,
  ...expeditingSchema,
  ...trainingSchema,
  ...localContentSchema,
  ...partnerNetworkSchema,
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
  // Phase 4: Backup & Recovery, Service Catalog
  backupSchema,
  serviceCatalogSchema,
  // Phase 5: Extended Business Modules
  propertyManagementSchema,
  expeditingSchema,
  trainingSchema,
  localContentSchema,
  partnerNetworkSchema,
};

// Export the combined schema
export { schema };
