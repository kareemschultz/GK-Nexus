import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Archive,
  Calendar,
  Check,
  Clock,
  Cloud,
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Shield,
  Trash2,
  Upload,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings/backup")({
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

const backupHistory = [
  {
    id: "1",
    date: "Jan 15, 2024 - 03:00 AM",
    size: "2.3 GB",
    type: "automatic",
    status: "completed",
  },
  {
    id: "2",
    date: "Jan 14, 2024 - 03:00 AM",
    size: "2.2 GB",
    type: "automatic",
    status: "completed",
  },
  {
    id: "3",
    date: "Jan 13, 2024 - 10:30 AM",
    size: "2.2 GB",
    type: "manual",
    status: "completed",
  },
  {
    id: "4",
    date: "Jan 12, 2024 - 03:00 AM",
    size: "2.1 GB",
    type: "automatic",
    status: "completed",
  },
];

function RouteComponent() {
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [backupRetention, setBackupRetention] = useState("30");
  const [backupLocation, setBackupLocation] = useState("cloud");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  const [includeClients, setIncludeClients] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [includeInvoices, setIncludeInvoices] = useState(true);
  const [includeCalculations, setIncludeCalculations] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          toast.success("Backup completed successfully!");
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleDownloadBackup = (backupId: string) => {
    toast.success(`Downloading backup ${backupId}...`);
  };

  const handleDeleteBackup = (backupId: string) => {
    toast.success(`Backup ${backupId} deleted`);
  };

  const handleExportData = (format: string) => {
    toast.success(`Exporting data as ${format}...`);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold text-2xl">Backup & Data</h2>
          <p className="text-muted-foreground">
            Manage backups, exports, and data retention settings.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Backup Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Backup Status
              </CardTitle>
              <CardDescription>
                Monitor your backup health and storage usage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      Last Backup
                    </span>
                  </div>
                  <p className="mt-2 font-semibold">Jan 15, 2024</p>
                  <p className="text-muted-foreground text-xs">03:00 AM</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      Storage Used
                    </span>
                  </div>
                  <p className="mt-2 font-semibold">15.6 GB</p>
                  <p className="text-muted-foreground text-xs">of 50 GB</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      Total Backups
                    </span>
                  </div>
                  <p className="mt-2 font-semibold">7</p>
                  <p className="text-muted-foreground text-xs">stored</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Storage Usage</span>
                  <span>31.2%</span>
                </div>
                <Progress value={31.2} />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button disabled={isBackingUp} onClick={handleBackupNow}>
                {isBackingUp ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Backing up... {backupProgress}%
                  </>
                ) : (
                  <>
                    <Cloud className="mr-2 h-4 w-4" />
                    Backup Now
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Backup Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup Configuration
              </CardTitle>
              <CardDescription>
                Configure automatic backup settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium">Automatic Backups</Label>
                  <p className="text-muted-foreground text-xs">
                    Enable scheduled automatic backups
                  </p>
                </div>
                <Checkbox
                  checked={autoBackup}
                  onCheckedChange={(checked) =>
                    setAutoBackup(checked as boolean)
                  }
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select
                    onValueChange={setBackupFrequency}
                    value={backupFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Retention Period</Label>
                  <Select
                    onValueChange={setBackupRetention}
                    value={backupRetention}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Backup Location</Label>
                <Select
                  onValueChange={setBackupLocation}
                  value={backupLocation}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloud">
                      Cloud Storage (Default)
                    </SelectItem>
                    <SelectItem value="google">Google Drive</SelectItem>
                    <SelectItem value="dropbox">Dropbox</SelectItem>
                    <SelectItem value="local">Local Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Backup Contents</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={includeClients}
                      id="clients"
                      onCheckedChange={(c) => setIncludeClients(c as boolean)}
                    />
                    <Label className="font-normal text-sm" htmlFor="clients">
                      Client Data
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={includeDocuments}
                      id="documents"
                      onCheckedChange={(c) => setIncludeDocuments(c as boolean)}
                    />
                    <Label className="font-normal text-sm" htmlFor="documents">
                      Documents
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={includeInvoices}
                      id="invoices"
                      onCheckedChange={(c) => setIncludeInvoices(c as boolean)}
                    />
                    <Label className="font-normal text-sm" htmlFor="invoices">
                      Invoices
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={includeCalculations}
                      id="calculations"
                      onCheckedChange={(c) =>
                        setIncludeCalculations(c as boolean)
                      }
                    />
                    <Label
                      className="font-normal text-sm"
                      htmlFor="calculations"
                    >
                      Tax Calculations
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={includeSettings}
                      id="settings"
                      onCheckedChange={(c) => setIncludeSettings(c as boolean)}
                    />
                    <Label className="font-normal text-sm" htmlFor="settings">
                      Settings & Preferences
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Backup History
              </CardTitle>
              <CardDescription>
                View and manage previous backups.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {backupHistory.map((backup) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={backup.id}
                >
                  <div className="flex items-center gap-4">
                    <Archive className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{backup.date}</p>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <span>{backup.size}</span>
                        <span>•</span>
                        <Badge variant="outline">{backup.type}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        backup.status === "completed" ? "default" : "secondary"
                      }
                    >
                      <Check className="mr-1 h-3 w-3" />
                      {backup.status}
                    </Badge>
                    <Button
                      onClick={() => handleDownloadBackup(backup.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteBackup(backup.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>
                Download your data in various formats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => handleExportData("CSV")}
                  variant="outline"
                >
                  <Download className="h-6 w-6" />
                  <span>Export as CSV</span>
                  <span className="text-muted-foreground text-xs">
                    Spreadsheet format
                  </span>
                </Button>
                <Button
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => handleExportData("JSON")}
                  variant="outline"
                >
                  <Download className="h-6 w-6" />
                  <span>Export as JSON</span>
                  <span className="text-muted-foreground text-xs">
                    Developer format
                  </span>
                </Button>
                <Button
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => handleExportData("PDF")}
                  variant="outline"
                >
                  <Download className="h-6 w-6" />
                  <span>Export as PDF</span>
                  <span className="text-muted-foreground text-xs">
                    Report format
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data
              </CardTitle>
              <CardDescription>
                Restore data from a backup or import from another system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-8 text-center">
                <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="font-medium">
                  Drop files here or click to upload
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Supports .csv, .json, or .zip backup files
                </p>
                <Button className="mt-4" variant="outline">
                  Select Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              All backups are encrypted using AES-256 encryption. Your data is
              secure during transfer and at rest.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </SettingsLayout>
  );
}
