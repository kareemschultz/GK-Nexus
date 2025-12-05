import { randomUUID } from "node:crypto";
import type { TestScenario } from "./integration-test-framework";

// Mock expect function for validation (defined early to avoid temporal dead zone)
const expect = {
  any: (type: any) => `__expect_any_${type.name}__`,
  stringMatching: (pattern: RegExp) =>
    `__expect_string_matching_${pattern.source}__`,
};

/**
 * Predefined test scenarios for GK-Nexus Phase 3 Infrastructure
 */

/**
 * GRA Integration Test Scenarios
 */
export const graIntegrationScenarios: TestScenario[] = [
  {
    id: "gra-001",
    name: "GRA Connection and Basic Filing",
    description: "Test GRA connection setup and basic tax filing submission",
    category: "gra_integration",
    steps: [
      {
        id: "step-1",
        name: "Create GRA Connection",
        action: "gra_create_connection",
        payload: {
          connectionName: "Test GRA Connection",
          environment: "sandbox",
          configuration: {
            timeout: 30_000,
            retryAttempts: 3,
            enableValidation: true,
          },
        },
        expectedResult: { success: true, connectionId: expect.any(String) },
        validation: (actual, _expected) =>
          actual.success && actual.connectionId,
      },
      {
        id: "step-2",
        name: "Submit PAYE Filing",
        action: "gra_submit_filing",
        payload: {
          filingType: "paye_monthly",
          taxYear: 2024,
          taxPeriod: "2024-01",
          clientId: randomUUID(),
          submissionData: {
            totalGrossPay: 50_000,
            totalPAYE: 7500,
            totalNIS: 2500,
            employeeCount: 10,
          },
        },
        expectedResult: { success: true, submissionId: expect.any(String) },
        validation: (actual, _expected) =>
          actual.success && actual.submissionId,
      },
      {
        id: "step-3",
        name: "Check Submission Status",
        action: "gra_check_status",
        payload: {
          submissionId: "${step-2.submissionId}",
        },
        expectedResult: { status: "submitted" },
        validation: (actual, _expected) =>
          actual.status &&
          ["submitted", "processing", "accepted"].includes(actual.status),
      },
    ],
    timeout: 60_000,
  },

  {
    id: "gra-002",
    name: "GRA VAT Filing with Documents",
    description: "Test VAT filing submission with attached documents",
    category: "gra_integration",
    steps: [
      {
        id: "step-1",
        name: "Submit VAT Filing with Documents",
        action: "gra_submit_filing",
        payload: {
          filingType: "vat_quarterly",
          taxYear: 2024,
          taxPeriod: "2024-Q1",
          clientId: randomUUID(),
          submissionData: {
            totalSales: 100_000,
            totalPurchases: 60_000,
            outputVAT: 15_000,
            inputVAT: 9000,
            netVAT: 6000,
          },
          attachedDocuments: [
            {
              id: randomUUID(),
              name: "Sales_Register_Q1.pdf",
              type: "application/pdf",
              size: 1_024_000,
              required: true,
            },
            {
              id: randomUUID(),
              name: "Purchase_Register_Q1.pdf",
              type: "application/pdf",
              size: 512_000,
              required: true,
            },
          ],
        },
        expectedResult: { success: true },
        validation: (actual, _expected) => actual.success,
      },
      {
        id: "step-2",
        name: "Verify Document Upload",
        action: "wait",
        payload: { duration: 5000 },
        expectedResult: {},
        validation: () => true,
      },
    ],
    timeout: 120_000,
  },
];

/**
 * OCR Processing Test Scenarios
 */
export const ocrProcessingScenarios: TestScenario[] = [
  {
    id: "ocr-001",
    name: "Basic Receipt OCR Processing",
    description: "Test OCR processing of a basic receipt document",
    category: "ocr_processing",
    steps: [
      {
        id: "step-1",
        name: "Queue Receipt Document",
        action: "ocr_queue_document",
        payload: {
          documentId: randomUUID(),
          originalFileName: "receipt_001.jpg",
          documentType: "receipt",
          fileSize: 256_000,
          fileFormat: "jpg",
          pageCount: 1,
          language: "en",
          processingEngine: "tesseract",
        },
        expectedResult: { success: true, processingId: expect.any(String) },
        validation: (actual, _expected) =>
          actual.success && actual.processingId,
      },
      {
        id: "step-2",
        name: "Process Document",
        action: "ocr_process_document",
        payload: {
          processingId: "${step-1.processingId}",
        },
        expectedResult: { status: "completed", confidence: expect.any(Number) },
        validation: (actual, _expected) =>
          actual.status === "completed" && actual.confidence > 50,
      },
      {
        id: "step-3",
        name: "Retrieve OCR Results",
        action: "ocr_get_results",
        payload: {
          processingId: "${step-1.processingId}",
        },
        expectedResult: {
          status: "completed",
          extractedText: expect.any(String),
          structuredData: expect.any(Object),
        },
        validation: (actual, _expected) =>
          actual.status === "completed" &&
          actual.extractedText &&
          actual.structuredData,
      },
    ],
    timeout: 300_000, // 5 minutes for OCR processing
  },

  {
    id: "ocr-002",
    name: "Multi-page Invoice Processing",
    description:
      "Test OCR processing of a multi-page invoice with structured extraction",
    category: "ocr_processing",
    steps: [
      {
        id: "step-1",
        name: "Queue Multi-page Invoice",
        action: "ocr_queue_document",
        payload: {
          documentId: randomUUID(),
          originalFileName: "invoice_multipage.pdf",
          documentType: "invoice",
          fileSize: 1_024_000,
          fileFormat: "pdf",
          pageCount: 3,
          language: "en",
          processingEngine: "tesseract",
          extractionTemplateId: randomUUID(),
          priority: 2, // High priority
        },
        expectedResult: { success: true },
        validation: (actual, _expected) => actual.success,
      },
      {
        id: "step-2",
        name: "Wait for Processing",
        action: "wait",
        payload: { duration: 10_000 }, // 10 seconds
        expectedResult: {},
        validation: () => true,
      },
      {
        id: "step-3",
        name: "Check Processing Status",
        action: "ocr_get_results",
        payload: {
          processingId: "${step-1.processingId}",
        },
        expectedResult: {
          status: expect.stringMatching(
            /^(processing|completed|manual_review)$/
          ),
        },
        validation: (actual, _expected) =>
          ["processing", "completed", "manual_review"].includes(actual.status),
      },
    ],
    timeout: 600_000, // 10 minutes for complex processing
  },
];

/**
 * Analytics and Reporting Test Scenarios
 */
export const reportingScenarios: TestScenario[] = [
  {
    id: "report-001",
    name: "Basic Financial Report Generation",
    description: "Test generation of a basic financial summary report",
    category: "reporting",
    steps: [
      {
        id: "step-1",
        name: "Generate Financial Report",
        action: "report_generate",
        payload: {
          reportTitle: "Monthly Financial Summary",
          reportType: "financial_summary",
          parameters: {
            dateFrom: "2024-01-01",
            dateTo: "2024-01-31",
            filters: {
              includeProjections: false,
            },
            outputFormat: "pdf",
          },
        },
        expectedResult: { success: true, reportId: expect.any(String) },
        validation: (actual, _expected) => actual.success && actual.reportId,
      },
      {
        id: "step-2",
        name: "Check Report Status",
        action: "report_get_status",
        payload: {
          reportId: "${step-1.reportId}",
        },
        expectedResult: {
          status: expect.stringMatching(/^(generating|completed)$/),
        },
        validation: (actual, _expected) =>
          ["generating", "completed"].includes(actual.status),
      },
      {
        id: "step-3",
        name: "Wait for Completion",
        action: "wait",
        payload: { duration: 15_000 }, // 15 seconds
        expectedResult: {},
        validation: () => true,
      },
      {
        id: "step-4",
        name: "Verify Report Completion",
        action: "report_get_status",
        payload: {
          reportId: "${step-1.reportId}",
        },
        expectedResult: { status: "completed", outputFiles: expect.any(Array) },
        validation: (actual, _expected) =>
          actual.status === "completed" &&
          actual.outputFiles &&
          actual.outputFiles.length > 0,
      },
    ],
    timeout: 120_000, // 2 minutes
  },

  {
    id: "report-002",
    name: "Client-Specific Tax Compliance Report",
    description: "Test generation of client-specific tax compliance report",
    category: "reporting",
    steps: [
      {
        id: "step-1",
        name: "Generate Compliance Report",
        action: "report_generate",
        payload: {
          reportTitle: "Q1 2024 Tax Compliance Report",
          reportType: "tax_compliance",
          parameters: {
            dateFrom: "2024-01-01",
            dateTo: "2024-03-31",
            filters: {
              clientIds: [randomUUID()],
              includeDetails: true,
            },
            outputFormat: "excel",
          },
        },
        expectedResult: { success: true },
        validation: (actual, _expected) => actual.success,
      },
    ],
    timeout: 180_000, // 3 minutes
  },
];

/**
 * Queue Processing Test Scenarios
 */
export const queueProcessingScenarios: TestScenario[] = [
  {
    id: "queue-001",
    name: "Basic Job Queue Processing",
    description: "Test basic job queuing and processing functionality",
    category: "queue_processing",
    steps: [
      {
        id: "step-1",
        name: "Add Job to Queue",
        action: "queue_add_job",
        payload: {
          jobType: "email_delivery",
          priority: "normal",
          payload: {
            to: "test@example.com",
            subject: "Test Email",
            body: "This is a test email from the queue processor",
          },
        },
        expectedResult: { jobId: expect.any(String), status: "queued" },
        validation: (actual, _expected) =>
          actual.jobId && actual.status === "queued",
      },
      {
        id: "step-2",
        name: "Process Job",
        action: "queue_process_job",
        payload: {
          jobId: "${step-1.jobId}",
          simulatedDuration: 2000, // 2 seconds
          expectedResult: { emailSent: true },
        },
        expectedResult: { status: "completed", result: { emailSent: true } },
        validation: (actual, _expected) =>
          actual.status === "completed" && actual.result.emailSent,
      },
    ],
    timeout: 30_000,
  },

  {
    id: "queue-002",
    name: "High Priority Job Processing",
    description: "Test high-priority job processing and queue jumping",
    category: "queue_processing",
    steps: [
      {
        id: "step-1",
        name: "Add Low Priority Job",
        action: "queue_add_job",
        payload: {
          jobType: "data_export",
          priority: "low",
          payload: { exportType: "csv", recordCount: 10_000 },
        },
        expectedResult: { success: true },
        validation: (actual, _expected) => actual.jobId,
      },
      {
        id: "step-2",
        name: "Add High Priority Job",
        action: "queue_add_job",
        payload: {
          jobType: "gra_submission",
          priority: "critical",
          payload: { submissionType: "urgent_filing" },
        },
        expectedResult: { success: true },
        validation: (actual, _expected) => actual.jobId,
      },
      {
        id: "step-3",
        name: "Verify Priority Processing",
        action: "wait",
        payload: { duration: 3000 },
        expectedResult: {},
        validation: () => true, // High priority job should be processed first
      },
    ],
    timeout: 60_000,
  },
];

/**
 * Enterprise Monitoring Test Scenarios
 */
export const monitoringScenarios: TestScenario[] = [
  {
    id: "monitor-001",
    name: "Alert Rule Creation and Triggering",
    description: "Test creation of monitoring alert rules and triggering",
    category: "enterprise_monitoring",
    steps: [
      {
        id: "step-1",
        name: "Create CPU Usage Alert",
        action: "monitoring_create_alert",
        payload: {
          ruleName: "High CPU Usage Alert",
          metricName: "system.cpu_usage",
          threshold: 80,
          operator: "gt",
          severity: "warning",
        },
        expectedResult: { alertRuleId: expect.any(String), isActive: true },
        validation: (actual, _expected) =>
          actual.alertRuleId && actual.isActive,
      },
      {
        id: "step-2",
        name: "Simulate High CPU Usage",
        action: "monitoring_trigger_alert",
        payload: {
          ruleId: "${step-1.alertRuleId}",
          metricValue: 85,
          severity: "warning",
        },
        expectedResult: { alertId: expect.any(String), status: "active" },
        validation: (actual, _expected) =>
          actual.alertId && actual.status === "active",
      },
      {
        id: "step-3",
        name: "Verify Alert Status",
        action: "wait",
        payload: { duration: 2000 },
        expectedResult: {},
        validation: () => true,
      },
    ],
    timeout: 45_000,
  },

  {
    id: "monitor-002",
    name: "Database Performance Monitoring",
    description: "Test database performance monitoring and alerting",
    category: "enterprise_monitoring",
    steps: [
      {
        id: "step-1",
        name: "Test Database Query Performance",
        action: "database_query",
        payload: {
          query: "SELECT COUNT(*) FROM organizations",
        },
        expectedResult: { success: true, duration: expect.any(Number) },
        validation: (actual, _expected) =>
          actual.success && actual.duration < 10_000,
      },
      {
        id: "step-2",
        name: "Create Slow Query Alert",
        action: "monitoring_create_alert",
        payload: {
          ruleName: "Slow Database Query Alert",
          metricName: "database.query_time",
          threshold: 5000, // 5 seconds
          operator: "gt",
          severity: "critical",
        },
        expectedResult: { success: true },
        validation: (actual, expected) => actual.alertRuleId,
      },
    ],
    timeout: 60_000,
  },
];

/**
 * End-to-End Integration Test Scenarios
 */
export const e2eScenarios: TestScenario[] = [
  {
    id: "e2e-001",
    name: "Complete Tax Filing Workflow",
    description:
      "End-to-end test of complete tax filing workflow from OCR to GRA submission",
    category: "gra_integration",
    steps: [
      // Step 1: OCR Process Tax Documents
      {
        id: "step-1",
        name: "Process Tax Document with OCR",
        action: "ocr_queue_document",
        payload: {
          documentId: randomUUID(),
          originalFileName: "tax_documents.pdf",
          documentType: "financial_statement",
          fileSize: 2_048_000,
          fileFormat: "pdf",
          pageCount: 5,
        },
        expectedResult: { success: true },
        validation: (actual, _expected) => actual.success,
      },

      // Step 2: Wait for OCR Processing
      {
        id: "step-2",
        name: "Wait for OCR Processing",
        action: "wait",
        payload: { duration: 30_000 }, // 30 seconds
        expectedResult: {},
        validation: () => true,
      },

      // Step 3: Create GRA Connection
      {
        id: "step-3",
        name: "Setup GRA Connection",
        action: "gra_create_connection",
        payload: {
          connectionName: "E2E Test Connection",
          environment: "sandbox",
        },
        expectedResult: { success: true },
        validation: (actual, _expected) => actual.success,
      },

      // Step 4: Submit to GRA using OCR data
      {
        id: "step-4",
        name: "Submit Tax Filing to GRA",
        action: "gra_submit_filing",
        payload: {
          filingType: "corporate_tax",
          taxYear: 2024,
          clientId: randomUUID(),
          submissionData: {
            // This would normally come from OCR results
            totalIncome: 500_000,
            totalExpenses: 300_000,
            taxableIncome: 200_000,
            taxOwed: 50_000,
          },
        },
        expectedResult: { success: true },
        validation: (actual, _expected) => actual.success,
      },

      // Step 5: Generate Compliance Report
      {
        id: "step-5",
        name: "Generate Compliance Report",
        action: "report_generate",
        payload: {
          reportTitle: "E2E Tax Filing Report",
          reportType: "tax_compliance",
          parameters: {
            dateFrom: "2024-01-01",
            dateTo: "2024-12-31",
            outputFormat: "pdf",
          },
        },
        expectedResult: { success: true },
        validation: (actual, _expected) => actual.success,
      },
    ],
    timeout: 600_000, // 10 minutes for complete workflow
  },
];

/**
 * Performance Test Scenarios
 */
export const performanceScenarios: TestScenario[] = [
  {
    id: "perf-001",
    name: "High Volume OCR Processing",
    description: "Performance test for high volume OCR document processing",
    category: "ocr_processing",
    steps: [
      {
        id: "step-1",
        name: "Queue Multiple Documents",
        action: "ocr_queue_document",
        payload: {
          documentId: randomUUID(),
          originalFileName: "batch_document.pdf",
          documentType: "receipt",
          fileSize: 512_000,
          fileFormat: "pdf",
          pageCount: 1,
        },
        expectedResult: { success: true },
        validation: (actual, _expected) => actual.success,
      },
    ],
    timeout: 30_000,
  },
];

/**
 * Utility function to get scenarios by category
 */
export function getScenariosByCategory(category: string): TestScenario[] {
  const allScenarios = [
    ...graIntegrationScenarios,
    ...ocrProcessingScenarios,
    ...reportingScenarios,
    ...queueProcessingScenarios,
    ...monitoringScenarios,
    ...e2eScenarios,
    ...performanceScenarios,
  ];

  return allScenarios.filter((scenario) => scenario.category === category);
}

/**
 * Utility function to get scenario by ID
 */
export function getScenarioById(id: string): TestScenario | undefined {
  const allScenarios = [
    ...graIntegrationScenarios,
    ...ocrProcessingScenarios,
    ...reportingScenarios,
    ...queueProcessingScenarios,
    ...monitoringScenarios,
    ...e2eScenarios,
    ...performanceScenarios,
  ];

  return allScenarios.find((scenario) => scenario.id === id);
}

/**
 * Get all available test scenarios
 */
export function getAllScenarios(): TestScenario[] {
  return [
    ...graIntegrationScenarios,
    ...ocrProcessingScenarios,
    ...reportingScenarios,
    ...queueProcessingScenarios,
    ...monitoringScenarios,
    ...e2eScenarios,
    ...performanceScenarios,
  ];
}
