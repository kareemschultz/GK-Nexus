/**
 * Guyana eServices Integration Configuration
 *
 * This file documents the government eServices systems and their potential
 * integration points for GK-Nexus. As of December 2025, neither GRA nor NIS
 * offer public APIs for third-party integration.
 *
 * RESEARCH SOURCES (December 2025):
 * - GRA eServices: https://eservices.gra.gov.gy/
 * - GRA Padna App: https://www.gra.gov.gy/gra-launches-padna-app-and-other-taxpayer-friendly-solutions/
 * - NIS Portal: https://nis.org.gy/
 * - NIS eSchedule: https://esched.nis.org.gy/
 */

// =============================================================================
// GRA (GUYANA REVENUE AUTHORITY) INTEGRATION
// =============================================================================

export const GRA_CONFIG = {
  // Official portal URLs
  portals: {
    main: "https://www.gra.gov.gy/",
    eservices: "https://eservices.gra.gov.gy/",
    login: "https://eservices.gra.gov.gy/login",
  },

  // System info
  system: {
    name: "Optimal Revenue Management System (RMS)",
    launchDate: "2021-03",
    description:
      "Replaced TRIPS system. Allows electronic filing and payment tracking.",
  },

  // Padna mobile app (launched January 2025)
  padnaApp: {
    features: [
      "Event reminders for tax deadlines",
      "License expiration notifications",
      "Digital Document Vault (TIN Certificate, etc.)",
      "Motor vehicle/driver license payments via MMG",
      "Compliance certificate applications",
      "QR code scanning for Form 7B auto-population",
    ],
    platforms: ["iOS", "Android"],
    launchDate: "2025-01-28",
  },

  // Tax types managed by GRA
  taxTypes: [
    { code: "PAYE", name: "Pay As You Earn", filingFrequency: "monthly" },
    { code: "VAT", name: "Value Added Tax", filingFrequency: "monthly" },
    {
      code: "CT",
      name: "Corporation Tax",
      filingFrequency: "quarterly/annual",
    },
    { code: "PIT", name: "Personal Income Tax", filingFrequency: "annual" },
    { code: "WHT", name: "Withholding Tax", filingFrequency: "monthly" },
    { code: "PT", name: "Property Tax", filingFrequency: "annual" },
    { code: "CAT", name: "Capital Gains Tax", filingFrequency: "as-needed" },
  ],

  // Key filing deadlines
  deadlines: {
    paye: "14th of following month",
    vat: "21st of following month",
    corporationTax: "April 30 (annual)",
    personalIncomeTax: "April 30 (annual)",
  },

  // Contact for API inquiries
  contact: {
    itDepartment: "227-6060 ext: 8000",
    note: "Contact IT department for third-party integration inquiries",
  },
} as const;

// =============================================================================
// NIS (NATIONAL INSURANCE SCHEME) INTEGRATION
// =============================================================================

export const NIS_CONFIG = {
  // Official portal URLs
  portals: {
    main: "https://www.nis.org.gy/",
    eSchedule: "https://esched.nis.org.gy/",
    contributionCheck: "https://www.nis.org.gy/occs/",
  },

  // Contribution rates (as of 2025)
  contributions: {
    employer: 0.084, // 8.4%
    employee: 0.056, // 5.6%
    total: 0.14, // 14%
    ceiling: 280_000, // Monthly ceiling in GYD
    ceilingNote: "Maximum insurable earnings per month",
  },

  // Online services available
  services: {
    eScheduleSubmission: {
      description:
        "Electronic schedule submission for monthly/weekly employees",
      features: [
        "Create summary sheets online",
        "Attach employee schedules",
        "View past submitted schedules",
        "No more physical media required",
      ],
    },
    occs: {
      name: "Online Contribution Checking System",
      description: "Check contribution history for NIS-registered individuals",
      updateFrequency: "quarterly",
      lastUpdated: "2024-11-30",
      nextUpdate: "2025-02-28",
    },
  },

  // Filing deadlines
  deadlines: {
    monthlyContributions: "14th of following month",
    scheduleSubmission: "14th of following month",
    annualReturn: "January 31",
  },

  // NIS number format
  numberFormat: {
    pattern: "^[A-Z]-\\d{6}$", // A-123456
    example: "A-123456",
    description: "Letter prefix followed by 6 digits",
  },
} as const;

// =============================================================================
// DEEDS REGISTRY INTEGRATION
// =============================================================================

export const DEEDS_REGISTRY_CONFIG = {
  portals: {
    main: "https://www.deedsregistry.gov.gy/",
  },

  services: [
    "Property Title Search",
    "Transport Registration",
    "Mortgage Registration",
    "Title Verification",
    "Company Registration Search",
  ],

  // No electronic services currently available
  integrationStatus: "manual",
  note: "All transactions require in-person visits",
} as const;

// =============================================================================
// INTEGRATION STATUS SUMMARY
// =============================================================================

export const INTEGRATION_STATUS = {
  gra: {
    hasPublicAPI: false,
    webPortalAvailable: true,
    mobileApp: true,
    automationPossibility: "future",
    notes:
      "GRA is moving towards full automation. Future API may become available.",
  },
  nis: {
    hasPublicAPI: false,
    webPortalAvailable: true,
    mobileApp: false,
    automationPossibility: "limited",
    notes: "eSchedule portal allows electronic submission, no API integration.",
  },
  deedsRegistry: {
    hasPublicAPI: false,
    webPortalAvailable: false,
    mobileApp: false,
    automationPossibility: "none",
    notes: "All services require in-person visits.",
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS FOR FUTURE INTEGRATION
// =============================================================================

/**
 * Calculate NIS contributions for an employee
 */
export function calculateNISContributions(grossSalary: number): {
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  insurableEarnings: number;
} {
  // Apply ceiling
  const insurableEarnings = Math.min(
    grossSalary,
    NIS_CONFIG.contributions.ceiling
  );

  const employeeContribution = Math.round(
    insurableEarnings * NIS_CONFIG.contributions.employee
  );
  const employerContribution = Math.round(
    insurableEarnings * NIS_CONFIG.contributions.employer
  );

  return {
    employeeContribution,
    employerContribution,
    totalContribution: employeeContribution + employerContribution,
    insurableEarnings,
  };
}

/**
 * Generate GRA eServices portal link
 */
export function getGRAPortalLink(
  service?: "login" | "main" | "eservices"
): string {
  return GRA_CONFIG.portals[service || "eservices"];
}

/**
 * Generate NIS portal link
 */
export function getNISPortalLink(
  service?: "main" | "eSchedule" | "contributionCheck"
): string {
  return NIS_CONFIG.portals[service || "main"];
}

/**
 * Validate NIS number format
 */
export function isValidNISNumber(nisNumber: string): boolean {
  const pattern = new RegExp(NIS_CONFIG.numberFormat.pattern);
  return pattern.test(nisNumber);
}

/**
 * Get filing deadline for a specific tax type
 */
export function getFilingDeadline(
  taxType: keyof typeof GRA_CONFIG.deadlines
): string {
  return GRA_CONFIG.deadlines[taxType];
}
