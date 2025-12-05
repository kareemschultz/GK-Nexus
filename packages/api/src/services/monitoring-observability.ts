import type { Context } from "@GK-Nexus/api/context";
import { db } from "@GK-Nexus/db";
import type { AlertRule } from "@GK-Nexus/db/schema/enterprise-infrastructure";
import {
  activeAlerts,
  alertRules,
  capacityPlanning,
  performanceBaselines,
  securityEvents,
  systemMonitoring,
} from "@GK-Nexus/db/schema/enterprise-infrastructure";
import crypto from "node:crypto";
import { and, count, eq, gte, lte } from "drizzle-orm";

export interface MetricData {
  metricName: string;
  metricType: string;
  source: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
  aggregationPeriod?: string;
}

export interface AlertRuleConfig {
  ruleName: string;
  description?: string;
  category: string;
  metricQuery: {
    metricName: string;
    aggregation: string;
    timeWindow: string;
    filters?: Record<string, any>;
  };
  conditions: Array<{
    operator: string;
    value: number;
    severity: string;
  }>;
  evaluationInterval?: number;
  alertCooldown?: number;
  notificationChannels?: Array<{
    type: string;
    config: any;
    severityFilter?: string[];
  }>;
}

export interface SecurityEventData {
  eventType: string;
  severity: string;
  category: string;
  title: string;
  description?: string;
  source: string;
  detector?: string;
  userId?: string;
  sourceIp?: string;
  userAgent?: string;
  targetResource?: string;
  targetType?: string;
  eventData: any;
  riskScore?: number;
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

export class MonitoringObservabilityService {
  constructor(private ctx: Context) {}

  /**
   * Get organization ID from context (defaults to "default" if not available)
   */
  private getOrganizationId(): string {
    // In a real implementation, this would fetch the organization from user data
    // For now, return a default organization ID
    return "default";
  }

  /**
   * Record system monitoring metric
   */
  async recordMetric(metricData: MetricData): Promise<void> {
    const metricId = crypto.randomUUID();

    await db.insert(systemMonitoring).values({
      id: metricId,
      organizationId: this.getOrganizationId(),
      metricName: metricData.metricName,
      metricType: metricData.metricType as any,
      source: metricData.source,
      value: metricData.value.toString(),
      unit: metricData.unit,
      timestamp: metricData.timestamp,
      tags: metricData.tags,
      aggregationPeriod: metricData.aggregationPeriod,
    });

    // Trigger alert evaluation for this metric
    await this.evaluateAlerts(metricData);
  }

  /**
   * Record multiple metrics in batch
   */
  async recordMetricsBatch(metrics: MetricData[]): Promise<void> {
    const metricInserts = metrics.map((metric) => ({
      id: crypto.randomUUID(),
      organizationId: this.getOrganizationId(),
      metricName: metric.metricName,
      metricType: metric.metricType as any,
      source: metric.source,
      value: metric.value.toString(),
      unit: metric.unit,
      timestamp: metric.timestamp,
      tags: metric.tags,
      aggregationPeriod: metric.aggregationPeriod,
    }));

    await db.insert(systemMonitoring).values(metricInserts);

    // Evaluate alerts for all metrics
    for (const metric of metrics) {
      await this.evaluateAlerts(metric);
    }
  }

  /**
   * Create alert rule
   */
  async createAlertRule(config: AlertRuleConfig): Promise<string> {
    const ruleId = crypto.randomUUID();

    await db.insert(alertRules).values({
      id: ruleId,
      organizationId: this.getOrganizationId(),
      ruleName: config.ruleName,
      description: config.description,
      category: config.category,
      metricQuery: config.metricQuery,
      conditions: config.conditions,
      evaluationInterval: config.evaluationInterval || 60,
      alertCooldown: config.alertCooldown || 300,
      notificationChannels: config.notificationChannels || [],
      createdBy: this.ctx.user?.id || "",
    });

    return ruleId;
  }

  /**
   * Evaluate alerts for a given metric
   */
  private async evaluateAlerts(metricData: MetricData): Promise<void> {
    // Get all active alert rules for this metric
    const rules = await db
      .select()
      .from(alertRules)
      .where(
        and(
          eq(alertRules.organizationId, this.getOrganizationId()),
          eq(alertRules.isActive, true)
        )
      );

    for (const rule of rules) {
      // Check if this rule applies to the metric
      if (!this.ruleAppliesToMetric(rule, metricData)) {
        continue;
      }

      // Check cooldown period
      if (await this.isRuleInCooldown(rule.id)) {
        continue;
      }

      // Evaluate conditions
      const triggeredCondition = await this.evaluateRuleConditions(
        rule,
        metricData
      );

      if (triggeredCondition) {
        await this.triggerAlert(rule, metricData, triggeredCondition);
      }
    }
  }

  /**
   * Check if alert rule applies to the given metric
   */
  private ruleAppliesToMetric(
    rule: AlertRule,
    metricData: MetricData
  ): boolean {
    const query = rule.metricQuery as any;
    return query.metricName === metricData.metricName;
  }

  /**
   * Check if rule is in cooldown period
   */
  private async isRuleInCooldown(ruleId: string): Promise<boolean> {
    const cooldownThreshold = new Date(Date.now() - 300_000); // 5 minutes default

    const [recentAlert] = await db
      .select()
      .from(activeAlerts)
      .where(
        and(
          eq(activeAlerts.ruleId, ruleId),
          gte(activeAlerts.createdAt, cooldownThreshold)
        )
      )
      .limit(1);

    return !!recentAlert;
  }

  /**
   * Evaluate rule conditions against metric data
   */
  private async evaluateRuleConditions(
    rule: AlertRule,
    metricData: MetricData
  ): Promise<any | null> {
    const conditions = rule.conditions as any[];

    for (const condition of conditions) {
      let thresholdMet = false;

      switch (condition.operator) {
        case "gt":
          thresholdMet = metricData.value > condition.value;
          break;
        case "gte":
          thresholdMet = metricData.value >= condition.value;
          break;
        case "lt":
          thresholdMet = metricData.value < condition.value;
          break;
        case "lte":
          thresholdMet = metricData.value <= condition.value;
          break;
        case "eq":
          thresholdMet = metricData.value === condition.value;
          break;
        case "ne":
          thresholdMet = metricData.value !== condition.value;
          break;
        default:
          continue;
      }

      if (thresholdMet) {
        return condition;
      }
    }

    return null;
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(
    rule: AlertRule,
    metricData: MetricData,
    condition: any
  ): Promise<string> {
    const alertId = crypto.randomUUID();
    const alertKey = `${rule.id}:${metricData.source}:${metricData.metricName}`;

    // Check if alert already exists for this key
    const [existingAlert] = await db
      .select()
      .from(activeAlerts)
      .where(
        and(
          eq(activeAlerts.alertKey, alertKey),
          eq(activeAlerts.status, "active")
        )
      )
      .limit(1);

    if (existingAlert) {
      // Update existing alert
      await db
        .update(activeAlerts)
        .set({
          lastSeen: new Date(),
          triggerValue: metricData.value.toString(),
          triggerTimestamp: metricData.timestamp,
          triggerMetrics: metricData,
        })
        .where(eq(activeAlerts.id, existingAlert.id));

      return existingAlert.id;
    }

    // Create new alert
    await db.insert(activeAlerts).values({
      id: alertId,
      organizationId: this.getOrganizationId(),
      ruleId: rule.id,
      alertKey,
      title: `${rule.ruleName} - ${metricData.source}`,
      description: `Metric ${metricData.metricName} exceeded threshold: ${metricData.value} ${condition.operator} ${condition.value}`,
      severity: condition.severity as any,
      triggerValue: metricData.value.toString(),
      triggerTimestamp: metricData.timestamp,
      triggerMetrics: metricData,
      firstSeen: new Date(),
      lastSeen: new Date(),
    });

    // Send notifications
    await this.sendAlertNotifications(rule, metricData, condition);

    // Update rule statistics
    // Note: evaluationCount and alertCount increments should use SQL expressions
    // For now, we just update lastEvaluated
    await db
      .update(alertRules)
      .set({
        lastEvaluated: new Date(),
      })
      .where(eq(alertRules.id, rule.id));

    return alertId;
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(
    rule: AlertRule,
    metricData: MetricData,
    condition: any
  ): Promise<void> {
    const channels = (rule.notificationChannels as any[]) || [];

    for (const channel of channels) {
      // Filter by severity if configured
      if (
        channel.severityFilter &&
        !channel.severityFilter.includes(condition.severity)
      ) {
        continue;
      }

      try {
        await this.sendNotification(channel, rule, metricData, condition);
      } catch (error) {
        console.error(
          `Failed to send notification via ${channel.type}:`,
          error
        );
      }
    }
  }

  /**
   * Send individual notification
   */
  private async sendNotification(
    channel: any,
    rule: AlertRule,
    metricData: MetricData,
    condition: any
  ): Promise<void> {
    switch (channel.type) {
      case "email":
        await this.sendEmailNotification(channel, rule, metricData, condition);
        break;
      case "slack":
        await this.sendSlackNotification(channel, rule, metricData, condition);
        break;
      case "webhook":
        await this.sendWebhookNotification(
          channel,
          rule,
          metricData,
          condition
        );
        break;
      case "sms":
        await this.sendSmsNotification(channel, rule, metricData, condition);
        break;
      default:
        console.warn(`Unknown notification channel type: ${channel.type}`);
    }
  }

  /**
   * Record security event
   */
  async recordSecurityEvent(eventData: SecurityEventData): Promise<string> {
    const eventId = crypto.randomUUID();

    await db.insert(securityEvents).values({
      id: eventId,
      organizationId: this.getOrganizationId(),
      eventType: eventData.eventType,
      severity: eventData.severity as any,
      category: eventData.category,
      title: eventData.title,
      description: eventData.description,
      source: eventData.source,
      detector: eventData.detector,
      userId: eventData.userId,
      sourceIp: eventData.sourceIp,
      userAgent: eventData.userAgent,
      targetResource: eventData.targetResource,
      targetType: eventData.targetType,
      eventData: eventData.eventData,
      riskScore: eventData.riskScore,
      geoLocation: eventData.geoLocation,
      eventTimestamp: new Date(),
    });

    // Analyze event for patterns and correlations
    await this.analyzeSecurityEvent(eventId, eventData);

    return eventId;
  }

  /**
   * Calculate performance baseline
   */
  async calculatePerformanceBaseline(
    metricName: string,
    source: string,
    timeFrame: string
  ): Promise<string> {
    const baselineId = crypto.randomUUID();

    // Calculate date range based on timeFrame
    const endDate = new Date();
    const startDate = this.getBaselineStartDate(endDate, timeFrame);

    // Get historical data
    const metrics = await db
      .select()
      .from(systemMonitoring)
      .where(
        and(
          eq(systemMonitoring.organizationId, this.getOrganizationId()),
          eq(systemMonitoring.metricName, metricName),
          eq(systemMonitoring.source, source),
          gte(systemMonitoring.timestamp, startDate),
          lte(systemMonitoring.timestamp, endDate)
        )
      );

    if (metrics.length === 0) {
      throw new Error("Insufficient data for baseline calculation");
    }

    // Calculate statistical values
    const values = metrics.map((m) => Number.parseFloat(m.value));
    const stats = this.calculateStatistics(values);

    // Calculate anomaly thresholds
    const upperBound = stats.mean + 2.5 * stats.standardDeviation;
    const lowerBound = Math.max(0, stats.mean - 2.5 * stats.standardDeviation);

    await db.insert(performanceBaselines).values({
      id: baselineId,
      organizationId: this.getOrganizationId(),
      metricName,
      source,
      timeFrame,
      meanValue: stats.mean.toString(),
      medianValue: stats.median.toString(),
      standardDeviation: stats.standardDeviation.toString(),
      percentile95: stats.percentile95.toString(),
      percentile99: stats.percentile99.toString(),
      minValue: stats.min.toString(),
      maxValue: stats.max.toString(),
      upperBound: upperBound.toString(),
      lowerBound: lowerBound.toString(),
      sampleSize: metrics.length,
      confidenceLevel: this.calculateConfidenceLevel(metrics.length),
      lastCalculated: new Date(),
      calculationPeriodStart: startDate,
      calculationPeriodEnd: endDate,
    });

    return baselineId;
  }

  /**
   * Perform capacity planning analysis
   */
  async performCapacityAnalysis(
    resourceType: string,
    resourceId: string
  ): Promise<string> {
    const analysisId = crypto.randomUUID();

    // Get current resource utilization
    const currentMetrics = await this.getCurrentResourceUtilization(
      resourceType,
      resourceId
    );

    // Calculate growth projections
    const growthProjections = await this.calculateGrowthProjections(
      resourceType,
      resourceId
    );

    // Generate recommendations
    const recommendations = this.generateCapacityRecommendations(
      currentMetrics,
      growthProjections
    );

    await db.insert(capacityPlanning).values({
      id: analysisId,
      organizationId: this.getOrganizationId(),
      resourceType,
      resourceId,
      currentCapacity: currentMetrics.capacity.toString(),
      currentUtilization: currentMetrics.utilization.toString(),
      utilizationPercentage: Math.round(
        (currentMetrics.utilization / currentMetrics.capacity) * 100
      ),
      projectedGrowthRate: growthProjections.growthRate.toString(),
      forecastPeriod: "12m",
      projectedUtilization: growthProjections.projections,
      estimatedExhaustionDate: growthProjections.exhaustionDate,
      recommendations,
      analysisDate: new Date(),
      dataWindowStart: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
      dataWindowEnd: new Date(),
      sampleCount: currentMetrics.sampleCount,
    });

    return analysisId;
  }

  /**
   * Get system health summary
   */
  async getSystemHealthSummary(): Promise<{
    overallStatus: string;
    criticalAlerts: number;
    warningAlerts: number;
    systemMetrics: any;
    securityEvents: number;
    performanceStatus: string;
  }> {
    // Get critical alerts
    const criticalAlerts = await db
      .select({ count: count() })
      .from(activeAlerts)
      .where(
        and(
          eq(activeAlerts.organizationId, this.getOrganizationId()),
          eq(activeAlerts.status, "active"),
          eq(activeAlerts.severity, "critical")
        )
      );

    // Get warning alerts
    const warningAlerts = await db
      .select({ count: count() })
      .from(activeAlerts)
      .where(
        and(
          eq(activeAlerts.organizationId, this.getOrganizationId()),
          eq(activeAlerts.status, "active"),
          eq(activeAlerts.severity, "warning")
        )
      );

    // Get recent security events
    const securityEventCounts = await db
      .select({ count: count() })
      .from(securityEvents)
      .where(
        and(
          eq(securityEvents.organizationId, this.getOrganizationId()),
          gte(
            securityEvents.eventTimestamp,
            new Date(Date.now() - 24 * 60 * 60 * 1000)
          )
        )
      );

    // Get key system metrics
    const systemMetrics = await this.getKeySystemMetrics();

    const criticalCount = criticalAlerts[0]?.count || 0;
    const warningCount = warningAlerts[0]?.count || 0;
    const securityEventCount = securityEventCounts[0]?.count || 0;

    // Determine overall status
    let overallStatus = "healthy";
    if (criticalCount > 0) {
      overallStatus = "critical";
    } else if (warningCount > 0) {
      overallStatus = "warning";
    }

    return {
      overallStatus,
      criticalAlerts: criticalCount,
      warningAlerts: warningCount,
      systemMetrics,
      securityEvents: securityEventCount,
      performanceStatus: this.determinePerformanceStatus(systemMetrics),
    };
  }

  /**
   * Private helper methods
   */

  private async sendEmailNotification(
    _channel: any,
    rule: AlertRule,
    _metricData: MetricData,
    _condition: any
  ): Promise<void> {
    // TODO: Implement email notification
    console.log("Sending email notification for alert:", rule.ruleName);
  }

  private async sendSlackNotification(
    _channel: any,
    rule: AlertRule,
    _metricData: MetricData,
    _condition: any
  ): Promise<void> {
    // TODO: Implement Slack notification
    console.log("Sending Slack notification for alert:", rule.ruleName);
  }

  private async sendWebhookNotification(
    _channel: any,
    rule: AlertRule,
    _metricData: MetricData,
    _condition: any
  ): Promise<void> {
    // TODO: Implement webhook notification
    console.log("Sending webhook notification for alert:", rule.ruleName);
  }

  private async sendSmsNotification(
    _channel: any,
    rule: AlertRule,
    _metricData: MetricData,
    _condition: any
  ): Promise<void> {
    // TODO: Implement SMS notification
    console.log("Sending SMS notification for alert:", rule.ruleName);
  }

  private async analyzeSecurityEvent(
    eventId: string,
    _eventData: SecurityEventData
  ): Promise<void> {
    // TODO: Implement security event analysis for correlation and pattern detection
    console.log("Analyzing security event:", eventId);
  }

  private getBaselineStartDate(endDate: Date, timeFrame: string): Date {
    const days = timeFrame === "daily" ? 30 : timeFrame === "weekly" ? 90 : 365;
    return new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private calculateStatistics(values: number[]): {
    mean: number;
    median: number;
    standardDeviation: number;
    percentile95: number;
    percentile99: number;
    min: number;
    max: number;
  } {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const medianIndex = Math.floor(sorted.length / 2);
    const median = sorted[medianIndex] ?? 0;

    const variance =
      values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    const percentile95Index = Math.floor(sorted.length * 0.95);
    const percentile99Index = Math.floor(sorted.length * 0.99);
    const percentile95 =
      sorted[percentile95Index] ?? sorted[sorted.length - 1] ?? 0;
    const percentile99 =
      sorted[percentile99Index] ?? sorted[sorted.length - 1] ?? 0;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      mean,
      median,
      standardDeviation,
      percentile95,
      percentile99,
      min,
      max,
    };
  }

  private calculateConfidenceLevel(sampleSize: number): number {
    if (sampleSize < 30) return 70;
    if (sampleSize < 100) return 85;
    if (sampleSize < 1000) return 95;
    return 99;
  }

  private async getCurrentResourceUtilization(
    _resourceType: string,
    _resourceId: string
  ): Promise<{
    capacity: number;
    utilization: number;
    sampleCount: number;
  }> {
    // TODO: Implement actual resource utilization calculation
    return {
      capacity: 100,
      utilization: 75,
      sampleCount: 1000,
    };
  }

  private async calculateGrowthProjections(
    _resourceType: string,
    _resourceId: string
  ): Promise<{
    growthRate: number;
    projections: Array<{
      date: string;
      utilization: number;
      confidence: number;
    }>;
    exhaustionDate?: Date;
  }> {
    // TODO: Implement growth projection calculations
    return {
      growthRate: 5.2, // 5.2% per month
      projections: [
        { date: "2024-02-01", utilization: 80, confidence: 95 },
        { date: "2024-03-01", utilization: 85, confidence: 90 },
      ],
      exhaustionDate: new Date("2024-06-15"),
    };
  }

  private generateCapacityRecommendations(
    currentMetrics: any,
    _growthProjections: any
  ): Array<{
    type: string;
    priority: string;
    description: string;
    estimatedCost?: number;
  }> {
    const recommendations = [];

    if (currentMetrics.utilization / currentMetrics.capacity > 0.8) {
      recommendations.push({
        type: "scale_up",
        priority: "high",
        description:
          "Resource utilization is above 80%. Consider scaling up capacity.",
        estimatedCost: 500, // USD
      });
    }

    return recommendations;
  }

  private async getKeySystemMetrics(): Promise<any> {
    // TODO: Implement key system metrics retrieval
    return {
      cpuUsage: 65,
      memoryUsage: 72,
      diskUsage: 45,
      networkThroughput: 1250, // Mbps
      responseTime: 250, // ms
      errorRate: 0.1, // percentage
    };
  }

  private determinePerformanceStatus(systemMetrics: any): string {
    const cpuThreshold = systemMetrics.cpuUsage > 80;
    const memoryThreshold = systemMetrics.memoryUsage > 85;
    const responseTimeThreshold = systemMetrics.responseTime > 1000;
    const errorRateThreshold = systemMetrics.errorRate > 1;

    if (
      cpuThreshold ||
      memoryThreshold ||
      responseTimeThreshold ||
      errorRateThreshold
    ) {
      return "degraded";
    }

    if (systemMetrics.cpuUsage > 60 || systemMetrics.memoryUsage > 70) {
      return "warning";
    }

    return "optimal";
  }
}
