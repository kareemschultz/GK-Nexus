import { createFileRoute, redirect } from "@tanstack/react-router";
import { TimeEntriesManager } from "@/components/time-tracking/entries";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/time-tracking/entries")({
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
  return <TimeEntriesManager />;
}
