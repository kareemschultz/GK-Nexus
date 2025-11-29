import { createFileRoute, redirect } from "@tanstack/react-router";
import { AutomationRules } from "@/components/automation/rules";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/automation/rules")({
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
  return <AutomationRules />;
}
