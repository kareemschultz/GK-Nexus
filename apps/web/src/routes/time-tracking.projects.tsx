import { createFileRoute, redirect } from "@tanstack/react-router";
import { TimeTrackingProjects } from "@/components/time-tracking/projects";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/time-tracking/projects")({
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
  return <TimeTrackingProjects />;
}
