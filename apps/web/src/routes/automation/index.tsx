import { createFileRoute } from "@tanstack/react-router";
import { AutomationDashboard } from "@/components/automation/dashboard";

export const Route = createFileRoute("/automation/")({
  component: AutomationIndexPage,
});

function AutomationIndexPage() {
  return <AutomationDashboard />;
}
