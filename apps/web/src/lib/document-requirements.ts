/**
 * Dynamic Document Requirements Configuration
 * Based on Guyana regulatory requirements for different entity types and services
 */

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSizeMB: number;
  validityPeriod?: string; // e.g., "6 months", "1 year"
  agency?: string; // Which agency requires this
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  documents: DocumentRequirement[];
}

// Base documents required for ALL entity types
const BASE_INDIVIDUAL_DOCUMENTS: DocumentRequirement[] = [
  {
    id: "national_id",
    name: "National ID Card",
    description: "Valid Guyana National ID card (front and back)",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 5,
    validityPeriod: "Must be valid",
  },
  {
    id: "passport",
    name: "Passport",
    description: "Valid passport (bio page) - required if non-Guyanese",
    required: false,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 5,
    validityPeriod: "6 months beyond intended use",
  },
  {
    id: "proof_of_address",
    name: "Proof of Address",
    description:
      "Utility bill, bank statement, or government correspondence (not older than 3 months)",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 5,
    validityPeriod: "3 months",
  },
  {
    id: "passport_photo",
    name: "Passport-Size Photograph",
    description: "Recent passport-size photo with white background",
    required: true,
    acceptedFormats: [".jpg", ".jpeg", ".png"],
    maxSizeMB: 2,
    validityPeriod: "Recent (within 6 months)",
  },
];

const BASE_COMPANY_DOCUMENTS: DocumentRequirement[] = [
  {
    id: "certificate_of_incorporation",
    name: "Certificate of Incorporation",
    description: "Official certificate from Deeds Registry",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 10,
    agency: "Deeds Registry",
  },
  {
    id: "articles_of_incorporation",
    name: "Articles of Incorporation",
    description: "Company's articles/memorandum of association",
    required: true,
    acceptedFormats: [".pdf"],
    maxSizeMB: 20,
    agency: "Deeds Registry",
  },
  {
    id: "tin_certificate",
    name: "TIN Certificate",
    description: "Tax Identification Number certificate from GRA",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 5,
    agency: "GRA",
  },
  {
    id: "directors_id",
    name: "Directors' Identification",
    description: "National ID or passport for all directors",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 10,
  },
  {
    id: "directors_list",
    name: "List of Directors",
    description: "Official document listing all company directors",
    required: true,
    acceptedFormats: [".pdf"],
    maxSizeMB: 5,
  },
  {
    id: "shareholders_register",
    name: "Register of Shareholders",
    description: "Document showing all shareholders and their shares",
    required: true,
    acceptedFormats: [".pdf"],
    maxSizeMB: 5,
  },
  {
    id: "registered_address",
    name: "Registered Office Address",
    description: "Proof of registered business address",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 5,
  },
];

const BASE_PARTNERSHIP_DOCUMENTS: DocumentRequirement[] = [
  {
    id: "partnership_agreement",
    name: "Partnership Agreement",
    description: "Signed partnership agreement between all partners",
    required: true,
    acceptedFormats: [".pdf"],
    maxSizeMB: 20,
  },
  {
    id: "partnership_registration",
    name: "Partnership Registration Certificate",
    description: "Registration certificate from Deeds Registry",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 10,
    agency: "Deeds Registry",
  },
  {
    id: "partners_id",
    name: "Partners' Identification",
    description: "National ID or passport for all partners",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 10,
  },
  {
    id: "tin_certificate",
    name: "TIN Certificate",
    description: "Tax Identification Number certificate from GRA",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 5,
    agency: "GRA",
  },
];

const BASE_SOLE_PROPRIETORSHIP_DOCUMENTS: DocumentRequirement[] = [
  {
    id: "business_name_registration",
    name: "Business Name Registration",
    description: "Certificate of business name registration",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 10,
    agency: "Deeds Registry",
  },
  {
    id: "owner_id",
    name: "Owner's Identification",
    description: "National ID or passport of business owner",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 5,
  },
  {
    id: "tin_certificate",
    name: "TIN Certificate",
    description: "Tax Identification Number certificate from GRA",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 5,
    agency: "GRA",
  },
  {
    id: "proof_of_address",
    name: "Proof of Business Address",
    description: "Utility bill or bank statement showing business address",
    required: true,
    acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMB: 5,
    validityPeriod: "3 months",
  },
];

// Service-specific additional documents
const SERVICE_SPECIFIC_DOCUMENTS: Record<string, DocumentRequirement[]> = {
  PAYE_FILING: [
    {
      id: "nis_employer_registration",
      name: "NIS Employer Registration",
      description: "NIS employer registration certificate",
      required: true,
      acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
      maxSizeMB: 5,
      agency: "NIS",
    },
    {
      id: "payroll_records",
      name: "Payroll Records",
      description: "Recent payroll records or employee schedule",
      required: false,
      acceptedFormats: [".pdf", ".xlsx", ".csv"],
      maxSizeMB: 10,
    },
  ],
  VAT_RETURN: [
    {
      id: "vat_registration",
      name: "VAT Registration Certificate",
      description: "Certificate of VAT registration from GRA",
      required: true,
      acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
      maxSizeMB: 5,
      agency: "GRA",
    },
    {
      id: "sales_records",
      name: "Sales Records",
      description: "Monthly sales records or invoices summary",
      required: false,
      acceptedFormats: [".pdf", ".xlsx", ".csv"],
      maxSizeMB: 20,
    },
  ],
  INCOME_TAX_RETURN: [
    {
      id: "financial_statements",
      name: "Financial Statements",
      description: "Year-end financial statements (audited if applicable)",
      required: true,
      acceptedFormats: [".pdf", ".xlsx"],
      maxSizeMB: 20,
    },
    {
      id: "bank_statements",
      name: "Bank Statements",
      description: "12 months of bank statements",
      required: false,
      acceptedFormats: [".pdf"],
      maxSizeMB: 50,
      validityPeriod: "12 months",
    },
    {
      id: "previous_tax_returns",
      name: "Previous Tax Returns",
      description: "Last 3 years of tax returns (if available)",
      required: false,
      acceptedFormats: [".pdf"],
      maxSizeMB: 30,
    },
  ],
  NIS_SUBMISSION: [
    {
      id: "nis_employer_registration",
      name: "NIS Employer Registration",
      description: "NIS employer registration certificate",
      required: true,
      acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
      maxSizeMB: 5,
      agency: "NIS",
    },
    {
      id: "employee_schedule",
      name: "Employee Schedule",
      description: "List of all employees with NIS numbers",
      required: true,
      acceptedFormats: [".pdf", ".xlsx", ".csv"],
      maxSizeMB: 10,
    },
  ],
  BUSINESS_REGISTRATION: [
    {
      id: "proposed_name_search",
      name: "Name Search Results",
      description: "Evidence of business name availability search",
      required: false,
      acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
      maxSizeMB: 5,
      agency: "Deeds Registry",
    },
    {
      id: "business_plan",
      name: "Business Plan",
      description: "Business plan or description of activities",
      required: false,
      acceptedFormats: [".pdf", ".docx"],
      maxSizeMB: 20,
    },
  ],
  LOCAL_CONTENT: [
    {
      id: "local_content_application",
      name: "Local Content Application Form",
      description: "Completed LCDS application form",
      required: true,
      acceptedFormats: [".pdf"],
      maxSizeMB: 10,
      agency: "Local Content Secretariat",
    },
    {
      id: "ownership_structure",
      name: "Ownership Structure Document",
      description: "Document showing Guyanese ownership percentage",
      required: true,
      acceptedFormats: [".pdf"],
      maxSizeMB: 10,
    },
    {
      id: "employee_nationality",
      name: "Employee Nationality Records",
      description: "Records showing employee nationality breakdown",
      required: true,
      acceptedFormats: [".pdf", ".xlsx"],
      maxSizeMB: 10,
    },
    {
      id: "goods_services_declaration",
      name: "Goods & Services Declaration",
      description: "Declaration of goods/services to be provided",
      required: true,
      acceptedFormats: [".pdf"],
      maxSizeMB: 10,
    },
  ],
  IMMIGRATION: [
    {
      id: "passport_full",
      name: "Full Passport Copy",
      description: "All pages of valid passport",
      required: true,
      acceptedFormats: [".pdf"],
      maxSizeMB: 30,
      validityPeriod: "6 months beyond intended stay",
    },
    {
      id: "passport_photos",
      name: "Passport Photographs",
      description: "4 recent passport-size photos (white background)",
      required: true,
      acceptedFormats: [".jpg", ".jpeg", ".png"],
      maxSizeMB: 5,
    },
    {
      id: "police_clearance",
      name: "Police Clearance Certificate",
      description:
        "Police clearance from country of origin (not older than 6 months)",
      required: true,
      acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
      maxSizeMB: 5,
      validityPeriod: "6 months",
    },
    {
      id: "medical_certificate",
      name: "Medical Certificate",
      description: "Medical examination from approved facility",
      required: true,
      acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
      maxSizeMB: 10,
      agency: "Ministry of Health",
    },
    {
      id: "employment_letter",
      name: "Employment Letter",
      description: "Letter from employer stating position, duties, and salary",
      required: true,
      acceptedFormats: [".pdf"],
      maxSizeMB: 5,
    },
    {
      id: "cv_resume",
      name: "CV/Resume",
      description: "Detailed curriculum vitae",
      required: true,
      acceptedFormats: [".pdf", ".docx"],
      maxSizeMB: 5,
    },
    {
      id: "qualifications",
      name: "Educational Qualifications",
      description: "Copies of degrees, diplomas, and certificates",
      required: true,
      acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
      maxSizeMB: 20,
    },
  ],
  EXPEDITING: [
    {
      id: "authorization_letter",
      name: "Authorization Letter",
      description: "Letter authorizing GK to act on your behalf",
      required: true,
      acceptedFormats: [".pdf"],
      maxSizeMB: 5,
    },
    {
      id: "power_of_attorney",
      name: "Power of Attorney",
      description: "Notarized power of attorney (if applicable)",
      required: false,
      acceptedFormats: [".pdf"],
      maxSizeMB: 10,
    },
  ],
};

// Entity type to base documents mapping
export const ENTITY_TYPE_DOCUMENTS: Record<string, DocumentRequirement[]> = {
  INDIVIDUAL: BASE_INDIVIDUAL_DOCUMENTS,
  COMPANY: BASE_COMPANY_DOCUMENTS,
  PARTNERSHIP: BASE_PARTNERSHIP_DOCUMENTS,
  SOLE_PROPRIETORSHIP: BASE_SOLE_PROPRIETORSHIP_DOCUMENTS,
};

/**
 * Map service IDs to their document category keys
 * This maps the service values (e.g., WORK_PERMIT) to the SERVICE_SPECIFIC_DOCUMENTS keys (e.g., IMMIGRATION)
 */
const SERVICE_TO_DOCUMENT_CATEGORY: Record<string, string> = {
  // Tax Compliance services - map to their specific document requirements
  PAYE_FILING: "PAYE_FILING",
  VAT_RETURN: "VAT_RETURN",
  INCOME_TAX_RETURN: "INCOME_TAX_RETURN",
  CORPORATION_TAX_RETURN: "INCOME_TAX_RETURN",
  PROPERTY_TAX_RETURN: "INCOME_TAX_RETURN",
  CAPITAL_GAINS_TAX: "INCOME_TAX_RETURN",
  EXCISE_TAX_RETURN: "INCOME_TAX_RETURN",
  TENDER_COMPLIANCE: "INCOME_TAX_RETURN",
  WORK_PERMIT_COMPLIANCE: "INCOME_TAX_RETURN",
  LAND_TRANSFER_COMPLIANCE: "INCOME_TAX_RETURN",
  LIABILITY_COMPLIANCE: "INCOME_TAX_RETURN",
  PENSION_COMPLIANCE: "INCOME_TAX_RETURN",
  CERTIFICATE_OF_ASSESSMENT: "INCOME_TAX_RETURN",

  // NIS Services - map to NIS_SUBMISSION documents
  NIS_REGISTRATION: "NIS_SUBMISSION",
  NIS_CONTRIBUTIONS: "NIS_SUBMISSION",
  NIS_COMPLIANCE: "NIS_SUBMISSION",
  NIS_PENSION_QUERY: "NIS_SUBMISSION",

  // Business Development - map to BUSINESS_REGISTRATION documents
  COMPANY_INCORPORATION: "BUSINESS_REGISTRATION",
  BUSINESS_NAME_REGISTRATION: "BUSINESS_REGISTRATION",

  // Immigration Services - map to IMMIGRATION documents
  WORK_PERMIT: "IMMIGRATION",
  WORK_PERMIT_RENEWAL: "IMMIGRATION",
  CITIZENSHIP_APPLICATION: "IMMIGRATION",
  BUSINESS_VISA: "IMMIGRATION",
  RESIDENCE_PERMIT: "IMMIGRATION",

  // Local Content Services - map to LOCAL_CONTENT documents
  LOCAL_CONTENT_REGISTRATION: "LOCAL_CONTENT",
  LOCAL_CONTENT_CERTIFICATION: "LOCAL_CONTENT",
  LOCAL_CONTENT_COMPLIANCE: "LOCAL_CONTENT",

  // Expediting Services - map to EXPEDITING documents
  GRA_EXPEDITING: "EXPEDITING",
  DEEDS_EXPEDITING: "EXPEDITING",
  IMMIGRATION_EXPEDITING: "EXPEDITING",
  GENERAL_EXPEDITING: "EXPEDITING",
};

/**
 * Get all required documents based on entity type and selected services
 */
export function getRequiredDocuments(
  entityType: string,
  selectedServices: string[]
): DocumentCategory[] {
  const categories: DocumentCategory[] = [];

  // Add base documents for entity type
  const baseDocuments = ENTITY_TYPE_DOCUMENTS[entityType] || [];
  if (baseDocuments.length > 0) {
    categories.push({
      id: "base",
      name: "Identity & Registration Documents",
      description: `Required documents for ${entityType.toLowerCase().replace("_", " ")} registration`,
      documents: baseDocuments,
    });
  }

  // Add service-specific documents (deduplicated)
  const serviceDocuments: Map<string, DocumentRequirement> = new Map();

  for (const service of selectedServices) {
    // Map service ID to its document category key
    const documentCategoryKey =
      SERVICE_TO_DOCUMENT_CATEGORY[service] || service;
    const docs = SERVICE_SPECIFIC_DOCUMENTS[documentCategoryKey] || [];
    for (const doc of docs) {
      // Only add if not already present (deduplicate)
      if (!serviceDocuments.has(doc.id)) {
        serviceDocuments.set(doc.id, doc);
      }
    }
  }

  if (serviceDocuments.size > 0) {
    categories.push({
      id: "services",
      name: "Service-Specific Documents",
      description: "Additional documents required for your selected services",
      documents: Array.from(serviceDocuments.values()),
    });
  }

  return categories;
}

/**
 * Get document requirements for a specific service
 */
export function getServiceDocuments(
  serviceType: string
): DocumentRequirement[] {
  return SERVICE_SPECIFIC_DOCUMENTS[serviceType] || [];
}

/**
 * Calculate total required and optional documents
 */
export function getDocumentStats(categories: DocumentCategory[]): {
  requiredCount: number;
  optionalCount: number;
  totalCount: number;
} {
  let requiredCount = 0;
  let optionalCount = 0;

  for (const category of categories) {
    for (const doc of category.documents) {
      if (doc.required) {
        requiredCount++;
      } else {
        optionalCount++;
      }
    }
  }

  return {
    requiredCount,
    optionalCount,
    totalCount: requiredCount + optionalCount,
  };
}

/**
 * Validate if all required documents are uploaded
 */
export function validateDocumentUploads(
  categories: DocumentCategory[],
  uploadedDocIds: string[]
): { isValid: boolean; missingDocs: string[] } {
  const missingDocs: string[] = [];

  for (const category of categories) {
    for (const doc of category.documents) {
      if (doc.required && !uploadedDocIds.includes(doc.id)) {
        missingDocs.push(doc.name);
      }
    }
  }

  return {
    isValid: missingDocs.length === 0,
    missingDocs,
  };
}
