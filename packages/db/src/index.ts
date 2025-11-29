import { drizzle } from "drizzle-orm/node-postgres";
import * as appointmentsSchema from "./schema/appointments";
import * as auditLogsSchema from "./schema/audit-logs";
import * as authSchema from "./schema/auth";
import * as businessSchema from "./schema/business";
import * as clientsSchema from "./schema/clients";
import * as complianceSchema from "./schema/compliance";
import * as documentsSchema from "./schema/documents";
import * as notificationsSchema from "./schema/notifications";

import * as rbacSchema from "./schema/rbac";
import * as searchSchema from "./schema/search";
import * as taxCalculationsSchema from "./schema/tax-calculations";
import * as usersSchema from "./schema/users";

const schema = {
  ...authSchema,
  ...businessSchema,
  ...clientsSchema,
  ...appointmentsSchema,
  ...taxCalculationsSchema,
  ...documentsSchema,
  ...auditLogsSchema,
  ...complianceSchema,
  ...rbacSchema,
  ...usersSchema,
  ...notificationsSchema,
  ...searchSchema,

  // New enhanced schemas
  ...organizationsSchema,
  ...graIntegrationSchema,
  ...documentManagementSchema,
  ...immigrationSchema,
  ...enhancedAuditSchema,
};

export const db = drizzle(process.env.DATABASE_URL || "", { schema });

// Export all schemas for use in other parts of the application
export {
  authSchema,
  businessSchema,
  clientsSchema,
  appointmentsSchema,
  taxCalculationsSchema,
  documentsSchema,
  auditLogsSchema,
  complianceSchema,
  rbacSchema,
  usersSchema,
  notificationsSchema,
  searchSchema,
  // New enhanced schemas
  type organizationsSchema,
  type graIntegrationSchema,
  type documentManagementSchema,
  type immigrationSchema,
  type enhancedAuditSchema,
};

// Export the combined schema
export { schema };
