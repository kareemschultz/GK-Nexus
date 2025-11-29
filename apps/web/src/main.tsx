import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { Component, type ReactNode, StrictMode } from "react";
import ReactDOM from "react-dom/client";
import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";
import { orpc, queryClient } from "./utils/orpc";

console.log("🚀 Starting application...");

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("❌ Error Boundary caught error:", error);
    console.error("❌ Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px",
            fontFamily: "monospace",
            background: "#fff",
            color: "#000",
          }}
        >
          <h1 style={{ color: "red" }}>Application Error</h1>
          <h2>Error Details:</h2>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "20px",
              border: "1px solid #ccc",
            }}
          >
            {this.state.error?.toString()}
          </pre>
          <h2>Check the browser console for more details.</h2>
          <p>
            Try refreshing the page or check if the backend server is running at{" "}
            <code>http://localhost:3000</code>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  console.log("✅ All imports successful");

  console.log("🔧 Creating router...");
  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPendingComponent: () => <Loader />,
    context: { orpc, queryClient },
    Wrap({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    },
  });

  console.log("✅ Router created successfully");

  console.log("🔍 Looking for root element...");
  const rootElement = document.getElementById("app");

  if (!rootElement) {
    console.error("❌ Root element with id 'app' not found");
    throw new Error("Root element not found");
  }

  console.log("✅ Root element found");

  if (rootElement.innerHTML) {
    console.log("⚠️  Root element already has content, skipping render");
  } else {
    console.log("🎯 Rendering React application...");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </StrictMode>
    );
    console.log("✅ React application rendered successfully");
  }
} catch (error) {
  console.error("❌ Fatal error during application startup:", error);

  // Fallback rendering
  const rootElement = document.getElementById("app");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: monospace; background: #fff; color: #000;">
        <h1 style="color: red;">Application Startup Error</h1>
        <h2>Error Details:</h2>
        <pre style="background: #f5f5f5; padding: 20px; border: 1px solid #ccc;">${error}</pre>
        <h2>Check the browser console for more details.</h2>
        <p>Make sure the backend server is running at <code>http://localhost:3000</code></p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px;">
          Reload Page
        </button>
      </div>
    `;
  }
}
