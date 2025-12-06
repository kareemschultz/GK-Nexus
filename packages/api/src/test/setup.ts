/**
 * Test setup for API unit tests
 */

import { afterAll, afterEach, beforeAll, expect, vi } from "vitest";
import { cleanupTestData } from "./test-helpers";

// Global test configuration
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    "postgres://test:test@localhost:5432/gk_nexus_test";

  // Disable external API calls in tests
  process.env.DISABLE_EXTERNAL_APIS = "true";
});

afterEach(async () => {
  // Clean up test data after each test
  await cleanupTestData();
});

afterAll(async () => {
  // Global cleanup
});

// Mock external services for unit tests
vi.mock("@GK-Nexus/auth", () => ({
  auth: {
    getUserFromRequest: vi.fn(),
    verifySession: vi.fn(),
  },
}));

// Extend expect with custom matchers
expect.extend({
  toBeValidGuyanaAmount(received: number) {
    const isValid =
      Number.isFinite(received) &&
      received >= 0 &&
      Number(received.toFixed(2)) === received;
    return {
      message: () =>
        `expected ${received} to be a valid Guyana amount (non-negative, max 2 decimal places)`,
      pass: isValid,
    };
  },

  toMatchNISFormat(received: string) {
    const cleaned = received.replace(/[^A-Z0-9]/gi, "");
    const isValid = cleaned.length === 9 && /^[A-Z0-9]{9}$/i.test(cleaned);
    return {
      message: () =>
        `expected ${received} to match NIS number format (9 alphanumeric characters)`,
      pass: isValid,
    };
  },
});

// Declare custom matchers for TypeScript
declare module "vitest" {
  interface Assertion {
    toBeValidGuyanaAmount(): void;
    toMatchNISFormat(): void;
  }
  interface AsymmetricMatchersContaining {
    toBeValidGuyanaAmount(): unknown;
    toMatchNISFormat(): unknown;
  }
}
