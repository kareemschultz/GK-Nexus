import { createFileRoute, redirect } from "@tanstack/react-router";
import { TimeTrackingTimer } from "@/components/time-tracking/timer";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/time-tracking/timer")({
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
  return <TimeTrackingTimer />;
}
