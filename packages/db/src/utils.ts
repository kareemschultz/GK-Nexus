import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/**
 * Hash a password using scrypt (same method as better-auth)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
}

/**
 * Generate a unique ID for database records
 */
export function generateId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Generate a unique event ID for audit logging
 */
export function generateEventId(): string {
  return `evt_${randomBytes(12).toString("hex")}`;
}

/**
 * Generate a correlation ID for tracking related operations
 */
export function generateCorrelationId(): string {
  return `corr_${randomBytes(12).toString("hex")}`;
}

/**
 * Generate organization slug from name
 */
export function generateOrgSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

/**
 * Validate TIN number format for Guyana (9 digits)
 */
export function validateTinNumber(tin: string): boolean {
  const tinPattern = /^\d{9}$/;
  return tinPattern.test(tin.replace(/\s|-/g, ""));
}

/**
 * Format TIN number for display
 */
export function formatTinNumber(tin: string): string {
  const cleaned = tin.replace(/\s|-/g, "");
  if (cleaned.length === 9) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  return tin;
}

/**
 * Validate NIS number format for Guyana
 */
export function validateNisNumber(nis: string): boolean {
  const nisPattern = /^\d{8}$/;
  return nisPattern.test(nis.replace(/\s|-/g, ""));
}

/**
 * Format NIS number for display
 */
export function formatNisNumber(nis: string): string {
  const cleaned = nis.replace(/\s|-/g, "");
  if (cleaned.length === 8) {
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 5)}-${cleaned.substring(5)}`;
  }
  return nis;
}

/**
 * Calculate tax year from date
 */
export function getTaxYear(date: Date = new Date()): number {
  return date.getFullYear();
}

/**
 * Get tax period string (YYYY-MM format)
 */
export function getTaxPeriod(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get tax quarter from date
 */
export function getTaxQuarter(date: Date = new Date()): number {
  const month = date.getMonth() + 1;
  return Math.ceil(month / 3);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Generate client number with prefix
 */
export function generateClientNumber(prefix = "CL"): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Sanitize text input for database storage
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Check if date is within business hours (Guyana time)
 */
export function isBusinessHours(date: Date = new Date()): boolean {
  const hour = date.getHours();
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Business hours: Monday-Friday, 8 AM to 5 PM
  return day >= 1 && day <= 5 && hour >= 8 && hour < 17;
}

/**
 * Convert amount to words for Guyana Dollar
 */
export function convertAmountToWords(amount: number): string {
  if (amount === 0) return "Zero Guyana Dollars";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertHundreds(num: number): string {
    let result = "";

    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        result += " " + ones[num % 10];
      }
    } else if (num >= 10) {
      result += teens[num - 10];
    } else if (num > 0) {
      result += ones[num];
    }

    return result.trim();
  }

  let dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);

  let result = "";

  if (dollars >= 1_000_000) {
    result += convertHundreds(Math.floor(dollars / 1_000_000)) + " Million ";
    dollars %= 1_000_000;
  }

  if (dollars >= 1000) {
    result += convertHundreds(Math.floor(dollars / 1000)) + " Thousand ";
    dollars %= 1000;
  }

  if (dollars > 0) {
    result += convertHundreds(dollars);
  }

  result += " Guyana Dollar" + (Math.floor(amount) !== 1 ? "s" : "");

  if (cents > 0) {
    result +=
      " and " + convertHundreds(cents) + " Cent" + (cents !== 1 ? "s" : "");
  }

  return result.trim();
}

/**
 * Database connection health check utilities
 */
export const dbHealth = {
  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      // This would be implemented with actual database connection
      // For now, returns true as placeholder
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get database metrics
   */
  async getMetrics() {
    return {
      connections: 0, // Would be populated from actual DB
      uptime: 0,
      queryCount: 0,
      avgResponseTime: 0,
    };
  },
};

/**
 * Audit logging utilities
 */
export const auditUtils = {
  /**
   * Create audit context for database operations
   */
  createContext(userId: string, organizationId?: string, sessionId?: string) {
    return {
      userId,
      organizationId,
      sessionId,
      timestamp: new Date(),
      correlationId: generateCorrelationId(),
    };
  },

  /**
   * Format audit description
   */
  formatDescription(
    action: string,
    entity: string,
    entityName?: string
  ): string {
    return `${action} ${entity}${entityName ? ` "${entityName}"` : ""}`;
  },
};

/**
 * Organization management utilities
 */
export const orgUtils = {
  /**
   * Generate organization ID with prefix
   */
  generateOrgId(): string {
    return `org_${randomBytes(12).toString("hex")}`;
  },

  /**
   * Validate organization slug availability
   */
  validateSlugFormat(slug: string): boolean {
    const slugPattern = /^[a-z0-9-]{3,50}$/;
    return slugPattern.test(slug);
  },
};

/**
 * User management utilities
 */
export const userUtils = {
  /**
   * Generate user ID with prefix
   */
  generateUserId(): string {
    return `usr_${randomBytes(12).toString("hex")}`;
  },

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push("Password must be at least 8 characters long");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Include at least one uppercase letter");

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Include at least one lowercase letter");

    if (/\d/.test(password)) score += 1;
    else feedback.push("Include at least one number");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push("Include at least one special character");

    return {
      isValid: score >= 4,
      score,
      feedback,
    };
  },
};

/**
 * Tax calculation utilities
 */
export const taxUtils = {
  /**
   * Calculate PAYE tax for Guyana (2025 rates)
   */
  calculatePAYE(
    grossIncome: number,
    period: "monthly" | "annually" = "monthly"
  ): {
    taxableIncome: number;
    tax: number;
    netIncome: number;
  } {
    // 2025 Guyana PAYE rates and thresholds
    const personalAllowance = period === "monthly" ? 65_000 : 780_000; // GYD 780,000 annually
    const taxableIncome = Math.max(0, grossIncome - personalAllowance);

    let tax = 0;
    const monthlyThreshold1 = 10_000; // First GYD 10,000 at 28%
    const monthlyThreshold2 = 15_000; // Next GYD 15,000 at 30%
    // Above GYD 25,000 at 40%

    const threshold1 =
      period === "monthly" ? monthlyThreshold1 : monthlyThreshold1 * 12;
    const threshold2 =
      period === "monthly" ? monthlyThreshold2 : monthlyThreshold2 * 12;

    if (taxableIncome > 0) {
      // First bracket: 28%
      const bracket1 = Math.min(taxableIncome, threshold1);
      tax += bracket1 * 0.28;

      if (taxableIncome > threshold1) {
        // Second bracket: 30%
        const bracket2 = Math.min(taxableIncome - threshold1, threshold2);
        tax += bracket2 * 0.3;

        if (taxableIncome > threshold1 + threshold2) {
          // Third bracket: 40%
          const bracket3 = taxableIncome - threshold1 - threshold2;
          tax += bracket3 * 0.4;
        }
      }
    }

    return {
      taxableIncome,
      tax: Math.round(tax),
      netIncome: grossIncome - Math.round(tax),
    };
  },

  /**
   * Calculate NIS contribution for Guyana
   */
  calculateNIS(
    grossIncome: number,
    period: "monthly" | "annually" = "monthly"
  ): {
    insurableEarnings: number;
    employeeContribution: number;
    employerContribution: number;
    totalContribution: number;
  } {
    // NIS contribution rate: 5.6% employee + 8.4% employer = 14% total
    const maxInsurable = period === "monthly" ? 200_000 : 2_400_000; // GYD 2.4M annually
    const insurableEarnings = Math.min(grossIncome, maxInsurable);

    const employeeContribution = Math.round(insurableEarnings * 0.056);
    const employerContribution = Math.round(insurableEarnings * 0.084);

    return {
      insurableEarnings,
      employeeContribution,
      employerContribution,
      totalContribution: employeeContribution + employerContribution,
    };
  },

  /**
   * Calculate VAT for Guyana
   */
  calculateVAT(
    amount: number,
    rate = 0.125
  ): {
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  } {
    const vatAmount = Math.round(amount * rate);

    return {
      netAmount: amount,
      vatAmount,
      grossAmount: amount + vatAmount,
    };
  },
};
