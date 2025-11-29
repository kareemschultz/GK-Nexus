// Core tax calculation components

// Type exports for component props
export type {
  PayeCalculationResult,
  PayrollEmployee,
} from "@/lib/tax-calculations";
export { ClientTaxStatusCards } from "./client-tax-status-cards";
export { EnhancedPayeCalculator } from "./enhanced-paye-calculator";
export { EnhancedVatCalculator } from "./enhanced-vat-calculator";
// Loading states and skeletons
export {
  CalculationResultsSkeleton,
  ClientTaxStatusCardsSkeleton,
  FormFieldSkeleton,
  FormSectionSkeleton,
  RecentCalculationsHistorySkeleton,
  TaxCalculationEmptyState,
  TaxCalculationErrorState,
  TaxCalculatorSkeleton,
  TaxDashboardSkeleton,
  TaxDeadlineWidgetSkeleton,
  TaxQuickActionsSkeleton,
} from "./loading-skeleton";
export { RecentCalculationsHistory } from "./recent-calculations-history";
// Dashboard widgets and components
export { TaxDeadlineWidgets } from "./tax-deadline-widgets";
export {
  ClientManagementActions,
  TaxCalculatorActions,
  TaxQuickActions,
} from "./tax-quick-actions";

// Component configuration types
export interface TaxCalculatorConfig {
  enablePDFExport?: boolean;
  showAdvancedFeatures?: boolean;
  enableAdvancedValidation?: boolean;
  showDetailedBreakdown?: boolean;
}

export interface TaxDashboardConfig {
  showQuickActions?: boolean;
  showDeadlineWidgets?: boolean;
  showClientStatus?: boolean;
  showRecentCalculations?: boolean;
  enableRealTimeUpdates?: boolean;
}

// Accessibility and responsive design utilities
export const TAX_COMPONENT_CLASSES = {
  // Responsive grid layouts
  responsiveGrid:
    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
  responsiveTwoColumn: "grid grid-cols-1 lg:grid-cols-2 gap-6",

  // Mobile-first spacing
  sectionSpacing: "space-y-4 md:space-y-6",
  cardPadding: "p-4 md:p-6",

  // Accessible focus states
  focusRing:
    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  focusVisible:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",

  // Touch-friendly sizes (minimum 44px for touch targets)
  touchTarget: "min-h-[44px] min-w-[44px]",

  // Text size scaling
  headingScale: "text-lg md:text-xl lg:text-2xl",
  bodyScale: "text-sm md:text-base",

  // High contrast for accessibility
  highContrast:
    "contrast-more:text-black contrast-more:border-black dark:contrast-more:text-white dark:contrast-more:border-white",
} as const;

// ARIA labels and descriptions for tax components
export const TAX_ARIA_LABELS = {
  payeCalculator: "PAYE tax calculator form",
  vatCalculator: "VAT tax calculator form",
  taxDeadlines: "Tax deadline notifications",
  clientStatus: "Client tax compliance status overview",
  recentCalculations: "Recent tax calculations history",
  quickActions: "Quick access to tax operations",

  // Form fields
  grossSalary: "Employee gross salary input",
  nisNumber: "National Insurance Scheme number input",
  vatRegistration: "VAT registration number input",

  // Results
  calculationResults: "Tax calculation results and breakdown",
  netPay: "Final net pay amount after deductions",
  vatDue: "Total VAT amount due to GRA",

  // Actions
  calculateButton: "Calculate tax amount",
  exportPDF: "Export calculation as PDF report",
  saveCalculation: "Save calculation to records",
} as const;

// Mobile responsive breakpoints used in tax components
export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Accessibility configuration
export const A11Y_CONFIG = {
  // Color contrast ratios
  minimumContrast: 4.5, // WCAG AA standard
  enhancedContrast: 7.0, // WCAG AAA standard

  // Animation preferences
  respectsReducedMotion: true,
  animationDuration: 200, // milliseconds

  // Focus management
  skipLinksEnabled: true,
  focusTrapping: true,

  // Screen reader support
  announceChanges: true,
  liveRegions: true,

  // Keyboard navigation
  tabOrderLogical: true,
  keyboardShortcuts: {
    calculate: "Enter",
    export: "Ctrl+E",
    save: "Ctrl+S",
    print: "Ctrl+P",
  },
} as const;

// Form validation configuration for accessibility
export const FORM_VALIDATION_CONFIG = {
  // Real-time validation
  validateOnChange: true,
  validateOnBlur: true,

  // Error handling
  showInlineErrors: true,
  showSummaryErrors: true,
  focusFirstError: true,

  // Success feedback
  showSuccessMessages: true,
  announceSuccess: true,

  // Loading states
  showLoadingStates: true,
  disableFormDuringSubmission: true,
} as const;

// Mobile-specific configuration
export const MOBILE_CONFIG = {
  // Touch interaction
  touchFeedback: true,
  hapticFeedback: false, // Device dependent

  // Viewport
  preventZoom: false, // Allow zooming for accessibility
  responsiveText: true,

  // Input optimization
  appropriateKeyboards: true, // number inputs show numeric keyboard
  autoComplete: true,

  // Performance
  lazyLoadImages: true,
  progressiveEnhancement: true,
} as const;

// Performance monitoring for tax components
export const PERFORMANCE_CONFIG = {
  // Calculation timing
  maxCalculationTime: 5000, // 5 seconds
  showLoadingAfter: 500, // 0.5 seconds

  // Bundle size optimization
  lazyLoadComponents: true,
  splitChunks: true,

  // Caching
  cacheCalculations: true,
  cacheDuration: 300_000, // 5 minutes
} as const;
