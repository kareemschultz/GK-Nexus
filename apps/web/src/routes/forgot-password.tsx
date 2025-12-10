import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      setEmailError(null);
      try {
        // TODO: Configure email provider for password reset functionality
        // await authClient.forgetPassword({
        //   email: value.email,
        //   redirectTo: `${window.location.origin}/reset-password`,
        // });
        // For now, show a message that this feature is not yet configured
        toast.error(
          "Password reset is not yet configured. Please contact support."
        );
        throw new Error("Password reset not configured");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Email not found";
        setEmailError(message);
        toast.error(message);
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
      }),
    },
  });

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-6 text-center font-bold text-3xl">Reset Password</h1>
      <p className="mb-6 text-center text-muted-foreground">
        Enter your email address and we'll send you a link to reset your
        password.
      </p>

      {isSuccess ? (
        <div
          className="rounded-md bg-green-50 p-4 text-green-800"
          data-testid="reset-success-message"
        >
          Check your email for a password reset link. If you don't see it,
          please check your spam folder.
        </div>
      ) : (
        <form
          className="space-y-4"
          data-testid="forgot-password-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div>
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    data-testid="email-input"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="email"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FormError
                      data-testid="email-error"
                      message={field.state.meta.errors[0]?.message}
                    />
                  )}
                  {emailError && (
                    <FormError data-testid="email-error" message={emailError} />
                  )}
                </div>
              )}
            </form.Field>
          </div>

          <form.Subscribe>
            {(state) => (
              <Button
                className="w-full"
                data-testid="send-reset-button"
                disabled={!state.canSubmit || state.isSubmitting}
                type="submit"
              >
                {state.isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      )}

      <div className="mt-4 text-center">
        <a
          className="text-indigo-600 text-sm hover:text-indigo-800"
          data-testid="back-to-login-link"
          href="/login"
        >
          Back to Sign In
        </a>
      </div>
    </div>
  );
}
