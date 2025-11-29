import { createFileRoute, redirect } from "@tanstack/react-router";
import { EnhancedDashboard } from "@/components/enhanced-dashboard";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
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
  return <EnhancedDashboard />;
}
