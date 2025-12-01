import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.data) {
      redirect({
        to: "/dashboard",
        throw: true,
      });
    } else {
      redirect({
        to: "/login",
        throw: true,
      });
    }
  },
});

function HomeComponent() {
  return null;
}
