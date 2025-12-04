/**
 * Validation and Formatting Utilities for Guyana-specific IDs
 * Handles TIN, NIS, VAT, Phone, National ID, Passport, etc.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  formatted?: string;
}

export interface FormatterResult {
  formatted: string;
  isValid: boolean;
  error?: string;
}

// ============================================
// Guyana Format Patterns
// ============================================

export const GUYANA_FORMATS = {
  phone: {
    pattern: /^(\+592)?[-\s]?(\d{3})[-\s]?(\d{4})$/,
    format: "+592-XXX-XXXX",
    example: "+592-123-4567",
    description: "Guyanese phone number with country code",
  },
  tin: {
    pattern: /^(\d{3})[-\s]?(\d{3})[-\s]?(\d{3})$/,
    format: "XXX-XXX-XXX",
    example: "123-456-789",
    description: "Tax Identification Number (9 digits)",
  },
  nis: {
    pattern: /^([A-Z])[-\s]?(\d{6})$/,
    format: "A-XXXXXX",
    example: "A-123456",
    description: "National Insurance Scheme number",
  },
  nationalId: {
    pattern: /^\d{9}$/,
    format: "XXXXXXXXX",
    example: "144123456",
    description: "9-digit National ID number",
  },
  vat: {
    pattern: /^[V][-\s]?(\d{6,8})$/,
    format: "V-XXXXXX",
    example: "V-123456",
    description: "VAT registration number",
  },
  businessReg: {
    pattern: /^[C][-\s]?(\d{5,7})$/,
    format: "C-XXXXX",
    example: "C-12345",
    description: "Business registration number",
  },
  passport: {
    pattern: /^[A-Z]\d{7}$/,
    format: "XXXXXXXX",
    example: "R0712345",
    description: "Passport number (1 letter + 7 digits)",
  },
} as const;

// ============================================
// TIN Validation & Formatting
// ============================================

export function validateTIN(tin: string): ValidationResult {
  if (!tin) {
    return { valid: false, error: "TIN is required" };
  }

  // Remove any spaces or dashes for validation
  const cleaned = tin.replace(/[-\s]/g, "");

  // Should be 9 digits
  if (!/^\d{9}$/.test(cleaned)) {
    return { valid: false, error: "TIN must be exactly 9 digits" };
  }

  return { valid: true, formatted: formatTIN(cleaned).formatted };
}

export function formatTIN(input: string): FormatterResult {
  if (!input) return { formatted: "", isValid: false };

  const cleaned = input.replace(/\D/g, "");

  if (cleaned.length > 9) {
    return { formatted: input, isValid: false, error: "TIN must be 9 digits" };
  }

  let formatted = cleaned;
  if (cleaned.length > 6) {
    formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length > 3) {
    formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }

  return {
    formatted,
    isValid: cleaned.length === 9,
    error:
      cleaned.length > 0 && cleaned.length !== 9
        ? "TIN must be exactly 9 digits"
        : undefined,
  };
}

// ============================================
// Phone Validation & Formatting
// ============================================

export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { valid: false, error: "Phone number is required" };
  }

  const cleaned = phone.replace(/[-\s+()]/g, "");

  // Valid Guyana number formats:
  // 7 digits (local), 10 digits (592 + 7), 11 digits (+592 + 7)
  if (/^592\d{7}$/.test(cleaned) || /^\d{7}$/.test(cleaned)) {
    return { valid: true, formatted: formatPhone(cleaned).formatted };
  }

  return { valid: false, error: "Invalid Guyana phone number (+592-XXX-XXXX)" };
}

export function formatPhone(input: string): FormatterResult {
  if (!input) return { formatted: "", isValid: false };

  // Remove all non-numeric characters except + at the start
  const cleaned = input.replace(/[^\d+]/g, "");
  let formatted = "";
  let isValid = false;

  if (cleaned.startsWith("+592")) {
    const digits = cleaned.slice(4);
    if (digits.length <= 7) {
      formatted = `+592-${digits.slice(0, 3)}${digits.length > 3 ? `-${digits.slice(3)}` : ""}`;
      isValid = digits.length === 7;
    }
  } else if (cleaned.startsWith("592")) {
    const digits = cleaned.slice(3);
    if (digits.length <= 7) {
      formatted = `+592-${digits.slice(0, 3)}${digits.length > 3 ? `-${digits.slice(3)}` : ""}`;
      isValid = digits.length === 7;
    }
  } else {
    // Local number
    if (cleaned.length <= 7) {
      formatted = `${cleaned.slice(0, 3)}${cleaned.length > 3 ? `-${cleaned.slice(3)}` : ""}`;
      if (cleaned.length === 7) {
        formatted = `+592-${formatted}`;
        isValid = true;
      }
    }
  }

  return {
    formatted,
    isValid,
    error:
      !isValid && input.length > 0
        ? "Please enter a valid Guyanese phone number"
        : undefined,
  };
}

// ============================================
// NIS Number Validation & Formatting
// ============================================

export function validateNISNumber(nis: string): ValidationResult {
  if (!nis) {
    return { valid: true }; // Optional field
  }

  const cleaned = nis.replace(/[-\s]/g, "").toUpperCase();

  if (!/^[A-Z]\d{6}$/.test(cleaned)) {
    return {
      valid: false,
      error: "NIS format: A-123456 (1 letter + 6 digits)",
    };
  }

  return { valid: true, formatted: formatNIS(cleaned).formatted };
}

export function formatNIS(input: string): FormatterResult {
  if (!input) return { formatted: "", isValid: false };

  const cleaned = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  if (cleaned.length > 7) {
    return {
      formatted: input,
      isValid: false,
      error: "NIS must be 1 letter followed by 6 digits",
    };
  }

  let formatted = cleaned;
  if (cleaned.length > 1) {
    formatted = `${cleaned.charAt(0)}-${cleaned.slice(1)}`;
  }

  const isValid = /^[A-Z]-\d{6}$/.test(formatted);

  return {
    formatted,
    isValid,
    error: cleaned.length > 0 && !isValid ? "NIS format: A-123456" : undefined,
  };
}

// ============================================
// VAT Number Validation & Formatting
// ============================================

export function validateVATNumber(vat: string): ValidationResult {
  if (!vat) {
    return { valid: true }; // Optional field
  }

  const cleaned = vat.replace(/[-\s]/g, "").toUpperCase();

  if (!/^V\d{6,8}$/.test(cleaned)) {
    return { valid: false, error: "VAT format: V-123456" };
  }

  return { valid: true, formatted: formatVAT(cleaned).formatted };
}

export function formatVAT(input: string): FormatterResult {
  if (!input) return { formatted: "", isValid: false };

  const cleaned = input.replace(/[^V0-9]/gi, "").toUpperCase();

  if (cleaned.length > 9) {
    return { formatted: input, isValid: false, error: "VAT format: V-123456" };
  }

  let formatted = cleaned;
  if (cleaned.startsWith("V") && cleaned.length > 1) {
    formatted = `V-${cleaned.slice(1)}`;
  }

  const isValid = /^V-\d{6,8}$/.test(formatted);

  return {
    formatted,
    isValid,
    error: cleaned.length > 0 && !isValid ? "VAT format: V-123456" : undefined,
  };
}

// ============================================
// Email Validation
// ============================================

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true };
}

// ============================================
// National ID Validation & Formatting
// ============================================

export function validateNationalId(id: string): ValidationResult {
  if (!id) {
    return { valid: true }; // Optional field
  }

  const cleaned = id.replace(/\D/g, "");

  if (cleaned.length !== 9) {
    return { valid: false, error: "National ID must be exactly 9 digits" };
  }

  return { valid: true, formatted: cleaned };
}

export function formatNationalId(input: string): FormatterResult {
  if (!input) return { formatted: "", isValid: false };

  const cleaned = input.replace(/\D/g, "");

  if (cleaned.length > 9) {
    return {
      formatted: input,
      isValid: false,
      error: "National ID must be 9 digits",
    };
  }

  return {
    formatted: cleaned,
    isValid: cleaned.length === 9,
    error:
      cleaned.length > 0 && cleaned.length !== 9
        ? "National ID must be exactly 9 digits"
        : undefined,
  };
}

// ============================================
// Business Registration Validation & Formatting
// ============================================

export function validateBusinessReg(reg: string): ValidationResult {
  if (!reg) {
    return { valid: true }; // Optional field
  }

  const cleaned = reg.replace(/[-\s]/g, "").toUpperCase();

  if (!/^C\d{5,7}$/.test(cleaned)) {
    return { valid: false, error: "Business registration format: C-12345" };
  }

  return { valid: true, formatted: formatBusinessReg(cleaned).formatted };
}

export function formatBusinessReg(input: string): FormatterResult {
  if (!input) return { formatted: "", isValid: false };

  const cleaned = input.replace(/[^C0-9]/gi, "").toUpperCase();

  if (cleaned.length > 8) {
    return {
      formatted: input,
      isValid: false,
      error: "Business registration format: C-12345",
    };
  }

  let formatted = cleaned;
  if (cleaned.startsWith("C") && cleaned.length > 1) {
    formatted = `C-${cleaned.slice(1)}`;
  }

  const isValid = /^C-\d{5,7}$/.test(formatted);

  return {
    formatted,
    isValid,
    error:
      cleaned.length > 0 && !isValid
        ? "Business registration format: C-12345"
        : undefined,
  };
}

// ============================================
// Passport Validation & Formatting
// ============================================

export function validatePassport(passport: string): ValidationResult {
  if (!passport) {
    return { valid: true }; // Optional field
  }

  const cleaned = passport.replace(/[-\s]/g, "").toUpperCase();

  if (!/^[A-Z]\d{7}$/.test(cleaned)) {
    return {
      valid: false,
      error: "Passport format: R0712345 (1 letter + 7 digits)",
    };
  }

  return { valid: true, formatted: cleaned };
}

export function formatPassport(input: string): FormatterResult {
  if (!input) return { formatted: "", isValid: false };

  const cleaned = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  if (cleaned.length > 8) {
    return {
      formatted: input,
      isValid: false,
      error: "Passport format: R0712345",
    };
  }

  const isValid = /^[A-Z]\d{7}$/.test(cleaned);

  return {
    formatted: cleaned,
    isValid,
    error:
      cleaned.length > 0 && !isValid
        ? "Passport format: R0712345 (1 letter + 7 digits)"
        : undefined,
  };
}

// ============================================
// Auto-format based on ID type
// ============================================

export function autoFormatById(idType: string, input: string): FormatterResult {
  switch (idType) {
    case "National ID":
      return formatNationalId(input);
    case "TIN":
      return formatTIN(input);
    case "NIS":
      return formatNIS(input);
    case "VAT":
      return formatVAT(input);
    case "Business Registration":
      return formatBusinessReg(input);
    case "Passport":
      return formatPassport(input);
    case "Phone":
      return formatPhone(input);
    default:
      return { formatted: input, isValid: true };
  }
}

// ============================================
// Get format helper info
// ============================================

export function getFormatExample(idType: string): string {
  const formatKey = idType
    .toLowerCase()
    .replace(/[^a-z]/g, "") as keyof typeof GUYANA_FORMATS;
  return GUYANA_FORMATS[formatKey]?.example ?? "";
}

export function getFormatDescription(idType: string): string {
  const formatKey = idType
    .toLowerCase()
    .replace(/[^a-z]/g, "") as keyof typeof GUYANA_FORMATS;
  return GUYANA_FORMATS[formatKey]?.description ?? "";
}
