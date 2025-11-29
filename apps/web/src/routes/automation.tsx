import { createFileRoute, redirect } from "@tanstack/react-router";
import { AutomationDashboard } from "@/components/automation/dashboard";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/automation")({
  component: RouteComponent,
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

function RouteComponent() {
  return <AutomationDashboard />;
}
