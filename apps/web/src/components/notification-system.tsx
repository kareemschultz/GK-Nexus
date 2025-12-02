import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: "default" | "destructive" | "outline";
  }>;
};

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Welcome to GK-Nexus",
    message:
      "Your account has been successfully created. Complete your profile to get started.",
    type: "success",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
    actions: [
      {
        label: "Complete Profile",
        action: () => console.log("Navigate to profile"),
        variant: "default",
      },
    ],
  },
  {
    id: "2",
    title: "System Update",
    message: "New features have been added to the dashboard. Check them out!",
    type: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: false,
  },
  {
    id: "3",
    title: "Security Alert",
    message:
      "New login detected from a different device. If this wasn't you, please secure your account.",
    type: "warning",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true,
    actions: [
      {
        label: "Review",
        action: () => console.log("Review security"),
        variant: "outline",
      },
    ],
  },
];

export function NotificationSystem() {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      <Button
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        size="sm"
        variant="ghost"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className="-right-2 -top-2 absolute h-5 w-5 rounded-full p-0 text-xs"
            variant="destructive"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 z-50 w-96 shadow-lg">
          <CardContent className="p-0">
            <div className="border-border border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    className="text-xs"
                    onClick={markAllAsRead}
                    size="sm"
                    variant="ghost"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    className={cn(
                      "border-border border-b p-4 transition-colors hover:bg-muted/50",
                      !notification.read && "bg-muted/20"
                    )}
                    key={notification.id}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <Button
                              className="h-auto p-1"
                              onClick={() =>
                                removeNotification(notification.id)
                              }
                              size="sm"
                              variant="ghost"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {notification.message}
                        </p>
                        {notification.actions && (
                          <div className="flex gap-2 pt-2">
                            {notification.actions.map((action, index) => (
                              <Button
                                key={index}
                                onClick={() => {
                                  action.action();
                                  markAsRead(notification.id);
                                }}
                                size="sm"
                                variant={action.variant || "outline"}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                        {!notification.read && (
                          <Button
                            className="text-xs"
                            onClick={() => markAsRead(notification.id)}
                            size="sm"
                            variant="ghost"
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default NotificationSystem;
