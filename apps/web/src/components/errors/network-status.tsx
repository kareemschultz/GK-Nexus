import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NetworkStatusProps {
  showOfflineBanner?: boolean;
  showConnectionQuality?: boolean;
  onRetry?: () => void;
  className?: string;
}

type ConnectionType = "slow-2g" | "2g" | "3g" | "4g" | "wifi" | "unknown";

interface NetworkInfo {
  online: boolean;
  connectionType?: ConnectionType;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function NetworkStatus({
  showOfflineBanner = true,
  showConnectionQuality = false,
  onRetry,
  className = "",
}: NetworkStatusProps) {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    online: navigator.onLine,
  });
  const [retryCount, setRetryCount] = useState(0);
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      const info: NetworkInfo = {
        online: navigator.onLine,
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
      };

      setNetworkInfo(info);

      // Track offline time
      if (!(info.online || lastOfflineTime)) {
        setLastOfflineTime(new Date());
      } else if (info.online && lastOfflineTime) {
        setLastOfflineTime(null);
        setRetryCount(0);
      }
    };

    const handleOnline = () => {
      updateNetworkInfo();
      console.log("Network: Back online");
    };

    const handleOffline = () => {
      updateNetworkInfo();
      console.log("Network: Went offline");
    };

    // Initial check
    updateNetworkInfo();

    // Listen for network changes
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for connection changes if supported
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener("change", updateNetworkInfo);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection) {
        connection.removeEventListener("change", updateNetworkInfo);
      }
    };
  }, [lastOfflineTime]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    onRetry?.();
  };

  const getConnectionIcon = () => {
    if (!networkInfo.online) return WifiOff;

    switch (networkInfo.effectiveType) {
      case "slow-2g":
      case "2g":
        return Activity;
      case "3g":
        return Wifi;
      case "4g":
        return Wifi;
      default:
        return Wifi;
    }
  };

  const getConnectionQuality = (): "excellent" | "good" | "fair" | "poor" => {
    if (!networkInfo.online) return "poor";

    const { effectiveType, downlink, rtt } = networkInfo;

    if (effectiveType === "4g" && (downlink || 0) > 5 && (rtt || 0) < 100)
      return "excellent";
    if (effectiveType === "4g" || ((downlink || 0) > 2 && (rtt || 0) < 200))
      return "good";
    if (effectiveType === "3g" || ((downlink || 0) > 0.5 && (rtt || 0) < 500))
      return "fair";
    return "poor";
  };

  const getQualityColor = (
    quality: ReturnType<typeof getConnectionQuality>
  ) => {
    switch (quality) {
      case "excellent":
        return "text-green-600 bg-green-50 border-green-200";
      case "good":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "fair":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "poor":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} KB/s`;
    return `${(bytes / 1024).toFixed(1)} MB/s`;
  };

  const ConnectionIcon = getConnectionIcon();
  const quality = getConnectionQuality();

  // Offline banner
  if (!networkInfo.online && showOfflineBanner) {
    return (
      <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-orange-900">You're offline</div>
            <div className="text-orange-700 text-sm">
              Check your internet connection and try again.
              {lastOfflineTime && (
                <span className="ml-1">
                  (Offline for{" "}
                  {Math.round((Date.now() - lastOfflineTime.getTime()) / 1000)}
                  s)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {retryCount > 0 && (
              <Badge className="text-xs" variant="secondary">
                Retry {retryCount}
              </Badge>
            )}
            <Button onClick={handleRetry} size="sm" variant="outline">
              <RefreshCw className="mr-1 h-3 w-3" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Connection quality indicator (compact)
  if (showConnectionQuality && networkInfo.online) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <ConnectionIcon className="h-4 w-4 text-muted-foreground" />
          <Badge className={`text-xs ${getQualityColor(quality)}`}>
            {quality}
          </Badge>
        </div>

        {networkInfo.effectiveType && (
          <Badge className="text-xs" variant="outline">
            {networkInfo.effectiveType.toUpperCase()}
          </Badge>
        )}

        {networkInfo.saveData && (
          <Badge className="text-xs" variant="outline">
            Data Saver
          </Badge>
        )}
      </div>
    );
  }

  return null;
}

// Detailed network information component
export function NetworkInfo({ className = "" }: { className?: string }) {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    online: navigator.onLine,
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      setNetworkInfo({
        online: navigator.onLine,
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
      });
    };

    updateNetworkInfo();

    const handleNetworkChange = () => updateNetworkInfo();
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener("change", handleNetworkChange);
    }

    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
      if (connection) {
        connection.removeEventListener("change", handleNetworkChange);
      }
    };
  }, []);

  const getConnectionIcon = () => {
    if (!networkInfo.online) return WifiOff;
    return Wifi;
  };

  const getStatusColor = () => {
    if (!networkInfo.online) return "text-red-600";

    const quality = getConnectionQuality();
    switch (quality) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getConnectionQuality = (): "excellent" | "good" | "fair" | "poor" => {
    if (!networkInfo.online) return "poor";

    const { effectiveType, downlink, rtt } = networkInfo;

    if (effectiveType === "4g" && (downlink || 0) > 5 && (rtt || 0) < 100)
      return "excellent";
    if (effectiveType === "4g" || ((downlink || 0) > 2 && (rtt || 0) < 200))
      return "good";
    if (effectiveType === "3g" || ((downlink || 0) > 0.5 && (rtt || 0) < 500))
      return "fair";
    return "poor";
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1) return `${Math.round(bytes * 1000)} KB/s`;
    return `${bytes.toFixed(1)} MB/s`;
  };

  const ConnectionIcon = getConnectionIcon();
  const quality = getConnectionQuality();

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ConnectionIcon className={`h-6 w-6 ${getStatusColor()}`} />
            <div>
              <h3 className="font-semibold">Network Status</h3>
              <p className="text-muted-foreground text-sm">
                {networkInfo.online ? "Connected" : "Offline"}
              </p>
            </div>
            <div className="ml-auto">
              {networkInfo.online ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>

          {networkInfo.online && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">
                    Connection Quality
                  </div>
                  <div className="font-medium capitalize">{quality}</div>
                </div>

                {networkInfo.effectiveType && (
                  <div>
                    <div className="text-muted-foreground">Type</div>
                    <div className="font-medium">
                      {networkInfo.effectiveType.toUpperCase()}
                    </div>
                  </div>
                )}

                {networkInfo.downlink && (
                  <div>
                    <div className="text-muted-foreground">Download Speed</div>
                    <div className="font-medium">
                      {formatBytes(networkInfo.downlink)}
                    </div>
                  </div>
                )}

                {networkInfo.rtt && (
                  <div>
                    <div className="text-muted-foreground">Latency</div>
                    <div className="font-medium">{networkInfo.rtt}ms</div>
                  </div>
                )}
              </div>

              {networkInfo.saveData && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800 text-sm">
                    Data Saver mode is enabled
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionInfo, setConnectionInfo] = useState<NetworkInfo>({
    online: navigator.onLine,
  });

  useEffect(() => {
    const updateConnectionInfo = () => {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      const info: NetworkInfo = {
        online: navigator.onLine,
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
      };

      setIsOnline(info.online);
      setConnectionInfo(info);
    };

    const handleOnline = () => updateConnectionInfo();
    const handleOffline = () => updateConnectionInfo();

    updateConnectionInfo();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener("change", updateConnectionInfo);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection) {
        connection.removeEventListener("change", updateConnectionInfo);
      }
    };
  }, []);

  return {
    isOnline,
    connectionInfo,
    isSlowConnection:
      connectionInfo.effectiveType === "slow-2g" ||
      connectionInfo.effectiveType === "2g",
    isFastConnection:
      connectionInfo.effectiveType === "4g" &&
      (connectionInfo.downlink || 0) > 5,
  };
}

// Component for API error handling with retry logic
interface ApiErrorHandlerProps {
  error: Error | null;
  onRetry: () => void;
  loading?: boolean;
  retryCount?: number;
  maxRetries?: number;
  children?: React.ReactNode;
}

export function ApiErrorHandler({
  error,
  onRetry,
  loading = false,
  retryCount = 0,
  maxRetries = 3,
  children,
}: ApiErrorHandlerProps) {
  const { isOnline } = useNetworkStatus();

  if (!error) {
    return <>{children}</>;
  }

  const isNetworkError =
    !isOnline ||
    error.message.includes("fetch") ||
    error.message.includes("Network");
  const canRetry = retryCount < maxRetries;

  return (
    <Alert
      className={`${isNetworkError ? "border-orange-200 bg-orange-50" : "border-red-200 bg-red-50"}`}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium">
              {isNetworkError ? "Connection Problem" : "Request Failed"}
            </div>
            <div className="mt-1 text-sm">
              {isNetworkError
                ? isOnline
                  ? "Unable to reach the server. Please try again."
                  : "You appear to be offline. Check your internet connection."
                : error.message || "An unexpected error occurred."}
            </div>
            {retryCount > 0 && (
              <div className="mt-1 text-xs opacity-75">
                Retry attempt {retryCount} of {maxRetries}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge className="text-xs" variant="destructive">
                Offline
              </Badge>
            )}
            {canRetry && (
              <Button
                disabled={loading}
                onClick={onRetry}
                size="sm"
                variant="outline"
              >
                {loading ? (
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 h-3 w-3" />
                )}
                {loading ? "Retrying..." : "Try Again"}
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
