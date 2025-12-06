import { type RenderResult, render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactElement } from "react";
import { expect } from "vitest";

// Extend Vitest matchers with jest-axe
declare module "vitest" {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): unknown;
  }
}

// Extend Vitest expect with jest-axe matchers
expect.extend(toHaveNoViolations);

/**
 * Test a component for accessibility violations using axe-core
 */
export const testA11y = async (component: ReactElement): Promise<void> => {
  const { container } = render(component);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

/**
 * Test a component with custom axe configuration
 */
export const testA11yWithConfig = async (
  component: ReactElement,
  config?: Record<string, unknown>
): Promise<void> => {
  const { container } = render(component);
  const results = await axe(container, config);
  expect(results).toHaveNoViolations();
};

/**
 * Test keyboard navigation for a component
 */
export const testKeyboardNavigation = (
  renderResult: RenderResult
): {
  focusableElements: NodeListOf<Element>;
  getFirstFocusable: () => HTMLElement | undefined;
  getLastFocusable: () => HTMLElement | undefined;
} => {
  const focusableElements = renderResult.container.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  );

  return {
    focusableElements,
    getFirstFocusable: () => focusableElements[0] as HTMLElement | undefined,
    getLastFocusable: () =>
      focusableElements[focusableElements.length - 1] as
        | HTMLElement
        | undefined,
  };
};

/**
 * Check if element has proper ARIA labels
 */
export const hasAriaLabel = (element: HTMLElement): boolean =>
  !!(
    element.getAttribute("aria-label") ||
    element.getAttribute("aria-labelledby") ||
    element.getAttribute("aria-describedby")
  );

/**
 * Check color contrast ratio (simplified check)
 */
export const checkColorContrast = (element: HTMLElement): boolean => {
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  const backgroundColor = styles.backgroundColor;

  // This is a simplified check - in real scenarios, you'd want to use a proper contrast checking library
  return color !== backgroundColor;
};

/**
 * Test focus management for modal dialogs
 */
export const testFocusTrap = async (
  _modalTrigger: HTMLElement,
  modalContainer: HTMLElement
): Promise<{
  firstFocusable: HTMLElement | undefined;
  lastFocusable: HTMLElement | undefined;
  shouldTrapFocus: boolean;
}> => {
  const focusableElements = modalContainer.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0] as HTMLElement | undefined;
  const lastFocusable = focusableElements[focusableElements.length - 1] as
    | HTMLElement
    | undefined;

  return {
    firstFocusable,
    lastFocusable,
    shouldTrapFocus: focusableElements.length > 0,
  };
};
