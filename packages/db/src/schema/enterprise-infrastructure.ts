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
import { organizations } from "./organizations";
import { users } from "./users";

// System monitoring and performance tracking
export const monitoringMetricTypeEnum = pgEnum("monitoring_metric_type", [
  "system_cpu",
  "system_memory",
  "system_disk",
  "system_network",
  "application_response_time",
  "application_throughput",
  "application_error_rate",
  "database_connections",
  "database_query_time",
  "api_request_count",
  "api_error_count",
  "user_session_count",
  "business_kpi",
]);

export const alertSeverityEnum = pgEnum("alert_severity", [
  "critical",
  "warning",
  "info",
  "low",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "active",
  "acknowledged",
  "resolved",
  "suppressed",
]);

// System health and monitoring metrics
export const systemMonitoring = pgTable(
  "system_monitoring",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Metric identification
    metricName: text("metric_name").notNull(),
    metricType: monitoringMetricTypeEnum("metric_type").notNull(),
    source: text("source").notNull(), // server_name, application_component, etc.
    tags: jsonb("tags").$type<Record<string, string>>(), // Additional metadata tags

    // Metric values and statistics
    value: text("value").notNull(), // Using text for high precision
    unit: text("unit"), // cpu_percent, bytes, milliseconds, etc.
    timestamp: timestamp("timestamp").notNull(),

    // Aggregated statistics (for time windows)
    aggregationPeriod: text("aggregation_period"), // 1m, 5m, 15m, 1h, 1d
    minValue: text("min_value"),
    maxValue: text("max_value"),
    avgValue: text("avg_value"),
    sumValue: text("sum_value"),
    sampleCount: integer("sample_count"),

    // Threshold and alerting context
    thresholds: jsonb("thresholds").$type<{
      critical?: number;
      warning?: number;
      info?: number;
    }>(),

    // Data quality and collection metadata
    collectionMethod: text("collection_method"), // agent, api, manual
    dataQuality: integer("data_quality"), // 0-100 quality score
    collectorVersion: text("collector_version"),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("system_monitoring_org_id_idx").on(table.organizationId),
    index("system_monitoring_metric_name_idx").on(table.metricName),
    index("system_monitoring_metric_type_idx").on(table.metricType),
    index("system_monitoring_source_idx").on(table.source),
    index("system_monitoring_timestamp_idx").on(table.timestamp),
    index("system_monitoring_aggregation_period_idx").on(
      table.aggregationPeriod
    ),
    // Composite index for time-series queries
    index("system_monitoring_metric_time_idx").on(
      table.metricName,
      table.source,
      table.timestamp
    ),
  ]
);

// Alert definitions and rules
export const alertRules = pgTable(
  "alert_rules",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Rule identification
    ruleName: text("rule_name").notNull(),
    description: text("description"),
    category: text("category").notNull(), // system, application, business, security

    // Alert condition configuration
    metricQuery: jsonb("metric_query").notNull().$type<{
      metricName: string;
      aggregation: string; // avg, max, min, sum, count
      timeWindow: string; // 1m, 5m, 15m, 30m, 1h
      filters?: Record<string, any>;
    }>(),

    // Threshold configuration
    conditions: jsonb("conditions").notNull().$type<
      {
        operator: string; // gt, lt, gte, lte, eq, ne
        value: number;
        severity: string;
      }[]
    >(),

    // Alert behavior
    evaluationInterval: integer("evaluation_interval").default(60).notNull(), // seconds
    alertCooldown: integer("alert_cooldown").default(300).notNull(), // seconds
    autoResolve: boolean("auto_resolve").default(true).notNull(),
    autoResolveTimeout: integer("auto_resolve_timeout").default(3600), // seconds

    // Notification configuration
    notificationChannels: jsonb("notification_channels").$type<
      Array<{
        type: string; // email, slack, webhook, sms, pagerduty
        config: any;
        severityFilter?: string[];
      }>
    >(),

    // Rule status and metadata
    isActive: boolean("is_active").default(true).notNull(),
    lastEvaluated: timestamp("last_evaluated"),
    evaluationCount: integer("evaluation_count").default(0).notNull(),
    alertCount: integer("alert_count").default(0).notNull(),

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
    unique("alert_rules_org_name_unique").on(
      table.organizationId,
      table.ruleName
    ),
    index("alert_rules_org_id_idx").on(table.organizationId),
    index("alert_rules_category_idx").on(table.category),
    index("alert_rules_is_active_idx").on(table.isActive),
    index("alert_rules_last_evaluated_idx").on(table.lastEvaluated),
  ]
);

// Active alerts and incidents
export const activeAlerts: any = pgTable(
  "active_alerts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Alert identification
    ruleId: text("rule_id")
      .notNull()
      .references(() => alertRules.id, { onDelete: "cascade" }),
    alertKey: text("alert_key").notNull(), // Unique identifier for this alert instance

    // Alert details
    title: text("title").notNull(),
    description: text("description"),
    severity: alertSeverityEnum("severity").notNull(),
    status: alertStatusEnum("status").default("active").notNull(),

    // Triggering metrics and context
    triggerValue: text("trigger_value").notNull(),
    triggerTimestamp: timestamp("trigger_timestamp").notNull(),
    triggerMetrics: jsonb("trigger_metrics"), // Snapshot of metrics that triggered alert

    // Alert lifecycle
    firstSeen: timestamp("first_seen").notNull(),
    lastSeen: timestamp("last_seen").notNull(),
    acknowledgedAt: timestamp("acknowledged_at"),
    acknowledgedBy: text("acknowledged_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by").references(() => users.id),
    resolutionNote: text("resolution_note"),

    // Impact assessment
    affectedServices: jsonb("affected_services").$type<string[]>(),
    affectedUsers: integer("affected_users"),
    businessImpact: text("business_impact"), // low, medium, high, critical

    // Escalation and assignment
    assignedTo: text("assigned_to").references(() => users.id),
    escalationLevel: integer("escalation_level").default(0).notNull(),
    escalationHistory:
      jsonb("escalation_history").$type<
        Array<{
          level: number;
          timestamp: string;
          assignedTo?: string;
          reason: string;
        }>
      >(),

    // Notification tracking
    notificationsSent:
      jsonb("notifications_sent").$type<
        Array<{
          channel: string;
          timestamp: string;
          success: boolean;
          error?: string;
        }>
      >(),

    // Alert correlation and grouping
    parentAlertId: text("parent_alert_id").references(
      (): any => activeAlerts.id
    ),
    correlationKey: text("correlation_key"), // For grouping related alerts
    suppressedBy: text("suppressed_by").references((): any => activeAlerts.id),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("active_alerts_alert_key_unique").on(table.alertKey),
    index("active_alerts_org_id_idx").on(table.organizationId),
    index("active_alerts_rule_id_idx").on(table.ruleId),
    index("active_alerts_severity_idx").on(table.severity),
    index("active_alerts_status_idx").on(table.status),
    index("active_alerts_trigger_timestamp_idx").on(table.triggerTimestamp),
    index("active_alerts_assigned_to_idx").on(table.assignedTo),
    index("active_alerts_correlation_key_idx").on(table.correlationKey),
    index("active_alerts_parent_alert_idx").on(table.parentAlertId),
  ]
);

// System performance baselines for anomaly detection
export const performanceBaselines = pgTable(
  "performance_baselines",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Baseline identification
    metricName: text("metric_name").notNull(),
    source: text("source").notNull(),
    timeFrame: text("time_frame").notNull(), // hourly, daily, weekly, monthly
    dayOfWeek: integer("day_of_week"), // 0-6 for weekly patterns
    hourOfDay: integer("hour_of_day"), // 0-23 for daily patterns

    // Statistical baseline values
    meanValue: text("mean_value").notNull(),
    medianValue: text("median_value"),
    standardDeviation: text("standard_deviation"),
    percentile95: text("percentile_95"),
    percentile99: text("percentile_99"),
    minValue: text("min_value"),
    maxValue: text("max_value"),

    // Anomaly detection thresholds
    upperBound: text("upper_bound").notNull(),
    lowerBound: text("lower_bound").notNull(),
    anomalyThreshold: text("anomaly_threshold").default("2.5").notNull(), // Number of standard deviations

    // Baseline quality and confidence
    sampleSize: integer("sample_size").notNull(),
    confidenceLevel: integer("confidence_level"), // 0-100 percentage
    lastCalculated: timestamp("last_calculated").notNull(),
    calculationPeriodStart: timestamp("calculation_period_start").notNull(),
    calculationPeriodEnd: timestamp("calculation_period_end").notNull(),

    // Seasonal adjustments
    seasonalityDetected: boolean("seasonality_detected")
      .default(false)
      .notNull(),
    seasonalPattern: jsonb("seasonal_pattern"), // Detected seasonal patterns

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("performance_baselines_metric_source_timeframe_unique").on(
      table.metricName,
      table.source,
      table.timeFrame,
      table.dayOfWeek,
      table.hourOfDay
    ),
    index("performance_baselines_org_id_idx").on(table.organizationId),
    index("performance_baselines_metric_name_idx").on(table.metricName),
    index("performance_baselines_source_idx").on(table.source),
    index("performance_baselines_time_frame_idx").on(table.timeFrame),
    index("performance_baselines_last_calculated_idx").on(table.lastCalculated),
  ]
);

// Security monitoring and incident tracking
export const securityEvents: any = pgTable(
  "security_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Event classification
    eventType: text("event_type").notNull(), // login_failure, privilege_escalation, data_access, etc.
    severity: alertSeverityEnum("severity").notNull(),
    category: text("category").notNull(), // authentication, authorization, data_protection, etc.

    // Event details
    title: text("title").notNull(),
    description: text("description"),
    source: text("source").notNull(), // application, system, network, etc.
    detector: text("detector"), // security_rule, anomaly_detection, manual

    // Actor and target information
    userId: text("user_id").references(() => users.id),
    sourceIp: text("source_ip"),
    userAgent: text("user_agent"),
    targetResource: text("target_resource"),
    targetType: text("target_type"), // file, database, api, user_account

    // Event context
    eventData: jsonb("event_data").notNull(), // Detailed event information
    riskScore: integer("risk_score"), // 0-100 risk assessment
    confidence: integer("confidence"), // 0-100 confidence in detection

    // Geographic and network context
    geoLocation: jsonb("geo_location").$type<{
      country?: string;
      region?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    }>(),
    networkContext: jsonb("network_context").$type<{
      protocol?: string;
      port?: number;
      bytes?: number;
      packets?: number;
    }>(),

    // Investigation and response
    investigationStatus: text("investigation_status").default("new"), // new, investigating, closed
    assignedTo: text("assigned_to").references(() => users.id),
    responseActions:
      jsonb("response_actions").$type<
        Array<{
          action: string;
          timestamp: string;
          performedBy: string;
          result: string;
        }>
      >(),

    // Correlation with other events
    correlationId: text("correlation_id"), // For grouping related events
    parentEventId: text("parent_event_id").references(
      (): any => securityEvents.id
    ),

    // Audit fields
    eventTimestamp: timestamp("event_timestamp").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("security_events_org_id_idx").on(table.organizationId),
    index("security_events_event_type_idx").on(table.eventType),
    index("security_events_severity_idx").on(table.severity),
    index("security_events_category_idx").on(table.category),
    index("security_events_user_id_idx").on(table.userId),
    index("security_events_source_ip_idx").on(table.sourceIp),
    index("security_events_event_timestamp_idx").on(table.eventTimestamp),
    index("security_events_investigation_status_idx").on(
      table.investigationStatus
    ),
    index("security_events_assigned_to_idx").on(table.assignedTo),
    index("security_events_correlation_id_idx").on(table.correlationId),
    index("security_events_risk_score_idx").on(table.riskScore),
  ]
);

// System capacity planning and resource forecasting
export const capacityPlanning = pgTable(
  "capacity_planning",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Resource identification
    resourceType: text("resource_type").notNull(), // cpu, memory, disk, network, database_connections
    resourceId: text("resource_id").notNull(), // server_name, database_instance, etc.

    // Current capacity and utilization
    currentCapacity: text("current_capacity").notNull(),
    currentUtilization: text("current_utilization").notNull(),
    utilizationPercentage: integer("utilization_percentage").notNull(),

    // Growth projections
    projectedGrowthRate: text("projected_growth_rate"), // Percentage per month
    forecastPeriod: text("forecast_period"), // 3m, 6m, 12m
    projectedUtilization: jsonb("projected_utilization").$type<
      Array<{
        date: string;
        utilization: number;
        confidence: number;
      }>
    >(),

    // Threshold and alerting
    warningThreshold: integer("warning_threshold").default(70).notNull(), // Percentage
    criticalThreshold: integer("critical_threshold").default(85).notNull(), // Percentage
    estimatedExhaustionDate: timestamp("estimated_exhaustion_date"),

    // Recommendations
    recommendations:
      jsonb("recommendations").$type<
        Array<{
          type: string; // scale_up, scale_out, optimize, migrate
          priority: string;
          description: string;
          estimatedCost?: number;
          implementation_effort?: string;
        }>
      >(),

    // Model accuracy and validation
    forecastAccuracy: integer("forecast_accuracy"), // Percentage accuracy of previous forecasts
    modelType: text("model_type"), // linear_regression, arima, neural_network
    modelVersion: text("model_version"),
    lastModelUpdate: timestamp("last_model_update"),

    // Analysis metadata
    analysisDate: timestamp("analysis_date").notNull(),
    dataWindowStart: timestamp("data_window_start").notNull(),
    dataWindowEnd: timestamp("data_window_end").notNull(),
    sampleCount: integer("sample_count").notNull(),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("capacity_planning_resource_analysis_unique").on(
      table.resourceType,
      table.resourceId,
      table.analysisDate
    ),
    index("capacity_planning_org_id_idx").on(table.organizationId),
    index("capacity_planning_resource_type_idx").on(table.resourceType),
    index("capacity_planning_resource_id_idx").on(table.resourceId),
    index("capacity_planning_utilization_percentage_idx").on(
      table.utilizationPercentage
    ),
    index("capacity_planning_exhaustion_date_idx").on(
      table.estimatedExhaustionDate
    ),
    index("capacity_planning_analysis_date_idx").on(table.analysisDate),
  ]
);

// Relations
export const systemMonitoringRelations = relations(
  systemMonitoring,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [systemMonitoring.organizationId],
      references: [organizations.id],
    }),
  })
);

export const alertRulesRelations = relations(alertRules, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [alertRules.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [alertRules.createdBy],
    references: [users.id],
    relationName: "alertRuleCreatedBy",
  }),
  updatedByUser: one(users, {
    fields: [alertRules.updatedBy],
    references: [users.id],
    relationName: "alertRuleUpdatedBy",
  }),
  activeAlerts: many(activeAlerts),
}));

export const activeAlertsRelations = relations(
  activeAlerts,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [activeAlerts.organizationId],
      references: [organizations.id],
    }),
    rule: one(alertRules, {
      fields: [activeAlerts.ruleId],
      references: [alertRules.id],
    }),
    acknowledgedByUser: one(users, {
      fields: [activeAlerts.acknowledgedBy],
      references: [users.id],
      relationName: "alertAcknowledgedBy",
    }),
    resolvedByUser: one(users, {
      fields: [activeAlerts.resolvedBy],
      references: [users.id],
      relationName: "alertResolvedBy",
    }),
    assignedToUser: one(users, {
      fields: [activeAlerts.assignedTo],
      references: [users.id],
      relationName: "alertAssignedTo",
    }),
    parentAlert: one(activeAlerts, {
      fields: [activeAlerts.parentAlertId],
      references: [activeAlerts.id],
      relationName: "parentAlert",
    }),
    childAlerts: many(activeAlerts, {
      relationName: "parentAlert",
    }),
  })
);

export const performanceBaselinesRelations = relations(
  performanceBaselines,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [performanceBaselines.organizationId],
      references: [organizations.id],
    }),
  })
);

export const securityEventsRelations = relations(
  securityEvents,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [securityEvents.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [securityEvents.userId],
      references: [users.id],
      relationName: "securityEventUser",
    }),
    assignedToUser: one(users, {
      fields: [securityEvents.assignedTo],
      references: [users.id],
      relationName: "securityEventAssignedTo",
    }),
    parentEvent: one(securityEvents, {
      fields: [securityEvents.parentEventId],
      references: [securityEvents.id],
      relationName: "parentEvent",
    }),
    childEvents: many(securityEvents, {
      relationName: "parentEvent",
    }),
  })
);

export const capacityPlanningRelations = relations(
  capacityPlanning,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [capacityPlanning.organizationId],
      references: [organizations.id],
    }),
  })
);

// Export types
export type SystemMonitoring = typeof systemMonitoring.$inferSelect;
export type NewSystemMonitoring = typeof systemMonitoring.$inferInsert;
export type AlertRule = typeof alertRules.$inferSelect;
export type NewAlertRule = typeof alertRules.$inferInsert;
export type ActiveAlert = typeof activeAlerts.$inferSelect;
export type NewActiveAlert = typeof activeAlerts.$inferInsert;
export type PerformanceBaseline = typeof performanceBaselines.$inferSelect;
export type NewPerformanceBaseline = typeof performanceBaselines.$inferInsert;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;
export type CapacityPlanning = typeof capacityPlanning.$inferSelect;
export type NewCapacityPlanning = typeof capacityPlanning.$inferInsert;
