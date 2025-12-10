import { useForm } from "@tanstack/react-form";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/reset-password")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/reset-password" });
  const [tokenError, setTokenError] = useState<string | null>(
    token ? null : "Invalid or expired reset link"
  );

  const form = useForm({
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (value.newPassword !== value.confirmNewPassword) {
        toast.error("Passwords do not match");
        return;
      }
      try {
        await authClient.resetPassword({
          newPassword: value.newPassword,
          token,
        });
        toast.success("Password reset successful");
        navigate({ to: "/login" });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to reset password. The link may have expired.";
        setTokenError(message);
        toast.error(message);
      }
    },
    validators: {
      onSubmit: z.object({
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[A-Z]/, "Password must contain an uppercase letter")
          .regex(/[0-9]/, "Password must contain a number"),
        confirmNewPassword: z.string().min(1, "Please confirm your password"),
      }),
    },
  });

  if (tokenError) {
    return (
      <div className="mx-auto mt-10 w-full max-w-md p-6">
        <h1 className="mb-6 text-center font-bold text-3xl">Reset Password</h1>
        <div
          className="rounded-md bg-red-50 p-4 text-red-800"
          data-testid="token-error"
        >
          {tokenError}
        </div>
        <div className="mt-4 text-center">
          <a
            className="text-indigo-600 text-sm hover:text-indigo-800"
            href="/forgot-password"
          >
            Request a new reset link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-6 text-center font-bold text-3xl">
        Create New Password
      </h1>
      <p className="mb-6 text-center text-muted-foreground">
        Enter your new password below.
      </p>

      <form
        className="space-y-4"
        data-testid="reset-password-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div>
          <form.Field name="newPassword">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>New Password</Label>
                <Input
                  data-testid="new-password-input"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="password"
                  value={field.state.value}
                />
                {field.state.meta.errors.length > 0 && (
                  <FormError
                    data-testid="new-password-error"
                    message={field.state.meta.errors[0]?.message}
                  />
                )}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="confirmNewPassword">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Confirm New Password</Label>
                <Input
                  data-testid="confirm-new-password-input"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="password"
                  value={field.state.value}
                />
                <form.Subscribe selector={(state) => state.values.newPassword}>
                  {(newPassword) =>
                    field.state.value &&
                    field.state.value !== newPassword && (
                      <FormError
                        data-testid="confirm-new-password-error"
                        message="Passwords do not match"
                      />
                    )
                  }
                </form.Subscribe>
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe>
          {(state) => (
            <Button
              className="w-full"
              data-testid="reset-password-button"
              disabled={!state.canSubmit || state.isSubmitting}
              type="submit"
            >
              {state.isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
