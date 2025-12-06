// =============================================================================
// GUYANA DOCUMENT REQUIREMENTS
// Based on GRA, NIS, Deeds Registry, and Immigration Department requirements
// =============================================================================

export type DocumentRequirement = {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSizeMB: number;
  source: string; // Where to get this document
  validityPeriod?: string; // How long it's valid
  notes?: string;
};

export type ServiceDocumentCategory = {
  serviceId: string;
  serviceName: string;
  description: string;
  icon?: string; // Lucide icon name
  documents: DocumentRequirement[];
};

export type EntityDocumentCategory = {
  entityType: string;
  entityName: string;
  description: string;
  documents: DocumentRequirement[];
};

// =============================================================================
// ENTITY TYPE DOCUMENTS (Company Registration)
// =============================================================================

export const ENTITY_DOCUMENTS: Record<string, EntityDocumentCategory> = {
  INDIVIDUAL: {
    entityType: "INDIVIDUAL",
    entityName: "Individual",
    description: "Documents required for individual/sole trader registration",
    documents: [
      {
        id: "valid-id",
        name: "Valid Government-Issued ID",
        description: "Passport or Driver's License",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "National ID or Passport Office",
      },
      {
        id: "tin-certificate",
        name: "TIN Certificate",
        description: "Tax Identification Number from GRA",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Guyana Revenue Authority (GRA)",
      },
      {
        id: "proof-of-address",
        name: "Proof of Address",
        description: "Utility bill or bank statement (within 3 months)",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "GPL, GWI, or Bank",
        validityPeriod: "3 months",
      },
    ],
  },

  SOLE_PROPRIETORSHIP: {
    entityType: "SOLE_PROPRIETORSHIP",
    entityName: "Sole Proprietorship",
    description: "Documents required for sole proprietorship registration",
    documents: [
      {
        id: "business-name-registration",
        name: "Business Name Registration",
        description: "Certificate from Deeds Registry",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Deeds Registry, Georgetown",
      },
      {
        id: "tin-certificate",
        name: "TIN Certificate",
        description: "Tax Identification Number from GRA",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Guyana Revenue Authority (GRA)",
      },
      {
        id: "nis-registration",
        name: "NIS Registration Certificate",
        description: "National Insurance Scheme registration",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "National Insurance Scheme (NIS)",
      },
      {
        id: "owner-id",
        name: "Owner's Valid ID",
        description: "Passport or Driver's License of owner",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "National ID or Passport Office",
      },
      {
        id: "proof-of-business-address",
        name: "Proof of Business Address",
        description: "Utility bill or lease agreement",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "GPL, GWI, or Landlord",
        validityPeriod: "3 months",
      },
    ],
  },

  PARTNERSHIP: {
    entityType: "PARTNERSHIP",
    entityName: "Partnership",
    description: "Documents required for partnership registration",
    documents: [
      {
        id: "partnership-agreement",
        name: "Partnership Agreement",
        description: "Signed agreement between all partners",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 20,
        source: "Legal/Attorney",
      },
      {
        id: "business-registration",
        name: "Business Registration Certificate",
        description: "Certificate from Deeds Registry",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Deeds Registry, Georgetown",
      },
      {
        id: "tin-certificate",
        name: "Partnership TIN Certificate",
        description: "Tax Identification Number for the partnership",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Guyana Revenue Authority (GRA)",
      },
      {
        id: "partners-ids",
        name: "All Partners' Valid IDs",
        description: "Passport or Driver's License for each partner",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 10,
        source: "National ID or Passport Office",
        notes: "Upload all partners' IDs in a single PDF or as separate files",
      },
      {
        id: "nis-registration",
        name: "NIS Registration Certificate",
        description: "National Insurance Scheme employer registration",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "National Insurance Scheme (NIS)",
      },
    ],
  },

  PRIVATE_LIMITED_COMPANY: {
    entityType: "PRIVATE_LIMITED_COMPANY",
    entityName: "Private Limited Company",
    description: "Documents required for private limited company registration",
    documents: [
      {
        id: "certificate-of-incorporation",
        name: "Certificate of Incorporation",
        description: "Official incorporation certificate from Deeds Registry",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Deeds Registry, Georgetown",
      },
      {
        id: "articles-of-incorporation",
        name: "Articles of Incorporation",
        description: "Company's articles/memorandum of association",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 20,
        source: "Deeds Registry, Georgetown",
      },
      {
        id: "tin-certificate",
        name: "TIN Certificate",
        description: "Company Tax Identification Number from GRA",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Guyana Revenue Authority (GRA)",
      },
      {
        id: "vat-certificate",
        name: "VAT Registration Certificate",
        description: "Required if annual turnover exceeds GYD 15 million",
        required: false,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Guyana Revenue Authority (GRA)",
        notes: "Required if turnover > GYD 15,000,000",
      },
      {
        id: "directors-ids",
        name: "Directors' Identification",
        description: "Valid ID for all company directors",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 10,
        source: "National ID or Passport Office",
      },
      {
        id: "shareholders-register",
        name: "Register of Shareholders",
        description: "Document showing all shareholders and their shares",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 5,
        source: "Company Records",
      },
      {
        id: "registered-office-proof",
        name: "Proof of Registered Office Address",
        description: "Utility bill or lease for registered address",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "GPL, GWI, or Landlord",
        validityPeriod: "3 months",
      },
      {
        id: "nis-employer-registration",
        name: "NIS Employer Registration",
        description: "National Insurance Scheme employer certificate",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "National Insurance Scheme (NIS)",
      },
    ],
  },

  // Alias for backward compatibility
  COMPANY: {
    entityType: "COMPANY",
    entityName: "Private Limited Company",
    description: "Documents required for private limited company registration",
    documents: [
      {
        id: "certificate-of-incorporation",
        name: "Certificate of Incorporation",
        description: "Official incorporation certificate from Deeds Registry",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Deeds Registry, Georgetown",
      },
      {
        id: "articles-of-incorporation",
        name: "Articles of Incorporation",
        description: "Company's articles/memorandum of association",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 20,
        source: "Deeds Registry, Georgetown",
      },
      {
        id: "tin-certificate",
        name: "TIN Certificate",
        description: "Company Tax Identification Number from GRA",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Guyana Revenue Authority (GRA)",
      },
      {
        id: "directors-ids",
        name: "Directors' Identification",
        description: "Valid ID for all company directors",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 10,
        source: "National ID or Passport Office",
      },
      {
        id: "shareholders-register",
        name: "Register of Shareholders",
        description: "Document showing all shareholders and their shares",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 5,
        source: "Company Records",
      },
      {
        id: "registered-office-proof",
        name: "Proof of Registered Office Address",
        description: "Utility bill or lease for registered address",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "GPL, GWI, or Landlord",
        validityPeriod: "3 months",
      },
      {
        id: "nis-employer-registration",
        name: "NIS Employer Registration",
        description: "National Insurance Scheme employer certificate",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "National Insurance Scheme (NIS)",
      },
    ],
  },

  PUBLIC_LIMITED_COMPANY: {
    entityType: "PUBLIC_LIMITED_COMPANY",
    entityName: "Public Limited Company",
    description: "Documents required for public limited company registration",
    documents: [
      {
        id: "certificate-of-incorporation",
        name: "Certificate of Incorporation",
        description: "Official incorporation certificate from Deeds Registry",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Deeds Registry, Georgetown",
      },
      {
        id: "articles-of-incorporation",
        name: "Articles of Incorporation",
        description: "Company's articles/memorandum of association",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 20,
        source: "Deeds Registry, Georgetown",
      },
      {
        id: "tin-certificate",
        name: "TIN Certificate",
        description: "Company Tax Identification Number from GRA",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Guyana Revenue Authority (GRA)",
      },
      {
        id: "vat-certificate",
        name: "VAT Registration Certificate",
        description: "VAT registration from GRA",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Guyana Revenue Authority (GRA)",
      },
      {
        id: "directors-ids",
        name: "Directors' Identification",
        description: "Valid ID for all company directors",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 10,
        source: "National ID or Passport Office",
      },
      {
        id: "shareholders-register",
        name: "Register of Shareholders",
        description: "Document showing all shareholders and their shares",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Company Records",
      },
      {
        id: "audited-financial-statements",
        name: "Latest Audited Financial Statements",
        description: "Most recent audited financials",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 50,
        source: "Licensed Auditor",
      },
      {
        id: "annual-returns",
        name: "Latest Annual Returns",
        description: "Most recent annual returns filed with Deeds Registry",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 20,
        source: "Deeds Registry, Georgetown",
      },
      {
        id: "nis-employer-registration",
        name: "NIS Employer Registration",
        description: "National Insurance Scheme employer certificate",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "National Insurance Scheme (NIS)",
      },
    ],
  },

  NON_PROFIT: {
    entityType: "NON_PROFIT",
    entityName: "Non-Profit Organization",
    description: "Documents required for non-profit organization registration",
    documents: [
      {
        id: "certificate-of-incorporation",
        name: "Certificate of Incorporation",
        description: "Non-profit incorporation certificate",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Deeds Registry, Georgetown",
      },
      {
        id: "constitution-bylaws",
        name: "Constitution/By-Laws",
        description: "Organization's governing documents",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 20,
        source: "Organization Records",
      },
      {
        id: "tin-certificate",
        name: "TIN Certificate",
        description: "Tax Identification Number from GRA",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Guyana Revenue Authority (GRA)",
      },
      {
        id: "board-resolution",
        name: "Board Resolution",
        description: "Resolution authorizing tax/accounting services",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Organization Board",
      },
      {
        id: "board-members-ids",
        name: "Board Members' Valid IDs",
        description: "Identification for all board members",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 10,
        source: "National ID or Passport Office",
      },
    ],
  },
};

// =============================================================================
// SERVICE-SPECIFIC DOCUMENTS (Grouped by Service)
// =============================================================================

export const SERVICE_DOCUMENTS: Record<string, ServiceDocumentCategory> = {
  // ---------------------------------------------------------------------------
  // TAX SERVICES
  // ---------------------------------------------------------------------------
  paye: {
    serviceId: "paye",
    serviceName: "PAYE (Pay As You Earn)",
    description: "Employee income tax withholding and remittance",
    icon: "Users",
    documents: [
      {
        id: "employee-list-tin",
        name: "List of Employees with TIN Numbers",
        description: "Complete list of all employees with their TIN",
        required: true,
        acceptedFormats: [".pdf", ".xlsx", ".csv"],
        maxSizeMB: 10,
        source: "HR/Payroll Department",
      },
      {
        id: "salary-wage-records",
        name: "Salary/Wage Records",
        description: "Current salary structure for all employees",
        required: true,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 20,
        source: "HR/Payroll Department",
      },
      {
        id: "employment-contracts",
        name: "Employment Contracts",
        description: "Signed contracts for all employees",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 50,
        source: "HR Department",
        notes: "Can upload as single combined PDF",
      },
      {
        id: "nis-employee-cards",
        name: "NIS Cards for All Employees",
        description: "Copy of NIS cards for each employee",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 20,
        source: "Employees/NIS",
      },
      {
        id: "previous-paye-returns",
        name: "Previous PAYE Returns",
        description: "Last 12 months of PAYE returns filed (if any)",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 30,
        source: "Previous Accountant/GRA",
      },
    ],
  },

  vat: {
    serviceId: "vat",
    serviceName: "VAT (Value Added Tax)",
    description: "VAT registration, filing, and compliance",
    icon: "Receipt",
    documents: [
      {
        id: "vat-registration-cert",
        name: "VAT Registration Certificate",
        description: "Current VAT registration from GRA",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Guyana Revenue Authority (GRA)",
      },
      {
        id: "sales-records-12m",
        name: "Sales Records (12 months)",
        description: "All sales invoices for the past 12 months",
        required: true,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 100,
        source: "Accounting/Sales Department",
      },
      {
        id: "purchase-records-12m",
        name: "Purchase Records (12 months)",
        description: "All purchase invoices for the past 12 months",
        required: true,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 100,
        source: "Accounting/Procurement",
      },
      {
        id: "bank-statements-12m",
        name: "Bank Statements (12 months)",
        description: "Complete bank statements for all business accounts",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 50,
        source: "Bank",
        validityPeriod: "Current",
      },
      {
        id: "previous-vat-returns",
        name: "Previous VAT Returns",
        description: "Last 12 months of VAT returns filed (if any)",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 30,
        source: "Previous Accountant/GRA",
      },
    ],
  },

  "corporate-tax": {
    serviceId: "corporate-tax",
    serviceName: "Corporate Tax",
    description: "Annual corporate income tax filing and planning",
    icon: "Building2",
    documents: [
      {
        id: "audited-financials",
        name: "Audited Financial Statements",
        description: "Latest audited financial statements",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 50,
        source: "Licensed Auditor",
      },
      {
        id: "trial-balance",
        name: "Trial Balance",
        description: "Current trial balance from accounting system",
        required: true,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 10,
        source: "Accounting Department",
      },
      {
        id: "bank-statements-12m-corp",
        name: "Bank Statements (12 months)",
        description: "Complete bank statements for all business accounts",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 50,
        source: "Bank",
      },
      {
        id: "fixed-asset-register",
        name: "Fixed Asset Register",
        description: "Complete list of company fixed assets",
        required: true,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 20,
        source: "Accounting Department",
      },
      {
        id: "previous-corp-tax-returns",
        name: "Previous Corporate Tax Returns (3 years)",
        description: "Last 3 years of corporate tax returns",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 30,
        source: "Previous Accountant/GRA",
      },
      {
        id: "related-party-details",
        name: "Related Party Transaction Details",
        description: "Details of transactions with related companies/persons",
        required: false,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 20,
        source: "Accounting Department",
      },
    ],
  },

  "personal-tax": {
    serviceId: "personal-tax",
    serviceName: "Personal Income Tax",
    description: "Individual income tax filing and planning",
    icon: "User",
    documents: [
      {
        id: "income-statements",
        name: "Income Statements/Pay Slips",
        description: "All pay slips or income statements for the tax year",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 20,
        source: "Employer",
      },
      {
        id: "bank-statements-personal",
        name: "Personal Bank Statements (12 months)",
        description: "Bank statements for all personal accounts",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 50,
        source: "Bank",
      },
      {
        id: "rental-income-docs",
        name: "Rental Income Documentation",
        description: "Lease agreements and rental receipts (if applicable)",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 20,
        source: "Personal Records",
      },
      {
        id: "investment-statements",
        name: "Investment/Dividend Statements",
        description: "Statements showing investment income (if applicable)",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Financial Institutions",
      },
      {
        id: "previous-personal-returns",
        name: "Previous Personal Tax Returns",
        description: "Last 3 years of personal tax returns (if available)",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 20,
        source: "Previous Accountant/GRA",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // PAYROLL SERVICES
  // ---------------------------------------------------------------------------
  payroll: {
    serviceId: "payroll",
    serviceName: "Payroll Management",
    description: "Complete payroll processing, NIS, and PAYE management",
    icon: "Wallet",
    documents: [
      {
        id: "employee-contracts-all",
        name: "All Employment Contracts",
        description: "Signed contracts for every employee",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 100,
        source: "HR Department",
      },
      {
        id: "nis-cards-all",
        name: "NIS Cards for All Employees",
        description: "Copy of NIS card for each employee",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 30,
        source: "Employees/NIS",
      },
      {
        id: "employee-tin-letters",
        name: "TIN Letters for All Employees",
        description: "TIN letter/certificate for each employee",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 30,
        source: "Employees/GRA",
      },
      {
        id: "salary-structure",
        name: "Salary Structure/Pay Scales",
        description: "Complete salary structure with all allowances",
        required: true,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 10,
        source: "HR Department",
      },
      {
        id: "leave-policy",
        name: "Leave Policy Document",
        description: "Company leave policy (vacation, sick, etc.)",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "HR Department",
      },
      {
        id: "overtime-policy",
        name: "Overtime Policy",
        description: "Company overtime policy (if applicable)",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 5,
        source: "HR Department",
      },
      {
        id: "benefits-summary",
        name: "Employee Benefits Summary",
        description:
          "Summary of all employee benefits (medical, pension, etc.)",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "HR Department",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // IMMIGRATION SERVICES
  // ---------------------------------------------------------------------------
  immigration: {
    serviceId: "immigration",
    serviceName: "Immigration & Work Permits",
    description: "Work permit and immigration document processing",
    icon: "Plane",
    documents: [
      {
        id: "passport-all-pages",
        name: "Passport (All Pages)",
        description: "Clear copy of all passport pages including blank ones",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 20,
        source: "Applicant",
        notes: "Include all pages, even blank ones",
      },
      {
        id: "educational-certificates",
        name: "Educational Certificates/Degrees",
        description: "All relevant educational qualifications",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 30,
        source: "Educational Institutions",
      },
      {
        id: "professional-certifications",
        name: "Professional Certifications",
        description: "Industry certifications and licenses",
        required: false,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 20,
        source: "Professional Bodies",
      },
      {
        id: "police-clearance",
        name: "Police Clearance Certificate",
        description: "From country of origin/residence (within 6 months)",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 5,
        source: "Police Department (Country of Origin)",
        validityPeriod: "6 months",
      },
      {
        id: "medical-certificate",
        name: "Medical Certificate",
        description: "Medical examination certificate (within 3 months)",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Approved Medical Practitioner",
        validityPeriod: "3 months",
      },
      {
        id: "employment-offer-letter",
        name: "Employment Offer Letter",
        description: "Official job offer from Guyana-based employer",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 5,
        source: "Sponsoring Employer",
      },
      {
        id: "sponsor-letter",
        name: "Sponsor Letter from Employer",
        description: "Letter confirming sponsorship and employment details",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 5,
        source: "Sponsoring Employer",
      },
      {
        id: "sponsor-company-docs",
        name: "Sponsoring Company Documents",
        description: "Company registration, TIN, and NIS certificates",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 20,
        source: "Sponsoring Employer",
      },
      {
        id: "cv-resume",
        name: "Curriculum Vitae/Resume",
        description: "Detailed CV with work history",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 5,
        source: "Applicant",
      },
      {
        id: "passport-photos",
        name: "Passport-Size Photographs",
        description: "6 recent passport-size photos",
        required: true,
        acceptedFormats: [".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Applicant",
      },
      {
        id: "previous-work-permits",
        name: "Previous Work Permits",
        description: "Copies of any previous Guyana work permits",
        required: false,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 10,
        source: "Applicant/Immigration",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // COMPLIANCE & AUDIT SERVICES
  // ---------------------------------------------------------------------------
  compliance: {
    serviceId: "compliance",
    serviceName: "Tax Compliance",
    description: "GRA compliance review and remediation",
    icon: "ShieldCheck",
    documents: [
      {
        id: "gra-correspondence",
        name: "GRA Correspondence/Notices",
        description: "All letters and notices from GRA",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 30,
        source: "Company Records/GRA",
      },
      {
        id: "current-compliance-certs",
        name: "Current Compliance Certificates",
        description: "Any current compliance certificates held",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 10,
        source: "GRA",
      },
      {
        id: "tax-clearance-cert",
        name: "Tax Clearance Certificate",
        description: "Current tax clearance from GRA (if available)",
        required: false,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "GRA",
        validityPeriod: "Valid for specific period",
      },
      {
        id: "nis-clearance-cert",
        name: "NIS Clearance Certificate",
        description: "Current NIS clearance (if available)",
        required: false,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "NIS",
      },
      {
        id: "previous-audit-reports",
        name: "Previous Audit Reports",
        description: "Any previous GRA audit reports",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 50,
        source: "GRA/Previous Accountant",
      },
    ],
  },

  audit: {
    serviceId: "audit",
    serviceName: "Audit Preparation",
    description: "Preparation for GRA or external audit",
    icon: "FileSearch",
    documents: [
      {
        id: "financials-3yr",
        name: "Financial Statements (3 years)",
        description: "Last 3 years of financial statements",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 100,
        source: "Accounting/Auditor",
      },
      {
        id: "bank-statements-3yr",
        name: "Bank Statements (3 years)",
        description: "Complete bank statements for 3 years",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 100,
        source: "Bank",
      },
      {
        id: "all-tax-returns-filed",
        name: "All Tax Returns Filed",
        description: "PAYE, VAT, Corporate Tax returns for audit period",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 50,
        source: "GRA/Previous Accountant",
      },
      {
        id: "contracts-agreements",
        name: "Major Contracts and Agreements",
        description: "Significant business contracts for audit period",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 100,
        source: "Legal/Company Records",
      },
      {
        id: "board-minutes",
        name: "Board Meeting Minutes",
        description: "Board minutes for the audit period",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 50,
        source: "Company Secretary",
      },
      {
        id: "internal-policies",
        name: "Internal Policies and Procedures",
        description: "Accounting and operational policies",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 30,
        source: "Management",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // BOOKKEEPING SERVICES
  // ---------------------------------------------------------------------------
  bookkeeping: {
    serviceId: "bookkeeping",
    serviceName: "Bookkeeping",
    description: "Ongoing bookkeeping and accounting services",
    icon: "BookOpen",
    documents: [
      {
        id: "bank-statements-current",
        name: "Bank Statements (Current Year)",
        description: "Bank statements for current year to date",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 30,
        source: "Bank",
      },
      {
        id: "sales-invoices",
        name: "Sales Invoices",
        description: "All sales invoices issued",
        required: true,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 50,
        source: "Sales/Accounting",
      },
      {
        id: "purchase-invoices-receipts",
        name: "Purchase Invoices/Receipts",
        description: "All purchase invoices and expense receipts",
        required: true,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 50,
        source: "Procurement/Accounting",
      },
      {
        id: "payroll-records",
        name: "Payroll Records",
        description: "Payroll summaries and pay slips",
        required: true,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 30,
        source: "HR/Payroll",
      },
      {
        id: "petty-cash-records",
        name: "Petty Cash Records",
        description: "Petty cash log and receipts",
        required: false,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 10,
        source: "Accounting",
      },
      {
        id: "previous-accounting-records",
        name: "Previous Accounting Records",
        description:
          "Chart of accounts, trial balance from previous accountant",
        required: false,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 20,
        source: "Previous Accountant",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // BUSINESS REGISTRATION SERVICES
  // ---------------------------------------------------------------------------
  "business-registration": {
    serviceId: "business-registration",
    serviceName: "Business Registration",
    description: "New company/business registration assistance",
    icon: "Building",
    documents: [
      {
        id: "proposed-business-names",
        name: "Proposed Business Names (3 options)",
        description: "Three name options in order of preference",
        required: true,
        acceptedFormats: [".pdf", ".docx"],
        maxSizeMB: 2,
        source: "Applicant",
      },
      {
        id: "shareholder-details-ids",
        name: "Shareholder Details and ID Copies",
        description: "Details and ID for each proposed shareholder",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 20,
        source: "Applicant",
      },
      {
        id: "director-details-ids",
        name: "Director Details and ID Copies",
        description: "Details and ID for each proposed director",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 20,
        source: "Applicant",
      },
      {
        id: "registered-address-proof",
        name: "Proof of Registered Address",
        description: "Utility bill or lease for proposed registered address",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "Landlord/Utility Company",
      },
      {
        id: "business-plan",
        name: "Business Plan/Description",
        description: "Brief description of business activities",
        required: false,
        acceptedFormats: [".pdf", ".docx"],
        maxSizeMB: 10,
        source: "Applicant",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // NIS SERVICES
  // ---------------------------------------------------------------------------
  nis: {
    serviceId: "nis",
    serviceName: "NIS Submissions",
    description: "National Insurance Scheme registration and contributions",
    icon: "Shield",
    documents: [
      {
        id: "nis-employer-registration",
        name: "NIS Employer Registration",
        description: "NIS employer registration certificate",
        required: true,
        acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
        maxSizeMB: 5,
        source: "NIS",
      },
      {
        id: "employee-schedule",
        name: "Employee Schedule",
        description: "List of all employees with NIS numbers",
        required: true,
        acceptedFormats: [".pdf", ".xlsx", ".csv"],
        maxSizeMB: 10,
        source: "HR/Payroll Department",
      },
      {
        id: "previous-nis-returns",
        name: "Previous NIS Returns",
        description: "Last 12 months of NIS returns filed (if any)",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 30,
        source: "Previous Accountant/NIS",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // LOCAL CONTENT SERVICES
  // ---------------------------------------------------------------------------
  "local-content": {
    serviceId: "local-content",
    serviceName: "Local Content Certification",
    description: "LCDS registration and certification",
    icon: "Award",
    documents: [
      {
        id: "local-content-application",
        name: "Local Content Application Form",
        description: "Completed LCDS application form",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Local Content Secretariat",
      },
      {
        id: "ownership-structure",
        name: "Ownership Structure Document",
        description: "Document showing Guyanese ownership percentage",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Company Records",
      },
      {
        id: "employee-nationality",
        name: "Employee Nationality Records",
        description: "Records showing employee nationality breakdown",
        required: true,
        acceptedFormats: [".pdf", ".xlsx"],
        maxSizeMB: 10,
        source: "HR Department",
      },
      {
        id: "goods-services-declaration",
        name: "Goods & Services Declaration",
        description: "Declaration of goods/services to be provided",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Management",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // EXPEDITING SERVICES
  // ---------------------------------------------------------------------------
  expediting: {
    serviceId: "expediting",
    serviceName: "Expediting Services",
    description: "Government agency expediting and liaison",
    icon: "Zap",
    documents: [
      {
        id: "authorization-letter",
        name: "Authorization Letter",
        description: "Letter authorizing GK to act on your behalf",
        required: true,
        acceptedFormats: [".pdf"],
        maxSizeMB: 5,
        source: "Client",
      },
      {
        id: "power-of-attorney",
        name: "Power of Attorney",
        description: "Notarized power of attorney (if applicable)",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 10,
        source: "Legal/Notary",
      },
      {
        id: "pending-applications",
        name: "Pending Application Documents",
        description: "Copies of any pending applications to be expedited",
        required: false,
        acceptedFormats: [".pdf"],
        maxSizeMB: 30,
        source: "Client",
      },
    ],
  },
};

// =============================================================================
// SERVICE ID MAPPING - Maps various service ID formats to canonical keys
// =============================================================================

const SERVICE_ID_MAP: Record<string, string> = {
  // PAYE variations
  paye: "paye",
  PAYE: "paye",
  "paye-filing": "paye",
  "tax-paye": "paye",
  PAYE_FILING: "paye",

  // VAT variations
  vat: "vat",
  VAT: "vat",
  "vat-filing": "vat",
  "tax-vat": "vat",
  VAT_RETURN: "vat",

  // Corporate tax variations
  "corporate-tax": "corporate-tax",
  corporate_tax: "corporate-tax",
  corporateTax: "corporate-tax",
  "tax-corporate": "corporate-tax",
  INCOME_TAX_RETURN: "corporate-tax",
  CORPORATION_TAX_RETURN: "corporate-tax",

  // Personal tax variations
  "personal-tax": "personal-tax",
  personal_tax: "personal-tax",
  personalTax: "personal-tax",
  "tax-personal": "personal-tax",

  // Payroll variations
  payroll: "payroll",
  "payroll-management": "payroll",
  "payroll-processing": "payroll",

  // Immigration variations
  immigration: "immigration",
  "work-permit": "immigration",
  "work-permits": "immigration",
  workPermit: "immigration",
  WORK_PERMIT: "immigration",
  WORK_PERMIT_RENEWAL: "immigration",
  IMMIGRATION: "immigration",
  CITIZENSHIP_APPLICATION: "immigration",
  BUSINESS_VISA: "immigration",
  RESIDENCE_PERMIT: "immigration",

  // Compliance variations
  compliance: "compliance",
  "tax-compliance": "compliance",

  // Audit variations
  audit: "audit",
  "audit-preparation": "audit",
  "audit-prep": "audit",

  // Bookkeeping variations
  bookkeeping: "bookkeeping",
  "book-keeping": "bookkeeping",
  accounting: "bookkeeping",

  // Business registration variations
  "business-registration": "business-registration",
  "company-registration": "business-registration",
  registration: "business-registration",
  COMPANY_INCORPORATION: "business-registration",
  BUSINESS_NAME_REGISTRATION: "business-registration",

  // NIS variations
  nis: "nis",
  NIS: "nis",
  "nis-submission": "nis",
  NIS_REGISTRATION: "nis",
  NIS_CONTRIBUTIONS: "nis",
  NIS_COMPLIANCE: "nis",
  NIS_SUBMISSION: "nis",

  // Local content variations
  "local-content": "local-content",
  localContent: "local-content",
  LOCAL_CONTENT: "local-content",
  LOCAL_CONTENT_REGISTRATION: "local-content",
  LOCAL_CONTENT_CERTIFICATION: "local-content",
  LOCAL_CONTENT_COMPLIANCE: "local-content",

  // Expediting variations
  expediting: "expediting",
  EXPEDITING: "expediting",
  GRA_EXPEDITING: "expediting",
  DEEDS_EXPEDITING: "expediting",
  IMMIGRATION_EXPEDITING: "expediting",
  GENERAL_EXPEDITING: "expediting",
};

// =============================================================================
// THE MAIN FUNCTION - Returns documents GROUPED BY SERVICE
// =============================================================================

export function getRequiredDocuments(
  entityType: string,
  selectedServices: string[]
): {
  entityDocuments: EntityDocumentCategory | null;
  serviceDocuments: ServiceDocumentCategory[];
} {
  // Get entity-specific documents
  const entityDocuments = ENTITY_DOCUMENTS[entityType] || null;

  // Get service-specific documents (each as its own category)
  const serviceDocuments: ServiceDocumentCategory[] = [];
  const addedServices = new Set<string>();

  for (const serviceId of selectedServices) {
    // Normalize the service ID
    const normalizedId =
      SERVICE_ID_MAP[serviceId] ||
      SERVICE_ID_MAP[serviceId.toLowerCase()] ||
      serviceId.toLowerCase().replace(/_/g, "-");

    // Skip if already added (prevent duplicates)
    if (addedServices.has(normalizedId)) {
      continue;
    }

    const serviceDocs = SERVICE_DOCUMENTS[normalizedId];

    if (serviceDocs) {
      serviceDocuments.push(serviceDocs);
      addedServices.add(normalizedId);
    }
  }

  return {
    entityDocuments,
    serviceDocuments,
  };
}

// Helper to count total required documents
export function countRequiredDocuments(
  entityDocuments: EntityDocumentCategory | null,
  serviceDocuments: ServiceDocumentCategory[]
): { required: number; optional: number; total: number } {
  let required = 0;
  let optional = 0;

  if (entityDocuments) {
    for (const doc of entityDocuments.documents) {
      if (doc.required) {
        required += 1;
      } else {
        optional += 1;
      }
    }
  }

  for (const service of serviceDocuments) {
    for (const doc of service.documents) {
      if (doc.required) {
        required += 1;
      } else {
        optional += 1;
      }
    }
  }

  return { required, optional, total: required + optional };
}

// Helper to get all document IDs for tracking uploads
export function getAllDocumentIds(
  entityDocuments: EntityDocumentCategory | null,
  serviceDocuments: ServiceDocumentCategory[]
): string[] {
  const ids: string[] = [];

  if (entityDocuments) {
    for (const doc of entityDocuments.documents) {
      ids.push(doc.id);
    }
  }

  for (const service of serviceDocuments) {
    for (const doc of service.documents) {
      ids.push(`${service.serviceId}-${doc.id}`);
    }
  }

  return ids;
}

// Helper to check if all required documents are uploaded
export function areRequiredDocumentsComplete(
  entityDocuments: EntityDocumentCategory | null,
  serviceDocuments: ServiceDocumentCategory[],
  uploadedDocIds: Set<string>
): boolean {
  if (entityDocuments) {
    for (const doc of entityDocuments.documents) {
      if (doc.required && !uploadedDocIds.has(doc.id)) {
        return false;
      }
    }
  }

  for (const service of serviceDocuments) {
    for (const doc of service.documents) {
      const docKey = `${service.serviceId}-${doc.id}`;
      if (doc.required && !uploadedDocIds.has(docKey)) {
        return false;
      }
    }
  }

  return true;
}

// =============================================================================
// BACKWARD COMPATIBILITY - Old interface support
// =============================================================================

export type DocumentCategory = {
  id: string;
  name: string;
  description: string;
  documents: DocumentRequirement[];
};

// Old getDocumentStats function for backward compatibility
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
        requiredCount += 1;
      } else {
        optionalCount += 1;
      }
    }
  }

  return {
    requiredCount,
    optionalCount,
    totalCount: requiredCount + optionalCount,
  };
}

// Validate if all required documents are uploaded
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
