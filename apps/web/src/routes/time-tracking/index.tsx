import { createFileRoute } from "@tanstack/react-router";
import { TimeTrackingDashboard } from "@/components/time-tracking/dashboard";

export const Route = createFileRoute("/time-tracking/")({
  component: TimeTrackingIndexPage,
});

function TimeTrackingIndexPage() {
  return <TimeTrackingDashboard />;
}
