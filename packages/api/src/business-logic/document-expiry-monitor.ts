/**
 * Document Expiry Monitoring System for Guyana Tax Compliance
 * Tracks and monitors expiry dates for all business documents and certificates
 */

export type DocumentType =
  | "business_registration"
  | "tax_registration"
  | "vat_registration"
  | "nis_registration"
  | "trade_licence"
  | "professional_licence"
  | "import_licence"
  | "export_licence"
  | "environmental_permit"
  | "fire_certificate"
  | "health_permit"
  | "insurance_policy"
  | "passport"
  | "work_permit"
  | "other";

export type DocumentStatus =
  | "valid"
  | "expiring_soon" // Within warning period
  | "expired"
  | "renewal_pending"
  | "renewal_submitted"
  | "suspended"
  | "revoked";

export type AlertFrequency = "daily" | "weekly" | "monthly" | "one_time";

export type DocumentRecord = {
  id: string;
  businessId: string;
  documentType: DocumentType;
  documentName: string;
  documentNumber?: string;
  issueDate: Date;
  expiryDate: Date;
  issuingAuthority: string;
  status: DocumentStatus;
  renewalRequired: boolean;
  renewalPeriodDays: number; // How many days before expiry to start renewal process
  warningPeriodDays: number; // How many days before expiry to show warnings
  filePath?: string;
  notes?: string;
  lastChecked: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ExpiryAlert = {
  id: string;
  documentId: string;
  businessId: string;
  alertType: "warning" | "urgent" | "expired" | "renewal_due";
  alertDate: Date;
  expiryDate: Date;
  daysUntilExpiry: number;
  message: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  notificationSent: boolean;
  notificationSentAt?: Date;
  priority: "low" | "medium" | "high" | "critical";
};

export type ExpiryMonitoringConfig = {
  businessId: string;
  alertFrequency: AlertFrequency;
  defaultWarningDays: number;
  defaultRenewalDays: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  notificationEmails: string[];
  notificationPhones: string[];
  workingDaysOnly: boolean;
  timezone: string;
  isActive: boolean;
};

export type ExpiryDashboard = {
  businessId: string;
  dashboardDate: Date;
  totalDocuments: number;
  validDocuments: number;
  expiringSoonDocuments: number;
  expiredDocuments: number;
  renewalPendingDocuments: number;
  criticalAlerts: number;
  upcomingExpirations: DocumentRecord[];
  recentlyExpired: DocumentRecord[];
  overdueRenewals: DocumentRecord[];
  complianceScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  nextActions: Array<{
    documentName: string;
    action: "renew" | "review" | "urgent_action";
    dueDate: Date;
    priority: "low" | "medium" | "high" | "critical";
  }>;
};

/**
 * Standard document configurations for Guyana businesses
 */
export const STANDARD_DOCUMENT_CONFIGS: Record<
  DocumentType,
  {
    renewalPeriodDays: number;
    warningPeriodDays: number;
    renewalRequired: boolean;
    issuingAuthority: string;
  }
> = {
  business_registration: {
    renewalPeriodDays: 90,
    warningPeriodDays: 30,
    renewalRequired: true,
    issuingAuthority: "Deeds and Commercial Registry",
  },
  tax_registration: {
    renewalPeriodDays: 60,
    warningPeriodDays: 30,
    renewalRequired: false,
    issuingAuthority: "Guyana Revenue Authority",
  },
  vat_registration: {
    renewalPeriodDays: 60,
    warningPeriodDays: 30,
    renewalRequired: false,
    issuingAuthority: "Guyana Revenue Authority",
  },
  nis_registration: {
    renewalPeriodDays: 60,
    warningPeriodDays: 30,
    renewalRequired: false,
    issuingAuthority: "National Insurance Scheme",
  },
  trade_licence: {
    renewalPeriodDays: 60,
    warningPeriodDays: 30,
    renewalRequired: true,
    issuingAuthority: "Municipal Authority",
  },
  professional_licence: {
    renewalPeriodDays: 90,
    warningPeriodDays: 45,
    renewalRequired: true,
    issuingAuthority: "Professional Regulatory Body",
  },
  import_licence: {
    renewalPeriodDays: 30,
    warningPeriodDays: 14,
    renewalRequired: true,
    issuingAuthority: "Guyana Revenue Authority",
  },
  export_licence: {
    renewalPeriodDays: 30,
    warningPeriodDays: 14,
    renewalRequired: true,
    issuingAuthority: "Guyana Revenue Authority",
  },
  environmental_permit: {
    renewalPeriodDays: 120,
    warningPeriodDays: 60,
    renewalRequired: true,
    issuingAuthority: "Environmental Protection Agency",
  },
  fire_certificate: {
    renewalPeriodDays: 60,
    warningPeriodDays: 30,
    renewalRequired: true,
    issuingAuthority: "Guyana Fire Service",
  },
  health_permit: {
    renewalPeriodDays: 30,
    warningPeriodDays: 14,
    renewalRequired: true,
    issuingAuthority: "Ministry of Health",
  },
  insurance_policy: {
    renewalPeriodDays: 45,
    warningPeriodDays: 21,
    renewalRequired: true,
    issuingAuthority: "Insurance Company",
  },
  passport: {
    renewalPeriodDays: 180,
    warningPeriodDays: 90,
    renewalRequired: true,
    issuingAuthority: "Ministry of Citizenship",
  },
  work_permit: {
    renewalPeriodDays: 90,
    warningPeriodDays: 45,
    renewalRequired: true,
    issuingAuthority: "Ministry of Labour",
  },
  other: {
    renewalPeriodDays: 60,
    warningPeriodDays: 30,
    renewalRequired: false,
    issuingAuthority: "Various",
  },
};

/**
 * Update document statuses based on current date
 */
export function updateDocumentStatuses(
  documents: DocumentRecord[],
  currentDate: Date = new Date()
): DocumentRecord[] {
  return documents.map((document) => {
    const updatedDocument = { ...document };
    const daysUntilExpiry = Math.ceil(
      (document.expiryDate.getTime() - currentDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (currentDate > document.expiryDate) {
      updatedDocument.status = "expired";
    } else if (daysUntilExpiry <= document.warningPeriodDays) {
      updatedDocument.status = "expiring_soon";
    } else {
      updatedDocument.status = "valid";
    }

    updatedDocument.lastChecked = currentDate;
    updatedDocument.updatedAt = currentDate;

    return updatedDocument;
  });
}

/**
 * Generate expiry alerts for documents
 */
export function generateExpiryAlerts(
  documents: DocumentRecord[],
  currentDate: Date = new Date()
): ExpiryAlert[] {
  const alerts: ExpiryAlert[] = [];

  for (const document of documents) {
    const daysUntilExpiry = Math.ceil(
      (document.expiryDate.getTime() - currentDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    let alertType: ExpiryAlert["alertType"] | null = null;
    let priority: ExpiryAlert["priority"] = "low";
    let message = "";

    if (currentDate > document.expiryDate) {
      alertType = "expired";
      priority = "critical";
      const daysExpired = Math.abs(daysUntilExpiry);
      message = `${document.documentName} expired ${daysExpired} day(s) ago`;
    } else if (
      document.renewalRequired &&
      daysUntilExpiry <= document.renewalPeriodDays
    ) {
      alertType = "renewal_due";
      priority = daysUntilExpiry <= 14 ? "high" : "medium";
      message = `${document.documentName} renewal required - ${daysUntilExpiry} days until expiry`;
    } else if (daysUntilExpiry <= 7) {
      alertType = "urgent";
      priority = "high";
      message = `${document.documentName} expires in ${daysUntilExpiry} day(s)`;
    } else if (daysUntilExpiry <= document.warningPeriodDays) {
      alertType = "warning";
      priority = daysUntilExpiry <= 14 ? "medium" : "low";
      message = `${document.documentName} expires in ${daysUntilExpiry} day(s)`;
    }

    if (alertType) {
      alerts.push({
        id: `alert-${document.id}-${currentDate.getTime()}`,
        documentId: document.id,
        businessId: document.businessId,
        alertType,
        alertDate: currentDate,
        expiryDate: document.expiryDate,
        daysUntilExpiry,
        message,
        isAcknowledged: false,
        notificationSent: false,
        priority,
      });
    }
  }

  return alerts;
}

/**
 * Create comprehensive expiry dashboard
 */
export function createExpiryDashboard(
  businessId: string,
  documents: DocumentRecord[],
  alerts: ExpiryAlert[],
  currentDate: Date = new Date()
): ExpiryDashboard {
  const businessDocuments = documents.filter(
    (doc) => doc.businessId === businessId
  );
  const businessAlerts = alerts.filter(
    (alert) => alert.businessId === businessId
  );

  // Update document statuses
  const updatedDocuments = updateDocumentStatuses(
    businessDocuments,
    currentDate
  );

  // Calculate metrics
  const totalDocuments = updatedDocuments.length;
  const validDocuments = updatedDocuments.filter(
    (doc) => doc.status === "valid"
  ).length;
  const expiringSoonDocuments = updatedDocuments.filter(
    (doc) => doc.status === "expiring_soon"
  ).length;
  const expiredDocuments = updatedDocuments.filter(
    (doc) => doc.status === "expired"
  ).length;
  const renewalPendingDocuments = updatedDocuments.filter(
    (doc) =>
      doc.status === "renewal_pending" || doc.status === "renewal_submitted"
  ).length;

  const criticalAlerts = businessAlerts.filter(
    (alert) => alert.priority === "critical"
  ).length;

  // Get upcoming expirations (next 90 days)
  const next90Days = new Date(currentDate);
  next90Days.setDate(next90Days.getDate() + 90);

  const upcomingExpirations = updatedDocuments
    .filter(
      (doc) => doc.expiryDate <= next90Days && doc.expiryDate > currentDate
    )
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())
    .slice(0, 10);

  // Get recently expired documents (last 30 days)
  const last30Days = new Date(currentDate);
  last30Days.setDate(last30Days.getDate() - 30);

  const recentlyExpired = updatedDocuments
    .filter(
      (doc) => doc.expiryDate < currentDate && doc.expiryDate >= last30Days
    )
    .sort((a, b) => b.expiryDate.getTime() - a.expiryDate.getTime())
    .slice(0, 10);

  // Get overdue renewals
  const overdueRenewals = updatedDocuments
    .filter((doc) => {
      const daysUntilExpiry = Math.ceil(
        (doc.expiryDate.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return doc.renewalRequired && daysUntilExpiry <= doc.renewalPeriodDays;
    })
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

  // Calculate compliance score
  const complianceScore =
    totalDocuments > 0 ? (validDocuments / totalDocuments) * 100 : 100;

  // Assess risk level
  const riskLevel = assessDocumentRiskLevel(
    complianceScore,
    expiredDocuments,
    expiringSoonDocuments,
    criticalAlerts
  );

  // Generate recommendations
  const recommendations = generateDocumentRecommendations(
    updatedDocuments,
    businessAlerts,
    riskLevel
  );

  // Generate next actions
  const nextActions = generateDocumentActions(updatedDocuments, currentDate);

  return {
    businessId,
    dashboardDate: currentDate,
    totalDocuments,
    validDocuments,
    expiringSoonDocuments,
    expiredDocuments,
    renewalPendingDocuments,
    criticalAlerts,
    upcomingExpirations,
    recentlyExpired,
    overdueRenewals,
    complianceScore: Math.round(complianceScore),
    riskLevel,
    recommendations,
    nextActions,
  };
}

/**
 * Assess document compliance risk level
 */
function assessDocumentRiskLevel(
  complianceScore: number,
  expiredDocuments: number,
  expiringSoonDocuments: number,
  criticalAlerts: number
): "low" | "medium" | "high" | "critical" {
  if (criticalAlerts > 0 || expiredDocuments > 0 || complianceScore < 50) {
    return "critical";
  }
  if (expiringSoonDocuments > 2 || complianceScore < 75) {
    return "high";
  }
  if (expiringSoonDocuments > 0 || complianceScore < 90) {
    return "medium";
  }
  return "low";
}

/**
 * Generate document-specific recommendations
 */
function generateDocumentRecommendations(
  documents: DocumentRecord[],
  alerts: ExpiryAlert[],
  riskLevel: "low" | "medium" | "high" | "critical"
): string[] {
  const recommendations: string[] = [];

  const expiredDocuments = documents.filter((doc) => doc.status === "expired");
  const expiringSoonDocuments = documents.filter(
    (doc) => doc.status === "expiring_soon"
  );

  if (expiredDocuments.length > 0) {
    recommendations.push(
      `Immediately renew ${expiredDocuments.length} expired document(s) to avoid penalties.`
    );
  }

  if (expiringSoonDocuments.length > 0) {
    recommendations.push(
      `Begin renewal process for ${expiringSoonDocuments.length} document(s) expiring soon.`
    );
  }

  if (riskLevel === "critical") {
    recommendations.push(
      "Engage legal counsel to address critical document compliance issues."
    );
    recommendations.push("Implement emergency document renewal procedures.");
  } else if (riskLevel === "high") {
    recommendations.push(
      "Establish automated document renewal tracking system."
    );
    recommendations.push(
      "Assign dedicated staff member for document management."
    );
  }

  const criticalAlerts = alerts.filter(
    (alert) => alert.priority === "critical"
  );
  if (criticalAlerts.length > 0) {
    recommendations.push("Address all critical document alerts immediately.");
  }

  if (
    documents.some(
      (doc) => !doc.renewalPeriodDays || doc.renewalPeriodDays < 30
    )
  ) {
    recommendations.push("Review and standardize document renewal timelines.");
  }

  return recommendations;
}

/**
 * Generate next actions for document management
 */
function generateDocumentActions(
  documents: DocumentRecord[],
  currentDate: Date
): Array<{
  documentName: string;
  action: "renew" | "review" | "urgent_action";
  dueDate: Date;
  priority: "low" | "medium" | "high" | "critical";
}> {
  const actions = [];

  for (const document of documents) {
    const daysUntilExpiry = Math.ceil(
      (document.expiryDate.getTime() - currentDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (document.status === "expired") {
      actions.push({
        documentName: document.documentName,
        action: "urgent_action" as const,
        dueDate: new Date(), // Immediate
        priority: "critical" as const,
      });
    } else if (
      document.renewalRequired &&
      daysUntilExpiry <= document.renewalPeriodDays
    ) {
      const renewalDue = new Date(document.expiryDate);
      renewalDue.setDate(renewalDue.getDate() - document.renewalPeriodDays);

      const renewPriority: "low" | "medium" | "high" | "critical" =
        daysUntilExpiry <= 14 ? "high" : "medium";
      actions.push({
        documentName: document.documentName,
        action: "renew" as const,
        dueDate: renewalDue,
        priority: renewPriority,
      });
    } else if (daysUntilExpiry <= document.warningPeriodDays) {
      const reviewPriority: "low" | "medium" | "high" | "critical" =
        daysUntilExpiry <= 7 ? "high" : "low";
      actions.push({
        documentName: document.documentName,
        action: "review" as const,
        dueDate: document.expiryDate,
        priority: reviewPriority,
      });
    }
  }

  return actions.sort((a, b) => {
    const priorityOrder: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });
}

/**
 * Validate document record inputs
 */
export function validateDocumentRecord(
  input: Partial<DocumentRecord>
): string[] {
  const errors: string[] = [];

  if (!input.documentName || input.documentName.trim().length === 0) {
    errors.push("Document name is required");
  }

  if (!input.documentType) {
    errors.push("Document type is required");
  }

  if (!(input.issueDate && input.expiryDate)) {
    errors.push("Issue date and expiry date are required");
  } else if (input.issueDate >= input.expiryDate) {
    errors.push("Expiry date must be after issue date");
  }

  if (!input.issuingAuthority || input.issuingAuthority.trim().length === 0) {
    errors.push("Issuing authority is required");
  }

  if (input.renewalPeriodDays && input.renewalPeriodDays < 0) {
    errors.push("Renewal period days cannot be negative");
  }

  if (input.warningPeriodDays && input.warningPeriodDays < 0) {
    errors.push("Warning period days cannot be negative");
  }

  return errors;
}

/**
 * Create document record with standard configuration
 */
export function createStandardDocumentRecord(
  businessId: string,
  documentType: DocumentType,
  documentName: string,
  documentNumber: string,
  issueDate: Date,
  expiryDate: Date,
  customConfig?: Partial<DocumentRecord>
): DocumentRecord {
  const config = STANDARD_DOCUMENT_CONFIGS[documentType];
  const currentDate = new Date();

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    businessId,
    documentType,
    documentName,
    documentNumber,
    issueDate,
    expiryDate,
    issuingAuthority: config.issuingAuthority,
    status: "valid",
    renewalRequired: config.renewalRequired,
    renewalPeriodDays: config.renewalPeriodDays,
    warningPeriodDays: config.warningPeriodDays,
    lastChecked: currentDate,
    createdAt: currentDate,
    updatedAt: currentDate,
    ...customConfig,
  };
}

/**
 * Generate document renewal calendar
 */
export function generateDocumentRenewalCalendar(
  documents: DocumentRecord[],
  startDate: Date,
  endDate: Date
): Array<{
  date: Date;
  documents: Array<{
    id: string;
    documentName: string;
    documentType: DocumentType;
    action: "renew" | "expires" | "warning";
    priority: "low" | "medium" | "high" | "critical";
  }>;
}> {
  const calendar = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayDocuments = [];

    for (const document of documents) {
      const renewalDate = new Date(document.expiryDate);
      renewalDate.setDate(renewalDate.getDate() - document.renewalPeriodDays);

      const warningDate = new Date(document.expiryDate);
      warningDate.setDate(warningDate.getDate() - document.warningPeriodDays);

      // Check if current date matches any significant date
      if (isSameDate(currentDate, document.expiryDate)) {
        dayDocuments.push({
          id: document.id,
          documentName: document.documentName,
          documentType: document.documentType,
          action: "expires" as const,
          priority: "critical" as const,
        });
      } else if (
        document.renewalRequired &&
        isSameDate(currentDate, renewalDate)
      ) {
        dayDocuments.push({
          id: document.id,
          documentName: document.documentName,
          documentType: document.documentType,
          action: "renew" as const,
          priority: "high" as const,
        });
      } else if (isSameDate(currentDate, warningDate)) {
        dayDocuments.push({
          id: document.id,
          documentName: document.documentName,
          documentType: document.documentType,
          action: "warning" as const,
          priority: "medium" as const,
        });
      }
    }

    if (dayDocuments.length > 0) {
      calendar.push({
        date: new Date(currentDate),
        documents: dayDocuments,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return calendar;
}

/**
 * Check if two dates are the same day
 */
function isSameDate(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
