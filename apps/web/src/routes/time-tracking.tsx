import { createFileRoute, redirect } from "@tanstack/react-router";
import { TimeTrackingDashboard } from "@/components/time-tracking/dashboard";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/time-tracking")({
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
  return <TimeTrackingDashboard />;
}
