/**
 * Comprehensive Service Catalog for GK-Nexus
 * Includes ALL services from KAJ Financial Services and GCMC Consultancy
 * Based on Guyana regulatory requirements and government agency integrations
 */

// Government Agencies
export const GOVERNMENT_AGENCIES = {
  GRA: {
    id: "gra",
    name: "Guyana Revenue Authority",
    shortName: "GRA",
    description: "Tax collection and compliance",
    website: "https://www.gra.gov.gy",
  },
  NIS: {
    id: "nis",
    name: "National Insurance Scheme",
    shortName: "NIS",
    description: "Social security and pension contributions",
    website: "https://www.nis.gov.gy",
  },
  DEEDS_REGISTRY: {
    id: "deeds",
    name: "Deeds Registry",
    shortName: "Deeds",
    description: "Business registration and land titles",
    website: null,
  },
  IMMIGRATION: {
    id: "immigration",
    name: "Immigration Department",
    shortName: "Immigration",
    description: "Work permits and visa processing",
    website: null,
  },
  LOCAL_CONTENT: {
    id: "local_content",
    name: "Local Content Secretariat",
    shortName: "LCS",
    description: "Local content certification for oil & gas sector",
    website: null,
  },
} as const;

// Business Units
export const BUSINESS_UNITS = {
  KAJ: {
    id: "kaj",
    name: "KAJ Financial Services",
    description: "Tax preparation, accounting, audit, and financial services",
    color: "blue",
  },
  GCMC: {
    id: "gcmc",
    name: "GCMC Consultancy",
    description:
      "Business consulting, immigration, training, and compliance services",
    color: "green",
  },
} as const;

// Service Categories
export const SERVICE_CATEGORIES = {
  // KAJ Categories
  TAX_COMPLIANCE: {
    id: "tax_compliance",
    name: "Tax Compliance",
    description: "GRA tax filing and compliance services",
    business: "kaj",
    color: "#3B82F6", // blue
    icon: "FileText",
  },
  FINANCIAL_SERVICES: {
    id: "financial_services",
    name: "Financial Services",
    description: "Financial statements and bookkeeping",
    business: "kaj",
    color: "#8B5CF6", // purple
    icon: "Calculator",
  },
  AUDIT_SERVICES: {
    id: "audit_services",
    name: "Audit Services",
    description: "Audit of NGOs and cooperative societies",
    business: "kaj",
    color: "#EC4899", // pink
    icon: "ClipboardCheck",
  },
  NIS_SERVICES: {
    id: "nis_services",
    name: "NIS Services",
    description: "National Insurance Scheme filings and compliance",
    business: "kaj",
    color: "#F59E0B", // amber
    icon: "Users",
  },
  // GCMC Categories
  TRAININGS: {
    id: "trainings",
    name: "Training Programs",
    description: "Professional development and skills training",
    business: "gcmc",
    color: "#10B981", // emerald
    icon: "GraduationCap",
  },
  BUSINESS_DEVELOPMENT: {
    id: "business_development",
    name: "Business Development",
    description: "Company incorporation and business registration",
    business: "gcmc",
    color: "#06B6D4", // cyan
    icon: "Building2",
  },
  PARALEGAL: {
    id: "paralegal",
    name: "Paralegal Services",
    description: "Legal document preparation and notarization",
    business: "gcmc",
    color: "#6366F1", // indigo
    icon: "Scale",
  },
  IMMIGRATION: {
    id: "immigration",
    name: "Immigration Services",
    description: "Work permits, visas, and citizenship applications",
    business: "gcmc",
    color: "#EF4444", // red
    icon: "Plane",
  },
  BUSINESS_PROPOSALS: {
    id: "business_proposals",
    name: "Business Proposals",
    description: "Investment proposals and startup planning",
    business: "gcmc",
    color: "#84CC16", // lime
    icon: "FileSpreadsheet",
  },
  PARTNER_NETWORK: {
    id: "partner_network",
    name: "Partner Network",
    description: "Professional referral network services",
    business: "gcmc",
    color: "#F97316", // orange
    icon: "Network",
  },
  EXPEDITING: {
    id: "expediting",
    name: "Government Expediting",
    description: "Document processing and agency liaison",
    business: "gcmc",
    color: "#14B8A6", // teal
    icon: "Zap",
  },
  LOCAL_CONTENT: {
    id: "local_content",
    name: "Local Content",
    description: "Local content certification and compliance",
    business: "gcmc",
    color: "#A855F7", // purple
    icon: "Award",
  },
  PROPERTY_MANAGEMENT: {
    id: "property_management",
    name: "Property Management",
    description: "Real estate and property services",
    business: "gcmc",
    color: "#22C55E", // green
    icon: "Home",
  },
} as const;

export interface Service {
  id: string;
  name: string;
  description: string;
  category: keyof typeof SERVICE_CATEGORIES;
  business: "kaj" | "gcmc";
  agency: keyof typeof GOVERNMENT_AGENCIES | null;
  basePrice?: number; // In GYD
  estimatedDays?: number;
  requirements?: string[];
  forms?: string[];
  isPopular?: boolean;
}

// COMPREHENSIVE SERVICE CATALOG
export const SERVICES: Service[] = [
  // ============================================
  // KAJ FINANCIAL SERVICES - TAX COMPLIANCE
  // ============================================
  {
    id: "income_tax_return",
    name: "Income Tax Returns",
    description: "Annual personal income tax filing (Form 2) to GRA",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 5,
    isPopular: true,
    requirements: [
      "Form 2 (Income Tax Return)",
      "Financial Statements",
      "Salary Slips / 7B Slip (if employed)",
      "Wear & Tear Schedule (if applicable)",
    ],
    forms: ["Form 2"],
  },
  {
    id: "corporation_tax_return",
    name: "Corporation Tax Returns",
    description: "Annual corporate income tax filing to GRA",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 10,
    isPopular: true,
    requirements: [
      "Corporation Tax Return Form",
      "Audited Financial Statements",
      "Wear & Tear Schedule",
      "Loss Schedule (if applicable)",
    ],
    forms: ["Corporation Tax Form"],
  },
  {
    id: "paye_filing",
    name: "PAYE Filing",
    description: "Monthly/Annual Pay-As-You-Earn tax returns",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 3,
    isPopular: true,
    requirements: [
      "Employee Schedule",
      "Payroll Records",
      "NIS Contribution Records",
    ],
    forms: ["PAYE Return Form"],
  },
  {
    id: "vat_return",
    name: "VAT Returns",
    description: "Monthly VAT Form C-104 submissions to GRA",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 3,
    isPopular: true,
    requirements: [
      "Sales Invoices",
      "Purchase Invoices",
      "Import Documentation",
    ],
    forms: ["Form C-104"],
  },
  {
    id: "property_tax_return",
    name: "Property Tax Returns",
    description: "Annual property tax filing for real estate holdings",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 5,
    requirements: [
      "Property Tax Return Form",
      "Valuation of Assets",
      "List of Liabilities",
    ],
  },
  {
    id: "capital_gains_tax",
    name: "Capital Gains Tax",
    description: "Tax filing for gains on property and asset sales",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 7,
    requirements: [
      "Capital Gains Tax Return",
      "Agreement of Sale",
      "Proof of Cost of Acquisition",
      "Receipts for Improvement/Expenses",
    ],
  },
  {
    id: "excise_tax_return",
    name: "Excise Tax Returns",
    description: "Tax filing for excise duties on imports and production",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 5,
    requirements: [
      "Excise Tax Return Form",
      "Import Documentation (C72)",
      "Production/Sales Records",
    ],
  },
  {
    id: "tender_compliance",
    name: "Tender Compliance Certificate",
    description: "Tax compliance certification for government tenders",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 5,
    isPopular: true,
    requirements: [
      "Compliance Application Form",
      "Valid NIS Compliance Certificate",
      "Proof of VAT Returns Filing",
      "Proof of Income/Corp Tax Filing",
    ],
  },
  {
    id: "work_permit_compliance",
    name: "Work Permit Tax Compliance",
    description: "Tax compliance for work permit applications",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 5,
    requirements: [
      "Compliance Application Form",
      "Employment Contract",
      "Company Tax Filings",
    ],
  },
  {
    id: "land_transfer_compliance",
    name: "Land Transfer Compliance",
    description: "Tax compliance for property transfers",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 7,
    requirements: [
      "Compliance Application Form",
      "Copy of Transport/Title/Lease",
      "Agreement of Sale & Purchase",
      "Rates & Taxes Receipt (Current Year)",
      "Valuation Report",
    ],
  },
  {
    id: "liability_compliance",
    name: "Liability Compliance",
    description: "Tax compliance for firearms licenses and other liabilities",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 5,
    requirements: [
      "Compliance Application Form",
      "License Application",
      "Supporting Documentation",
    ],
  },
  {
    id: "pension_compliance",
    name: "Pension Compliance",
    description: "Tax compliance for pension withdrawals",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 5,
    requirements: [
      "Compliance Application Form",
      "Pension Statement",
      "NIS Records",
    ],
  },
  {
    id: "certificate_of_assessment",
    name: "Certificate of Assessment",
    description: "Tax assessment certificates from GRA",
    category: "TAX_COMPLIANCE",
    business: "kaj",
    agency: "GRA",
    estimatedDays: 10,
    requirements: [
      "Application Form",
      "Tax Returns (3 years)",
      "Financial Statements",
    ],
  },

  // ============================================
  // KAJ FINANCIAL SERVICES - FINANCIAL SERVICES
  // ============================================
  {
    id: "bank_account_statement",
    name: "Bank Account Statements",
    description: "Preparation of financial statements for bank account opening",
    category: "FINANCIAL_SERVICES",
    business: "kaj",
    agency: null,
    estimatedDays: 3,
  },
  {
    id: "loan_application_statement",
    name: "Loan Application Statements",
    description: "Financial statements for bank loan applications",
    category: "FINANCIAL_SERVICES",
    business: "kaj",
    agency: null,
    estimatedDays: 5,
    isPopular: true,
  },
  {
    id: "investment_statement",
    name: "Investment Statements",
    description: "Financial statements for investment proposals",
    category: "FINANCIAL_SERVICES",
    business: "kaj",
    agency: null,
    estimatedDays: 7,
  },
  {
    id: "cash_flow_projection",
    name: "Cash Flow Projection",
    description: "Cash flow forecasting and projection reports",
    category: "FINANCIAL_SERVICES",
    business: "kaj",
    agency: null,
    estimatedDays: 5,
  },
  {
    id: "firearm_statement",
    name: "Commissioner of Police Statement",
    description: "Financial statements for firearm license applications",
    category: "FINANCIAL_SERVICES",
    business: "kaj",
    agency: null,
    estimatedDays: 3,
  },
  {
    id: "bookkeeping",
    name: "Monthly Bookkeeping",
    description: "Monthly bookkeeping and financial record maintenance",
    category: "FINANCIAL_SERVICES",
    business: "kaj",
    agency: null,
    isPopular: true,
  },
  {
    id: "annual_financial_statements",
    name: "Annual Financial Statements",
    description: "Year-end financial statement preparation",
    category: "FINANCIAL_SERVICES",
    business: "kaj",
    agency: null,
    estimatedDays: 14,
    isPopular: true,
  },

  // ============================================
  // KAJ FINANCIAL SERVICES - AUDIT SERVICES
  // ============================================
  {
    id: "ngo_audit",
    name: "NGO Audit",
    description: "Annual audit services for non-governmental organizations",
    category: "AUDIT_SERVICES",
    business: "kaj",
    agency: null,
    estimatedDays: 21,
  },
  {
    id: "cooperative_audit",
    name: "Cooperative Society Audit",
    description: "Annual audit services for cooperative societies",
    category: "AUDIT_SERVICES",
    business: "kaj",
    agency: null,
    estimatedDays: 21,
  },

  // ============================================
  // KAJ FINANCIAL SERVICES - NIS SERVICES
  // ============================================
  {
    id: "nis_registration",
    name: "NIS Registration",
    description: "New employer/employee registration with NIS",
    category: "NIS_SERVICES",
    business: "kaj",
    agency: "NIS",
    estimatedDays: 5,
    isPopular: true,
    requirements: [
      "NIS Registration Form",
      "National ID",
      "Business Registration",
    ],
  },
  {
    id: "nis_contributions",
    name: "NIS Contribution Schedules",
    description: "Monthly NIS contribution schedule submissions",
    category: "NIS_SERVICES",
    business: "kaj",
    agency: "NIS",
    estimatedDays: 3,
    isPopular: true,
    requirements: [
      "Employee Schedule",
      "Contribution Records",
      "Payment Evidence",
    ],
  },
  {
    id: "nis_compliance",
    name: "NIS Compliance Certificate",
    description: "NIS compliance certification for tenders and contracts",
    category: "NIS_SERVICES",
    business: "kaj",
    agency: "NIS",
    estimatedDays: 5,
    isPopular: true,
    requirements: [
      "Compliance App Form (C100F72/A)",
      "NIS Card",
      "Current Contribution Records",
    ],
  },
  {
    id: "nis_pension_query",
    name: "NIS Pension Queries",
    description: "Pension benefit queries and calculation assistance",
    category: "NIS_SERVICES",
    business: "kaj",
    agency: "NIS",
    estimatedDays: 7,
    requirements: [
      "NIS Card",
      "Contribution History",
      "Query Application Form",
    ],
  },

  // ============================================
  // GCMC CONSULTANCY - TRAININGS
  // ============================================
  {
    id: "hr_management_training",
    name: "Human Resource Management",
    description: "Training program for HR professionals and managers",
    category: "TRAININGS",
    business: "gcmc",
    agency: null,
    basePrice: 15_000,
  },
  {
    id: "customer_relations_training",
    name: "Customer Relations",
    description: "Customer service and relations training",
    category: "TRAININGS",
    business: "gcmc",
    agency: null,
    basePrice: 12_000,
  },
  {
    id: "cooperatives_training",
    name: "Co-operatives and Credit Unions",
    description: "Training for cooperative society management",
    category: "TRAININGS",
    business: "gcmc",
    agency: null,
    basePrice: 15_000,
  },
  {
    id: "organisational_management",
    name: "Organisational Management",
    description: "Organizational leadership and management training",
    category: "TRAININGS",
    business: "gcmc",
    agency: null,
    basePrice: 18_000,
  },

  // ============================================
  // GCMC CONSULTANCY - BUSINESS DEVELOPMENT
  // ============================================
  {
    id: "company_incorporation",
    name: "Company Incorporation",
    description: "Registration of limited liability companies",
    category: "BUSINESS_DEVELOPMENT",
    business: "gcmc",
    agency: "DEEDS_REGISTRY",
    estimatedDays: 14,
    basePrice: 50_000,
    isPopular: true,
    requirements: [
      "Articles of Incorporation",
      "Notice of Directors",
      "Notice of Secretary",
      "Notice of Registered Office",
      "Declaration of Compliance",
      "Directors' ID",
      "TIN Certificates",
    ],
  },
  {
    id: "business_name_registration",
    name: "Business Name Registration",
    description: "Registration of sole proprietorship or partnership",
    category: "BUSINESS_DEVELOPMENT",
    business: "gcmc",
    agency: "DEEDS_REGISTRY",
    estimatedDays: 7,
    basePrice: 6000,
    isPopular: true,
    requirements: [
      "Proposed Business Names (3 Options)",
      "Nature of Business Description",
      "Valid ID",
      "TIN Certificate",
      "Registration Fee",
      "Beneficial Ownership Form",
    ],
  },

  // ============================================
  // GCMC CONSULTANCY - PARALEGAL SERVICES
  // ============================================
  {
    id: "affidavit_preparation",
    name: "Affidavits",
    description: "Preparation and notarization of affidavits",
    category: "PARALEGAL",
    business: "gcmc",
    agency: null,
    estimatedDays: 2,
    basePrice: 5000,
  },
  {
    id: "agreement_of_sale",
    name: "Agreement of Sale & Purchase",
    description: "Preparation of property sale and purchase agreements",
    category: "PARALEGAL",
    business: "gcmc",
    agency: null,
    estimatedDays: 3,
    basePrice: 15_000,
  },
  {
    id: "will_preparation",
    name: "Wills",
    description: "Last will and testament preparation",
    category: "PARALEGAL",
    business: "gcmc",
    agency: null,
    estimatedDays: 5,
    basePrice: 20_000,
  },
  {
    id: "settlement_agreement",
    name: "Settlement Agreement",
    description: "Legal settlement agreement preparation",
    category: "PARALEGAL",
    business: "gcmc",
    agency: null,
    estimatedDays: 5,
    basePrice: 25_000,
  },
  {
    id: "separation_agreement",
    name: "Separation Agreement",
    description: "Marital separation agreement preparation",
    category: "PARALEGAL",
    business: "gcmc",
    agency: null,
    estimatedDays: 7,
    basePrice: 30_000,
  },
  {
    id: "partnership_agreement",
    name: "Investment & Partnership Agreement",
    description: "Partnership and investment agreement preparation",
    category: "PARALEGAL",
    business: "gcmc",
    agency: null,
    estimatedDays: 7,
    basePrice: 35_000,
  },

  // ============================================
  // GCMC CONSULTANCY - IMMIGRATION
  // ============================================
  {
    id: "work_permit",
    name: "Work Permit Application",
    description: "Work permit application processing",
    category: "IMMIGRATION",
    business: "gcmc",
    agency: "IMMIGRATION",
    estimatedDays: 30,
    isPopular: true,
    requirements: [
      "Passport Bio Page (6+ Months Validity)",
      "Current Visa / Entry Stamp",
      "Job Letter / Employment Contract",
      "Curriculum Vitae",
      "Police Clearance Certificate",
      "Medical Certificate",
      "Passport-Size Photos (4)",
      "Educational Qualifications",
    ],
  },
  {
    id: "work_permit_renewal",
    name: "Work Permit Renewal",
    description: "Renewal of existing work permits",
    category: "IMMIGRATION",
    business: "gcmc",
    agency: "IMMIGRATION",
    estimatedDays: 21,
    requirements: [
      "Current Work Permit",
      "Updated Passport",
      "Employment Confirmation Letter",
      "Tax Compliance Certificate",
    ],
  },
  {
    id: "citizenship_application",
    name: "Citizenship Application",
    description: "Application for Guyanese citizenship",
    category: "IMMIGRATION",
    business: "gcmc",
    agency: "IMMIGRATION",
    estimatedDays: 180,
    requirements: [
      "Birth Certificate",
      "Marriage Certificate (if applicable)",
      "Proof of Residence (5 Years)",
      "Police Clearance",
      "Character References",
    ],
  },
  {
    id: "business_visa",
    name: "Business Visa",
    description: "Business visa application processing",
    category: "IMMIGRATION",
    business: "gcmc",
    agency: "IMMIGRATION",
    estimatedDays: 14,
    requirements: [
      "Letter of Invitation",
      "Host Business Registration",
      "Valid Passport",
      "Travel Itinerary",
    ],
  },
  {
    id: "residence_permit",
    name: "Residence Permit",
    description: "Application for residence permit",
    category: "IMMIGRATION",
    business: "gcmc",
    agency: "IMMIGRATION",
    estimatedDays: 45,
  },

  // ============================================
  // GCMC CONSULTANCY - BUSINESS PROPOSALS
  // ============================================
  {
    id: "land_occupation_proposal",
    name: "Land Occupation Proposal",
    description: "Proposals for land occupation and development",
    category: "BUSINESS_PROPOSALS",
    business: "gcmc",
    agency: null,
    estimatedDays: 14,
  },
  {
    id: "investment_proposal",
    name: "Investment Proposal",
    description: "Business investment proposals and feasibility studies",
    category: "BUSINESS_PROPOSALS",
    business: "gcmc",
    agency: null,
    estimatedDays: 21,
  },
  {
    id: "startup_proposal",
    name: "Start Up Proposal",
    description: "Startup business proposals and planning",
    category: "BUSINESS_PROPOSALS",
    business: "gcmc",
    agency: null,
    estimatedDays: 14,
  },

  // ============================================
  // GCMC CONSULTANCY - PARTNER NETWORK
  // ============================================
  {
    id: "real_estate_referral",
    name: "Real Estate Agency Referral",
    description: "Referral to partner real estate agencies",
    category: "PARTNER_NETWORK",
    business: "gcmc",
    agency: null,
  },
  {
    id: "it_technician_referral",
    name: "IT Technician Referral",
    description: "Referral to partner IT service providers",
    category: "PARTNER_NETWORK",
    business: "gcmc",
    agency: null,
  },
  {
    id: "law_firm_referral",
    name: "Law Firm Referral",
    description: "Referral to partner law firms",
    category: "PARTNER_NETWORK",
    business: "gcmc",
    agency: null,
  },
  {
    id: "accounting_referral",
    name: "Accounting Firm Referral",
    description: "Referral to partner accounting firms",
    category: "PARTNER_NETWORK",
    business: "gcmc",
    agency: null,
  },
  {
    id: "insurance_referral",
    name: "Insurance Provider Referral",
    description: "Referral to partner insurance providers",
    category: "PARTNER_NETWORK",
    business: "gcmc",
    agency: null,
  },
  {
    id: "banking_referral",
    name: "Banking Services Referral",
    description: "Referral to partner banking institutions",
    category: "PARTNER_NETWORK",
    business: "gcmc",
    agency: null,
  },

  // ============================================
  // GCMC CONSULTANCY - EXPEDITING
  // ============================================
  {
    id: "gra_expediting",
    name: "GRA Document Expediting",
    description: "Document processing at Guyana Revenue Authority",
    category: "EXPEDITING",
    business: "gcmc",
    agency: "GRA",
    estimatedDays: 3,
  },
  {
    id: "deeds_expediting",
    name: "Deeds Registry Expediting",
    description: "Document processing at Deeds Registry",
    category: "EXPEDITING",
    business: "gcmc",
    agency: "DEEDS_REGISTRY",
    estimatedDays: 5,
  },
  {
    id: "immigration_expediting",
    name: "Immigration Expediting",
    description: "Document processing at Immigration Department",
    category: "EXPEDITING",
    business: "gcmc",
    agency: "IMMIGRATION",
    estimatedDays: 7,
  },
  {
    id: "general_expediting",
    name: "General Government Expediting",
    description: "Document processing at various government agencies",
    category: "EXPEDITING",
    business: "gcmc",
    agency: null,
    estimatedDays: 5,
  },

  // ============================================
  // GCMC CONSULTANCY - LOCAL CONTENT
  // ============================================
  {
    id: "local_content_registration",
    name: "Local Content Registration",
    description: "Registration with Local Content Secretariat",
    category: "LOCAL_CONTENT",
    business: "gcmc",
    agency: "LOCAL_CONTENT",
    estimatedDays: 21,
    isPopular: true,
    requirements: [
      "Local Content Application Form",
      "Ownership Structure Document",
      "Employee Nationality Records",
      "Goods & Services Declaration",
      "Business Registration",
    ],
  },
  {
    id: "local_content_certification",
    name: "Local Content Certification",
    description: "Certification for oil & gas sector participation",
    category: "LOCAL_CONTENT",
    business: "gcmc",
    agency: "LOCAL_CONTENT",
    estimatedDays: 30,
    isPopular: true,
  },
  {
    id: "local_content_compliance",
    name: "Local Content Compliance Review",
    description: "Annual compliance review and reporting",
    category: "LOCAL_CONTENT",
    business: "gcmc",
    agency: "LOCAL_CONTENT",
    estimatedDays: 14,
  },

  // ============================================
  // GCMC CONSULTANCY - PROPERTY MANAGEMENT
  // ============================================
  {
    id: "property_management",
    name: "Property Management",
    description: "Full property management services",
    category: "PROPERTY_MANAGEMENT",
    business: "gcmc",
    agency: null,
  },
  {
    id: "tenant_placement",
    name: "Tenant Placement",
    description: "Tenant screening and placement services",
    category: "PROPERTY_MANAGEMENT",
    business: "gcmc",
    agency: null,
  },
  {
    id: "rent_collection",
    name: "Rent Collection",
    description: "Monthly rent collection and disbursement",
    category: "PROPERTY_MANAGEMENT",
    business: "gcmc",
    agency: null,
  },
];

// Helper functions
export function getServicesByBusiness(businessId: "kaj" | "gcmc"): Service[] {
  return SERVICES.filter((s) => s.business === businessId);
}

export function getServicesByCategory(categoryId: string): Service[] {
  return SERVICES.filter((s) => s.category === categoryId);
}

export function getPopularServices(): Service[] {
  return SERVICES.filter((s) => s.isPopular);
}

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function searchServices(query: string): Service[] {
  const lowerQuery = query.toLowerCase();
  return SERVICES.filter(
    (s) =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery)
  );
}

// Export legacy format for backwards compatibility with client wizard
export const SERVICE_TYPES = SERVICES.map((s) => ({
  value: s.id.toUpperCase(),
  label: s.name,
  description: s.description,
  business: s.business,
  agency: s.agency ? GOVERNMENT_AGENCIES[s.agency]?.shortName : null,
  category: s.category,
}));

export function getServiceTypesByBusiness(businessId: "kaj" | "gcmc") {
  return SERVICE_TYPES.filter((s) => s.business === businessId);
}
