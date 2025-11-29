import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import PayeCalculator from "@/components/paye-calculator";

export const Route = createFileRoute("/tax/paye")({
  component: PayePage,
});

function PayePage() {
  const handleSave = (employee: any, calculation: any) => {
    // Here you would save to your API/database
    toast.success("Calculation saved to payroll", {
      description: `PAYE calculation for ${employee.firstName} ${employee.lastName} has been saved`,
    });
    console.log("Saving employee calculation:", { employee, calculation });
  };

  return <PayeCalculator onSave={handleSave} />;
}
