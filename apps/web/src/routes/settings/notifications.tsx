import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Bell,
  Calendar,
  FileText,
  Mail,
  MessageSquare,
  Shield,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings/notifications")({
  component: NotificationSettingsPage,
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

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  icon: typeof Bell;
}

const notificationSettings: NotificationSetting[] = [
  {
    id: "deadlines",
    title: "Tax Deadlines",
    description: "Reminders for upcoming tax filing deadlines",
    email: true,
    push: true,
    sms: true,
    icon: Calendar,
  },
  {
    id: "compliance",
    title: "Compliance Alerts",
    description: "Important compliance updates and warnings",
    email: true,
    push: true,
    sms: false,
    icon: Shield,
  },
  {
    id: "documents",
    title: "Document Updates",
    description: "Notifications when documents are uploaded or processed",
    email: true,
    push: false,
    sms: false,
    icon: FileText,
  },
  {
    id: "appointments",
    title: "Appointment Reminders",
    description: "Reminders for scheduled appointments",
    email: true,
    push: true,
    sms: true,
    icon: Calendar,
  },
  {
    id: "messages",
    title: "Client Messages",
    description: "Notifications for new client messages",
    email: true,
    push: true,
    sms: false,
    icon: MessageSquare,
  },
];

function NotificationSettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">
          Notification Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose how and when you want to receive notifications
        </p>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Channels
            </CardTitle>
            <CardDescription>
              Configure your preferred notification methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Email Notifications</p>
                    <p className="text-muted-foreground text-sm">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Push Notifications</p>
                    <p className="text-muted-foreground text-sm">
                      Receive browser push notifications
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">SMS Notifications</p>
                    <p className="text-muted-foreground text-sm">
                      Receive notifications via SMS
                    </p>
                  </div>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Customize notifications for different types of events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {notificationSettings.map((setting) => (
                <div className="rounded-lg border p-4" key={setting.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <setting.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{setting.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        defaultChecked={setting.email}
                        id={`${setting.id}-email`}
                      />
                      <label
                        className="text-sm"
                        htmlFor={`${setting.id}-email`}
                      >
                        Email
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        defaultChecked={setting.push}
                        id={`${setting.id}-push`}
                      />
                      <label className="text-sm" htmlFor={`${setting.id}-push`}>
                        Push
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        defaultChecked={setting.sms}
                        id={`${setting.id}-sms`}
                      />
                      <label className="text-sm" htmlFor={`${setting.id}-sms`}>
                        SMS
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quiet Hours</CardTitle>
            <CardDescription>
              Set times when you don&apos;t want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Enable Quiet Hours</p>
                <p className="text-muted-foreground text-sm">
                  Pause notifications during specified hours
                </p>
              </div>
              <Switch />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div>
                <label className="font-medium text-sm" htmlFor="quiet-start">
                  From
                </label>
                <input
                  className="mt-1 block rounded-md border px-3 py-2 text-sm"
                  defaultValue="22:00"
                  id="quiet-start"
                  type="time"
                />
              </div>
              <div>
                <label className="font-medium text-sm" htmlFor="quiet-end">
                  To
                </label>
                <input
                  className="mt-1 block rounded-md border px-3 py-2 text-sm"
                  defaultValue="08:00"
                  id="quiet-end"
                  type="time"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
