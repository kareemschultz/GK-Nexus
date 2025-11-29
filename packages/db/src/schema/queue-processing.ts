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

// Queue job status tracking
export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "retry",
  "delayed",
]);

// Job priority levels
export const jobPriorityEnum = pgEnum("job_priority", [
  "critical", // 1
  "high", // 2
  "normal", // 3
  "low", // 4
  "background", // 5
]);

// Queue types for different processing categories
export const queueTypeEnum = pgEnum("queue_type", [
  "gra_submission",
  "ocr_processing",
  "report_generation",
  "email_delivery",
  "document_processing",
  "data_export",
  "backup_operations",
  "system_maintenance",
  "notification_delivery",
  "file_processing",
  "analytics_calculation",
  "integration_sync",
]);

// Main job queue for background processing
export const jobQueue = pgTable(
  "job_queue",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),

    // Job identification
    jobName: text("job_name").notNull(),
    jobType: text("job_type").notNull(),
    queueType: queueTypeEnum("queue_type").notNull(),

    // Job payload and configuration
    payload: jsonb("payload").notNull(), // Job-specific data
    options: jsonb("options").$type<{
      timeout?: number; // milliseconds
      maxRetries?: number;
      retryDelay?: number; // milliseconds
      retryBackoff?: string; // exponential, linear, fixed
      delayUntil?: string; // ISO timestamp
      dependencies?: string[]; // Job IDs this job depends on
    }>(),

    // Job scheduling and priority
    priority: jobPriorityEnum("priority").default("normal").notNull(),
    scheduledFor: timestamp("scheduled_for"),
    delayedUntil: timestamp("delayed_until"),

    // Processing status and metadata
    status: jobStatusEnum("status").default("pending").notNull(),
    processingStarted: timestamp("processing_started"),
    processingCompleted: timestamp("processing_completed"),
    processingTime: integer("processing_time"), // milliseconds

    // Worker information
    workerId: text("worker_id"), // ID of the worker processing this job
    workerPid: integer("worker_pid"), // Process ID of the worker
    workerHostname: text("worker_hostname"),

    // Retry and error handling
    attemptNumber: integer("attempt_number").default(0).notNull(),
    maxRetries: integer("max_retries").default(3).notNull(),
    lastAttemptAt: timestamp("last_attempt_at"),
    nextRetryAt: timestamp("next_retry_at"),

    // Results and error tracking
    result: jsonb("result"), // Job execution result
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),
    errorDetails: jsonb("error_details"),

    // Progress tracking for long-running jobs
    progressPercentage: integer("progress_percentage").default(0).notNull(),
    progressMessage: text("progress_message"),
    progressData: jsonb("progress_data"), // Detailed progress information

    // Job dependencies and workflow
    parentJobId: text("parent_job_id").references(() => jobQueue.id),
    childJobIds: jsonb("child_job_ids").$type<string[]>(), // Jobs created by this job
    dependencyJobIds: jsonb("dependency_job_ids").$type<string[]>(), // Jobs this depends on
    workflowId: text("workflow_id"), // For grouping related jobs

    // Performance and resource usage
    resourceUsage: jsonb("resource_usage").$type<{
      cpuTime?: number; // milliseconds
      memoryUsed?: number; // bytes
      diskIO?: number; // bytes
      networkIO?: number; // bytes
    }>(),

    // Audit and tracking
    createdBy: text("created_by").references(() => users.id),
    tags: jsonb("tags").$type<Record<string, string>>(), // Custom tags for filtering/grouping

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("job_queue_org_id_idx").on(table.organizationId),
    index("job_queue_status_idx").on(table.status),
    index("job_queue_priority_idx").on(table.priority),
    index("job_queue_queue_type_idx").on(table.queueType),
    index("job_queue_scheduled_for_idx").on(table.scheduledFor),
    index("job_queue_delayed_until_idx").on(table.delayedUntil),
    index("job_queue_worker_id_idx").on(table.workerId),
    index("job_queue_parent_job_idx").on(table.parentJobId),
    index("job_queue_workflow_id_idx").on(table.workflowId),
    index("job_queue_created_at_idx").on(table.createdAt),
    // Composite indexes for queue processing
    index("job_queue_processing_idx").on(
      table.status,
      table.priority,
      table.scheduledFor
    ),
    index("job_queue_retry_idx").on(table.status, table.nextRetryAt),
  ]
);

// Queue configuration and management
export const queueConfigurations = pgTable(
  "queue_configurations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),

    // Queue identification
    queueName: text("queue_name").notNull(),
    queueType: queueTypeEnum("queue_type").notNull(),
    description: text("description"),

    // Processing configuration
    maxConcurrency: integer("max_concurrency").default(5).notNull(), // Max concurrent jobs
    maxRetries: integer("max_retries").default(3).notNull(),
    defaultTimeout: integer("default_timeout").default(300_000).notNull(), // 5 minutes
    retryBackoffStrategy: text("retry_backoff_strategy")
      .default("exponential")
      .notNull(),

    // Queue behavior settings
    fifoMode: boolean("fifo_mode").default(false).notNull(), // First-in-first-out
    deduplicate: boolean("deduplicate").default(false).notNull(), // Prevent duplicate jobs
    deduplicationKey: text("deduplication_key"), // Field to use for deduplication

    // Rate limiting
    rateLimitEnabled: boolean("rate_limit_enabled").default(false).notNull(),
    maxJobsPerMinute: integer("max_jobs_per_minute"),
    maxJobsPerHour: integer("max_jobs_per_hour"),
    maxJobsPerDay: integer("max_jobs_per_day"),

    // Dead letter queue configuration
    deadLetterQueueEnabled: boolean("dead_letter_queue_enabled")
      .default(true)
      .notNull(),
    deadLetterAfterAttempts: integer("dead_letter_after_attempts")
      .default(5)
      .notNull(),

    // Monitoring and alerting
    alertingEnabled: boolean("alerting_enabled").default(true).notNull(),
    alertRules:
      jsonb("alert_rules").$type<
        Array<{
          metric: string; // queue_depth, processing_time, error_rate
          threshold: number;
          operator: string; // gt, lt, gte, lte
          windowMinutes: number;
          severity: string;
        }>
      >(),

    // Auto-scaling configuration
    autoScalingEnabled: boolean("auto_scaling_enabled")
      .default(false)
      .notNull(),
    minWorkers: integer("min_workers").default(1).notNull(),
    maxWorkers: integer("max_workers").default(10).notNull(),
    scaleUpThreshold: integer("scale_up_threshold").default(80).notNull(), // Queue depth %
    scaleDownThreshold: integer("scale_down_threshold").default(20).notNull(),

    // Queue status
    isActive: boolean("is_active").default(true).notNull(),
    isPaused: boolean("is_paused").default(false).notNull(),
    pausedReason: text("paused_reason"),
    pausedAt: timestamp("paused_at"),

    // Usage statistics
    totalJobsProcessed: integer("total_jobs_processed").default(0).notNull(),
    totalJobsFailed: integer("total_jobs_failed").default(0).notNull(),
    averageProcessingTime: integer("average_processing_time"), // milliseconds
    lastProcessedAt: timestamp("last_processed_at"),

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
    unique("queue_configs_org_name_unique").on(
      table.organizationId,
      table.queueName
    ),
    index("queue_configs_org_id_idx").on(table.organizationId),
    index("queue_configs_queue_type_idx").on(table.queueType),
    index("queue_configs_is_active_idx").on(table.isActive),
    index("queue_configs_is_paused_idx").on(table.isPaused),
  ]
);

// Worker instances and health monitoring
export const queueWorkers = pgTable(
  "queue_workers",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),

    // Worker identification
    workerId: text("worker_id").notNull(),
    workerName: text("worker_name"),
    hostname: text("hostname").notNull(),
    pid: integer("pid").notNull(),

    // Queue assignments
    queueTypes: jsonb("queue_types").$type<string[]>().notNull(),
    maxConcurrency: integer("max_concurrency").default(5).notNull(),
    currentJobs: integer("current_jobs").default(0).notNull(),

    // Worker status and health
    status: text("status").default("idle").notNull(), // idle, busy, stopped, error
    lastHeartbeat: timestamp("last_heartbeat").notNull(),
    healthScore: integer("health_score").default(100).notNull(), // 0-100

    // Performance metrics
    jobsProcessed: integer("jobs_processed").default(0).notNull(),
    jobsSucceeded: integer("jobs_succeeded").default(0).notNull(),
    jobsFailed: integer("jobs_failed").default(0).notNull(),
    totalProcessingTime: integer("total_processing_time").default(0).notNull(),
    averageJobTime: integer("average_job_time"),

    // Resource usage
    cpuUsage: integer("cpu_usage"), // Percentage
    memoryUsage: integer("memory_usage"), // Percentage
    diskUsage: integer("disk_usage"), // Percentage

    // Worker configuration
    workerConfig: jsonb("worker_config").$type<{
      environment?: string;
      version?: string;
      features?: string[];
      limits?: {
        maxMemoryMB?: number;
        maxCpuPercent?: number;
        maxJobDuration?: number;
      };
    }>(),

    // Error tracking
    lastError: text("last_error"),
    lastErrorAt: timestamp("last_error_at"),
    consecutiveErrors: integer("consecutive_errors").default(0).notNull(),

    // Timestamps
    startedAt: timestamp("started_at").notNull(),
    stoppedAt: timestamp("stopped_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("queue_workers_worker_id_unique").on(table.workerId),
    index("queue_workers_org_id_idx").on(table.organizationId),
    index("queue_workers_hostname_idx").on(table.hostname),
    index("queue_workers_status_idx").on(table.status),
    index("queue_workers_last_heartbeat_idx").on(table.lastHeartbeat),
    index("queue_workers_health_score_idx").on(table.healthScore),
  ]
);

// Job execution history and analytics
export const jobExecutionHistory = pgTable(
  "job_execution_history",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),

    // Job reference
    jobId: text("job_id")
      .notNull()
      .references(() => jobQueue.id),
    jobName: text("job_name").notNull(),
    jobType: text("job_type").notNull(),
    queueType: queueTypeEnum("queue_type").notNull(),

    // Execution details
    executionId: text("execution_id").notNull(), // Unique per attempt
    attemptNumber: integer("attempt_number").notNull(),
    workerId: text("worker_id"),

    // Timing information
    startedAt: timestamp("started_at").notNull(),
    completedAt: timestamp("completed_at"),
    executionTime: integer("execution_time"), // milliseconds
    queueWaitTime: integer("queue_wait_time"), // milliseconds

    // Execution result
    status: jobStatusEnum("status").notNull(),
    result: jsonb("result"),
    errorMessage: text("error_message"),
    errorType: text("error_type"),

    // Performance metrics
    resourceUsage: jsonb("resource_usage").$type<{
      cpuTime?: number;
      memoryPeak?: number;
      diskIO?: number;
      networkIO?: number;
    }>(),

    // Context and metadata
    executionContext: jsonb("execution_context").$type<{
      serverVersion?: string;
      environment?: string;
      userAgent?: string;
      clientId?: string;
    }>(),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("job_history_org_id_idx").on(table.organizationId),
    index("job_history_job_id_idx").on(table.jobId),
    index("job_history_execution_id_idx").on(table.executionId),
    index("job_history_status_idx").on(table.status),
    index("job_history_job_type_idx").on(table.jobType),
    index("job_history_started_at_idx").on(table.startedAt),
    index("job_history_worker_id_idx").on(table.workerId),
    // Composite index for analytics
    index("job_history_analytics_idx").on(
      table.jobType,
      table.status,
      table.startedAt
    ),
  ]
);

// Queue metrics and analytics aggregation
export const queueMetrics = pgTable(
  "queue_metrics",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),

    // Metric identification
    metricDate: timestamp("metric_date").notNull(),
    queueType: queueTypeEnum("queue_type").notNull(),
    aggregationPeriod: text("aggregation_period").notNull(), // hour, day, week, month

    // Volume metrics
    jobsQueued: integer("jobs_queued").default(0).notNull(),
    jobsProcessed: integer("jobs_processed").default(0).notNull(),
    jobsSucceeded: integer("jobs_succeeded").default(0).notNull(),
    jobsFailed: integer("jobs_failed").default(0).notNull(),
    jobsCancelled: integer("jobs_cancelled").default(0).notNull(),

    // Timing metrics (all in milliseconds)
    avgQueueWaitTime: integer("avg_queue_wait_time"),
    avgProcessingTime: integer("avg_processing_time"),
    maxProcessingTime: integer("max_processing_time"),
    minProcessingTime: integer("min_processing_time"),
    p95ProcessingTime: integer("p95_processing_time"),
    p99ProcessingTime: integer("p99_processing_time"),

    // Queue depth metrics
    avgQueueDepth: integer("avg_queue_depth"),
    maxQueueDepth: integer("max_queue_depth"),

    // Error metrics
    errorRate: integer("error_rate"), // Percentage * 100
    timeoutRate: integer("timeout_rate"), // Percentage * 100
    retryRate: integer("retry_rate"), // Percentage * 100

    // Resource utilization
    avgCpuUsage: integer("avg_cpu_usage"), // Percentage
    avgMemoryUsage: integer("avg_memory_usage"), // Percentage
    totalResourceCost: integer("total_resource_cost"), // In smallest currency unit

    // Worker metrics
    avgWorkersActive: integer("avg_workers_active"),
    maxWorkersActive: integer("max_workers_active"),
    workerEfficiency: integer("worker_efficiency"), // Percentage * 100

    // Throughput metrics
    jobsPerMinute: integer("jobs_per_minute"),
    jobsPerHour: integer("jobs_per_hour"),

    // Additional statistics
    uniqueJobTypes: integer("unique_job_types"),
    uniqueWorkers: integer("unique_workers"),

    // Data quality
    sampleSize: integer("sample_size").notNull(),
    dataCompleteness: integer("data_completeness"), // Percentage

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("queue_metrics_date_type_period_unique").on(
      table.metricDate,
      table.queueType,
      table.aggregationPeriod
    ),
    index("queue_metrics_org_id_idx").on(table.organizationId),
    index("queue_metrics_date_idx").on(table.metricDate),
    index("queue_metrics_queue_type_idx").on(table.queueType),
    index("queue_metrics_aggregation_period_idx").on(table.aggregationPeriod),
  ]
);

// Relations
export const jobQueueRelations = relations(jobQueue, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [jobQueue.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [jobQueue.createdBy],
    references: [users.id],
  }),
  parentJob: one(jobQueue, {
    fields: [jobQueue.parentJobId],
    references: [jobQueue.id],
    relationName: "parentJob",
  }),
  childJobs: many(jobQueue, {
    relationName: "parentJob",
  }),
  executionHistory: many(jobExecutionHistory),
}));

export const queueConfigurationsRelations = relations(
  queueConfigurations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [queueConfigurations.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [queueConfigurations.createdBy],
      references: [users.id],
      relationName: "queueConfigCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [queueConfigurations.updatedBy],
      references: [users.id],
      relationName: "queueConfigUpdatedBy",
    }),
  })
);

export const queueWorkersRelations = relations(queueWorkers, ({ one }) => ({
  organization: one(organizations, {
    fields: [queueWorkers.organizationId],
    references: [organizations.id],
  }),
}));

export const jobExecutionHistoryRelations = relations(
  jobExecutionHistory,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [jobExecutionHistory.organizationId],
      references: [organizations.id],
    }),
    job: one(jobQueue, {
      fields: [jobExecutionHistory.jobId],
      references: [jobQueue.id],
    }),
  })
);

export const queueMetricsRelations = relations(queueMetrics, ({ one }) => ({
  organization: one(organizations, {
    fields: [queueMetrics.organizationId],
    references: [organizations.id],
  }),
}));

// Export types
export type JobQueue = typeof jobQueue.$inferSelect;
export type NewJobQueue = typeof jobQueue.$inferInsert;
export type QueueConfiguration = typeof queueConfigurations.$inferSelect;
export type NewQueueConfiguration = typeof queueConfigurations.$inferInsert;
export type QueueWorker = typeof queueWorkers.$inferSelect;
export type NewQueueWorker = typeof queueWorkers.$inferInsert;
export type JobExecutionHistory = typeof jobExecutionHistory.$inferSelect;
export type NewJobExecutionHistory = typeof jobExecutionHistory.$inferInsert;
export type QueueMetrics = typeof queueMetrics.$inferSelect;
export type NewQueueMetrics = typeof queueMetrics.$inferInsert;
