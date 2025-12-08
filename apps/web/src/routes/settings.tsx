import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SettingsLayout } from "@/components/settings-layout";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings")({
  component: SettingsLayoutWrapper,
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

function SettingsLayoutWrapper() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  );
}
