import { createFileRoute, redirect } from "@tanstack/react-router";
import { AutomationTemplates } from "@/components/automation/templates";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/automation/templates")({
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
  return <AutomationTemplates />;
}
