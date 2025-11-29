import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import ClientOnboardingWizard from "@/components/client-onboarding-wizard";

export const Route = createFileRoute("/clients/new")({
  component: NewClientPage,
});

function NewClientPage() {
  const navigate = useNavigate();

  const handleComplete = (data: any) => {
    toast.success("Client created successfully!", {
      description: `${
        data.entityType === "INDIVIDUAL"
          ? `${data.firstName} ${data.lastName}`
          : data.businessName
      } has been added to GK-Nexus`,
    });

    // Navigate to clients list or client detail page
    navigate({ to: "/clients" });
  };

  const handleCancel = () => {
    navigate({ to: "/clients" });
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientOnboardingWizard
        onCancel={handleCancel}
        onComplete={handleComplete}
      />
    </div>
  );
}
