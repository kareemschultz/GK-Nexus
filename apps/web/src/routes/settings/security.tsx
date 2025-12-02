import { createFileRoute, redirect } from "@tanstack/react-router";
import { AlertTriangle, Key, Lock, Monitor, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/settings/security")({
  component: SecuritySettingsPage,
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

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const activeSessions: ActiveSession[] = [
  {
    id: "1",
    device: "Chrome on Windows",
    location: "Georgetown, Guyana",
    lastActive: "Active now",
    isCurrent: true,
  },
  {
    id: "2",
    device: "Safari on iPhone",
    location: "Georgetown, Guyana",
    lastActive: "2 hours ago",
    isCurrent: false,
  },
  {
    id: "3",
    device: "Firefox on MacOS",
    location: "New York, USA",
    lastActive: "Yesterday",
    isCurrent: false,
  },
];

function SecuritySettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">Security Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account security and authentication settings
        </p>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password
            </CardTitle>
            <CardDescription>
              Change your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Password</p>
                <p className="text-muted-foreground text-sm">
                  Last changed 30 days ago
                </p>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Authenticator App</p>
                  <p className="text-muted-foreground text-sm">
                    Use an authenticator app to generate codes
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">SMS Authentication</p>
                  <p className="text-muted-foreground text-sm">
                    Receive codes via SMS
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Backup Codes</p>
                  <p className="text-muted-foreground text-sm">
                    Generate backup codes for account recovery
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Generate Codes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage devices where you&apos;re currently logged in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={session.id}
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{session.device}</p>
                        {session.isCurrent && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {session.location} • {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button size="sm" variant="ghost">
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full" variant="outline">
              Sign Out All Other Sessions
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API keys for third-party integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
              <p className="text-muted-foreground text-sm">
                No API keys configured
              </p>
              <Button size="sm" variant="outline">
                Generate Key
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Deactivate Account</p>
                  <p className="text-muted-foreground text-sm">
                    Temporarily disable your account
                  </p>
                </div>
                <Button variant="outline">Deactivate</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Delete Account</p>
                  <p className="text-muted-foreground text-sm">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
