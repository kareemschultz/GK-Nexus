import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { organizations } from "./organizations";
import { users } from "./users";

// Enums for tax calculations
export const taxTypeEnum = pgEnum("tax_type", [
  "paye", // Pay As You Earn
  "nis", // National Insurance Scheme
  "vat", // Value Added Tax
  "corporate_tax",
  "withholding_tax",
  "land_tax",
  "stamp_duty",
  "customs_duty",
  "excise_tax",
]);

export const taxPeriodTypeEnum = pgEnum("tax_period_type", [
  "monthly",
  "quarterly",
  "annually",
  "one_time",
]);

export const calculationStatusEnum = pgEnum("calculation_status", [
  "draft",
  "calculated",
  "verified",
  "submitted",
  "paid",
  "overdue",
  "amended",
]);

export const payeFrequencyEnum = pgEnum("paye_frequency", [
  "weekly",
  "bi_weekly",
  "monthly",
  "annually",
]);

export const nisClassEnum = pgEnum("nis_class", [
  "class_1", // Employed persons
  "class_2", // Self-employed persons
  "class_3", // Voluntary contributors
]);

export const vatRateTypeEnum = pgEnum("vat_rate_type", [
  "standard", // 12.5% in Guyana (updated from Barbados 17.5%)
  "zero_rated",
  "exempt",
]);

// PAYE (Pay As You Earn) Calculations
export const payeCalculations = pgTable(
  "paye_calculations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    // Period information
    taxYear: integer("tax_year").notNull(),
    taxMonth: integer("tax_month"), // 1-12, null for annual calculations
    payPeriod: text("pay_period"), // e.g., "2024-01" for monthly
    frequency: payeFrequencyEnum("frequency").notNull(),

    // Employee information
    employeeCount: integer("employee_count").notNull(),
    totalGrossPay: decimal("total_gross_pay", {
      precision: 15,
      scale: 2,
    }).notNull(),
    totalTaxableIncome: decimal("total_taxable_income", {
      precision: 15,
      scale: 2,
    }).notNull(),

    // Deductions and allowances
    personalAllowances: decimal("personal_allowances", {
      precision: 15,
      scale: 2,
    }).default("0"),
    pensionContributions: decimal("pension_contributions", {
      precision: 15,
      scale: 2,
    }).default("0"),
    otherDeductions: decimal("other_deductions", {
      precision: 15,
      scale: 2,
    }).default("0"),

    // Tax calculations
    taxableAmount: decimal("taxable_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 4 }), // e.g., 0.175 for 17.5%
    taxCalculated: decimal("tax_calculated", {
      precision: 15,
      scale: 2,
    }).notNull(),
    previouslyPaid: decimal("previously_paid", {
      precision: 15,
      scale: 2,
    }).default("0"),
    taxDue: decimal("tax_due", { precision: 15, scale: 2 }).notNull(),

    // Status and submission
    status: calculationStatusEnum("status").default("draft").notNull(),
    submissionDate: date("submission_date"),
    paymentDate: date("payment_date"),
    dueDate: date("due_date").notNull(),

    // Additional information
    notes: text("notes"),
    calculationDetails: text("calculation_details"), // JSON object with breakdown
    amendments: text("amendments"), // JSON array of amendment history

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("paye_calculations_org_id_idx").on(table.organizationId),
    index("paye_calculations_client_id_idx").on(table.clientId),
    index("paye_calculations_tax_year_idx").on(table.taxYear),
    index("paye_calculations_pay_period_idx").on(table.payPeriod),
    index("paye_calculations_status_idx").on(table.status),
    index("paye_calculations_due_date_idx").on(table.dueDate),
    // Composite indexes for common query patterns
    index("paye_calculations_org_year_idx").on(
      table.organizationId,
      table.taxYear
    ),
    index("paye_calculations_org_status_idx").on(
      table.organizationId,
      table.status
    ),
    index("paye_calculations_client_year_idx").on(
      table.clientId,
      table.taxYear
    ),
    index("paye_calculations_status_due_date_idx").on(
      table.status,
      table.dueDate
    ),
  ]
);

// NIS (National Insurance Scheme) Calculations
export const nisCalculations = pgTable(
  "nis_calculations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    // Period information
    contributionYear: integer("contribution_year").notNull(),
    contributionMonth: integer("contribution_month"), // 1-12, null for annual calculations
    payPeriod: text("pay_period"), // e.g., "2024-01" for monthly

    // Contribution details
    nisClass: nisClassEnum("nis_class").notNull(),
    totalEarnings: decimal("total_earnings", {
      precision: 15,
      scale: 2,
    }).notNull(),
    insutableEarnings: decimal("insutable_earnings", {
      precision: 15,
      scale: 2,
    }).notNull(),
    contributionRate: decimal("contribution_rate", { precision: 5, scale: 4 }), // e.g., 0.1075

    // Calculations
    employeeContribution: decimal("employee_contribution", {
      precision: 15,
      scale: 2,
    }).notNull(),
    employerContribution: decimal("employer_contribution", {
      precision: 15,
      scale: 2,
    }).notNull(),
    totalContribution: decimal("total_contribution", {
      precision: 15,
      scale: 2,
    }).notNull(),
    previouslyPaid: decimal("previously_paid", {
      precision: 15,
      scale: 2,
    }).default("0"),
    contributionDue: decimal("contribution_due", {
      precision: 15,
      scale: 2,
    }).notNull(),

    // Status and submission
    status: calculationStatusEnum("status").default("draft").notNull(),
    submissionDate: date("submission_date"),
    paymentDate: date("payment_date"),
    dueDate: date("due_date").notNull(),

    // Additional information
    employeeCount: integer("employee_count"),
    notes: text("notes"),
    calculationDetails: text("calculation_details"), // JSON object with breakdown

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("nis_calculations_org_id_idx").on(table.organizationId),
    index("nis_calculations_client_id_idx").on(table.clientId),
    index("nis_calculations_year_idx").on(table.contributionYear),
    index("nis_calculations_pay_period_idx").on(table.payPeriod),
    index("nis_calculations_status_idx").on(table.status),
    index("nis_calculations_due_date_idx").on(table.dueDate),
    index("nis_calculations_nis_class_idx").on(table.nisClass),
    // Composite indexes for common query patterns
    index("nis_calculations_org_year_idx").on(
      table.organizationId,
      table.contributionYear
    ),
    index("nis_calculations_org_status_idx").on(
      table.organizationId,
      table.status
    ),
    index("nis_calculations_client_year_idx").on(
      table.clientId,
      table.contributionYear
    ),
    index("nis_calculations_class_year_idx").on(
      table.nisClass,
      table.contributionYear
    ),
  ]
);

// VAT (Value Added Tax) Calculations
export const vatCalculations = pgTable(
  "vat_calculations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    // Period information
    taxYear: integer("tax_year").notNull(),
    taxQuarter: integer("tax_quarter"), // 1-4, null for monthly/annual
    taxMonth: integer("tax_month"), // 1-12, null for quarterly/annual
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),

    // Sales and outputs
    totalSales: decimal("total_sales", { precision: 15, scale: 2 }).notNull(),
    standardRatedSales: decimal("standard_rated_sales", {
      precision: 15,
      scale: 2,
    }).default("0"),
    zeroRatedSales: decimal("zero_rated_sales", {
      precision: 15,
      scale: 2,
    }).default("0"),
    exemptSales: decimal("exempt_sales", { precision: 15, scale: 2 }).default(
      "0"
    ),
    outputVat: decimal("output_vat", { precision: 15, scale: 2 }).notNull(),

    // Purchases and inputs
    totalPurchases: decimal("total_purchases", {
      precision: 15,
      scale: 2,
    }).notNull(),
    standardRatedPurchases: decimal("standard_rated_purchases", {
      precision: 15,
      scale: 2,
    }).default("0"),
    zeroRatedPurchases: decimal("zero_rated_purchases", {
      precision: 15,
      scale: 2,
    }).default("0"),
    exemptPurchases: decimal("exempt_purchases", {
      precision: 15,
      scale: 2,
    }).default("0"),
    inputVat: decimal("input_vat", { precision: 15, scale: 2 }).notNull(),

    // VAT calculation
    netVat: decimal("net_vat", { precision: 15, scale: 2 }).notNull(), // Output VAT - Input VAT
    vatRate: decimal("vat_rate", { precision: 5, scale: 4 }).default("0.125"), // 12.5% Guyana standard rate
    adjustments: decimal("adjustments", { precision: 15, scale: 2 }).default(
      "0"
    ),
    penaltiesInterest: decimal("penalties_interest", {
      precision: 15,
      scale: 2,
    }).default("0"),
    totalVatDue: decimal("total_vat_due", {
      precision: 15,
      scale: 2,
    }).notNull(),

    // Status and submission
    status: calculationStatusEnum("status").default("draft").notNull(),
    submissionDate: date("submission_date"),
    paymentDate: date("payment_date"),
    dueDate: date("due_date").notNull(),

    // Supporting information
    vatRegistrationNumber: text("vat_registration_number"),
    returnType: text("return_type").default("standard").notNull(), // standard, cash_basis, annual
    notes: text("notes"),
    calculationDetails: text("calculation_details"), // JSON object with detailed breakdown

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("vat_calculations_org_id_idx").on(table.organizationId),
    index("vat_calculations_client_id_idx").on(table.clientId),
    index("vat_calculations_tax_year_idx").on(table.taxYear),
    index("vat_calculations_quarter_idx").on(table.taxQuarter),
    index("vat_calculations_period_start_idx").on(table.periodStart),
    index("vat_calculations_status_idx").on(table.status),
    index("vat_calculations_due_date_idx").on(table.dueDate),
    index("vat_calculations_registration_number_idx").on(
      table.vatRegistrationNumber
    ),
    // Composite indexes for common query patterns
    index("vat_calculations_org_year_idx").on(
      table.organizationId,
      table.taxYear
    ),
    index("vat_calculations_org_status_idx").on(
      table.organizationId,
      table.status
    ),
    index("vat_calculations_client_year_idx").on(table.clientId, table.taxYear),
    index("vat_calculations_year_quarter_idx").on(
      table.taxYear,
      table.taxQuarter
    ),
    index("vat_calculations_period_range_idx").on(
      table.periodStart,
      table.periodEnd
    ),
  ]
);

// Tax rates and brackets configuration
export const taxRates = pgTable(
  "tax_rates",
  {
    id: text("id").primaryKey(),
    taxType: taxTypeEnum("tax_type").notNull(),
    name: text("name").notNull(),
    description: text("description"),

    // Rate configuration
    rate: decimal("rate", { precision: 5, scale: 4 }).notNull(), // e.g., 0.175 for 17.5%
    minIncome: decimal("min_income", { precision: 15, scale: 2 }), // Minimum income for this bracket
    maxIncome: decimal("max_income", { precision: 15, scale: 2 }), // Maximum income for this bracket
    fixedAmount: decimal("fixed_amount", { precision: 15, scale: 2 }), // Fixed amount for this bracket

    // Validity period
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    taxYear: integer("tax_year"),

    // Additional configuration
    isActive: boolean("is_active").default(true).notNull(),
    country: text("country").default("Guyana").notNull(),
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("tax_rates_tax_type_idx").on(table.taxType),
    index("tax_rates_effective_from_idx").on(table.effectiveFrom),
    index("tax_rates_tax_year_idx").on(table.taxYear),
    index("tax_rates_is_active_idx").on(table.isActive),
  ]
);

// Relations
export const payeCalculationsRelations = relations(
  payeCalculations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [payeCalculations.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [payeCalculations.clientId],
      references: [clients.id],
    }),
    createdByUser: one(users, {
      fields: [payeCalculations.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [payeCalculations.updatedBy],
      references: [users.id],
    }),
  })
);

export const nisCalculationsRelations = relations(
  nisCalculations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [nisCalculations.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [nisCalculations.clientId],
      references: [clients.id],
    }),
    createdByUser: one(users, {
      fields: [nisCalculations.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [nisCalculations.updatedBy],
      references: [users.id],
    }),
  })
);

export const vatCalculationsRelations = relations(
  vatCalculations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [vatCalculations.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [vatCalculations.clientId],
      references: [clients.id],
    }),
    createdByUser: one(users, {
      fields: [vatCalculations.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [vatCalculations.updatedBy],
      references: [users.id],
    }),
  })
);

export const taxRatesRelations = relations(taxRates, ({ one }) => ({
  createdByUser: one(users, {
    fields: [taxRates.createdBy],
    references: [users.id],
  }),
}));
