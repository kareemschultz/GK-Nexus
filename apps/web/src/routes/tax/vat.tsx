import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import VatCalculator from "@/components/vat-calculator";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/tax/vat")({
  component: VatPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function VatPage() {
  const navigate = useNavigate();

  const handleSave = (calculation: any) => {
    // Here you would save to your API/database
    toast.success("VAT calculation saved successfully", {
      description:
        "VAT return calculation has been saved and is ready for GRA submission",
    });
    console.log("Saving VAT calculation:", { calculation });
  };

  const handleNavigateToReturns = () => {
    navigate({ to: "/tax/returns" });
  };

  const handleNavigateToGRA = () => {
    // Navigate to GRA integration page
    toast.info("GRA Integration", {
      description: "GRA e-services integration coming soon",
    });
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Quick Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">VAT Management</h1>
          <p className="text-muted-foreground">
            Calculate and manage Value Added Tax returns for Guyana Revenue
            Authority
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md bg-secondary px-3 py-1.5 font-medium text-secondary-foreground text-sm hover:bg-secondary/80"
            onClick={handleNavigateToReturns}
            type="button"
          >
            View Returns History
          </button>
          <button
            className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm hover:bg-primary/90"
            onClick={handleNavigateToGRA}
            type="button"
          >
            GRA e-Services
          </button>
        </div>
      </div>

      <VatCalculator onSave={handleSave} />
    </div>
  );
}
