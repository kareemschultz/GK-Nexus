import type { AppRouterClient } from "@GK-Nexus/api/routers/index";
import { createORPCClient } from "@orpc/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useState } from "react";
import { EnterpriseSidebar } from "@/components/enterprise-sidebar";
import SkipLinks from "@/components/skip-links";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useReducedMotionClass } from "@/hooks/use-reduced-motion";
import { ScreenReaderAnnouncements } from "@/hooks/use-screen-reader";
import { link, type orpc } from "@/utils/orpc";
import "../index.css";

export type RouterAppContext = {
  orpc: typeof orpc;
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "GK-Nexus",
      },
      {
        name: "description",
        content: "GK-Nexus is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const [client] = useState<AppRouterClient>(() => createORPCClient(link));
  const [_orpcUtils] = useState(() => createTanstackQueryUtils(client));

  // Apply reduced motion class to body
  useReducedMotionClass();

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <SkipLinks />
        <ScreenReaderAnnouncements />
        <div className="flex h-svh">
          <EnterpriseSidebar />
          <main
            className="flex-1 overflow-auto"
            id="main-content"
            tabIndex={-1}
          >
            <Outlet />
          </main>
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
    </>
  );
}
