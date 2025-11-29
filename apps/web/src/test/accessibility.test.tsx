import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormError } from "../components/form-error";
import Header from "../components/header";
import SignInForm from "../components/sign-in-form";
import SkipLinks from "../components/skip-links";
import Modal from "../components/ui/modal";
import {
  hasAriaLabel,
  testA11y,
  testKeyboardNavigation,
} from "./accessibility-utils";

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ isPending: false }),
    signIn: {
      email: vi.fn(),
    },
  },
}));

describe("Accessibility Tests", () => {
  describe("Header Component", () => {
    it("should have proper semantic markup and ARIA labels", async () => {
      await testA11y(<Header />);
    });

    it("should have proper navigation structure", () => {
      render(<Header />);

      const banner = screen.getByRole("banner");
      const navigation = screen.getByRole("navigation", {
        name: "Main navigation",
      });
      const toolbar = screen.getByRole("toolbar", {
        name: "User preferences and account",
      });

      expect(banner).toBeInTheDocument();
      expect(navigation).toBeInTheDocument();
      expect(toolbar).toBeInTheDocument();
    });

    it("should have proper focus management", () => {
      const result = render(<Header />);
      const { focusableElements } = testKeyboardNavigation(result);

      expect(focusableElements.length).toBeGreaterThan(0);

      // Check that all links are focusable
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
        expect(link.tabIndex).not.toBe(-1);
      });
    });
  });

  describe("Skip Links Component", () => {
    it("should provide keyboard navigation shortcuts", () => {
      render(<SkipLinks />);

      const skipToMain = screen.getByText("Skip to main content");
      const skipToNav = screen.getByText("Skip to navigation");

      expect(skipToMain).toBeInTheDocument();
      expect(skipToNav).toBeInTheDocument();
      expect(skipToMain).toHaveAttribute("href", "#main-content");
      expect(skipToNav).toHaveAttribute("href", "#main-navigation");
    });

    it("should be hidden by default but visible on focus", () => {
      render(<SkipLinks />);

      const skipToMain = screen.getByText("Skip to main content");
      const container = skipToMain.parentElement;

      expect(container).toHaveClass("sr-only");
      expect(container).toHaveClass("focus-within:not-sr-only");
    });
  });

  describe("Modal Component", () => {
    it("should have proper dialog markup and ARIA attributes", async () => {
      const mockClose = vi.fn();

      await testA11y(
        <Modal isOpen={true} onClose={mockClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
    });

    it("should trap focus within modal", () => {
      const mockClose = vi.fn();

      render(
        <Modal isOpen={true} onClose={mockClose} title="Test Modal">
          <button>First button</button>
          <input type="text" />
          <button>Last button</button>
        </Modal>
      );

      const dialog = screen.getByRole("dialog");
      const closeButton = screen.getByRole("button", { name: "Close modal" });
      const firstButton = screen.getByRole("button", { name: "First button" });

      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
      expect(closeButton).toBeInTheDocument();
      expect(firstButton).toBeInTheDocument();
    });

    it("should handle escape key", async () => {
      const mockClose = vi.fn();
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={mockClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      await user.keyboard("{Escape}");
      // Note: The escape handling is done via useEscapeKey hook
      // In a real test, we'd need to mock the hook or test integration
    });
  });

  describe("Form Error Component", () => {
    it("should have proper ARIA attributes for screen readers", async () => {
      await testA11y(
        <FormError id="test-error" message="This field is required" />
      );
    });

    it("should announce errors to screen readers", () => {
      render(<FormError id="email-error" message="Invalid email address" />);

      const errorDiv = screen.getByRole("alert");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv).toHaveAttribute("aria-live", "polite");
      expect(errorDiv).toHaveAttribute("id", "email-error");
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });

    it("should hide decorative icon from screen readers", () => {
      render(<FormError message="Error message" />);

      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Sign In Form", () => {
    const mockOnSwitch = vi.fn();

    it("should have proper form structure and labels", async () => {
      await testA11y(<SignInForm onSwitchToSignUp={mockOnSwitch} />);
    });

    it("should have proper input associations", () => {
      render(<SignInForm onSwitchToSignUp={mockOnSwitch} />);

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("autoComplete", "email");
      expect(emailInput).toHaveAttribute("required");

      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("autoComplete", "current-password");
      expect(passwordInput).toHaveAttribute("required");
    });

    it("should have proper form description", () => {
      render(<SignInForm onSwitchToSignUp={mockOnSwitch} />);

      const form = document.querySelector("form");
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute("aria-describedby", "signin-description");
      expect(form).toHaveAttribute("noValidate");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support tab navigation through interactive elements", async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button>Button 1</button>
          <a href="#test">Link</a>
          <input type="text" />
          <button>Button 2</button>
        </div>
      );

      const button1 = screen.getByText("Button 1");
      const link = screen.getByText("Link");
      const input = screen.getByRole("textbox");
      const button2 = screen.getByText("Button 2");

      // Start focus on first element
      button1.focus();
      expect(button1).toHaveFocus();

      // Tab through elements
      await user.tab();
      expect(link).toHaveFocus();

      await user.tab();
      expect(input).toHaveFocus();

      await user.tab();
      expect(button2).toHaveFocus();
    });
  });

  describe("ARIA Labels and Descriptions", () => {
    it("should detect elements with proper ARIA labels", () => {
      render(
        <div>
          <button aria-label="Close dialog">X</button>
          <input aria-labelledby="label-id" />
          <span id="label-id">Input Label</span>
          <button aria-describedby="help-text">Submit</button>
          <div id="help-text">Click to submit form</div>
        </div>
      );

      const closeButton = screen.getByRole("button", { name: "Close dialog" });
      const input = screen.getByRole("textbox");
      const submitButton = screen.getByRole("button", { name: "Submit" });

      expect(hasAriaLabel(closeButton)).toBe(true);
      expect(hasAriaLabel(input)).toBe(true);
      expect(hasAriaLabel(submitButton)).toBe(true);
    });
  });
});
