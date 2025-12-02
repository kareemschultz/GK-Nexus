import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  Cloud,
  ExternalLink,
  Key,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SettingsLayout } from "@/components/settings-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings/integrations")({
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

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "connected" | "disconnected" | "pending";
  lastSync?: string;
  category: string;
}

const availableIntegrations: Integration[] = [
  {
    id: "gra",
    name: "GRA (Guyana Revenue Authority)",
    description: "Connect to GRA for tax filing and compliance submissions",
    icon: Shield,
    status: "connected",
    lastSync: "2 hours ago",
    category: "Government",
  },
  {
    id: "nis",
    name: "NIS (National Insurance Scheme)",
    description: "Submit NIS contributions and employee registrations",
    icon: Shield,
    status: "connected",
    lastSync: "4 hours ago",
    category: "Government",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Backup documents and files to Google Drive",
    icon: Cloud,
    status: "disconnected",
    category: "Storage",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Sync documents with Dropbox for backup",
    icon: Cloud,
    status: "disconnected",
    category: "Storage",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Send notifications and reports via Gmail",
    icon: Mail,
    status: "connected",
    lastSync: "1 hour ago",
    category: "Communication",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications in your Slack workspace",
    icon: MessageSquare,
    status: "disconnected",
    category: "Communication",
  },
];

function RouteComponent() {
  const [integrations, setIntegrations] = useState(availableIntegrations);
  const [apiKeys, setApiKeys] = useState<
    Array<{ id: string; name: string; created: string; lastUsed: string }>
  >([
    {
      id: "key_1",
      name: "Production API Key",
      created: "2024-01-15",
      lastUsed: "2 hours ago",
    },
    {
      id: "key_2",
      name: "Development Key",
      created: "2024-02-01",
      lastUsed: "5 days ago",
    },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleConnect = async (integrationId: string) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === integrationId ? { ...int, status: "pending" } : int
      )
    );

    // Simulate connection
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((int) =>
          int.id === integrationId
            ? { ...int, status: "connected", lastSync: "Just now" }
            : int
        )
      );
      toast.success(`Successfully connected to ${integrationId}`);
    }, 2000);
  };

  const handleDisconnect = async (integrationId: string) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === integrationId
          ? { ...int, status: "disconnected", lastSync: undefined }
          : int
      )
    );
    toast.success("Integration disconnected");
  };

  const handleGenerateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const newKey = {
        id: `key_${Date.now()}`,
        name: newKeyName,
        created: new Date().toISOString().split("T")[0],
        lastUsed: "Never",
      };
      setApiKeys((prev) => [...prev, newKey]);
      setNewKeyName("");
      setIsGenerating(false);
      toast.success("API key generated successfully");
    }, 1500);
  };

  const handleDeleteApiKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
    toast.success("API key deleted");
  };

  const connectedCount = integrations.filter(
    (i) => i.status === "connected"
  ).length;

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold text-2xl">Integrations</h2>
          <p className="text-muted-foreground">
            Connect external services and manage API access.
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {connectedCount} active integrations.
            {connectedCount < 3 &&
              " Consider connecting more services to automate your workflow."}
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {/* Connected Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Connected Services
              </CardTitle>
              <CardDescription>
                Services that are currently connected to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations
                .filter((i) => i.status === "connected")
                .map((integration) => {
                  const Icon = integration.icon;
                  return (
                    <div
                      className="flex items-center justify-between rounded-lg border p-4"
                      key={integration.id}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{integration.name}</p>
                            <Badge className="text-xs" variant="secondary">
                              {integration.category}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            Last synced: {integration.lastSync}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDisconnect(integration.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              {integrations.filter((i) => i.status === "connected").length ===
                0 && (
                <p className="py-4 text-center text-muted-foreground">
                  No connected integrations yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Available Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
              <CardDescription>
                Connect additional services to enhance your workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations
                .filter((i) => i.status === "disconnected")
                .map((integration) => {
                  const Icon = integration.icon;
                  return (
                    <div
                      className="flex items-center justify-between rounded-lg border p-4"
                      key={integration.id}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{integration.name}</p>
                            <Badge className="text-xs" variant="outline">
                              {integration.category}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {integration.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleConnect(integration.id)}
                        size="sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Connect
                      </Button>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for programmatic access to your data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Keys */}
              {apiKeys.map((key) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={key.id}
                >
                  <div className="flex items-center gap-4">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-muted-foreground text-sm">
                        Created: {key.created} • Last used: {key.lastUsed}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      onClick={() => handleDeleteApiKey(key.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Generate New Key */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Generate New API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key for programmatic access to your
                      account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="key-name">Key Name</Label>
                      <Input
                        id="key-name"
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production API Key"
                        value={newKeyName}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={isGenerating}
                      onClick={handleGenerateApiKey}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Generate Key
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
}
