/**
 * Skip links component for keyboard navigation accessibility
 * Provides quick navigation to main content areas
 */
export default function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        className="-translate-y-1 absolute top-1 left-1 z-[9999] scale-95 rounded bg-primary px-3 py-2 text-primary-foreground transition-transform focus:translate-y-0 focus:scale-100"
        href="#main-content"
      >
        Skip to main content
      </a>
      <a
        className="-translate-y-1 absolute top-12 left-1 z-[9999] scale-95 rounded bg-primary px-3 py-2 text-primary-foreground transition-transform focus:translate-y-0 focus:scale-100"
        href="#main-navigation"
      >
        Skip to navigation
      </a>
    </div>
  );
}
