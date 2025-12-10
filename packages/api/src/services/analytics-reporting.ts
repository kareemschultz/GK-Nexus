import type { Context } from "@GK-Nexus/api/context";
import { db } from "@GK-Nexus/db";
import type {
  AnalyticsDashboard,
  GeneratedReport,
  ReportTemplate,
} from "@GK-Nexus/db/schema/analytics-reporting";
import {
  analyticsDashboards,
  analyticsMetrics,
  generatedReports,
  reportSchedules,
  reportTemplates,
} from "@GK-Nexus/db/schema/analytics-reporting";
import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";

export interface ReportGenerationRequest {
  templateId?: string;
  reportTitle: string;
  reportType: string;
  parameters: {
    dateFrom: string;
    dateTo: string;
    filters: Record<string, any>;
    outputFormat: string;
    clientIds?: string[];
  };
  scheduledFor?: Date;
}

export interface DashboardData {
  dashboardId: string;
  widgets: Array<{
    id: string;
    data: any;
    lastUpdated: Date;
    loadTime: number;
  }>;
  metadata: {
    totalLoadTime: number;
    cacheHit: boolean;
    dataFreshness: Date;
  };
}

export interface MetricCalculationRequest {
  metricName: string;
  metricType: string;
  category: string;
  dimension?: string;
  periodType: string;
  periodStart: Date;
  periodEnd: Date;
  filters?: Record<string, any>;
}

export class AnalyticsReportingService {
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
   * Create report template
   */
  async createReportTemplate(data: {
    templateName: string;
    description?: string;
    reportType: string;
    category: string;
    dataSourceConfig: any;
    reportStructure: any;
    outputFormats: any[];
    accessLevel?: string;
    allowedRoles?: string[];
  }): Promise<string> {
    const templateId = crypto.randomUUID();

    await db.insert(reportTemplates).values({
      id: templateId,
      organizationId: this.getOrganizationId(),
      templateName: data.templateName,
      description: data.description,
      reportType: data.reportType as any,
      category: data.category as any,
      dataSourceConfig: data.dataSourceConfig,
      reportStructure: data.reportStructure,
      outputFormats: data.outputFormats,
      accessLevel: data.accessLevel || "organization",
      allowedRoles: data.allowedRoles,
      createdBy: this.ctx.user?.id || "",
    });

    return templateId;
  }

  /**
   * Generate report
   */
  async generateReport(request: ReportGenerationRequest): Promise<string> {
    const reportId = crypto.randomUUID();

    // Get template if provided
    let template: ReportTemplate | null = null;
    if (request.templateId) {
      template = await this.getReportTemplate(request.templateId);
      if (!template) {
        throw new Error("Report template not found");
      }
    }

    // Create report record with parameters as JSON
    const parameters = request.parameters as unknown as Record<string, unknown>;

    await db.insert(generatedReports).values({
      id: reportId,
      organizationId: this.getOrganizationId(),
      templateId: request.templateId,
      reportTitle: request.reportTitle,
      reportType: request.reportType as any,
      category: template?.category || ("operational" as any),
      parameters: parameters as any,
      status: request.scheduledFor ? "scheduled" : "pending",
      scheduledFor: request.scheduledFor,
      generatedBy: this.ctx.user?.id || "",
      requestedBy: this.ctx.user?.id,
    });

    // If not scheduled, start generation immediately
    if (!request.scheduledFor) {
      await this.processReportGeneration(reportId);
    }

    return reportId;
  }

  /**
   * Process report generation
   */
  private async processReportGeneration(reportId: string): Promise<void> {
    try {
      // Update status to generating
      await this.updateReportStatus(reportId, "generating", {
        startedAt: new Date(),
      });

      const report = await this.getGeneratedReport(reportId);
      if (!report) throw new Error("Report not found");

      const template = report.templateId
        ? await this.getReportTemplate(report.templateId)
        : null;

      // Generate report data
      const reportData = await this.generateReportData(report, template);

      // Create output files
      const outputFiles = await this.generateOutputFiles(report, reportData);

      // Calculate data hash for change detection
      const dataHash = crypto
        .createHash("md5")
        .update(JSON.stringify(reportData))
        .digest("hex");

      // Update report with results
      await this.updateReportStatus(reportId, "completed", {
        completedAt: new Date(),
        reportData,
        totalRecords: reportData.totalRecords,
        outputFiles,
        dataHash,
        generationTime:
          Date.now() - (report.startedAt?.getTime() || Date.now()),
      });

      // Update template usage if applicable
      if (template) {
        await this.updateTemplateUsage(template.id);
      }
    } catch (error) {
      await this.updateReportStatus(reportId, "failed", {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorDetails: {
          error: error instanceof Error ? error.stack : error,
          timestamp: new Date().toISOString(),
        },
      });
      throw error;
    }
  }

  /**
   * Get report status and results
   */
  async getReportStatus(reportId: string): Promise<{
    status: string;
    progress?: number;
    reportData?: any;
    outputFiles?: any[];
    errorMessage?: string;
  }> {
    const report = await this.getGeneratedReport(reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    return {
      status: report.status,
      reportData: report.reportData,
      outputFiles: report.outputFiles as any[] | undefined,
      errorMessage: report.errorMessage || undefined,
    };
  }

  /**
   * Create analytics dashboard
   */
  async createDashboard(data: {
    dashboardName: string;
    description?: string;
    category: string;
    layout: any;
    widgets: any[];
    refreshInterval?: number;
    accessLevel?: string;
  }): Promise<string> {
    const dashboardId = crypto.randomUUID();

    await db.insert(analyticsDashboards).values({
      id: dashboardId,
      organizationId: this.getOrganizationId(),
      dashboardName: data.dashboardName,
      description: data.description,
      category: data.category as any,
      layout: data.layout,
      widgets: data.widgets,
      refreshInterval: data.refreshInterval || 300,
      accessLevel: data.accessLevel || "organization",
      createdBy: this.ctx.user?.id || "",
    });

    return dashboardId;
  }

  /**
   * Get dashboard data with real-time updates
   */
  async getDashboardData(dashboardId: string): Promise<DashboardData> {
    const dashboard = await this.getDashboard(dashboardId);
    if (!dashboard) {
      throw new Error("Dashboard not found");
    }

    const startTime = Date.now();
    const widgetData: any[] = [];
    let totalLoadTime = 0;
    let cacheHit = false;

    // Load data for each widget
    for (const widget of dashboard.widgets) {
      const widgetStartTime = Date.now();

      try {
        // Check cache first
        const cachedData = await this.getWidgetCachedData(widget.id);

        let data: any;
        if (
          cachedData &&
          this.isCacheValid(cachedData, widget.dataSource.refreshInterval)
        ) {
          data = cachedData.data;
          cacheHit = true;
        } else {
          // Execute widget query
          data = await this.executeWidgetQuery(widget);

          // Cache the result
          await this.cacheWidgetData(
            widget.id,
            data,
            widget.dataSource.refreshInterval
          );
        }

        const loadTime = Date.now() - widgetStartTime;
        totalLoadTime += loadTime;

        widgetData.push({
          id: widget.id,
          data,
          lastUpdated: new Date(),
          loadTime,
        });
      } catch (error) {
        console.error(`Error loading widget ${widget.id}:`, error);
        widgetData.push({
          id: widget.id,
          data: { error: "Failed to load widget data" },
          lastUpdated: new Date(),
          loadTime: Date.now() - widgetStartTime,
        });
      }
    }

    // Update dashboard usage
    await this.updateDashboardUsage(dashboardId, Date.now() - startTime);

    return {
      dashboardId,
      widgets: widgetData,
      metadata: {
        totalLoadTime,
        cacheHit,
        dataFreshness: new Date(),
      },
    };
  }

  /**
   * Calculate and store analytics metric
   */
  async calculateMetric(request: MetricCalculationRequest): Promise<string> {
    const metricId = crypto.randomUUID();

    const startTime = Date.now();

    try {
      // Execute metric calculation
      const result = await this.executeMetricCalculation(request);

      const computationTime = Date.now() - startTime;

      // Store metric result
      await db.insert(analyticsMetrics).values({
        id: metricId,
        organizationId: this.getOrganizationId(),
        metricName: request.metricName,
        metricType: request.metricType,
        category: request.category,
        dimension: request.dimension,
        periodType: request.periodType,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd,
        value: result.value.toString(),
        count: result.count,
        metadata: result.metadata,
        computationTime,
        sourceDataTimestamp: new Date(),
      });

      return metricId;
    } catch (error) {
      console.error("Error calculating metric:", error);
      throw error;
    }
  }

  /**
   * Create report schedule
   */
  async createReportSchedule(data: {
    scheduleName: string;
    templateId: string;
    frequency: string;
    scheduleConfig: any;
    defaultParameters: any;
    distributionConfig?: any;
  }): Promise<string> {
    const scheduleId = crypto.randomUUID();

    // Calculate next run time
    const nextRunAt = this.calculateNextRunTime(
      data.frequency,
      data.scheduleConfig
    );

    await db.insert(reportSchedules).values({
      id: scheduleId,
      organizationId: this.getOrganizationId(),
      scheduleName: data.scheduleName,
      templateId: data.templateId,
      frequency: data.frequency as any,
      scheduleConfig: data.scheduleConfig,
      defaultParameters: data.defaultParameters,
      distributionConfig: data.distributionConfig,
      nextRunAt,
      createdBy: this.ctx.user?.id || "",
    });

    return scheduleId;
  }

  /**
   * Get organization analytics overview
   */
  async getAnalyticsOverview(
    filters: { dateFrom?: Date; dateTo?: Date; categories?: string[] } = {}
  ): Promise<{
    keyMetrics: Record<string, any>;
    trends: any[];
    recentReports: GeneratedReport[];
    dashboards: AnalyticsDashboard[];
  }> {
    const dateFrom =
      filters.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const dateTo = filters.dateTo || new Date();

    // Get key metrics
    const keyMetrics = await this.getKeyMetrics(dateFrom, dateTo);

    // Get trend data
    const trends = await this.getTrendData(dateFrom, dateTo);

    // Get recent reports
    const recentReports = await this.getRecentReports(10);

    // Get available dashboards
    const dashboards = await this.getOrganizationDashboards();

    return {
      keyMetrics,
      trends,
      recentReports,
      dashboards,
    };
  }

  /**
   * Private helper methods
   */
  private async getReportTemplate(
    templateId: string
  ): Promise<ReportTemplate | null> {
    const [template] = await db
      .select()
      .from(reportTemplates)
      .where(
        and(
          eq(reportTemplates.id, templateId),
          eq(reportTemplates.organizationId, this.getOrganizationId())
        )
      )
      .limit(1);
    return template || null;
  }

  private async getGeneratedReport(
    reportId: string
  ): Promise<GeneratedReport | null> {
    const [report] = await db
      .select()
      .from(generatedReports)
      .where(eq(generatedReports.id, reportId))
      .limit(1);
    return report || null;
  }

  private async getDashboard(
    dashboardId: string
  ): Promise<AnalyticsDashboard | null> {
    const [dashboard] = await db
      .select()
      .from(analyticsDashboards)
      .where(
        and(
          eq(analyticsDashboards.id, dashboardId),
          eq(analyticsDashboards.organizationId, this.getOrganizationId())
        )
      )
      .limit(1);
    return dashboard || null;
  }

  private async updateReportStatus(
    reportId: string,
    status: string,
    updates: any = {}
  ): Promise<void> {
    await db
      .update(generatedReports)
      .set({
        status: status as any,
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(generatedReports.id, reportId));
  }

  private async generateReportData(
    _report: GeneratedReport,
    _template: ReportTemplate | null
  ): Promise<any> {
    // TODO: Implement actual data generation based on template configuration
    // This would execute queries, apply filters, and aggregate data

    // Return empty structure - actual implementation pending
    return {
      summary: {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        clientCount: 0,
        message:
          "Report generation not yet implemented. Data will appear here once analytics are configured.",
      },
      details: [],
      totalRecords: 0,
    };
  }

  private async generateOutputFiles(
    report: GeneratedReport,
    _data: any
  ): Promise<any[]> {
    // TODO: Implement actual file generation (PDF, Excel, CSV)

    const outputFiles = [
      {
        format: "pdf",
        filename: `${report.reportTitle.replace(/\s+/g, "_")}_${Date.now()}.pdf`,
        size: 1024 * 500, // 500KB placeholder
        downloadCount: 0,
      },
    ];

    const parameters = report.parameters as any;
    if (
      parameters?.outputFormat === "excel" ||
      parameters?.outputFormat === "all"
    ) {
      outputFiles.push({
        format: "excel",
        filename: `${report.reportTitle.replace(/\s+/g, "_")}_${Date.now()}.xlsx`,
        size: 1024 * 250, // 250KB placeholder
        downloadCount: 0,
      });
    }

    return outputFiles;
  }

  private async updateTemplateUsage(templateId: string): Promise<void> {
    // Note: usageCount increment should use SQL expressions
    // For now, we just update lastUsedAt
    await db
      .update(reportTemplates)
      .set({
        lastUsedAt: new Date(),
      })
      .where(eq(reportTemplates.id, templateId));
  }

  private async executeWidgetQuery(widget: any): Promise<any> {
    // TODO: Implement actual widget query execution
    // This would parse the widget configuration and execute appropriate queries

    // Placeholder implementation
    const mockWidgetData: Record<string, any> = {
      kpi: {
        value: Math.floor(Math.random() * 100_000),
        change: Math.floor(Math.random() * 20) - 10,
        trend: "up",
      },
      chart: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May"],
        datasets: [
          {
            label: "Revenue",
            data: [12_000, 15_000, 18_000, 14_000, 22_000],
          },
        ],
      },
      table: {
        headers: ["Date", "Amount", "Type"],
        rows: [
          ["2024-01-01", "5,000", "Revenue"],
          ["2024-01-02", "3,000", "Expense"],
        ],
      },
    };

    return mockWidgetData[widget.type] || { data: "No data available" };
  }

  private async getWidgetCachedData(_widgetId: string): Promise<any> {
    // TODO: Implement widget data caching
    return null;
  }

  private isCacheValid(cachedData: any, refreshInterval?: number): boolean {
    const maxAge = (refreshInterval || 300) * 1000; // Convert to milliseconds
    const age = Date.now() - new Date(cachedData.timestamp).getTime();
    return age < maxAge;
  }

  private async cacheWidgetData(
    _widgetId: string,
    _data: any,
    _ttl?: number
  ): Promise<void> {
    // TODO: Implement widget data caching with TTL
    // console.log(`Caching data for widget ${widgetId} with TTL ${ttl}s`);
  }

  private async updateDashboardUsage(
    dashboardId: string,
    loadTime: number
  ): Promise<void> {
    // Note: viewCount increment should use SQL expressions
    // For now, we just update lastViewedAt and averageLoadTime
    await db
      .update(analyticsDashboards)
      .set({
        lastViewedAt: new Date(),
        averageLoadTime: loadTime, // Simplified - should calculate running average
      })
      .where(eq(analyticsDashboards.id, dashboardId));
  }

  private async executeMetricCalculation(
    request: MetricCalculationRequest
  ): Promise<{
    value: number;
    count: number;
    metadata: any;
  }> {
    // TODO: Implement actual metric calculation based on type and data sources

    // Placeholder implementation
    const mockResults: Record<string, any> = {
      revenue: { value: 125_000, count: 45 },
      count: { value: 150, count: 150 },
      average: { value: 2500, count: 45 },
      ratio: { value: 0.67, count: 100 },
    };

    const result = mockResults[request.metricType] || { value: 0, count: 0 };

    return {
      ...result,
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataRange: {
          start: request.periodStart.toISOString(),
          end: request.periodEnd.toISOString(),
        },
        filters: request.filters,
      },
    };
  }

  private calculateNextRunTime(frequency: string, config: any): Date {
    const now = new Date();

    switch (frequency) {
      case "daily": {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(config.hour || 9, config.minute || 0, 0, 0);
        return tomorrow;
      }

      case "weekly": {
        const nextWeek = new Date(now);
        nextWeek.setDate(
          nextWeek.getDate() + (7 - now.getDay() + (config.dayOfWeek || 1))
        );
        nextWeek.setHours(config.hour || 9, config.minute || 0, 0, 0);
        return nextWeek;
      }

      case "monthly": {
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(config.dayOfMonth || 1);
        nextMonth.setHours(config.hour || 9, config.minute || 0, 0, 0);
        return nextMonth;
      }

      default: {
        // Default to next hour
        const nextHour = new Date(now);
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        return nextHour;
      }
    }
  }

  private async getKeyMetrics(
    _dateFrom: Date,
    _dateTo: Date
  ): Promise<Record<string, any>> {
    // TODO: Implement actual key metrics calculation
    return {
      totalRevenue: 125_000,
      totalClients: 45,
      averageRevenue: 2777,
      growthRate: 0.15,
    };
  }

  private async getTrendData(_dateFrom: Date, _dateTo: Date): Promise<any[]> {
    // TODO: Implement actual trend data calculation
    return [
      { date: "2024-01-01", value: 10_000 },
      { date: "2024-01-02", value: 12_000 },
      { date: "2024-01-03", value: 11_500 },
    ];
  }

  private async getRecentReports(limit: number): Promise<GeneratedReport[]> {
    return await db
      .select()
      .from(generatedReports)
      .where(eq(generatedReports.organizationId, this.getOrganizationId()))
      .orderBy(desc(generatedReports.createdAt))
      .limit(limit);
  }

  private async getOrganizationDashboards(): Promise<AnalyticsDashboard[]> {
    return await db
      .select()
      .from(analyticsDashboards)
      .where(eq(analyticsDashboards.organizationId, this.getOrganizationId()))
      .orderBy(desc(analyticsDashboards.lastViewedAt));
  }
}
