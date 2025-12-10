import { relations } from "drizzle-orm";
import {
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const employeeStatusEnum = pgEnum("employee_status", [
  "active",
  "inactive",
  "on_leave",
  "terminated",
]);

export const payrollRunStatusEnum = pgEnum("payroll_run_status", [
  "draft",
  "processing",
  "completed",
  "cancelled",
]);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    department: varchar("department", { length: 100 }),
    position: varchar("position", { length: 100 }),
    salary: decimal("salary", { precision: 15, scale: 2 }).default("0"),
    status: employeeStatusEnum("status").default("active").notNull(),
    startDate: timestamp("start_date"),
    tinNumber: varchar("tin_number", { length: 20 }),
    nisNumber: varchar("nis_number", { length: 20 }),
    bankAccount: text("bank_account"),
    emergencyContact: text("emergency_contact"),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("employees_organization_id_idx").on(table.organizationId),
    index("employees_email_idx").on(table.email),
    index("employees_status_idx").on(table.status),
    index("employees_department_idx").on(table.department),
  ]
);

export const payrollRuns = pgTable(
  "payroll_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    period: varchar("period", { length: 20 }).notNull(), // YYYY-MM
    payPeriodStart: timestamp("pay_period_start").notNull(),
    payPeriodEnd: timestamp("pay_period_end").notNull(),
    payDate: timestamp("pay_date"),
    status: payrollRunStatusEnum("status").default("draft").notNull(),

    // Aggregates
    employeeCount: integer("employee_count").default(0),
    totalGross: decimal("total_gross", { precision: 15, scale: 2 }).default(
      "0"
    ),
    totalNet: decimal("total_net", { precision: 15, scale: 2 }).default("0"),
    totalTax: decimal("total_tax", { precision: 15, scale: 2 }).default("0"),
    totalNis: decimal("total_nis", { precision: 15, scale: 2 }).default("0"),

    notes: text("notes"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    processedBy: text("processed_by").references(() => users.id),
  },
  (table) => [
    index("payroll_runs_organization_id_idx").on(table.organizationId),
    index("payroll_runs_period_idx").on(table.period),
    index("payroll_runs_status_idx").on(table.status),
  ]
);

// Relations
export const employeesRelations = relations(employees, ({ one }) => ({
  organization: one(organizations, {
    fields: [employees.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [employees.createdBy],
    references: [users.id],
  }),
}));

export const payrollRunsRelations = relations(payrollRuns, ({ one }) => ({
  organization: one(organizations, {
    fields: [payrollRuns.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [payrollRuns.createdBy],
    references: [users.id],
  }),
  processedByUser: one(users, {
    fields: [payrollRuns.processedBy],
    references: [users.id],
  }),
}));
