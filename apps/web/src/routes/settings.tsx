import { createFileRoute, redirect } from "@tanstack/react-router";
import { Bell, Database, Globe, Palette, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings")({
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
  const { session } = Route.useRouteContext();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Light
                </Button>
                <Button size="sm" variant="default">
                  Dark
                </Button>
                <Button size="sm" variant="outline">
                  System
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <div className="flex gap-2">
                <div className="h-8 w-8 cursor-pointer rounded-full bg-blue-500 ring-2 ring-primary" />
                <div className="h-8 w-8 cursor-pointer rounded-full bg-green-500" />
                <div className="h-8 w-8 cursor-pointer rounded-full bg-purple-500" />
                <div className="h-8 w-8 cursor-pointer rounded-full bg-orange-500" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox defaultChecked id="animations" />
              <Label className="text-sm" htmlFor="animations">
                Enable animations and transitions
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how and when you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium text-sm">
                    Email Notifications
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Receive notifications via email
                  </p>
                </div>
                <Checkbox defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium text-sm">
                    Push Notifications
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Receive browser push notifications
                  </p>
                </div>
                <Checkbox />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium text-sm">
                    Marketing Emails
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Receive updates about new features
                  </p>
                </div>
                <Checkbox defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Manage your privacy settings and security preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium text-sm">
                    Two-Factor Authentication
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Badge variant="outline">Disabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium text-sm">
                    Activity Logging
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Keep a log of account activity
                  </p>
                </div>
                <Checkbox defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium text-sm">Data Analytics</Label>
                  <p className="text-muted-foreground text-xs">
                    Help improve the service with usage analytics
                  </p>
                </div>
                <Checkbox defaultChecked />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                className="w-24"
                defaultValue="30"
                id="session-timeout"
                max="480"
                min="5"
                type="number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language & Region
            </CardTitle>
            <CardDescription>
              Set your language and regional preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Button className="w-full justify-start" variant="outline">
                  English (US)
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Button className="w-full justify-start" variant="outline">
                  UTC-05:00 (EST)
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Button className="w-full justify-start" variant="outline">
                  MM/DD/YYYY
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-format">Time Format</Label>
                <Button className="w-full justify-start" variant="outline">
                  12 Hour
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Export, backup, and manage your data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Export Options</h3>
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant="outline"
                  >
                    Export Profile Data
                  </Button>
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant="outline"
                  >
                    Export Activity History
                  </Button>
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant="outline"
                  >
                    Export Settings
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Data Control</h3>
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant="outline"
                  >
                    Request Data Copy
                  </Button>
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant="outline"
                  >
                    Clear Cache
                  </Button>
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant="destructive"
                  >
                    Delete All Data
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end gap-2">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
