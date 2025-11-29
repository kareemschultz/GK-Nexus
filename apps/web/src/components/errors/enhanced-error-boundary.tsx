import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
  Home,
  Lightbulb,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastErrorTime: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
  showRetryButton?: boolean;
  maxRetries?: number;
  resetTimeout?: number;
  context?: string;
}

interface ErrorSolution {
  id: string;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
  learnMore?: string;
}

const commonErrorSolutions: Record<string, ErrorSolution[]> = {
  ChunkLoadError: [
    {
      id: "refresh-page",
      title: "Refresh the Page",
      description:
        "A new version of the application may be available. Refreshing will load the latest version.",
      action: () => window.location.reload(),
      actionLabel: "Refresh Now",
    },
    {
      id: "clear-cache",
      title: "Clear Browser Cache",
      description: "Outdated cached files might be causing the issue.",
      actionLabel: "Learn How",
      learnMore: "/help/clear-cache",
    },
  ],
  NetworkError: [
    {
      id: "check-connection",
      title: "Check Your Connection",
      description: "Make sure you have a stable internet connection.",
    },
    {
      id: "retry-request",
      title: "Try Again",
      description: "The server might be temporarily unavailable.",
      action: () => window.location.reload(),
      actionLabel: "Retry",
    },
  ],
  AuthenticationError: [
    {
      id: "sign-in-again",
      title: "Sign In Again",
      description: "Your session may have expired. Please sign in to continue.",
      actionLabel: "Go to Sign In",
      learnMore: "/sign-in",
    },
  ],
  ValidationError: [
    {
      id: "check-inputs",
      title: "Check Your Input",
      description:
        "Some fields may contain invalid data. Please review and correct them.",
    },
  ],
};

export class EnhancedErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Auto-retry for certain errors
    if (this.shouldAutoRetry(error)) {
      this.scheduleAutoRetry();
    }
  }

  componentDidUpdate(
    prevProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState
  ) {
    // Reset error boundary when children change
    if (prevState.hasError && prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  shouldAutoRetry(error: Error): boolean {
    const autoRetryErrors = ["ChunkLoadError", "NetworkError"];
    return autoRetryErrors.some(
      (errorType) =>
        error.name.includes(errorType) || error.message.includes(errorType)
    );
  }

  scheduleAutoRetry() {
    const { maxRetries = 3, resetTimeout = 5000 } = this.props;

    if (this.state.retryCount < maxRetries) {
      this.resetTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, resetTimeout);
    }
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReport = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const reportData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: errorInfo?.componentStack,
      context: this.props.context,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    // In a real app, you would send this to your error reporting service
    console.log("Error report:", reportData);

    // For now, copy to clipboard
    navigator.clipboard?.writeText(JSON.stringify(reportData, null, 2));
  };

  getErrorType(error: Error): string {
    if (
      error.name === "ChunkLoadError" ||
      error.message.includes("Loading chunk")
    )
      return "ChunkLoadError";
    if (error.message.includes("Network") || error.message.includes("fetch"))
      return "NetworkError";
    if (
      error.message.includes("Authentication") ||
      error.message.includes("Unauthorized")
    )
      return "AuthenticationError";
    if (
      error.message.includes("Validation") ||
      error.message.includes("Invalid")
    )
      return "ValidationError";
    return "UnknownError";
  }

  getSolutions(errorType: string): ErrorSolution[] {
    return (
      commonErrorSolutions[errorType] || [
        {
          id: "generic-refresh",
          title: "Refresh the Page",
          description: "Sometimes a simple refresh can resolve the issue.",
          action: () => window.location.reload(),
          actionLabel: "Refresh",
        },
        {
          id: "contact-support",
          title: "Contact Support",
          description: "If the problem persists, our support team can help.",
          actionLabel: "Get Help",
          learnMore: "/help/contact",
        },
      ]
    );
  }

  copyErrorDetails = () => {
    const { error } = this.state;
    if (error) {
      const details = `Error: ${error.message}\n\nStack: ${error.stack}`;
      navigator.clipboard?.writeText(details);
    }
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const {
        showReportButton = true,
        showRetryButton = true,
        fallback,
      } = this.props;

      if (fallback) {
        return fallback;
      }

      if (!error) return null;

      const errorType = this.getErrorType(error);
      const solutions = this.getSolutions(errorType);
      const isNetworkError =
        errorType === "NetworkError" || errorType === "ChunkLoadError";

      return (
        <div className="flex min-h-[400px] items-center justify-center bg-muted/30 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">
                    Something went wrong
                  </CardTitle>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {isNetworkError
                      ? "We're having trouble loading part of the application"
                      : "An unexpected error occurred while processing your request"}
                  </p>
                </div>
                <Badge className="text-xs" variant="secondary">
                  Error{" "}
                  {this.state.retryCount > 0 &&
                    `(Retry ${this.state.retryCount})`}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Message */}
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription className="font-mono text-sm">
                  {error.message}
                </AlertDescription>
              </Alert>

              {/* Solutions */}
              {solutions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Suggested Solutions</h3>
                  </div>

                  <div className="grid gap-3">
                    {solutions.map((solution) => (
                      <Card className="p-4" key={solution.id}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="mb-1 font-medium">
                              {solution.title}
                            </h4>
                            <p className="mb-3 text-muted-foreground text-sm">
                              {solution.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {solution.action && (
                            <Button onClick={solution.action} size="sm">
                              {solution.actionLabel || "Try This"}
                            </Button>
                          )}
                          {solution.learnMore && (
                            <Button asChild size="sm" variant="outline">
                              <a
                                href={solution.learnMore}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Learn More
                              </a>
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {showRetryButton && (
                  <Button
                    className="flex items-center gap-2"
                    onClick={this.handleRetry}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                )}

                <Button onClick={() => window.history.back()} variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>

                <Button asChild variant="outline">
                  <a href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </a>
                </Button>

                <Button asChild variant="outline">
                  <a href="/help">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Get Help
                  </a>
                </Button>
              </div>

              {/* Error Details (Collapsible) */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button
                    className="flex items-center gap-2"
                    size="sm"
                    variant="ghost"
                  >
                    <FileText className="h-4 w-4" />
                    Show Technical Details
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <Card className="bg-muted/50">
                    <CardContent className="space-y-4 p-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-semibold text-sm">
                            Error Details
                          </h4>
                          <Button
                            onClick={this.copyErrorDetails}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </Button>
                        </div>
                        <div className="rounded-md border bg-background p-3">
                          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                            <div>
                              <strong>Error:</strong> {error.name}
                            </div>
                            <div>
                              <strong>Message:</strong> {error.message}
                            </div>
                            {error.stack && (
                              <div className="mt-2">
                                <strong>Stack Trace:</strong>
                                <br />
                                {error.stack}
                              </div>
                            )}
                          </pre>
                        </div>
                      </div>

                      {this.state.errorInfo && (
                        <div>
                          <h4 className="mb-2 font-semibold text-sm">
                            Component Stack
                          </h4>
                          <div className="rounded-md border bg-background p-3">
                            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <span>Error ID: {Date.now().toString(36)}</span>
                        <span>•</span>
                        <span>Timestamp: {new Date().toLocaleString()}</span>
                        {this.props.context && (
                          <>
                            <span>•</span>
                            <span>Context: {this.props.context}</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              {/* Report Error */}
              {showReportButton && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Help us improve</p>
                      <p className="text-muted-foreground text-xs">
                        Report this error to help us fix the issue
                      </p>
                    </div>
                    <Button
                      onClick={this.handleReport}
                      size="sm"
                      variant="outline"
                    >
                      Report Error
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    // Log error
    console.error("Error handled:", error, context);

    // In a real app, send to error reporting service
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    console.log("Error data:", errorData);
  };

  return { handleError };
}
