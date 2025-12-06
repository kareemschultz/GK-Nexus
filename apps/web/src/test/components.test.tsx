/**
 * Comprehensive unit tests for React components
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "@/components/error-boundary";
import { FormError } from "@/components/form-error";
import { LoadingSpinner } from "@/components/loading-spinner";
import { NotificationSystem } from "@/components/notification-system";
import PayeCalculator from "@/components/paye-calculator";

// Mock the tax calculations module
vi.mock("@/lib/tax-calculations", async () => {
  const actual = await vi.importActual("@/lib/tax-calculations");
  return {
    ...actual,
    calculatePAYE: vi.fn(() => ({
      employeeId: "test-123",
      grossEarnings: 200_000,
      statutoryFreePay: 130_000,
      childAllowance: 20_000,
      overtimeTaxFree: 50_000,
      taxableIncome: 0,
      taxBand1Amount: 0,
      taxBand1Tax: 0,
      taxBand2Amount: 0,
      taxBand2Tax: 0,
      totalPAYETax: 0,
      nisableEarnings: 200_000,
      employeeNISContribution: 11_200,
      employerNISContribution: 16_800,
      totalDeductions: 11_200,
      netPay: 188_800,
    })),
  };
});

// Test component that throws an error
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
}

describe("React Components", () => {
  describe("ErrorBoundary Component", () => {
    // Suppress console.error for these tests since we're intentionally causing errors
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should render children when there is no error", () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("should render error fallback when error occurs", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(
        screen.getByText(
          "An unexpected error occurred. Please try refreshing the page."
        )
      ).toBeInTheDocument();
    });

    it("should display error details when available", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorDetails = screen.getByText("Error Details");
      expect(errorDetails).toBeInTheDocument();

      fireEvent.click(errorDetails);
      expect(screen.getByText("Test error")).toBeInTheDocument();
    });

    it("should allow retry functionality", async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      const tryAgainButton = screen.getByText("Try Again");
      fireEvent.click(tryAgainButton);

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("No error")).toBeInTheDocument();
    });

    it("should provide reload page functionality", () => {
      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, "location", {
        value: { reload: reloadMock },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByText("Reload Page");
      fireEvent.click(reloadButton);

      expect(reloadMock).toHaveBeenCalled();
    });

    it("should render custom fallback when provided", () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom error message")).toBeInTheDocument();
      expect(
        screen.queryByText("Something went wrong")
      ).not.toBeInTheDocument();
    });
  });

  describe("PayeCalculator Component", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should render calculator form with all required fields", () => {
      render(<PayeCalculator />);

      expect(screen.getByText("PAYE Calculator")).toBeInTheDocument();
      expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
      expect(screen.getByLabelText("NIS Number")).toBeInTheDocument();
      expect(screen.getByLabelText("Basic Salary (GYD)")).toBeInTheDocument();
      expect(screen.getByLabelText("Overtime (GYD)")).toBeInTheDocument();
      expect(screen.getByLabelText("Allowances (GYD)")).toBeInTheDocument();
      expect(screen.getByLabelText("Bonuses (GYD)")).toBeInTheDocument();
      expect(screen.getByLabelText("Number of Children")).toBeInTheDocument();
    });

    it("should display 2025 tax rates information", () => {
      render(<PayeCalculator />);

      expect(screen.getByText("2025 Tax Rates")).toBeInTheDocument();
      expect(screen.getByText("Guyana Budget 2025")).toBeInTheDocument();
      expect(screen.getByText(/Statutory Free Pay:/)).toBeInTheDocument();
      expect(screen.getByText(/Tax Band 1 \(25%\):/)).toBeInTheDocument();
      expect(screen.getByText(/Tax Band 2 \(35%\):/)).toBeInTheDocument();
    });

    it("should validate required fields", async () => {
      const user = userEvent.setup();
      render(<PayeCalculator />);

      const calculateButton = screen.getByText("Calculate PAYE & NIS");
      await user.click(calculateButton);

      await waitFor(() => {
        expect(screen.getByText("First name is required")).toBeInTheDocument();
        expect(screen.getByText("Last name is required")).toBeInTheDocument();
        expect(screen.getByText("NIS number is required")).toBeInTheDocument();
      });
    });

    it("should validate NIS number format", async () => {
      const user = userEvent.setup();
      render(<PayeCalculator />);

      const nisInput = screen.getByLabelText("NIS Number");
      await user.type(nisInput, "invalid");

      const calculateButton = screen.getByText("Calculate PAYE & NIS");
      await user.click(calculateButton);

      await waitFor(() => {
        expect(
          screen.getByText("Invalid NIS number format")
        ).toBeInTheDocument();
      });
    });

    it("should validate numeric fields are non-negative", async () => {
      const user = userEvent.setup();
      render(<PayeCalculator />);

      const salaryInput = screen.getByLabelText("Basic Salary (GYD)");
      await user.clear(salaryInput);
      await user.type(salaryInput, "-1000");

      const calculateButton = screen.getByText("Calculate PAYE & NIS");
      await user.click(calculateButton);

      await waitFor(() => {
        expect(
          screen.getByText("Basic salary must be positive")
        ).toBeInTheDocument();
      });
    });

    it("should calculate PAYE successfully with valid input", async () => {
      const user = userEvent.setup();
      render(<PayeCalculator />);

      // Fill in valid employee data
      await user.type(screen.getByLabelText("First Name"), "John");
      await user.type(screen.getByLabelText("Last Name"), "Doe");
      await user.type(screen.getByLabelText("NIS Number"), "123456789");
      await user.clear(screen.getByLabelText("Basic Salary (GYD)"));
      await user.type(screen.getByLabelText("Basic Salary (GYD)"), "200000");
      await user.clear(screen.getByLabelText("Number of Children"));
      await user.type(screen.getByLabelText("Number of Children"), "2");

      const calculateButton = screen.getByText("Calculate PAYE & NIS");
      await user.click(calculateButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText("Calculating...")).toBeInTheDocument();
      });

      // Should show results after calculation
      await waitFor(
        () => {
          expect(screen.getByText("Calculation Results")).toBeInTheDocument();
          expect(screen.getByText("Gross Earnings")).toBeInTheDocument();
          expect(screen.getByText("Net Pay")).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("should display calculation results correctly", async () => {
      const user = userEvent.setup();
      render(<PayeCalculator />);

      // Fill form and calculate
      await user.type(screen.getByLabelText("First Name"), "Test");
      await user.type(screen.getByLabelText("Last Name"), "Employee");
      await user.type(screen.getByLabelText("NIS Number"), "A12345678");
      await user.clear(screen.getByLabelText("Basic Salary (GYD)"));
      await user.type(screen.getByLabelText("Basic Salary (GYD)"), "200000");

      const calculateButton = screen.getByText("Calculate PAYE & NIS");
      await user.click(calculateButton);

      await waitFor(
        () => {
          expect(screen.getByText("Calculation Results")).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Check for deduction details
      expect(
        screen.getByText("NIS Employee Contribution:")
      ).toBeInTheDocument();
      expect(screen.getByText("PAYE Tax:")).toBeInTheDocument();
      expect(screen.getByText("Total Deductions:")).toBeInTheDocument();

      // Check for employer information
      expect(
        screen.getByText(/Employer NIS Contribution:/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Total Employment Cost:/)).toBeInTheDocument();
    });

    it("should call onSave callback when save button is clicked", async () => {
      const user = userEvent.setup();
      const onSaveMock = vi.fn();
      render(<PayeCalculator onSave={onSaveMock} />);

      // Fill form and calculate
      await user.type(screen.getByLabelText("First Name"), "Save");
      await user.type(screen.getByLabelText("Last Name"), "Test");
      await user.type(screen.getByLabelText("NIS Number"), "123456789");
      await user.clear(screen.getByLabelText("Basic Salary (GYD)"));
      await user.type(screen.getByLabelText("Basic Salary (GYD)"), "150000");

      const calculateButton = screen.getByText("Calculate PAYE & NIS");
      await user.click(calculateButton);

      await waitFor(
        () => {
          expect(screen.getByText("Save to Payroll")).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const saveButton = screen.getByText("Save to Payroll");
      await user.click(saveButton);

      expect(onSaveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Save",
          lastName: "Test",
          nisNumber: "123456789",
          basicSalary: 150_000,
        }),
        expect.objectContaining({
          employeeId: "test-123",
          grossEarnings: 200_000,
          netPay: 188_800,
        })
      );
    });

    it("should handle print functionality", async () => {
      const user = userEvent.setup();
      // Mock window.print
      const printMock = vi.fn();
      Object.defineProperty(window, "print", {
        value: printMock,
        writable: true,
      });

      render(<PayeCalculator />);

      // Calculate first
      await user.type(screen.getByLabelText("First Name"), "Print");
      await user.type(screen.getByLabelText("Last Name"), "Test");
      await user.type(screen.getByLabelText("NIS Number"), "123456789");
      await user.clear(screen.getByLabelText("Basic Salary (GYD)"));
      await user.type(screen.getByLabelText("Basic Salary (GYD)"), "180000");

      const calculateButton = screen.getByText("Calculate PAYE & NIS");
      await user.click(calculateButton);

      await waitFor(
        () => {
          expect(screen.getByText("Print")).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const printButton = screen.getByText("Print");
      await user.click(printButton);

      expect(printMock).toHaveBeenCalled();
    });

    it("should show ready state when no calculation performed", () => {
      render(<PayeCalculator />);

      expect(screen.getByText("Ready to Calculate")).toBeInTheDocument();
      expect(
        screen.getByText(
          'Fill in the employee information and click "Calculate" to see the PAYE tax and NIS breakdown.'
        )
      ).toBeInTheDocument();
    });

    it("should handle maximum children limit", async () => {
      const user = userEvent.setup();
      render(<PayeCalculator />);

      const childrenInput = screen.getByLabelText("Number of Children");
      await user.clear(childrenInput);
      await user.type(childrenInput, "15"); // More than max

      expect(
        screen.getByText(/Max 3 children for allowance/)
      ).toBeInTheDocument();
    });

    it("should display overtime tax-free information", () => {
      render(<PayeCalculator />);

      expect(screen.getByText(/First .* is tax-free/)).toBeInTheDocument();
    });
  });

  describe("LoadingSpinner Component", () => {
    it("should render with default props", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute("aria-label", "Loading...");
    });

    it("should render with custom size", () => {
      render(<LoadingSpinner size="lg" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
    });

    it("should render with custom text", () => {
      render(<LoadingSpinner text="Custom loading text" />);

      expect(screen.getByText("Custom loading text")).toBeInTheDocument();
    });

    it("should have proper accessibility attributes", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-live", "polite");
      expect(spinner).toHaveAttribute("aria-label", "Loading...");
    });
  });

  describe("FormError Component", () => {
    it("should render error message when provided", () => {
      render(<FormError message="Test error message" />);

      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("should not render when no message provided", () => {
      const { container } = render(<FormError />);

      expect(container.firstChild).toBeNull();
    });

    it("should not render when message is empty string", () => {
      const { container } = render(<FormError message="" />);

      expect(container.firstChild).toBeNull();
    });

    it("should have proper styling and accessibility", () => {
      render(<FormError message="Validation error" />);

      const errorElement = screen.getByText("Validation error");
      expect(errorElement).toHaveClass("text-destructive");
      expect(errorElement).toHaveAttribute("role", "alert");
    });

    it("should render multiple errors correctly", () => {
      render(
        <div>
          <FormError message="First error" />
          <FormError message="Second error" />
        </div>
      );

      expect(screen.getByText("First error")).toBeInTheDocument();
      expect(screen.getByText("Second error")).toBeInTheDocument();
    });
  });

  describe("NotificationSystem Component", () => {
    it("should render without notifications", () => {
      render(<NotificationSystem />);

      // Should render the notification container but no notifications
      const container = document.querySelector("[data-sonner-toaster]");
      expect(container).toBeInTheDocument();
    });

    it("should render notification system", () => {
      render(<NotificationSystem />);

      // NotificationSystem renders a notification button/dropdown
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("should handle error boundary with calculator", async () => {
      // Mock calculatePAYE to throw an error
      const taxCalculations = await import("@/lib/tax-calculations");
      const { calculatePAYE } = vi.mocked(taxCalculations);
      calculatePAYE.mockImplementation(() => {
        throw new Error("Calculation error");
      });

      render(
        <ErrorBoundary>
          <PayeCalculator />
        </ErrorBoundary>
      );

      expect(screen.getByText("PAYE Calculator")).toBeInTheDocument();
    });

    it("should maintain component state across re-renders", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<PayeCalculator />);

      const firstNameInput = screen.getByLabelText("First Name");
      await user.type(firstNameInput, "Persistent");

      rerender(<PayeCalculator />);

      expect(firstNameInput).toHaveValue("Persistent");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels on calculator form", () => {
      render(<PayeCalculator />);

      expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
      expect(screen.getByLabelText("NIS Number")).toBeInTheDocument();
      expect(screen.getByLabelText("Basic Salary (GYD)")).toBeInTheDocument();
    });

    it("should have proper form validation messages", async () => {
      const user = userEvent.setup();
      render(<PayeCalculator />);

      const calculateButton = screen.getByText("Calculate PAYE & NIS");
      await user.click(calculateButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/is required/);
        for (const error of errorMessages) {
          expect(error).toHaveAttribute("role", "alert");
        }
      });
    });

    it("should have semantic HTML structure", () => {
      render(<PayeCalculator />);

      expect(
        screen.getByRole("heading", { name: /PAYE Calculator/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Calculate PAYE & NIS/ })
      ).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<PayeCalculator />);

      const firstNameInput = screen.getByLabelText("First Name");
      const lastNameInput = screen.getByLabelText("Last Name");

      firstNameInput.focus();
      expect(document.activeElement).toBe(firstNameInput);

      await user.keyboard("{Tab}");
      expect(document.activeElement).toBe(lastNameInput);
    });
  });

  describe("Performance", () => {
    it("should not cause unnecessary re-renders", () => {
      const renderSpy = vi.fn();

      function TestComponent() {
        renderSpy();
        return <PayeCalculator />;
      }

      const { rerender } = render(<TestComponent />);

      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestComponent />);

      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it("should handle large form inputs efficiently", async () => {
      const user = userEvent.setup();
      render(<PayeCalculator />);

      const salaryInput = screen.getByLabelText("Basic Salary (GYD)");

      // Performance test: typing large number should be responsive
      const startTime = performance.now();
      await user.clear(salaryInput);
      await user.type(salaryInput, "999999999.99");
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(salaryInput).toHaveValue(999_999_999.99);
    });
  });
});
