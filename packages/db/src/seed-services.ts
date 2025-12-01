import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { resolve } from "path";
import postgres from "postgres";
import { serviceCatalog } from "./schema/service-catalog";

// Load environment variables
config({ path: resolve(__dirname, "../../../.env") });

// Complete Service Catalog for GCMC and KAJ
// Based on analysis of existing platforms

const GCMC_SERVICES = [
  // ==========================================
  // TRAININGS (Green Crescent)
  // ==========================================
  {
    code: "GC-TRN-001",
    name: "Human Resource Management Training",
    shortDescription: "Professional HRM training and certification",
    fullDescription:
      "Comprehensive human resource management training covering recruitment, employee relations, performance management, and HR compliance for Guyanese businesses.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "TRAINING" as const,
    subcategory: "Human Resource Management",
    feeStructure: "FIXED" as const,
    basePrice: "75000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "40",
    iconName: "Users",
    colorCode: "#2563eb",
  },
  {
    code: "GC-TRN-002",
    name: "Customer Relations Training",
    shortDescription: "Excellence in customer service delivery",
    fullDescription:
      "Training program focused on customer service excellence, complaint handling, communication skills, and building lasting customer relationships.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "TRAINING" as const,
    subcategory: "Customer Relations",
    feeStructure: "FIXED" as const,
    basePrice: "50000",
    currency: "GYD",
    estimatedDurationDays: 3,
    estimatedHours: "24",
    iconName: "HeartHandshake",
    colorCode: "#2563eb",
  },
  {
    code: "GC-TRN-003",
    name: "Co-operatives & Credit Unions Training",
    shortDescription: "Governance and management for co-ops",
    fullDescription:
      "Specialized training for co-operative societies and credit unions covering governance, financial management, member services, and regulatory compliance.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "TRAINING" as const,
    subcategory: "Co-operatives and Credit Unions",
    feeStructure: "FIXED" as const,
    basePrice: "60000",
    currency: "GYD",
    estimatedDurationDays: 4,
    estimatedHours: "32",
    iconName: "Building2",
    colorCode: "#2563eb",
  },
  {
    code: "GC-TRN-004",
    name: "Organisational Management Training",
    shortDescription: "Leadership and organizational development",
    fullDescription:
      "Training program on organizational structure, leadership development, strategic planning, and operational efficiency for managers and executives.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "TRAINING" as const,
    subcategory: "Organisational Management",
    feeStructure: "FIXED" as const,
    basePrice: "85000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "40",
    iconName: "Network",
    colorCode: "#2563eb",
  },

  // ==========================================
  // CONSULTANCY (Green Crescent)
  // ==========================================
  {
    code: "GC-CON-001",
    name: "Company Incorporation",
    shortDescription: "Full company registration with DCRA",
    fullDescription:
      "Complete company incorporation service including name search, memorandum and articles preparation, DCRA registration, and post-incorporation compliance setup.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "CONSULTANCY" as const,
    subcategory: "Incorporation of Companies",
    feeStructure: "FIXED" as const,
    basePrice: "150000",
    currency: "GYD",
    estimatedDurationDays: 14,
    estimatedHours: "20",
    requiredDocuments: JSON.stringify([
      "National ID/Passport of Directors",
      "Proof of Address",
      "Proposed Company Name (3 options)",
      "Business Plan Summary",
    ]),
    iconName: "Building",
    colorCode: "#16a34a",
  },
  {
    code: "GC-CON-002",
    name: "Business Name Registration",
    shortDescription: "Sole proprietorship and partnership registration",
    fullDescription:
      "Business name registration service for sole proprietors and partnerships including name search, registration with Deeds Registry, and business compliance setup.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "CONSULTANCY" as const,
    subcategory: "Business Registration",
    feeStructure: "FIXED" as const,
    basePrice: "35000",
    currency: "GYD",
    estimatedDurationDays: 7,
    estimatedHours: "8",
    requiredDocuments: JSON.stringify([
      "National ID/Passport",
      "Proof of Address",
      "Proposed Business Name",
    ]),
    iconName: "FileSignature",
    colorCode: "#16a34a",
  },
  {
    code: "GC-CON-003",
    name: "Small Business Development Consultancy",
    shortDescription: "Strategic guidance for small businesses",
    fullDescription:
      "Comprehensive consultancy service for small business development including market analysis, business planning, operational setup, and growth strategies.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "CONSULTANCY" as const,
    subcategory: "Small Business Development",
    feeStructure: "HOURLY" as const,
    basePrice: "15000",
    currency: "GYD",
    estimatedHours: "10",
    iconName: "TrendingUp",
    colorCode: "#16a34a",
  },

  // ==========================================
  // PARALEGAL SERVICES (Green Crescent)
  // ==========================================
  {
    code: "GC-PAR-001",
    name: "Affidavit Preparation",
    shortDescription: "Sworn statement preparation and notarization",
    fullDescription:
      "Professional preparation of affidavits and sworn statements for various purposes including immigration, court proceedings, and general declarations.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "PARALEGAL" as const,
    subcategory: "Affidavits",
    feeStructure: "FIXED" as const,
    basePrice: "15000",
    currency: "GYD",
    estimatedDurationDays: 2,
    estimatedHours: "2",
    iconName: "FileCheck",
    colorCode: "#7c3aed",
  },
  {
    code: "GC-PAR-002",
    name: "Agreement of Sale & Purchase",
    shortDescription: "Property transaction agreements",
    fullDescription:
      "Preparation of sale and purchase agreements for real estate and business transactions including terms negotiation and legal document drafting.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "PARALEGAL" as const,
    subcategory: "Agreement of Sales and Purchases",
    feeStructure: "PERCENTAGE" as const,
    basePrice: "1",
    currency: "GYD",
    minPrice: "50000",
    maxPrice: "500000",
    estimatedDurationDays: 5,
    estimatedHours: "10",
    iconName: "FileText",
    colorCode: "#7c3aed",
  },
  {
    code: "GC-PAR-003",
    name: "Will Preparation",
    shortDescription: "Last will and testament drafting",
    fullDescription:
      "Professional preparation of wills including asset inventory, beneficiary designation, executor appointment, and proper legal execution.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "PARALEGAL" as const,
    subcategory: "Wills",
    feeStructure: "FIXED" as const,
    basePrice: "45000",
    currency: "GYD",
    estimatedDurationDays: 7,
    estimatedHours: "6",
    iconName: "ScrollText",
    colorCode: "#7c3aed",
  },
  {
    code: "GC-PAR-004",
    name: "Settlement Agreement",
    shortDescription: "Dispute resolution agreements",
    fullDescription:
      "Preparation of settlement agreements for resolving disputes including terms negotiation, payment schedules, and release clauses.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "PARALEGAL" as const,
    subcategory: "Settlement Agreement",
    feeStructure: "FIXED" as const,
    basePrice: "35000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "8",
    iconName: "Handshake",
    colorCode: "#7c3aed",
  },
  {
    code: "GC-PAR-005",
    name: "Separation Agreement",
    shortDescription: "Marital separation documentation",
    fullDescription:
      "Preparation of separation agreements covering asset division, custody arrangements, support obligations, and other marital dissolution terms.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "PARALEGAL" as const,
    subcategory: "Separation Agreement",
    feeStructure: "FIXED" as const,
    basePrice: "65000",
    currency: "GYD",
    estimatedDurationDays: 10,
    estimatedHours: "12",
    iconName: "UserMinus",
    colorCode: "#7c3aed",
  },
  {
    code: "GC-PAR-006",
    name: "Investment & Partnership Agreement",
    shortDescription: "Business partnership documentation",
    fullDescription:
      "Preparation of investment and partnership agreements including capital contributions, profit sharing, management rights, and exit provisions.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "PARALEGAL" as const,
    subcategory: "Investment & Partnership Agreement",
    feeStructure: "FIXED" as const,
    basePrice: "85000",
    currency: "GYD",
    estimatedDurationDays: 7,
    estimatedHours: "15",
    iconName: "Users",
    colorCode: "#7c3aed",
  },
  {
    code: "GC-PAR-007",
    name: "Power of Attorney",
    shortDescription: "Legal authorization documents",
    fullDescription:
      "Preparation of general and specific power of attorney documents for various purposes including property management, financial decisions, and legal representation.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "PARALEGAL" as const,
    subcategory: "Power of Attorney",
    feeStructure: "FIXED" as const,
    basePrice: "25000",
    currency: "GYD",
    estimatedDurationDays: 3,
    estimatedHours: "3",
    iconName: "Shield",
    colorCode: "#7c3aed",
  },
  {
    code: "GC-PAR-008",
    name: "Deed of Gift",
    shortDescription: "Property gift transfer documents",
    fullDescription:
      "Preparation of deed of gift documents for transferring property without consideration including tax implications guidance and registration support.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "PARALEGAL" as const,
    subcategory: "Deed of Gift",
    feeStructure: "FIXED" as const,
    basePrice: "40000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "6",
    iconName: "Gift",
    colorCode: "#7c3aed",
  },

  // ==========================================
  // IMMIGRATION (Green Crescent)
  // ==========================================
  {
    code: "GC-IMM-001",
    name: "Work Permit Application",
    shortDescription: "Employment authorization for foreign nationals",
    fullDescription:
      "Complete work permit application service including document preparation, employer liaison, Ministry of Labour submission, and status tracking.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "IMMIGRATION" as const,
    subcategory: "Work Permits",
    feeStructure: "FIXED" as const,
    basePrice: "125000",
    currency: "GYD",
    estimatedDurationDays: 30,
    estimatedHours: "20",
    immigrationIntegration: true,
    requiredDocuments: JSON.stringify([
      "Valid Passport (6+ months)",
      "Job Offer Letter",
      "CV/Resume",
      "Educational Certificates",
      "Police Clearance",
      "Medical Certificate",
      "Passport Photos",
    ]),
    iconName: "Briefcase",
    colorCode: "#dc2626",
  },
  {
    code: "GC-IMM-002",
    name: "Citizenship Application",
    shortDescription: "Guyanese citizenship processing",
    fullDescription:
      "Comprehensive citizenship application service including eligibility assessment, document compilation, application submission, and interview preparation.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "IMMIGRATION" as const,
    subcategory: "Citizenship",
    feeStructure: "FIXED" as const,
    basePrice: "200000",
    currency: "GYD",
    estimatedDurationDays: 180,
    estimatedHours: "40",
    immigrationIntegration: true,
    requiredDocuments: JSON.stringify([
      "Birth Certificate",
      "Marriage Certificate (if applicable)",
      "Proof of Residence (5 years)",
      "Police Clearance",
      "Tax Compliance Certificate",
      "Character References",
    ]),
    iconName: "Flag",
    colorCode: "#dc2626",
  },
  {
    code: "GC-IMM-003",
    name: "Business Visa Application",
    shortDescription: "Business visitor visa processing",
    fullDescription:
      "Business visa application service for investors, entrepreneurs, and business visitors including invitation letter coordination and documentation support.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "IMMIGRATION" as const,
    subcategory: "Business Visa",
    feeStructure: "FIXED" as const,
    basePrice: "75000",
    currency: "GYD",
    estimatedDurationDays: 21,
    estimatedHours: "15",
    immigrationIntegration: true,
    requiredDocuments: JSON.stringify([
      "Valid Passport",
      "Invitation Letter from Host Company",
      "Business Registration (Host)",
      "Proof of Funds",
      "Travel Itinerary",
    ]),
    iconName: "Plane",
    colorCode: "#dc2626",
  },
  {
    code: "GC-IMM-004",
    name: "Work Permit Renewal",
    shortDescription: "Extension of existing work authorization",
    fullDescription:
      "Work permit renewal service including compliance verification, updated documentation, and seamless extension processing.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "IMMIGRATION" as const,
    subcategory: "Work Permits",
    feeStructure: "FIXED" as const,
    basePrice: "85000",
    currency: "GYD",
    estimatedDurationDays: 21,
    estimatedHours: "12",
    immigrationIntegration: true,
    iconName: "RefreshCw",
    colorCode: "#dc2626",
  },
  {
    code: "GC-IMM-005",
    name: "Dependent Visa Application",
    shortDescription: "Family member visa processing",
    fullDescription:
      "Visa application service for dependents including spouse and children, covering documentation, application submission, and family reunification support.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "IMMIGRATION" as const,
    subcategory: "Dependent Visa",
    feeStructure: "FIXED" as const,
    basePrice: "65000",
    currency: "GYD",
    estimatedDurationDays: 30,
    estimatedHours: "15",
    immigrationIntegration: true,
    iconName: "Users",
    colorCode: "#dc2626",
  },

  // ==========================================
  // BUSINESS PROPOSALS (Green Crescent)
  // ==========================================
  {
    code: "GC-PRO-001",
    name: "Land Occupation Proposal",
    shortDescription: "Land use and development proposals",
    fullDescription:
      "Professional preparation of land occupation proposals for government and private land acquisition including feasibility analysis and regulatory compliance.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "BUSINESS_PROPOSALS" as const,
    subcategory: "Land Occupation",
    feeStructure: "FIXED" as const,
    basePrice: "150000",
    currency: "GYD",
    estimatedDurationDays: 14,
    estimatedHours: "30",
    iconName: "Map",
    colorCode: "#f59e0b",
  },
  {
    code: "GC-PRO-002",
    name: "Investment Proposal",
    shortDescription: "Investment pitch deck and documentation",
    fullDescription:
      "Comprehensive investment proposal preparation including market analysis, financial projections, risk assessment, and investor-ready presentation.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "BUSINESS_PROPOSALS" as const,
    subcategory: "Investment",
    feeStructure: "FIXED" as const,
    basePrice: "200000",
    currency: "GYD",
    estimatedDurationDays: 21,
    estimatedHours: "50",
    iconName: "PiggyBank",
    colorCode: "#f59e0b",
  },
  {
    code: "GC-PRO-003",
    name: "Startup Business Plan",
    shortDescription: "Comprehensive business plan for new ventures",
    fullDescription:
      "Full business plan development for startups including executive summary, market analysis, operations plan, financial projections, and funding strategy.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "BUSINESS_PROPOSALS" as const,
    subcategory: "Start Ups",
    feeStructure: "FIXED" as const,
    basePrice: "175000",
    currency: "GYD",
    estimatedDurationDays: 14,
    estimatedHours: "40",
    iconName: "Rocket",
    colorCode: "#f59e0b",
  },
  {
    code: "GC-PRO-004",
    name: "Feasibility Study",
    shortDescription: "Project viability assessment",
    fullDescription:
      "Comprehensive feasibility study including market research, technical assessment, financial analysis, and risk evaluation for new projects and ventures.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "BUSINESS_PROPOSALS" as const,
    subcategory: "Feasibility Studies",
    feeStructure: "FIXED" as const,
    basePrice: "250000",
    currency: "GYD",
    estimatedDurationDays: 21,
    estimatedHours: "60",
    iconName: "ClipboardCheck",
    colorCode: "#f59e0b",
  },

  // ==========================================
  // NETWORKING (Green Crescent)
  // ==========================================
  {
    code: "GC-NET-001",
    name: "Real Estate Agency Referral",
    shortDescription: "Vetted real estate partner connection",
    fullDescription:
      "Connection to trusted real estate agencies for property acquisition, rental, and management needs with preferential client rates.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "NETWORKING" as const,
    subcategory: "Real Estate Agencies",
    feeStructure: "FREE" as const,
    basePrice: "0",
    currency: "GYD",
    iconName: "Home",
    colorCode: "#6366f1",
  },
  {
    code: "GC-NET-002",
    name: "IT Technician Referral",
    shortDescription: "Technology support partner connection",
    fullDescription:
      "Connection to qualified IT technicians and technology service providers for business technology needs including setup, maintenance, and support.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "NETWORKING" as const,
    subcategory: "IT Technician",
    feeStructure: "FREE" as const,
    basePrice: "0",
    currency: "GYD",
    iconName: "Monitor",
    colorCode: "#6366f1",
  },
  {
    code: "GC-NET-003",
    name: "Law Firm Referral",
    shortDescription: "Legal services partner connection",
    fullDescription:
      "Connection to reputable law firms for legal matters requiring attorney representation including litigation, corporate law, and specialized legal services.",
    businessEntity: "GREEN_CRESCENT" as const,
    category: "NETWORKING" as const,
    subcategory: "Law Firms",
    feeStructure: "FREE" as const,
    basePrice: "0",
    currency: "GYD",
    iconName: "Scale",
    colorCode: "#6366f1",
  },
];

const KAJ_SERVICES = [
  // ==========================================
  // TAX RETURNS (KAJ Financial)
  // ==========================================
  {
    code: "KAJ-TAX-001",
    name: "Individual Income Tax Return",
    shortDescription: "Personal income tax filing with GRA",
    fullDescription:
      "Complete individual income tax return preparation and filing including income calculation, deduction optimization, and GRA submission.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "TAX_RETURNS" as const,
    subcategory: "Income Tax Returns",
    feeStructure: "FIXED" as const,
    basePrice: "25000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "4",
    graIntegration: true,
    requiredDocuments: JSON.stringify([
      "TIN Certificate",
      "Income Statements",
      "Bank Statements",
      "Receipts for Deductions",
    ]),
    iconName: "Receipt",
    colorCode: "#059669",
  },
  {
    code: "KAJ-TAX-002",
    name: "Corporate Income Tax Return",
    shortDescription: "Business income tax filing",
    fullDescription:
      "Corporate income tax return preparation including financial statement analysis, tax computation, and GRA filing for companies.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "TAX_RETURNS" as const,
    subcategory: "Income Tax Returns",
    feeStructure: "FIXED" as const,
    basePrice: "75000",
    currency: "GYD",
    estimatedDurationDays: 14,
    estimatedHours: "20",
    graIntegration: true,
    requiredDocuments: JSON.stringify([
      "TIN Certificate",
      "Financial Statements",
      "Bank Statements",
      "Trial Balance",
      "Fixed Assets Register",
    ]),
    iconName: "Building2",
    colorCode: "#059669",
  },
  {
    code: "KAJ-TAX-003",
    name: "VAT Return Filing",
    shortDescription: "Monthly/quarterly VAT submission",
    fullDescription:
      "VAT return preparation and filing including input/output VAT reconciliation, rate application (14%), and timely GRA submission.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "TAX_RETURNS" as const,
    subcategory: "VAT Returns",
    feeStructure: "MONTHLY" as const,
    basePrice: "20000",
    currency: "GYD",
    estimatedDurationDays: 3,
    estimatedHours: "4",
    graIntegration: true,
    iconName: "Percent",
    colorCode: "#059669",
  },
  {
    code: "KAJ-TAX-004",
    name: "Property Tax Return",
    shortDescription: "Real estate tax filing",
    fullDescription:
      "Property tax return preparation and filing including valuation assessment, exemption applications, and timely payment scheduling.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "TAX_RETURNS" as const,
    subcategory: "Property Tax",
    feeStructure: "FIXED" as const,
    basePrice: "15000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "3",
    graIntegration: true,
    iconName: "Home",
    colorCode: "#059669",
  },
  {
    code: "KAJ-TAX-005",
    name: "Capital Gains Tax Filing",
    shortDescription: "Asset disposal tax computation",
    fullDescription:
      "Capital gains tax calculation and filing for property and asset disposals including cost basis determination and exemption analysis.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "TAX_RETURNS" as const,
    subcategory: "Capital Gains Tax",
    feeStructure: "FIXED" as const,
    basePrice: "35000",
    currency: "GYD",
    estimatedDurationDays: 7,
    estimatedHours: "8",
    graIntegration: true,
    iconName: "TrendingUp",
    colorCode: "#059669",
  },

  // ==========================================
  // COMPLIANCE (KAJ Financial)
  // ==========================================
  {
    code: "KAJ-COM-001",
    name: "Tender Compliance Certificate",
    shortDescription: "GRA compliance for tender bids",
    fullDescription:
      "Procurement of GRA tax compliance certificate required for government and private sector tender submissions.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "COMPLIANCE" as const,
    subcategory: "Tender",
    feeStructure: "FIXED" as const,
    basePrice: "15000",
    currency: "GYD",
    estimatedDurationDays: 3,
    estimatedHours: "2",
    graIntegration: true,
    iconName: "FileCheck",
    colorCode: "#0891b2",
  },
  {
    code: "KAJ-COM-002",
    name: "Work Permit Compliance",
    shortDescription: "Tax clearance for work permits",
    fullDescription:
      "GRA compliance documentation required for work permit applications and renewals including employer tax status verification.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "COMPLIANCE" as const,
    subcategory: "Work Permit",
    feeStructure: "FIXED" as const,
    basePrice: "20000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "3",
    graIntegration: true,
    iconName: "Briefcase",
    colorCode: "#0891b2",
  },
  {
    code: "KAJ-COM-003",
    name: "Land Transfer Compliance",
    shortDescription: "Tax clearance for property transfers",
    fullDescription:
      "GRA compliance certificate for land and property transfers including capital gains assessment and transfer tax calculation.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "COMPLIANCE" as const,
    subcategory: "Land Transfer",
    feeStructure: "FIXED" as const,
    basePrice: "25000",
    currency: "GYD",
    estimatedDurationDays: 7,
    estimatedHours: "5",
    graIntegration: true,
    iconName: "MapPin",
    colorCode: "#0891b2",
  },
  {
    code: "KAJ-COM-004",
    name: "Firearm Liability Compliance",
    shortDescription: "Tax clearance for firearm applications",
    fullDescription:
      "GRA compliance documentation required for firearm license applications including income verification and tax status confirmation.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "COMPLIANCE" as const,
    subcategory: "Liability (Firearm)",
    feeStructure: "FIXED" as const,
    basePrice: "20000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "3",
    graIntegration: true,
    iconName: "Shield",
    colorCode: "#0891b2",
  },
  {
    code: "KAJ-COM-005",
    name: "Pension Compliance",
    shortDescription: "Pension contribution compliance",
    fullDescription:
      "Compliance verification for pension contributions including NIS verification and private pension fund documentation.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "COMPLIANCE" as const,
    subcategory: "Pension",
    feeStructure: "FIXED" as const,
    basePrice: "15000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "3",
    nisIntegration: true,
    iconName: "Wallet",
    colorCode: "#0891b2",
  },
  {
    code: "KAJ-COM-006",
    name: "Certificate of Assessment",
    shortDescription: "Official GRA tax assessment",
    fullDescription:
      "Procurement of official certificate of assessment from GRA for various purposes including loan applications and compliance verification.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "COMPLIANCE" as const,
    subcategory: "Certificate of Assessments",
    feeStructure: "FIXED" as const,
    basePrice: "15000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "2",
    graIntegration: true,
    iconName: "Award",
    colorCode: "#0891b2",
  },

  // ==========================================
  // PAYE SERVICES (KAJ Financial)
  // ==========================================
  {
    code: "KAJ-PAY-001",
    name: "Monthly PAYE Filing",
    shortDescription: "Employee tax deduction submission",
    fullDescription:
      "Monthly PAYE return preparation and filing including employee tax calculations, deduction schedules, and GRA submission.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "PAYE_SERVICES" as const,
    subcategory: "PAYE Returns",
    feeStructure: "MONTHLY" as const,
    basePrice: "15000",
    currency: "GYD",
    estimatedDurationDays: 3,
    estimatedHours: "4",
    graIntegration: true,
    iconName: "Calculator",
    colorCode: "#7c3aed",
  },
  {
    code: "KAJ-PAY-002",
    name: "Payroll Processing",
    shortDescription: "Complete payroll management",
    fullDescription:
      "Full payroll processing service including salary calculations, PAYE deductions, NIS contributions, and payslip generation.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "PAYE_SERVICES" as const,
    subcategory: "Payroll",
    feeStructure: "MONTHLY" as const,
    basePrice: "25000",
    currency: "GYD",
    estimatedHours: "8",
    graIntegration: true,
    nisIntegration: true,
    iconName: "DollarSign",
    colorCode: "#7c3aed",
  },
  {
    code: "KAJ-PAY-003",
    name: "Year-End PAYE Reconciliation",
    shortDescription: "Annual PAYE filing and certificates",
    fullDescription:
      "Year-end PAYE reconciliation including annual return filing, P9 certificates for employees, and tax clearance for staff.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "PAYE_SERVICES" as const,
    subcategory: "PAYE Returns",
    feeStructure: "ANNUAL" as const,
    basePrice: "45000",
    currency: "GYD",
    estimatedDurationDays: 14,
    estimatedHours: "15",
    graIntegration: true,
    iconName: "CalendarCheck",
    colorCode: "#7c3aed",
  },

  // ==========================================
  // FINANCIAL STATEMENTS (KAJ Financial)
  // ==========================================
  {
    code: "KAJ-FIN-001",
    name: "Bank Account Statement Letter",
    shortDescription: "Financial statement for banking",
    fullDescription:
      "Preparation of income/expenditure statement for bank account opening, loan applications, and financial verification purposes.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "FINANCIAL_STATEMENTS" as const,
    subcategory: "Bank Accounts",
    feeStructure: "FIXED" as const,
    basePrice: "15000",
    currency: "GYD",
    estimatedDurationDays: 3,
    estimatedHours: "3",
    iconName: "Landmark",
    colorCode: "#ec4899",
  },
  {
    code: "KAJ-FIN-002",
    name: "Firearm Financial Statement",
    shortDescription: "Income statement for firearm license",
    fullDescription:
      "Preparation of income/expenditure statement required by Commissioner of Police for firearm license applications.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "FINANCIAL_STATEMENTS" as const,
    subcategory: "Commissioner of Police - Firearm",
    feeStructure: "FIXED" as const,
    basePrice: "20000",
    currency: "GYD",
    estimatedDurationDays: 3,
    estimatedHours: "4",
    iconName: "FileText",
    colorCode: "#ec4899",
  },
  {
    code: "KAJ-FIN-003",
    name: "Loan Application Statement",
    shortDescription: "Financial statement for loans",
    fullDescription:
      "Comprehensive financial statement preparation for loan applications including income verification, asset listing, and cash flow analysis.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "FINANCIAL_STATEMENTS" as const,
    subcategory: "Loans",
    feeStructure: "FIXED" as const,
    basePrice: "25000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "6",
    iconName: "CreditCard",
    colorCode: "#ec4899",
  },
  {
    code: "KAJ-FIN-004",
    name: "Investment Financial Statement",
    shortDescription: "Financial statement for investments",
    fullDescription:
      "Preparation of financial statements for investment purposes including net worth calculation and investment portfolio summary.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "FINANCIAL_STATEMENTS" as const,
    subcategory: "Investments",
    feeStructure: "FIXED" as const,
    basePrice: "30000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "8",
    iconName: "LineChart",
    colorCode: "#ec4899",
  },
  {
    code: "KAJ-FIN-005",
    name: "Cash Flow Projection",
    shortDescription: "Future cash flow forecasting",
    fullDescription:
      "Preparation of cash flow projections for business planning, loan applications, and investment decisions including scenario analysis.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "FINANCIAL_STATEMENTS" as const,
    subcategory: "Cash Flow Projection",
    feeStructure: "FIXED" as const,
    basePrice: "45000",
    currency: "GYD",
    estimatedDurationDays: 7,
    estimatedHours: "12",
    iconName: "Activity",
    colorCode: "#ec4899",
  },
  {
    code: "KAJ-FIN-006",
    name: "Full Financial Statements",
    shortDescription: "Complete P&L, Balance Sheet, Cash Flow",
    fullDescription:
      "Comprehensive financial statement preparation including Profit & Loss, Balance Sheet, and Cash Flow Statement for annual reporting.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "FINANCIAL_STATEMENTS" as const,
    subcategory: "Financial Statements",
    feeStructure: "FIXED" as const,
    basePrice: "85000",
    currency: "GYD",
    estimatedDurationDays: 14,
    estimatedHours: "25",
    iconName: "FileSpreadsheet",
    colorCode: "#ec4899",
  },

  // ==========================================
  // AUDIT SERVICES (KAJ Financial)
  // ==========================================
  {
    code: "KAJ-AUD-001",
    name: "NGO Audit",
    shortDescription: "Non-profit organization audit",
    fullDescription:
      "Comprehensive audit of non-governmental organizations including financial statement audit, compliance verification, and donor reporting.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "AUDIT_SERVICES" as const,
    subcategory: "NGO Audit",
    feeStructure: "FIXED" as const,
    basePrice: "150000",
    currency: "GYD",
    estimatedDurationDays: 21,
    estimatedHours: "60",
    iconName: "ClipboardList",
    colorCode: "#f97316",
  },
  {
    code: "KAJ-AUD-002",
    name: "Co-operative Society Audit",
    shortDescription: "Credit union and co-op audit",
    fullDescription:
      "Statutory audit of co-operative societies and credit unions including member compliance, financial verification, and regulatory reporting.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "AUDIT_SERVICES" as const,
    subcategory: "Co-operative Audit",
    feeStructure: "FIXED" as const,
    basePrice: "175000",
    currency: "GYD",
    estimatedDurationDays: 21,
    estimatedHours: "70",
    iconName: "Users",
    colorCode: "#f97316",
  },
  {
    code: "KAJ-AUD-003",
    name: "Internal Control Review",
    shortDescription: "Business process audit",
    fullDescription:
      "Review of internal controls and business processes including risk assessment, control testing, and recommendations for improvement.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "AUDIT_SERVICES" as const,
    subcategory: "Internal Control",
    feeStructure: "FIXED" as const,
    basePrice: "100000",
    currency: "GYD",
    estimatedDurationDays: 14,
    estimatedHours: "40",
    iconName: "ShieldCheck",
    colorCode: "#f97316",
  },

  // ==========================================
  // NIS SERVICES (KAJ Financial)
  // ==========================================
  {
    code: "KAJ-NIS-001",
    name: "NIS Employer Registration",
    shortDescription: "New employer NIS setup",
    fullDescription:
      "Registration of employers with National Insurance Scheme including documentation, application submission, and compliance setup.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "NIS_SERVICES" as const,
    subcategory: "Registrations",
    feeStructure: "FIXED" as const,
    basePrice: "25000",
    currency: "GYD",
    estimatedDurationDays: 7,
    estimatedHours: "5",
    nisIntegration: true,
    iconName: "UserPlus",
    colorCode: "#0ea5e9",
  },
  {
    code: "KAJ-NIS-002",
    name: "NIS Employee Registration",
    shortDescription: "Individual NIS registration",
    fullDescription:
      "Registration of employees with National Insurance Scheme including NIS number application and contribution setup.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "NIS_SERVICES" as const,
    subcategory: "Registrations",
    feeStructure: "FIXED" as const,
    basePrice: "10000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "2",
    nisIntegration: true,
    iconName: "UserCheck",
    colorCode: "#0ea5e9",
  },
  {
    code: "KAJ-NIS-003",
    name: "Monthly NIS Schedule",
    shortDescription: "NIS contribution submission",
    fullDescription:
      "Monthly preparation and submission of NIS contribution schedules including employee and employer contribution calculations.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "NIS_SERVICES" as const,
    subcategory: "Schedules of Contributions",
    feeStructure: "MONTHLY" as const,
    basePrice: "15000",
    currency: "GYD",
    estimatedDurationDays: 3,
    estimatedHours: "4",
    nisIntegration: true,
    iconName: "Calendar",
    colorCode: "#0ea5e9",
  },
  {
    code: "KAJ-NIS-004",
    name: "NIS Compliance Certificate",
    shortDescription: "NIS clearance documentation",
    fullDescription:
      "Procurement of NIS compliance certificate for tenders, work permits, and other regulatory requirements.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "NIS_SERVICES" as const,
    subcategory: "Compliances",
    feeStructure: "FIXED" as const,
    basePrice: "15000",
    currency: "GYD",
    estimatedDurationDays: 5,
    estimatedHours: "3",
    nisIntegration: true,
    iconName: "BadgeCheck",
    colorCode: "#0ea5e9",
  },
  {
    code: "KAJ-NIS-005",
    name: "NIS Pension Query Resolution",
    shortDescription: "Pension benefit verification",
    fullDescription:
      "Resolution of NIS pension queries including contribution verification, benefit calculation, and claim assistance.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "NIS_SERVICES" as const,
    subcategory: "Pension Queries",
    feeStructure: "FIXED" as const,
    basePrice: "20000",
    currency: "GYD",
    estimatedDurationDays: 10,
    estimatedHours: "6",
    nisIntegration: true,
    iconName: "HelpCircle",
    colorCode: "#0ea5e9",
  },

  // ==========================================
  // BOOKKEEPING (KAJ Financial)
  // ==========================================
  {
    code: "KAJ-BKK-001",
    name: "Monthly Bookkeeping",
    shortDescription: "Ongoing accounting records maintenance",
    fullDescription:
      "Monthly bookkeeping service including transaction recording, bank reconciliation, accounts maintenance, and financial reporting.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "TAX_RETURNS" as const,
    subcategory: "Bookkeeping",
    feeStructure: "MONTHLY" as const,
    basePrice: "35000",
    currency: "GYD",
    estimatedHours: "15",
    iconName: "BookOpen",
    colorCode: "#059669",
  },
  {
    code: "KAJ-BKK-002",
    name: "Catch-Up Bookkeeping",
    shortDescription: "Historical records cleanup",
    fullDescription:
      "Catch-up bookkeeping service to bring accounting records current including transaction reconstruction and reconciliation.",
    businessEntity: "KAJ_FINANCIAL" as const,
    category: "TAX_RETURNS" as const,
    subcategory: "Bookkeeping",
    feeStructure: "HOURLY" as const,
    basePrice: "8000",
    currency: "GYD",
    iconName: "RotateCcw",
    colorCode: "#059669",
  },
];

// All services combined
const ALL_SERVICES = [...GCMC_SERVICES, ...KAJ_SERVICES];

async function seedServices() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Starting service catalog seed...");
  console.log(`Total services to seed: ${ALL_SERVICES.length}`);

  // Get the default organization ID (we'll use a placeholder for now)
  const organizationId = process.env.DEFAULT_ORG_ID || "default-org";

  for (const service of ALL_SERVICES) {
    const serviceId = crypto.randomUUID();

    try {
      await db.insert(serviceCatalog).values({
        id: serviceId,
        organizationId,
        ...service,
        status: "ACTIVE",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✓ Created service: ${service.code} - ${service.name}`);
    } catch (error) {
      console.error(`✗ Failed to create service ${service.code}:`, error);
    }
  }

  await client.end();
  console.log("\nService catalog seed completed!");
  console.log(`GCMC Services: ${GCMC_SERVICES.length}`);
  console.log(`KAJ Services: ${KAJ_SERVICES.length}`);
  console.log(`Total: ${ALL_SERVICES.length}`);
}

// Export for use in other scripts
export { GCMC_SERVICES, KAJ_SERVICES, ALL_SERVICES };

// Run if called directly
seedServices().catch(console.error);
