import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { organizations } from "./organizations";
import { users } from "./users";

// Report types and categories
export const reportTypeEnum = pgEnum("report_type", [
  "financial_summary",
  "tax_compliance",
  "client_activity",
  "revenue_analysis",
  "expense_tracking",
  "profit_loss",
  "cash_flow",
  "balance_sheet",
  "tax_liability",
  "client_profitability",
  "service_performance",
  "compliance_status",
  "audit_trail",
  "custom_analytics",
]);

export const reportCategoryEnum = pgEnum("report_category", [
  "financial",
  "compliance",
  "operational",
  "client_management",
  "business_intelligence",
  "regulatory",
  "audit",
  "performance",
]);

// Report status and scheduling
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "generating",
  "completed",
  "failed",
  "cancelled",
  "scheduled",
]);

export const reportFrequencyEnum = pgEnum("report_frequency", [
  "on_demand",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annually",
]);

// Data visualization types
export const visualizationTypeEnum = pgEnum("visualization_type", [
  "table",
  "chart_line",
  "chart_bar",
  "chart_pie",
  "chart_scatter",
  "chart_area",
  "heatmap",
  "dashboard",
  "kpi_metrics",
]);

// Report templates for standardized reporting
export const reportTemplates = pgTable(
  "report_templates",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),

    // Template identification
    templateName: text("template_name").notNull(),
    description: text("description"),
    reportType: reportTypeEnum("report_type").notNull(),
    category: reportCategoryEnum("category").notNull(),
    version: text("version").default("1.0").notNull(),

    // Template configuration
    dataSourceConfig: jsonb("data_source_config").notNull().$type<{
      // Data source definitions
      dataSources: Array<{
        id: string;
        name: string;
        type: string; // database_table, api_endpoint, file_import, calculated
        source: string; // table name, endpoint URL, etc.
        filters?: any;
        joins?: Array<{
          table: string;
          type: string;
          conditions: string;
        }>;
      }>;

      // Time range configuration
      defaultTimeRange: {
        type: string; // fixed, relative, custom
        start?: string;
        end?: string;
        period?: string; // last_30_days, current_month, etc.
      };

      // Filtering and grouping
      availableFilters: Array<{
        field: string;
        type: string; // text, number, date, select
        options?: any[];
        required?: boolean;
      }>;

      groupBy?: Array<{
        field: string;
        aggregation?: string;
      }>;
    }>(),

    // Report structure and layout
    reportStructure: jsonb("report_structure").notNull().$type<{
      // Report sections
      sections: Array<{
        id: string;
        title: string;
        type: string; // summary, detailed, visualization
        order: number;
        config: {
          columns?: Array<{
            field: string;
            title: string;
            type: string;
            format?: string;
            aggregation?: string;
          }>;
          visualization?: {
            type: string;
            config: any;
          };
          filters?: any;
          sorting?: any;
        };
      }>;

      // Summary metrics/KPIs
      summaryMetrics?: Array<{
        id: string;
        title: string;
        field: string;
        aggregation: string; // sum, avg, count, max, min
        format: string;
        comparison?: {
          period: string;
          type: string; // percentage, absolute
        };
      }>;

      // Page layout settings
      layout: {
        orientation: string; // portrait, landscape
        pageSize: string; // A4, letter, custom
        margins: any;
        header?: any;
        footer?: any;
      };
    }>(),

    // Output format configuration
    outputFormats:
      jsonb("output_formats").$type<
        Array<{
          format: string; // pdf, excel, csv, json
          config: any;
          isDefault: boolean;
        }>
      >(),

    // Access control and permissions
    isPublic: boolean("is_public").default(false).notNull(),
    accessLevel: text("access_level").default("organization").notNull(), // organization, client_specific, user_specific
    allowedRoles: jsonb("allowed_roles").$type<string[]>(),
    allowedUsers: jsonb("allowed_users").$type<string[]>(),

    // Usage and performance tracking
    isActive: boolean("is_active").default(true).notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
    averageGenerationTime: integer("average_generation_time"), // milliseconds
    lastUsedAt: timestamp("last_used_at"),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    unique("report_templates_org_name_version_unique").on(
      table.organizationId,
      table.templateName,
      table.version
    ),
    index("report_templates_org_id_idx").on(table.organizationId),
    index("report_templates_type_idx").on(table.reportType),
    index("report_templates_category_idx").on(table.category),
    index("report_templates_is_active_idx").on(table.isActive),
    index("report_templates_is_public_idx").on(table.isPublic),
    index("report_templates_last_used_idx").on(table.lastUsedAt),
  ]
);

// Generated reports and execution history
export const generatedReports = pgTable(
  "generated_reports",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "cascade",
    }),

    // Report identification
    templateId: text("template_id").references(() => reportTemplates.id, {
      onDelete: "cascade",
    }),
    reportTitle: text("report_title").notNull(),
    reportType: reportTypeEnum("report_type").notNull(),
    category: reportCategoryEnum("category").notNull(),

    // Generation parameters
    parameters: jsonb("parameters").$type<{
      // Time range
      dateFrom: string;
      dateTo: string;
      timeZone?: string;

      // Filters applied
      filters: Record<string, any>;

      // Grouping and aggregation
      groupBy?: string[];
      aggregations?: Record<string, string>;

      // Output format
      outputFormat: string;
      includeCharts: boolean;
      includeRawData: boolean;

      // Client-specific parameters
      clientIds?: string[];
      includeConfidential?: boolean;
    }>(),

    // Generation status and timing
    status: reportStatusEnum("status").default("pending").notNull(),
    scheduledFor: timestamp("scheduled_for"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    generationTime: integer("generation_time"), // milliseconds

    // Report data and metadata
    reportData: jsonb("report_data"), // Processed data for the report
    summaryMetrics: jsonb("summary_metrics").$type<Record<string, any>>(),
    totalRecords: integer("total_records"),
    dataHash: text("data_hash"), // Hash for change detection

    // Output files and storage
    outputFiles:
      jsonb("output_files").$type<
        Array<{
          format: string;
          filename: string;
          size: number;
          url?: string;
          downloadCount: number;
          expiresAt?: string;
        }>
      >(),

    // Sharing and distribution
    isShared: boolean("is_shared").default(false).notNull(),
    shareToken: text("share_token"), // For secure sharing
    shareExpiresAt: timestamp("share_expires_at"),
    emailedTo:
      jsonb("emailed_to").$type<
        Array<{
          email: string;
          sentAt: string;
          opened?: boolean;
          downloaded?: boolean;
        }>
      >(),

    // Error handling
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"),
    retryCount: integer("retry_count").default(0).notNull(),

    // Performance and caching
    cacheKey: text("cache_key"),
    cacheExpiresAt: timestamp("cache_expires_at"),
    resourceUsage: jsonb("resource_usage").$type<{
      cpuTime: number;
      memoryUsage: number;
      queryExecutionTime: number;
      dataProcessingTime: number;
      renderingTime: number;
    }>(),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    generatedBy: text("generated_by")
      .notNull()
      .references(() => users.id),
    requestedBy: text("requested_by").references(() => users.id),
  },
  (table) => [
    index("generated_reports_org_id_idx").on(table.organizationId),
    index("generated_reports_client_id_idx").on(table.clientId),
    index("generated_reports_template_id_idx").on(table.templateId),
    index("generated_reports_type_idx").on(table.reportType),
    index("generated_reports_status_idx").on(table.status),
    index("generated_reports_scheduled_for_idx").on(table.scheduledFor),
    index("generated_reports_completed_at_idx").on(table.completedAt),
    index("generated_reports_share_token_idx").on(table.shareToken),
    index("generated_reports_cache_key_idx").on(table.cacheKey),
    index("generated_reports_generated_by_idx").on(table.generatedBy),
  ]
);

// Report scheduling and automation
export const reportSchedules = pgTable(
  "report_schedules",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Schedule identification
    scheduleName: text("schedule_name").notNull(),
    description: text("description"),
    templateId: text("template_id")
      .notNull()
      .references(() => reportTemplates.id, { onDelete: "cascade" }),

    // Scheduling configuration
    frequency: reportFrequencyEnum("frequency").notNull(),
    scheduleConfig: jsonb("schedule_config").$type<{
      // Cron expression for complex schedules
      cronExpression?: string;

      // Simple schedule settings
      hour?: number;
      minute?: number;
      dayOfWeek?: number; // 0-6, Sunday = 0
      dayOfMonth?: number; // 1-31
      monthOfYear?: number; // 1-12

      // Time zone for schedule
      timeZone: string;

      // Date range for schedule
      startDate?: string;
      endDate?: string;

      // Holiday handling
      skipHolidays?: boolean;
      holidayCalendar?: string;
    }>(),

    // Report parameters for scheduled generation
    defaultParameters: jsonb("default_parameters").$type<{
      // Dynamic time ranges (e.g., "last_month", "previous_quarter")
      timeRange: {
        type: string; // relative, fixed
        period?: string;
        offset?: number;
      };

      filters: Record<string, any>;
      outputFormats: string[];
      includeCharts: boolean;
    }>(),

    // Distribution settings
    distributionConfig: jsonb("distribution_config").$type<{
      // Email distribution
      emailRecipients: Array<{
        email: string;
        type: string; // to, cc, bcc
        conditions?: any; // Conditional sending
      }>;

      // Automatic storage/upload
      storageTargets?: Array<{
        type: string; // s3, ftp, drive, sharepoint
        config: any;
        formats: string[];
      }>;

      // Webhook notifications
      webhooks?: Array<{
        url: string;
        method: string;
        headers?: Record<string, string>;
        payload?: any;
      }>;
    }>(),

    // Schedule status and tracking
    isActive: boolean("is_active").default(true).notNull(),
    lastRunAt: timestamp("last_run_at"),
    nextRunAt: timestamp("next_run_at"),
    successfulRuns: integer("successful_runs").default(0).notNull(),
    failedRuns: integer("failed_runs").default(0).notNull(),
    lastError: text("last_error"),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    unique("report_schedules_org_name_unique").on(
      table.organizationId,
      table.scheduleName
    ),
    index("report_schedules_org_id_idx").on(table.organizationId),
    index("report_schedules_template_id_idx").on(table.templateId),
    index("report_schedules_frequency_idx").on(table.frequency),
    index("report_schedules_is_active_idx").on(table.isActive),
    index("report_schedules_next_run_at_idx").on(table.nextRunAt),
    index("report_schedules_last_run_at_idx").on(table.lastRunAt),
  ]
);

// Analytics dashboards and KPI tracking
export const analyticsDashboards = pgTable(
  "analytics_dashboards",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Dashboard identification
    dashboardName: text("dashboard_name").notNull(),
    description: text("description"),
    category: reportCategoryEnum("category").notNull(),

    // Dashboard configuration
    layout: jsonb("layout").$type<{
      // Grid layout configuration
      columns: number;
      rows: number;
      gap: number;

      // Widget positioning
      widgets: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        minWidth?: number;
        minHeight?: number;
      }>;
    }>(),

    // Widget definitions
    widgets: jsonb("widgets").notNull().$type<
      Array<{
        id: string;
        type: string; // kpi, chart, table, metric
        title: string;
        description?: string;

        // Data source configuration
        dataSource: {
          type: string;
          query: string;
          parameters?: Record<string, any>;
          refreshInterval?: number; // seconds
        };

        // Visualization configuration
        visualization: {
          type: string;
          config: any;
          formatting?: {
            numberFormat?: string;
            dateFormat?: string;
            colorScheme?: string;
          };
        };

        // Interactive features
        interactions?: {
          drillDown?: boolean;
          filtering?: boolean;
          export?: boolean;
        };
      }>
    >(),

    // Dashboard settings
    refreshInterval: integer("refresh_interval").default(300).notNull(), // seconds
    autoRefresh: boolean("auto_refresh").default(true).notNull(),
    isPublic: boolean("is_public").default(false).notNull(),

    // Access control
    accessLevel: text("access_level").default("organization").notNull(),
    allowedRoles: jsonb("allowed_roles").$type<string[]>(),
    allowedUsers: jsonb("allowed_users").$type<string[]>(),

    // Performance and caching
    cacheSettings: jsonb("cache_settings").$type<{
      enableCaching: boolean;
      cacheTtl: number;
      smartRefresh: boolean; // Only refresh changed data
    }>(),

    // Usage tracking
    viewCount: integer("view_count").default(0).notNull(),
    lastViewedAt: timestamp("last_viewed_at"),
    averageLoadTime: integer("average_load_time"), // milliseconds

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    unique("dashboards_org_name_unique").on(
      table.organizationId,
      table.dashboardName
    ),
    index("dashboards_org_id_idx").on(table.organizationId),
    index("dashboards_category_idx").on(table.category),
    index("dashboards_is_public_idx").on(table.isPublic),
    index("dashboards_last_viewed_idx").on(table.lastViewedAt),
  ]
);

// Data aggregation and pre-computed metrics for performance
export const analyticsMetrics = pgTable(
  "analytics_metrics",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Metric identification
    metricName: text("metric_name").notNull(),
    metricType: text("metric_type").notNull(), // revenue, count, average, ratio
    category: text("category").notNull(),
    dimension: text("dimension"), // client, service, period, etc.

    // Time-based aggregation
    periodType: text("period_type").notNull(), // day, week, month, quarter, year
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),

    // Metric values
    value: text("value").notNull(), // Using text for high precision numbers
    count: integer("count"), // Number of records contributing to metric

    // Additional metric data
    metadata: jsonb("metadata").$type<{
      // Breakdown by subcategories
      breakdown?: Record<string, number>;

      // Comparison with previous period
      previousValue?: number;
      changePercent?: number;
      changeAbsolute?: number;

      // Data quality indicators
      confidence?: number;
      completeness?: number;

      // Source information
      sources?: string[];
      lastUpdated?: string;
    }>(),

    // Aggregation hierarchy (for drill-down capabilities)
    parentMetricId: text("parent_metric_id").references(
      () => analyticsMetrics.id
    ),
    hierarchyLevel: integer("hierarchy_level").default(0).notNull(),

    // Cache and performance
    computationTime: integer("computation_time"), // milliseconds
    isPrecomputed: boolean("is_precomputed").default(true).notNull(),

    // Data freshness
    sourceDataTimestamp: timestamp("source_data_timestamp"),
    stalenessThreshold: integer("staleness_threshold"), // minutes

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("analytics_metrics_org_name_period_unique").on(
      table.organizationId,
      table.metricName,
      table.dimension,
      table.periodStart
    ),
    index("analytics_metrics_org_id_idx").on(table.organizationId),
    index("analytics_metrics_name_idx").on(table.metricName),
    index("analytics_metrics_type_idx").on(table.metricType),
    index("analytics_metrics_category_idx").on(table.category),
    index("analytics_metrics_period_idx").on(
      table.periodStart,
      table.periodEnd
    ),
    index("analytics_metrics_parent_idx").on(table.parentMetricId),
    index("analytics_metrics_hierarchy_idx").on(table.hierarchyLevel),
  ]
);

// Relations
export const reportTemplatesRelations = relations(
  reportTemplates,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [reportTemplates.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [reportTemplates.createdBy],
      references: [users.id],
      relationName: "reportTemplateCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [reportTemplates.updatedBy],
      references: [users.id],
      relationName: "reportTemplateUpdatedBy",
    }),
    generatedReports: many(generatedReports),
    schedules: many(reportSchedules),
  })
);

export const generatedReportsRelations = relations(
  generatedReports,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [generatedReports.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [generatedReports.clientId],
      references: [clients.id],
    }),
    template: one(reportTemplates, {
      fields: [generatedReports.templateId],
      references: [reportTemplates.id],
    }),
    generatedByUser: one(users, {
      fields: [generatedReports.generatedBy],
      references: [users.id],
      relationName: "reportGeneratedBy",
    }),
    requestedByUser: one(users, {
      fields: [generatedReports.requestedBy],
      references: [users.id],
      relationName: "reportRequestedBy",
    }),
  })
);

export const reportSchedulesRelations = relations(
  reportSchedules,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [reportSchedules.organizationId],
      references: [organizations.id],
    }),
    template: one(reportTemplates, {
      fields: [reportSchedules.templateId],
      references: [reportTemplates.id],
    }),
    createdByUser: one(users, {
      fields: [reportSchedules.createdBy],
      references: [users.id],
      relationName: "scheduleCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [reportSchedules.updatedBy],
      references: [users.id],
      relationName: "scheduleUpdatedBy",
    }),
  })
);

export const analyticsDashboardsRelations = relations(
  analyticsDashboards,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [analyticsDashboards.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [analyticsDashboards.createdBy],
      references: [users.id],
      relationName: "dashboardCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [analyticsDashboards.updatedBy],
      references: [users.id],
      relationName: "dashboardUpdatedBy",
    }),
  })
);

export const analyticsMetricsRelations = relations(
  analyticsMetrics,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [analyticsMetrics.organizationId],
      references: [organizations.id],
    }),
    parentMetric: one(analyticsMetrics, {
      fields: [analyticsMetrics.parentMetricId],
      references: [analyticsMetrics.id],
      relationName: "parentMetric",
    }),
    childMetrics: many(analyticsMetrics, {
      relationName: "parentMetric",
    }),
  })
);

// Export types
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type NewReportTemplate = typeof reportTemplates.$inferInsert;
export type GeneratedReport = typeof generatedReports.$inferSelect;
export type NewGeneratedReport = typeof generatedReports.$inferInsert;
export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type NewReportSchedule = typeof reportSchedules.$inferInsert;
export type AnalyticsDashboard = typeof analyticsDashboards.$inferSelect;
export type NewAnalyticsDashboard = typeof analyticsDashboards.$inferInsert;
export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type NewAnalyticsMetric = typeof analyticsMetrics.$inferInsert;
