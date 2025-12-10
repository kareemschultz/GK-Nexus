import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";

// AI procedures
import {
  aiClassifyDocument,
  aiExecuteSmartFiling,
  aiExecuteSmartIntegration,
  aiGenerateClientInsights,
  aiGenerateExecutiveSummary,
  aiGenerateRealTimeInsights,
  aiGetBusinessMetrics,
  aiGetClientInsightsDashboard,
  aiGetSystemHealth,
  aiGetTaxSeasonAnalytics,
  aiGetUsageMetrics,
  aiManageMLModels,
  aiMonitorCompliance,
  aiPerformRiskAssessment,
  aiPerformSmartSubmission,
  aiProcessDocumentsIntelligently,
  aiValidateSubmissionData,
  aiValidateTaxCalculation,
} from "./ai";

// Appointments procedures
import {
  appointmentCancel,
  appointmentCheckAvailability,
  appointmentCreate,
  appointmentCreateExternal,
  appointmentGetById,
  appointmentGetStats,
  appointmentList,
  appointmentReschedule,
  appointmentUpdate,
} from "./appointments";

// Audit procedures
import {
  auditArchiveLogs,
  auditCreateSystemEvent,
  auditExportLogs,
  auditGenerateComplianceReport,
  auditGetLogById,
  auditGetRetentionPolicy,
  auditGetSummary,
  auditGetSuspiciousActivity,
  auditListLoginAttempts,
  auditListSystemEvents,
  auditSearchLogs,
} from "./audit";

// Backup procedures
import {
  backupCreate,
  backupCreateSchedule,
  backupDelete,
  backupDeleteSchedule,
  backupExportSettings,
  backupGetAuditLog,
  backupGetById,
  backupGetStorageStats,
  backupList,
  backupListRestoreOperations,
  backupListSchedules,
  backupRestore,
  backupUpdateSchedule,
  backupVerify,
} from "./backup";

// Clients procedures
import {
  clientBulkAction,
  clientContactCreate,
  clientContactDelete,
  clientContactList,
  clientContactUpdate,
  clientCreate,
  clientDelete,
  clientGetById,
  clientGetImmigrationStatus,
  clientGetImmigrationWorkflowTemplates,
  clientList,
  clientServiceCreate,
  clientServiceDelete,
  clientServiceList,
  clientServiceUpdate,
  clientStats,
  clientSubmitImmigrationDocuments,
  clientUpdate,
  clientUpdateImmigrationStatus,
  clientWizardComplete,
  clientWizardStep1,
  clientWizardStep2,
  clientWizardStep3,
  clientWizardStep4,
} from "./clients";

// Compliance procedures
import {
  complianceCreateFiling,
  complianceCreateRequirement,
  complianceExportGraForm7B,
  complianceGetAlerts,
  complianceGetAuditTrail,
  complianceGetDashboardOverview,
  complianceGetFilings,
  complianceGetRequirements,
  complianceUpdateFiling,
  complianceUpdateRequirement,
} from "./compliance";

// Dashboard procedures
import {
  dashboardClientPerformance,
  dashboardComplianceReport,
  dashboardFinancialSummary,
  dashboardKpis,
  dashboardOverview,
  dashboardRevenueAnalysis,
} from "./dashboard";

// Documents procedures
import {
  documentCreate,
  documentCreateFolder,
  documentCreateVersion,
  documentDelete,
  documentGetById,
  documentGetStats,
  documentGetVersions,
  documentList,
  documentListFolders,
  documentMoveDocument,
  documentRequirementChecklists,
  documentRequirementList,
  documentRequirementServiceTypes,
  documentSearch,
  documentShare,
  documentTemplateCategories,
  documentTemplateGetById,
  documentTemplateList,
  documentUpdate,
} from "./documents";

// Expediting procedures
import {
  expeditingActivitiesCreate,
  expeditingActivitiesList,
  expeditingAgencyContactsCreate,
  expeditingAgencyContactsList,
  expeditingAgencyContactsUpdate,
  expeditingQueueCreate,
  expeditingQueueList,
  expeditingQueueUpdateStatus,
  expeditingRequestsAssign,
  expeditingRequestsComplete,
  expeditingRequestsCreate,
  expeditingRequestsGetById,
  expeditingRequestsList,
  expeditingRequestsStats,
  expeditingRequestsUpdate,
} from "./expediting";

// GRA Integration procedures
import {
  graAuthenticate,
  graCheckSubmissionStatus,
  graExportClientData,
  graGetFilingCalendar,
  graSubmitFiling,
  graSyncClient,
} from "./gra-integration";

// Immigration procedures
import {
  immigrationArchiveCase,
  immigrationCreateCase,
  immigrationCreateDocumentRequirement,
  immigrationCreateTimelineEvent,
  immigrationGetCaseById,
  immigrationGetCaseTimeline,
  immigrationGetDocumentRequirements,
  immigrationGetStats,
  immigrationGetUpcomingDeadlines,
  immigrationListCases,
  immigrationUpdateCase,
  immigrationUpdateDocumentRequirement,
} from "./immigration";

// Invoices procedures
import {
  invoiceCreate,
  invoiceDelete,
  invoiceGetById,
  invoiceList,
  invoiceStats,
  invoiceUpdate,
} from "./invoices";

// Local Content procedures
import {
  localContentChecklistsCreate,
  localContentChecklistsList,
  localContentChecklistsUpdate,
  localContentPlansCreate,
  localContentPlansList,
  localContentPlansSubmit,
  localContentPlansUpdate,
  localContentRegistrationsApprove,
  localContentRegistrationsCreate,
  localContentRegistrationsGetById,
  localContentRegistrationsList,
  localContentRegistrationsStats,
  localContentRegistrationsUpdate,
  localContentReportsCreate,
  localContentReportsList,
  localContentReportsSubmit,
  localContentReportsUpdate,
  localContentVendorsCreate,
  localContentVendorsList,
  localContentVendorsUpdate,
} from "./local-content";

// Notifications procedures
import {
  notificationArchive,
  notificationBulkMarkRead,
  notificationCreate,
  notificationCreateTemplate,
  notificationGetMine,
  notificationGetPreferences,
  notificationGetStats,
  notificationGetTemplates,
  notificationMarkAllRead,
  notificationMarkRead,
  notificationUpdatePreferences,
} from "./notifications";

// OCR procedures
import {
  ocrBatchProcess,
  ocrGetBatchStatus,
  ocrGetExtractedData,
  ocrGetProcessingStats,
  ocrGetProcessingStatus,
  ocrProcessDocument,
  ocrValidateResults,
} from "./ocr";

// Partner Network procedures
import {
  partnerNetworkAgreementsActivate,
  partnerNetworkAgreementsCreate,
  partnerNetworkAgreementsDelete,
  partnerNetworkAgreementsGetById,
  partnerNetworkAgreementsList,
  partnerNetworkAgreementsUpdate,
  partnerNetworkCommunicationsCreate,
  partnerNetworkCommunicationsDelete,
  partnerNetworkCommunicationsGetById,
  partnerNetworkCommunicationsGetPendingFollowUps,
  partnerNetworkCommunicationsList,
  partnerNetworkCommunicationsMarkFollowUpComplete,
  partnerNetworkPartnersCreate,
  partnerNetworkPartnersDelete,
  partnerNetworkPartnersGetById,
  partnerNetworkPartnersList,
  partnerNetworkPartnersStats,
  partnerNetworkPartnersUpdate,
  partnerNetworkPartnersUpdateTier,
  partnerNetworkPartnersVerify,
  partnerNetworkReferralsAccept,
  partnerNetworkReferralsComplete,
  partnerNetworkReferralsCreate,
  partnerNetworkReferralsDelete,
  partnerNetworkReferralsGetById,
  partnerNetworkReferralsList,
  partnerNetworkReferralsUpdate,
  partnerNetworkReviewsAddResponse,
  partnerNetworkReviewsCreate,
  partnerNetworkReviewsDelete,
  partnerNetworkReviewsGetById,
  partnerNetworkReviewsList,
  partnerNetworkReviewsModerate,
} from "./partner-network";

// Payroll procedures
import {
  payrollCalculate,
  payrollDepartments,
  payrollEmployeeCreate,
  payrollEmployeeDelete,
  payrollEmployeeGetById,
  payrollEmployeeList,
  payrollEmployeeUpdate,
  payrollRunsCreate,
  payrollRunsList,
} from "./payroll";

// Property Management procedures
import {
  propertyManagementInspectionsComplete,
  propertyManagementInspectionsCreate,
  propertyManagementInspectionsList,
  propertyManagementLeasesCreate,
  propertyManagementLeasesGetById,
  propertyManagementLeasesGetExpiring,
  propertyManagementLeasesList,
  propertyManagementLeasesTerminate,
  propertyManagementLeasesUpdate,
  propertyManagementMaintenanceCreate,
  propertyManagementMaintenanceList,
  propertyManagementMaintenanceUpdate,
  propertyManagementPaymentsGetOverdue,
  propertyManagementPaymentsList,
  propertyManagementPaymentsRecordPayment,
  propertyManagementPaymentsUpdatePayment,
  propertyManagementPropertiesCreate,
  propertyManagementPropertiesDelete,
  propertyManagementPropertiesGetById,
  propertyManagementPropertiesList,
  propertyManagementPropertiesStats,
  propertyManagementPropertiesUpdate,
  propertyManagementTenantsCreate,
  propertyManagementTenantsDelete,
  propertyManagementTenantsGetById,
  propertyManagementTenantsList,
  propertyManagementTenantsUpdate,
} from "./property-management";

// RBAC procedures
import {
  rbacAssignRoleToUser,
  rbacCheckPermission,
  rbacCreatePermission,
  rbacCreateRole,
  rbacDenyPermissionToUser,
  rbacGetUserPermissions,
  rbacGrantPermissionToUser,
  rbacListPermissions,
  rbacListRoles,
  rbacRemoveRoleFromUser,
} from "./rbac";

// Service Catalog procedures
import { serviceCatalogRouter } from "./service-catalog";

// Tax procedures
import {
  taxCalculateNis,
  taxCalculatePaye,
  taxCalculatePayroll,
  taxCalculateQuarterly,
  taxCalculateVat,
  taxCheckVatRegistration,
  taxFilingsList,
  taxGenerateGraForm,
  taxGetCalculationHistory,
  taxGetDeadlines,
  taxGetRates,
  taxGetSubmissionStatus,
  taxGetSummary,
  taxSaveCalculation,
  taxSubmitCorporateTaxReturn,
  taxSubmitPayeReturn,
  taxSubmitVatReturn,
} from "./tax";

// Training procedures
import {
  trainingCertificatesIssue,
  trainingCertificatesList,
  trainingCertificatesVerify,
  trainingCoursesCreate,
  trainingCoursesGetById,
  trainingCoursesList,
  trainingCoursesPublish,
  trainingCoursesStats,
  trainingCoursesUpdate,
  trainingInstructorsCreate,
  trainingInstructorsList,
  trainingInstructorsUpdate,
  trainingRegistrationsCreate,
  trainingRegistrationsList,
  trainingRegistrationsMarkAttendance,
  trainingRegistrationsUpdateStatus,
  trainingSessionsCreate,
  trainingSessionsGetById,
  trainingSessionsList,
  trainingSessionsOpenRegistration,
  trainingSessionsUpdate,
} from "./training";

// Users procedures
import {
  userBulkAction,
  userChangePassword,
  userCreate,
  userDelete,
  userGetById,
  userList,
  userMe,
  userResetPassword,
  userRolesAndPermissions,
  userStats,
  userUpdate,
  userUpdatePermissions,
} from "./users";

// ============================================================================
// NESTED ROUTER STRUCTURE
// Pattern: orpc.{domain}.{resource}.{action}
// Example: orpc.training.courses.list
// ============================================================================

export const appRouter = {
  // Health check endpoints (public)
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.user,
  })),

  // AI domain
  ai: {
    classify: aiClassifyDocument,
    validateTax: aiValidateTaxCalculation,
    riskAssessment: aiPerformRiskAssessment,
    clientInsights: aiGenerateClientInsights,
    monitorCompliance: aiMonitorCompliance,
    smartSubmission: aiPerformSmartSubmission,
    validateSubmission: aiValidateSubmissionData,
    businessMetrics: aiGetBusinessMetrics,
    taxSeasonAnalytics: aiGetTaxSeasonAnalytics,
    clientInsightsDashboard: aiGetClientInsightsDashboard,
    executiveSummary: aiGenerateExecutiveSummary,
    smartIntegration: aiExecuteSmartIntegration,
    processDocuments: aiProcessDocumentsIntelligently,
    smartFiling: aiExecuteSmartFiling,
    realTimeInsights: aiGenerateRealTimeInsights,
    mlModels: aiManageMLModels,
    systemHealth: aiGetSystemHealth,
    usageMetrics: aiGetUsageMetrics,
  },

  // Appointments domain
  appointments: {
    list: appointmentList,
    getById: appointmentGetById,
    create: appointmentCreate,
    createExternal: appointmentCreateExternal,
    update: appointmentUpdate,
    cancel: appointmentCancel,
    reschedule: appointmentReschedule,
    checkAvailability: appointmentCheckAvailability,
    stats: appointmentGetStats,
  },

  // Audit domain
  audit: {
    logs: {
      search: auditSearchLogs,
      getById: auditGetLogById,
      export: auditExportLogs,
      summary: auditGetSummary,
      archive: auditArchiveLogs,
    },
    systemEvents: {
      list: auditListSystemEvents,
      create: auditCreateSystemEvent,
    },
    loginAttempts: {
      list: auditListLoginAttempts,
    },
    suspicious: auditGetSuspiciousActivity,
    complianceReport: auditGenerateComplianceReport,
    retentionPolicy: auditGetRetentionPolicy,
  },

  // Backup domain
  backup: {
    list: backupList,
    getById: backupGetById,
    create: backupCreate,
    delete: backupDelete,
    verify: backupVerify,
    restore: backupRestore,
    schedules: {
      list: backupListSchedules,
      create: backupCreateSchedule,
      update: backupUpdateSchedule,
      delete: backupDeleteSchedule,
    },
    storageStats: backupGetStorageStats,
    restoreOperations: backupListRestoreOperations,
    exportSettings: backupExportSettings,
    auditLog: backupGetAuditLog,
  },

  // Clients domain
  clients: {
    list: clientList,
    getById: clientGetById,
    create: clientCreate,
    update: clientUpdate,
    delete: clientDelete,
    stats: clientStats,
    bulkAction: clientBulkAction,
    contacts: {
      list: clientContactList,
      create: clientContactCreate,
      update: clientContactUpdate,
      delete: clientContactDelete,
    },
    services: {
      list: clientServiceList,
      create: clientServiceCreate,
      update: clientServiceUpdate,
      delete: clientServiceDelete,
    },
    wizard: {
      step1: clientWizardStep1,
      step2: clientWizardStep2,
      step3: clientWizardStep3,
      step4: clientWizardStep4,
      complete: clientWizardComplete,
    },
    immigration: {
      getStatus: clientGetImmigrationStatus,
      updateStatus: clientUpdateImmigrationStatus,
      submitDocuments: clientSubmitImmigrationDocuments,
      workflowTemplates: clientGetImmigrationWorkflowTemplates,
    },
  },

  // Compliance domain
  compliance: {
    dashboard: complianceGetDashboardOverview,
    requirements: {
      list: complianceGetRequirements,
      create: complianceCreateRequirement,
      update: complianceUpdateRequirement,
    },
    filings: {
      list: complianceGetFilings,
      create: complianceCreateFiling,
      update: complianceUpdateFiling,
      exportGraForm7B: complianceExportGraForm7B,
    },
    alerts: complianceGetAlerts,
    auditTrail: complianceGetAuditTrail,
  },

  // Dashboard domain
  dashboard: {
    overview: dashboardOverview,
    kpis: dashboardKpis,
    revenueAnalysis: dashboardRevenueAnalysis,
    complianceReport: dashboardComplianceReport,
    clientPerformance: dashboardClientPerformance,
    financialSummary: dashboardFinancialSummary,
  },

  // Documents domain
  documents: {
    list: documentList,
    getById: documentGetById,
    create: documentCreate,
    update: documentUpdate,
    delete: documentDelete,
    share: documentShare,
    search: documentSearch,
    stats: documentGetStats,
    versions: {
      list: documentGetVersions,
      create: documentCreateVersion,
    },
    folders: {
      list: documentListFolders,
      create: documentCreateFolder,
      move: documentMoveDocument,
    },
    templates: {
      list: documentTemplateList,
      getById: documentTemplateGetById,
      categories: documentTemplateCategories,
    },
    requirements: {
      list: documentRequirementList,
      serviceTypes: documentRequirementServiceTypes,
      checklists: documentRequirementChecklists,
    },
  },

  // Expediting domain
  expediting: {
    requests: {
      list: expeditingRequestsList,
      getById: expeditingRequestsGetById,
      create: expeditingRequestsCreate,
      update: expeditingRequestsUpdate,
      assign: expeditingRequestsAssign,
      complete: expeditingRequestsComplete,
      stats: expeditingRequestsStats,
    },
    activities: {
      list: expeditingActivitiesList,
      create: expeditingActivitiesCreate,
    },
    agencyContacts: {
      list: expeditingAgencyContactsList,
      create: expeditingAgencyContactsCreate,
      update: expeditingAgencyContactsUpdate,
    },
    queue: {
      list: expeditingQueueList,
      create: expeditingQueueCreate,
      updateStatus: expeditingQueueUpdateStatus,
    },
  },

  // GRA Integration domain
  gra: {
    authenticate: graAuthenticate,
    syncClient: graSyncClient,
    submitFiling: graSubmitFiling,
    checkSubmissionStatus: graCheckSubmissionStatus,
    filingCalendar: graGetFilingCalendar,
    exportClientData: graExportClientData,
  },

  // Immigration domain
  immigration: {
    cases: {
      list: immigrationListCases,
      getById: immigrationGetCaseById,
      create: immigrationCreateCase,
      update: immigrationUpdateCase,
      archive: immigrationArchiveCase,
    },
    documentRequirements: {
      list: immigrationGetDocumentRequirements,
      create: immigrationCreateDocumentRequirement,
      update: immigrationUpdateDocumentRequirement,
    },
    timeline: {
      get: immigrationGetCaseTimeline,
      createEvent: immigrationCreateTimelineEvent,
    },
    stats: immigrationGetStats,
    upcomingDeadlines: immigrationGetUpcomingDeadlines,
  },

  // Invoices domain
  invoices: {
    list: invoiceList,
    getById: invoiceGetById,
    create: invoiceCreate,
    update: invoiceUpdate,
    delete: invoiceDelete,
    stats: invoiceStats,
  },

  // Local Content domain
  localContent: {
    registrations: {
      list: localContentRegistrationsList,
      getById: localContentRegistrationsGetById,
      create: localContentRegistrationsCreate,
      update: localContentRegistrationsUpdate,
      approve: localContentRegistrationsApprove,
      stats: localContentRegistrationsStats,
    },
    plans: {
      list: localContentPlansList,
      create: localContentPlansCreate,
      update: localContentPlansUpdate,
      submit: localContentPlansSubmit,
    },
    reports: {
      list: localContentReportsList,
      create: localContentReportsCreate,
      update: localContentReportsUpdate,
      submit: localContentReportsSubmit,
    },
    vendors: {
      list: localContentVendorsList,
      create: localContentVendorsCreate,
      update: localContentVendorsUpdate,
    },
    checklists: {
      list: localContentChecklistsList,
      create: localContentChecklistsCreate,
      update: localContentChecklistsUpdate,
    },
  },

  // Notifications domain
  notifications: {
    list: notificationGetMine,
    create: notificationCreate,
    markRead: notificationMarkRead,
    bulkMarkRead: notificationBulkMarkRead,
    markAllRead: notificationMarkAllRead,
    archive: notificationArchive,
    stats: notificationGetStats,
    preferences: {
      get: notificationGetPreferences,
      update: notificationUpdatePreferences,
    },
    templates: {
      list: notificationGetTemplates,
      create: notificationCreateTemplate,
    },
  },

  // OCR domain
  ocr: {
    process: ocrProcessDocument,
    status: ocrGetProcessingStatus,
    extractedData: ocrGetExtractedData,
    validate: ocrValidateResults,
    stats: ocrGetProcessingStats,
    batch: {
      process: ocrBatchProcess,
      status: ocrGetBatchStatus,
    },
  },

  // Partner Network domain
  partnerNetwork: {
    partners: {
      list: partnerNetworkPartnersList,
      getById: partnerNetworkPartnersGetById,
      create: partnerNetworkPartnersCreate,
      update: partnerNetworkPartnersUpdate,
      delete: partnerNetworkPartnersDelete,
      verify: partnerNetworkPartnersVerify,
      updateTier: partnerNetworkPartnersUpdateTier,
      stats: partnerNetworkPartnersStats,
    },
    referrals: {
      list: partnerNetworkReferralsList,
      getById: partnerNetworkReferralsGetById,
      create: partnerNetworkReferralsCreate,
      update: partnerNetworkReferralsUpdate,
      accept: partnerNetworkReferralsAccept,
      complete: partnerNetworkReferralsComplete,
      delete: partnerNetworkReferralsDelete,
    },
    agreements: {
      list: partnerNetworkAgreementsList,
      getById: partnerNetworkAgreementsGetById,
      create: partnerNetworkAgreementsCreate,
      update: partnerNetworkAgreementsUpdate,
      delete: partnerNetworkAgreementsDelete,
      activate: partnerNetworkAgreementsActivate,
    },
    reviews: {
      list: partnerNetworkReviewsList,
      getById: partnerNetworkReviewsGetById,
      create: partnerNetworkReviewsCreate,
      moderate: partnerNetworkReviewsModerate,
      addResponse: partnerNetworkReviewsAddResponse,
      delete: partnerNetworkReviewsDelete,
    },
    communications: {
      list: partnerNetworkCommunicationsList,
      getById: partnerNetworkCommunicationsGetById,
      create: partnerNetworkCommunicationsCreate,
      markFollowUpComplete: partnerNetworkCommunicationsMarkFollowUpComplete,
      pendingFollowUps: partnerNetworkCommunicationsGetPendingFollowUps,
      delete: partnerNetworkCommunicationsDelete,
    },
  },

  // Payroll domain
  payroll: {
    employees: {
      list: payrollEmployeeList,
      getById: payrollEmployeeGetById,
      create: payrollEmployeeCreate,
      update: payrollEmployeeUpdate,
      delete: payrollEmployeeDelete,
    },
    calculate: payrollCalculate,
    runs: {
      list: payrollRunsList,
      create: payrollRunsCreate,
    },
    departments: payrollDepartments,
  },

  // Property Management domain (aliased as 'properties' for frontend)
  properties: {
    list: propertyManagementPropertiesList,
    getById: propertyManagementPropertiesGetById,
    create: propertyManagementPropertiesCreate,
    update: propertyManagementPropertiesUpdate,
    delete: propertyManagementPropertiesDelete,
    stats: propertyManagementPropertiesStats,
    tenants: {
      list: propertyManagementTenantsList,
      getById: propertyManagementTenantsGetById,
      create: propertyManagementTenantsCreate,
      update: propertyManagementTenantsUpdate,
      delete: propertyManagementTenantsDelete,
    },
    leases: {
      list: propertyManagementLeasesList,
      getById: propertyManagementLeasesGetById,
      create: propertyManagementLeasesCreate,
      update: propertyManagementLeasesUpdate,
      terminate: propertyManagementLeasesTerminate,
      expiring: propertyManagementLeasesGetExpiring,
    },
    payments: {
      list: propertyManagementPaymentsList,
      record: propertyManagementPaymentsRecordPayment,
      update: propertyManagementPaymentsUpdatePayment,
      overdue: propertyManagementPaymentsGetOverdue,
    },
    maintenance: {
      list: propertyManagementMaintenanceList,
      create: propertyManagementMaintenanceCreate,
      update: propertyManagementMaintenanceUpdate,
    },
    inspections: {
      list: propertyManagementInspectionsList,
      create: propertyManagementInspectionsCreate,
      complete: propertyManagementInspectionsComplete,
    },
  },

  // RBAC domain
  rbac: {
    checkPermission: rbacCheckPermission,
    userPermissions: rbacGetUserPermissions,
    roles: {
      list: rbacListRoles,
      create: rbacCreateRole,
      assignToUser: rbacAssignRoleToUser,
      removeFromUser: rbacRemoveRoleFromUser,
    },
    permissions: {
      list: rbacListPermissions,
      create: rbacCreatePermission,
      grantToUser: rbacGrantPermissionToUser,
      denyToUser: rbacDenyPermissionToUser,
    },
  },

  // Service Catalog domain (spread existing router)
  serviceCatalog: serviceCatalogRouter,

  // Tax domain
  tax: {
    filings: {
      list: taxFilingsList,
      submitVat: taxSubmitVatReturn,
      submitPaye: taxSubmitPayeReturn,
      submitCorporate: taxSubmitCorporateTaxReturn,
      status: taxGetSubmissionStatus,
    },
    calculate: {
      paye: taxCalculatePaye,
      nis: taxCalculateNis,
      vat: taxCalculateVat,
      payroll: taxCalculatePayroll,
      quarterly: taxCalculateQuarterly,
    },
    deadlines: taxGetDeadlines,
    vatRegistration: taxCheckVatRegistration,
    graForm: taxGenerateGraForm,
    saveCalculation: taxSaveCalculation,
    calculationHistory: taxGetCalculationHistory,
    summary: taxGetSummary,
    rates: taxGetRates,
  },

  // Training domain
  training: {
    courses: {
      list: trainingCoursesList,
      getById: trainingCoursesGetById,
      create: trainingCoursesCreate,
      update: trainingCoursesUpdate,
      publish: trainingCoursesPublish,
      stats: trainingCoursesStats,
    },
    sessions: {
      list: trainingSessionsList,
      getById: trainingSessionsGetById,
      create: trainingSessionsCreate,
      update: trainingSessionsUpdate,
      openRegistration: trainingSessionsOpenRegistration,
    },
    registrations: {
      list: trainingRegistrationsList,
      create: trainingRegistrationsCreate,
      updateStatus: trainingRegistrationsUpdateStatus,
      markAttendance: trainingRegistrationsMarkAttendance,
    },
    certificates: {
      list: trainingCertificatesList,
      issue: trainingCertificatesIssue,
      verify: trainingCertificatesVerify,
    },
    instructors: {
      list: trainingInstructorsList,
      create: trainingInstructorsCreate,
      update: trainingInstructorsUpdate,
    },
  },

  // Users domain
  users: {
    list: userList,
    getById: userGetById,
    me: userMe,
    create: userCreate,
    update: userUpdate,
    delete: userDelete,
    changePassword: userChangePassword,
    resetPassword: userResetPassword,
    updatePermissions: userUpdatePermissions,
    bulkAction: userBulkAction,
    stats: userStats,
    rolesAndPermissions: userRolesAndPermissions,
  },
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
