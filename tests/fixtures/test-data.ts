/**
 * Test fixtures and mock data for GK-Nexus E2E tests
 */

export const testUsers = {
  admin: {
    email: "admin@test.com",
    password: "TestPassword123!",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
  },
  manager: {
    email: "manager@test.com",
    password: "TestPassword123!",
    firstName: "Manager",
    lastName: "User",
    role: "manager",
  },
  client: {
    email: "client@test.com",
    password: "TestPassword123!",
    firstName: "Client",
    lastName: "User",
    role: "client",
  },
  staff: {
    email: "staff@test.com",
    password: "TestPassword123!",
    firstName: "Staff",
    lastName: "User",
    role: "staff",
  },
} as const;

export const testClients = [
  {
    id: "test-client-1",
    name: "Acme Corporation",
    email: "contact@acme.com",
    phone: "+1-555-0123",
    address: {
      street: "123 Main St",
      city: "Business City",
      state: "NY",
      zipCode: "12345",
      country: "USA",
    },
    taxId: "12-3456789",
    businessType: "corporation",
    industry: "technology",
    establishedDate: "2020-01-15",
    website: "https://acme.com",
  },
  {
    id: "test-client-2",
    name: "Tech Solutions Inc",
    email: "info@techsolutions.com",
    phone: "+1-555-0124",
    address: {
      street: "456 Tech Ave",
      city: "Silicon Valley",
      state: "CA",
      zipCode: "94000",
      country: "USA",
    },
    taxId: "98-7654321",
    businessType: "llc",
    industry: "consulting",
    establishedDate: "2019-06-01",
    website: "https://techsolutions.com",
  },
  {
    id: "test-client-3",
    name: "Local Restaurant Group",
    email: "admin@localrestaurant.com",
    phone: "+1-555-0125",
    address: {
      street: "789 Food St",
      city: "Cuisine City",
      state: "TX",
      zipCode: "75000",
      country: "USA",
    },
    taxId: "55-9876543",
    businessType: "partnership",
    industry: "restaurant",
    establishedDate: "2018-03-10",
    website: "https://localrestaurant.com",
  },
] as const;

export const testProjects = [
  {
    id: "test-project-1",
    clientId: "test-client-1",
    name: "Q4 2024 Tax Filing",
    description: "Annual tax preparation and filing for Acme Corporation",
    type: "tax-filing",
    status: "in-progress",
    priority: "high",
    startDate: "2024-11-01",
    dueDate: "2024-12-31",
    estimatedHours: 40,
    hourlyRate: 150,
    assignedStaff: ["staff@test.com"],
    tags: ["annual", "corporate", "urgent"],
  },
  {
    id: "test-project-2",
    clientId: "test-client-2",
    name: "Payroll Setup & Management",
    description: "Setup payroll system and ongoing management",
    type: "payroll",
    status: "completed",
    priority: "medium",
    startDate: "2024-10-01",
    dueDate: "2024-10-31",
    estimatedHours: 25,
    hourlyRate: 125,
    assignedStaff: ["manager@test.com"],
    tags: ["payroll", "setup", "monthly"],
  },
  {
    id: "test-project-3",
    clientId: "test-client-3",
    name: "Financial Consultation",
    description: "Business financial planning and consultation",
    type: "consultation",
    status: "pending",
    priority: "low",
    startDate: "2024-12-15",
    dueDate: "2025-01-15",
    estimatedHours: 15,
    hourlyRate: 200,
    assignedStaff: ["admin@test.com"],
    tags: ["consultation", "planning"],
  },
] as const;

export const testTaxForms = [
  {
    id: "test-form-1",
    clientId: "test-client-1",
    projectId: "test-project-1",
    formType: "1120",
    taxYear: 2024,
    status: "in-progress",
    dueDate: "2025-03-15",
    filingMethod: "electronic",
    preparer: "staff@test.com",
    reviewer: "manager@test.com",
    estimatedRefund: 0,
    estimatedTax: 15_000,
  },
  {
    id: "test-form-2",
    clientId: "test-client-2",
    projectId: "test-project-2",
    formType: "1065",
    taxYear: 2024,
    status: "completed",
    dueDate: "2025-03-15",
    filingMethod: "electronic",
    preparer: "manager@test.com",
    reviewer: "admin@test.com",
    estimatedRefund: 2500,
    estimatedTax: 0,
    filedDate: "2024-11-20",
  },
] as const;

export const testDocuments = [
  {
    id: "test-doc-1",
    clientId: "test-client-1",
    projectId: "test-project-1",
    name: "W-2 Forms 2024",
    type: "tax-document",
    category: "income",
    uploadDate: "2024-11-15",
    size: 245_760, // bytes
    mimeType: "application/pdf",
    uploadedBy: "client@test.com",
    status: "processed",
    tags: ["w2", "2024", "income"],
  },
  {
    id: "test-doc-2",
    clientId: "test-client-1",
    projectId: "test-project-1",
    name: "1099 Miscellaneous Income",
    type: "tax-document",
    category: "income",
    uploadDate: "2024-11-18",
    size: 180_240,
    mimeType: "application/pdf",
    uploadedBy: "client@test.com",
    status: "pending-review",
    tags: ["1099", "2024", "misc"],
  },
  {
    id: "test-doc-3",
    clientId: "test-client-2",
    projectId: "test-project-2",
    name: "Business Expense Receipts",
    type: "supporting-document",
    category: "expenses",
    uploadDate: "2024-10-05",
    size: 5_242_880, // 5MB
    mimeType: "application/zip",
    uploadedBy: "staff@test.com",
    status: "processed",
    tags: ["expenses", "receipts", "business"],
  },
] as const;

export const testInvoices = [
  {
    id: "test-invoice-1",
    clientId: "test-client-1",
    projectId: "test-project-1",
    invoiceNumber: "INV-2024-001",
    issueDate: "2024-11-01",
    dueDate: "2024-12-01",
    status: "pending",
    subtotal: 6000,
    taxAmount: 480,
    totalAmount: 6480,
    items: [
      {
        description: "Tax preparation services",
        quantity: 40,
        rate: 150,
        amount: 6000,
      },
    ],
  },
  {
    id: "test-invoice-2",
    clientId: "test-client-2",
    projectId: "test-project-2",
    invoiceNumber: "INV-2024-002",
    issueDate: "2024-10-31",
    dueDate: "2024-11-30",
    status: "paid",
    subtotal: 3125,
    taxAmount: 250,
    totalAmount: 3375,
    paidDate: "2024-11-15",
    paymentMethod: "bank-transfer",
    items: [
      {
        description: "Payroll setup and management",
        quantity: 25,
        rate: 125,
        amount: 3125,
      },
    ],
  },
] as const;

export const testNotifications = [
  {
    id: "test-notif-1",
    userId: "staff@test.com",
    type: "task-assigned",
    title: "New Task Assigned",
    message: "You have been assigned to Q4 2024 Tax Filing project",
    isRead: false,
    createdAt: "2024-11-20T10:00:00Z",
    relatedEntityType: "project",
    relatedEntityId: "test-project-1",
  },
  {
    id: "test-notif-2",
    userId: "client@test.com",
    type: "document-uploaded",
    title: "Document Uploaded Successfully",
    message:
      "Your W-2 Forms 2024 document has been uploaded and is being processed",
    isRead: true,
    createdAt: "2024-11-15T14:30:00Z",
    relatedEntityType: "document",
    relatedEntityId: "test-doc-1",
  },
  {
    id: "test-notif-3",
    userId: "manager@test.com",
    type: "deadline-reminder",
    title: "Upcoming Deadline",
    message: "Q4 2024 Tax Filing is due in 7 days",
    isRead: false,
    createdAt: "2024-11-24T09:00:00Z",
    relatedEntityType: "project",
    relatedEntityId: "test-project-1",
  },
] as const;

export const testTimeEntries = [
  {
    id: "test-time-1",
    projectId: "test-project-1",
    userId: "staff@test.com",
    date: "2024-11-20",
    startTime: "09:00",
    endTime: "12:00",
    duration: 3, // hours
    description:
      "Reviewed client documents and prepared initial tax calculations",
    billable: true,
    rate: 150,
    tags: ["preparation", "review"],
  },
  {
    id: "test-time-2",
    projectId: "test-project-1",
    userId: "staff@test.com",
    date: "2024-11-21",
    startTime: "14:00",
    endTime: "17:30",
    duration: 3.5,
    description: "Completed tax form preparation and review",
    billable: true,
    rate: 150,
    tags: ["preparation", "forms"],
  },
  {
    id: "test-time-3",
    projectId: "test-project-2",
    userId: "manager@test.com",
    date: "2024-10-15",
    startTime: "10:00",
    endTime: "15:00",
    duration: 5,
    description: "Setup payroll system and conducted client training",
    billable: true,
    rate: 125,
    tags: ["setup", "training"],
  },
] as const;

/**
 * Generate test file content for document upload tests
 */
export function generateTestFile(
  name: string,
  content = "Test file content"
): File {
  const blob = new Blob([content], { type: "text/plain" });
  return new File([blob], name, { type: "text/plain" });
}

/**
 * Generate test PDF file for upload tests
 */
export function generateTestPDF(name: string): File {
  // Simple PDF content (minimal valid PDF structure)
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
184
%%EOF`;

  const blob = new Blob([pdfContent], { type: "application/pdf" });
  return new File([blob], name, { type: "application/pdf" });
}

/**
 * Mock API responses for testing
 */
export const mockAPIResponses = {
  auth: {
    login: {
      success: {
        user: testUsers.client,
        token: "mock-jwt-token",
        refreshToken: "mock-refresh-token",
        expiresIn: 3600,
      },
      failure: {
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      },
    },
    register: {
      success: {
        user: testUsers.client,
        token: "mock-jwt-token",
        message: "Registration successful",
      },
      failure: {
        error: "Email already exists",
        code: "EMAIL_EXISTS",
      },
    },
  },
  clients: {
    list: {
      success: {
        data: testClients,
        total: testClients.length,
        page: 1,
        limit: 10,
      },
    },
    create: {
      success: {
        data: testClients[0],
        message: "Client created successfully",
      },
    },
  },
  projects: {
    list: {
      success: {
        data: testProjects,
        total: testProjects.length,
        page: 1,
        limit: 10,
      },
    },
  },
  documents: {
    list: {
      success: {
        data: testDocuments,
        total: testDocuments.length,
        page: 1,
        limit: 10,
      },
    },
    upload: {
      success: {
        data: testDocuments[0],
        message: "Document uploaded successfully",
      },
    },
  },
  taxes: {
    calculate: {
      success: {
        taxableIncome: 50_000,
        federalTax: 8500,
        stateTax: 2500,
        totalTax: 11_000,
        effectiveRate: 0.22,
        marginalRate: 0.24,
        deductions: {
          standard: 13_850,
          itemized: 0,
          total: 13_850,
        },
      },
    },
  },
};

/**
 * Test environment configuration
 */
export const testConfig = {
  baseURL: "http://localhost:3001",
  apiURL: "http://localhost:3000",
  timeouts: {
    default: 30_000,
    navigation: 60_000,
    assertion: 10_000,
  },
  retries: {
    ci: 2,
    local: 0,
  },
  workers: {
    ci: 1,
    local: 4,
  },
} as const;
