/**
 * Test utilities and helper functions
 */

import type { PayrollEmployee } from "../../web/src/lib/tax-calculations";

/**
 * Clean up test data (implementation varies based on test type)
 */
export async function cleanupTestData(): Promise<void> {
  // For unit tests, this might just reset mocks
  vi.clearAllMocks();
}

/**
 * Generate test employee data for payroll calculations
 */
export function createTestEmployee(
  overrides: Partial<PayrollEmployee> = {}
): PayrollEmployee {
  return {
    id: `emp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    firstName: "John",
    lastName: "Doe",
    nisNumber: "123456789",
    basicSalary: 150_000,
    overtime: 20_000,
    allowances: 15_000,
    bonuses: 10_000,
    dependents: 2,
    ...overrides,
  };
}

/**
 * Generate multiple test employees
 */
export function createTestEmployees(
  count: number,
  overrides: Partial<PayrollEmployee> = {}
): PayrollEmployee[] {
  return Array.from({ length: count }, (_, index) =>
    createTestEmployee({
      ...overrides,
      id: `emp-${Date.now()}-${index}`,
      firstName: `Employee${index + 1}`,
      lastName: "Test",
    })
  );
}

/**
 * Test data factory for organizations
 */
export function createTestOrganizationData(overrides = {}) {
  return {
    name: `Test Organization ${Date.now()}`,
    subdomain: `test-${Date.now()}`,
    settings: {
      timezone: "America/Guyana",
      currency: "GYD",
      fiscalYearStart: "01-01",
    },
    metadata: {},
    ...overrides,
  };
}

/**
 * Test data factory for users
 */
export function createTestUserData(overrides = {}) {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@example.com`,
    firstName: "Test",
    lastName: "User",
    role: "STAFF",
    isActive: true,
    emailVerified: true,
    ...overrides,
  };
}

/**
 * Test data factory for clients
 */
export function createTestClientData(overrides = {}) {
  const timestamp = Date.now();
  return {
    firstName: "Test",
    lastName: "Client",
    email: `client-${timestamp}@example.com`,
    phone: "+592-555-0123",
    nisNumber: "A12345678",
    tinNumber: "123456789",
    dateOfBirth: new Date("1985-06-15"),
    address: {
      street: "123 Main Street",
      city: "Georgetown",
      country: "Guyana",
      postalCode: "00001",
    },
    status: "ACTIVE",
    clientType: "INDIVIDUAL",
    ...overrides,
  };
}

/**
 * Test data factory for documents
 */
export function createTestDocumentData(overrides = {}) {
  return {
    title: "Test Document",
    description: "A test document for testing purposes",
    type: "PASSPORT",
    status: "PENDING_REVIEW",
    metadata: {
      uploadedBy: "test-user",
      fileSize: 1_024_000,
      mimeType: "application/pdf",
    },
    ...overrides,
  };
}

/**
 * Generate test tax calculation scenarios
 */
export const TAX_TEST_SCENARIOS = {
  LOW_INCOME: {
    description: "Low income employee under statutory threshold",
    employee: createTestEmployee({
      basicSalary: 100_000,
      overtime: 0,
      allowances: 0,
      bonuses: 0,
      dependents: 0,
    }),
    expectedResults: {
      totalPAYETax: 0,
      netPay: 94_400, // 100k - 5.6% NIS
    },
  },

  MIDDLE_INCOME: {
    description: "Middle income employee with standard deductions",
    employee: createTestEmployee({
      basicSalary: 200_000,
      overtime: 30_000,
      allowances: 20_000,
      bonuses: 0,
      dependents: 2,
    }),
    expectedResults: {
      // Calculations based on 2025 Guyana tax rules
      totalPAYETax: 11_000, // Approximate
      netPay: 221_320, // Approximate after tax and NIS
    },
  },

  HIGH_INCOME: {
    description: "High income employee hitting tax ceiling",
    employee: createTestEmployee({
      basicSalary: 500_000,
      overtime: 100_000,
      allowances: 50_000,
      bonuses: 50_000,
      dependents: 3,
    }),
    expectedResults: {
      // Will hit multiple tax bands
      totalPAYETax: 147_500, // Approximate for high earner
      netPay: 536_820, // After max NIS and calculated tax
    },
  },

  OVERTIME_SCENARIOS: {
    description: "Employee with significant overtime (tax-free portion)",
    employee: createTestEmployee({
      basicSalary: 180_000,
      overtime: 80_000, // 50k tax-free, 30k taxable
      allowances: 10_000,
      bonuses: 0,
      dependents: 1,
    }),
  },
};

/**
 * RBAC test scenarios
 */
export const RBAC_TEST_SCENARIOS = {
  SUPER_ADMIN: {
    role: "SUPER_ADMIN",
    shouldHaveAccess: [
      "clients:delete",
      "users:manage_roles",
      "system:admin",
      "financials:audit",
    ],
    shouldNotHaveAccess: [], // Super admin has all permissions
  },

  STAFF: {
    role: "STAFF",
    shouldHaveAccess: [
      "clients:read",
      "clients:write",
      "documents:read",
      "documents:write",
    ],
    shouldNotHaveAccess: ["users:delete", "system:admin", "financials:audit"],
  },

  CLIENT: {
    role: "CLIENT",
    shouldHaveAccess: [
      "clients:read", // Own data only
      "documents:read", // Own documents only
    ],
    shouldNotHaveAccess: [
      "clients:write",
      "users:read",
      "system:read",
      "financials:write",
    ],
  },

  VIEWER: {
    role: "VIEWER",
    shouldHaveAccess: ["clients:read", "documents:read", "reports:read"],
    shouldNotHaveAccess: [
      "clients:write",
      "documents:write",
      "users:write",
      "system:admin",
    ],
  },
};

/**
 * Wait for condition helper for async tests
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Generate realistic test file data
 */
export function createTestFileData(overrides = {}) {
  return {
    filename: "test-document.pdf",
    mimetype: "application/pdf",
    size: 1_024_000,
    buffer: Buffer.from("Mock PDF content"),
    ...overrides,
  };
}

/**
 * Mock HTTP request object for testing
 */
export function createMockRequest(overrides = {}) {
  return {
    method: "GET",
    url: "/api/test",
    headers: {},
    body: null,
    params: {},
    query: {},
    user: null,
    organization: null,
    ...overrides,
  };
}

/**
 * Mock HTTP response object for testing
 */
export function createMockResponse() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };

  return response;
}

/**
 * Error scenarios for testing error handling
 */
export const ERROR_SCENARIOS = {
  VALIDATION_ERROR: {
    name: "ValidationError",
    message: "Invalid input data",
    status: 400,
  },
  UNAUTHORIZED: {
    name: "UnauthorizedError",
    message: "Authentication required",
    status: 401,
  },
  FORBIDDEN: {
    name: "ForbiddenError",
    message: "Insufficient permissions",
    status: 403,
  },
  NOT_FOUND: {
    name: "NotFoundError",
    message: "Resource not found",
    status: 404,
  },
  INTERNAL_ERROR: {
    name: "InternalError",
    message: "Internal server error",
    status: 500,
  },
};
