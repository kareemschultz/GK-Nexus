import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Palette,
  RotateCcw,
  Save,
  Shield,
} from "lucide-react";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/settings/")({
  component: SettingsGeneralPage,
});

function SettingsGeneralPage() {
  const [autoSave, setAutoSave] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [dataRetention, setDataRetention] = useState("1year");
  const [cacheSize, setCacheSize] = useState("500");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call - settings update would be implemented here
      await new Promise((resolve) => setTimeout(resolve, 500));
      const { toast } = await import("sonner");
      toast.success("Settings saved successfully!");
    } catch {
      const { toast } = await import("sonner");
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = async () => {
    setAutoSave(true);
    setAutoBackup(false);
    setDataRetention("1year");
    setCacheSize("500");
    const { toast } = await import("sonner");
    toast.success("Settings reset to defaults");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-2xl">General Settings</h2>
        <p className="text-muted-foreground">
          Configure basic application preferences and behavior.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Configure application behavior and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium text-sm">Auto-Save</Label>
                  <p className="text-muted-foreground text-xs">
                    Automatically save changes as you type
                  </p>
                </div>
                <Checkbox
                  checked={autoSave}
                  onCheckedChange={(checked) => setAutoSave(checked === true)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium text-sm">Auto-Backup</Label>
                  <p className="text-muted-foreground text-xs">
                    Automatically backup data daily
                  </p>
                </div>
                <Checkbox
                  checked={autoBackup}
                  onCheckedChange={(checked) => setAutoBackup(checked === true)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-retention">Data Retention</Label>
              <Select onValueChange={setDataRetention} value={dataRetention}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                  <SelectItem value="2years">2 Years</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cache-size">Cache Size (MB)</Label>
              <Input
                className="w-32"
                id="cache-size"
                max="2000"
                min="100"
                onChange={(e) => setCacheSize(e.target.value)}
                type="number"
                value={cacheSize}
              />
            </div>
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your security settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>
              View system version and status information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="font-medium text-sm">Version</Label>
                <p className="text-muted-foreground text-sm">v1.0.0</p>
              </div>
              <div>
                <Label className="font-medium text-sm">Last Updated</Label>
                <p className="text-muted-foreground text-sm">2025-01-01</p>
              </div>
              <div>
                <Label className="font-medium text-sm">Cache Usage</Label>
                <p className="text-muted-foreground text-sm">245 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button onClick={handleResetSettings} type="button" variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button
            disabled={isSaving}
            onClick={handleSaveSettings}
            type="button"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
