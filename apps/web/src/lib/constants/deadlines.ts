/**
 * Guyana Public Holidays and Tax Deadlines for 2025
 * Used for due date calculations and deadline awareness
 */

export interface PublicHoliday {
  date: string;
  name: string;
  isObserved?: boolean;
}

export const GUYANA_PUBLIC_HOLIDAYS_2025: PublicHoliday[] = [
  { date: "2025-01-01", name: "New Year's Day" },
  { date: "2025-02-23", name: "Republic Day" },
  { date: "2025-03-14", name: "Phagwah/Holi" },
  { date: "2025-04-18", name: "Good Friday" },
  { date: "2025-04-21", name: "Easter Monday" },
  { date: "2025-05-01", name: "Labour Day" },
  { date: "2025-05-05", name: "Indian Arrival Day" },
  { date: "2025-05-26", name: "Independence Day" },
  { date: "2025-07-01", name: "CARICOM Day" },
  { date: "2025-08-01", name: "Emancipation Day" },
  { date: "2025-10-20", name: "Diwali" },
  { date: "2025-12-25", name: "Christmas Day" },
  { date: "2025-12-26", name: "Boxing Day" },
];

export interface TaxDeadline {
  id: string;
  name: string;
  frequency: "monthly" | "quarterly" | "annual" | "as-needed";
  dueDay?: number; // For monthly/quarterly
  dueDate?: string; // For annual (MM-DD)
  description: string;
  form?: string;
  agency: "GRA" | "NIS" | "DCRA";
}

export const TAX_DEADLINES: Record<string, TaxDeadline> = {
  // Monthly deadlines
  vat: {
    id: "vat",
    name: "VAT Return",
    frequency: "monthly",
    dueDay: 21, // 21st of following month
    description: "VAT Return (Form VAT-3) due by 21st of following month",
    form: "VAT-3",
    agency: "GRA",
  },
  paye: {
    id: "paye",
    name: "PAYE Return",
    frequency: "monthly",
    dueDay: 14, // 14th of following month
    description: "PAYE Return (Form 5) due by 14th of following month",
    form: "Form 5",
    agency: "GRA",
  },
  nis: {
    id: "nis",
    name: "NIS Contribution",
    frequency: "monthly",
    dueDay: 15, // 15th of following month
    description: "NIS Contribution due by 15th of following month",
    form: "NIS-C",
    agency: "NIS",
  },
  excise: {
    id: "excise",
    name: "Excise Tax Return",
    frequency: "monthly",
    dueDay: 21,
    description: "Excise Tax Return due by 21st of following month",
    form: "EX-1",
    agency: "GRA",
  },

  // Annual deadlines
  incomeTax: {
    id: "incomeTax",
    name: "Income Tax Return",
    frequency: "annual",
    dueDate: "04-30", // April 30th
    description: "Income Tax Return (Form 2) due by April 30th",
    form: "Form 2",
    agency: "GRA",
  },
  corporationTax: {
    id: "corporationTax",
    name: "Corporation Tax",
    frequency: "annual",
    dueDate: "04-30", // Or 3 months after year end
    description:
      "Corporation Tax due within 3 months of financial year end (default April 30)",
    form: "CT-1",
    agency: "GRA",
  },
  propertyTax: {
    id: "propertyTax",
    name: "Property Tax Return",
    frequency: "annual",
    dueDate: "03-31", // March 31st
    description: "Property Tax Return due by March 31st",
    form: "PT-1",
    agency: "GRA",
  },
  annualReturn: {
    id: "annualReturn",
    name: "Annual Return",
    frequency: "annual",
    dueDate: "03-31", // March 31st
    description: "Annual Return to Deeds Registry due by March 31st",
    form: "AR-1",
    agency: "DCRA",
  },
  nisCompliance: {
    id: "nisCompliance",
    name: "NIS Compliance Certificate",
    frequency: "annual",
    dueDate: "01-31", // January 31st for previous year
    description: "NIS Compliance Certificate renewal (valid 1 year)",
    form: "C100F72/A",
    agency: "NIS",
  },

  // As-needed deadlines
  tcc: {
    id: "tcc",
    name: "Tax Compliance Certificate",
    frequency: "as-needed",
    description: "Tax Compliance Certificate - valid for 1 year from issue",
    form: "TCC",
    agency: "GRA",
  },
  capitalGains: {
    id: "capitalGains",
    name: "Capital Gains Tax",
    frequency: "as-needed",
    description: "Capital Gains Tax due on disposal of assets",
    form: "CGT-1",
    agency: "GRA",
  },
  tenderCompliance: {
    id: "tenderCompliance",
    name: "Tender Compliance",
    frequency: "as-needed",
    description: "Tax compliance certificate for tender applications",
    form: "TC-1",
    agency: "GRA",
  },
  landTransfer: {
    id: "landTransfer",
    name: "Land Transfer Compliance",
    frequency: "as-needed",
    description: "Tax compliance for property transfers",
    form: "LT-1",
    agency: "GRA",
  },
};

export type DeadlineStatus = "overdue" | "urgent" | "soon" | "ok";

export interface DeadlineStatusInfo {
  status: DeadlineStatus;
  label: string;
  color: string;
  badgeVariant: "destructive" | "warning" | "secondary" | "default";
  daysUntilDue: number;
}

// Helper to check if a date is a public holiday
export function isPublicHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return GUYANA_PUBLIC_HOLIDAYS_2025.some((h) => h.date === dateStr);
}

// Helper to check if a date is a weekend
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

// Adjust date to next business day if it falls on weekend/holiday
export function adjustForHolidays(date: Date): Date {
  const adjustedDate = new Date(date);

  while (isWeekend(adjustedDate) || isPublicHoliday(adjustedDate)) {
    adjustedDate.setDate(adjustedDate.getDate() + 1);
  }

  return adjustedDate;
}

// Get next due date for a filing type
export function getNextDueDate(
  filingType: keyof typeof TAX_DEADLINES,
  period?: { month: number; year: number }
): Date {
  const deadline = TAX_DEADLINES[filingType];
  const today = new Date();

  if (deadline.frequency === "monthly" && deadline.dueDay) {
    // For monthly filings, due date is in the following month
    const targetMonth = period?.month ?? today.getMonth();
    const targetYear = period?.year ?? today.getFullYear();

    // Due date is dueDay of the following month
    let dueDate = new Date(targetYear, targetMonth + 1, deadline.dueDay);

    // Handle year rollover
    if (targetMonth === 11) {
      dueDate = new Date(targetYear + 1, 0, deadline.dueDay);
    }

    // Adjust for weekends/holidays
    return adjustForHolidays(dueDate);
  }

  if (deadline.frequency === "annual" && deadline.dueDate) {
    const [month, day] = deadline.dueDate.split("-").map(Number);
    const year = period?.year ?? today.getFullYear();

    let dueDate = new Date(year, month - 1, day);

    // If we've passed this date in current year, use next year
    if (dueDate < today && !period) {
      dueDate = new Date(year + 1, month - 1, day);
    }

    return adjustForHolidays(dueDate);
  }

  // For as-needed or unknown, return today
  return today;
}

// Calculate days until due
export function getDaysUntilDue(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Get due date status with badge info
export function getDueDateStatus(dueDate: Date): DeadlineStatusInfo {
  const days = getDaysUntilDue(dueDate);

  if (days < 0) {
    return {
      status: "overdue",
      label: `${Math.abs(days)} days overdue`,
      color: "text-destructive",
      badgeVariant: "destructive",
      daysUntilDue: days,
    };
  }

  if (days <= 3) {
    return {
      status: "urgent",
      label: days === 0 ? "Due today" : `Due in ${days} days`,
      color: "text-red-500",
      badgeVariant: "destructive",
      daysUntilDue: days,
    };
  }

  if (days <= 7) {
    return {
      status: "soon",
      label: `Due in ${days} days`,
      color: "text-orange-500",
      badgeVariant: "warning",
      daysUntilDue: days,
    };
  }

  if (days <= 14) {
    return {
      status: "soon",
      label: `Due in ${days} days`,
      color: "text-yellow-500",
      badgeVariant: "secondary",
      daysUntilDue: days,
    };
  }

  return {
    status: "ok",
    label: `Due in ${days} days`,
    color: "text-muted-foreground",
    badgeVariant: "default",
    daysUntilDue: days,
  };
}

// Get upcoming deadlines for a client's services
export function getUpcomingDeadlines(
  selectedServices: string[],
  daysAhead = 30
): Array<{ deadline: TaxDeadline; dueDate: Date; status: DeadlineStatusInfo }> {
  const deadlines: Array<{
    deadline: TaxDeadline;
    dueDate: Date;
    status: DeadlineStatusInfo;
  }> = [];

  // Map service types to deadline types
  const serviceDeadlineMap: Record<string, (keyof typeof TAX_DEADLINES)[]> = {
    VAT_RETURN: ["vat"],
    PAYE_FILING: ["paye"],
    NIS_SUBMISSION: ["nis"],
    CORPORATE_TAX: ["corporationTax"],
    INCOME_TAX: ["incomeTax"],
    PROPERTY_TAX: ["propertyTax"],
    EXCISE_TAX: ["excise"],
    ANNUAL_RETURN: ["annualReturn"],
  };

  for (const service of selectedServices) {
    const deadlineTypes = serviceDeadlineMap[service] ?? [];

    for (const type of deadlineTypes) {
      const deadline = TAX_DEADLINES[type];
      const dueDate = getNextDueDate(type);
      const status = getDueDateStatus(dueDate);

      if (status.daysUntilDue <= daysAhead) {
        deadlines.push({ deadline, dueDate, status });
      }
    }
  }

  // Sort by due date
  deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return deadlines;
}

// Format date for display
export function formatDeadlineDate(date: Date): string {
  return date.toLocaleDateString("en-GY", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
