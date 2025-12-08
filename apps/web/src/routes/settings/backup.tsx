import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  RotateCcw,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SettingsLayout } from "@/components/settings-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
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

function RouteComponent() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [backupRetention, setBackupRetention] = useState("30");
  const [backupLocation, setBackupLocation] = useState("cloud");

  const [includeClients, setIncludeClients] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [includeInvoices, setIncludeInvoices] = useState(true);
  const [includeCalculations, setIncludeCalculations] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);

  // Fetch backup list from API
  const backupsQuery = useQuery({
    queryKey: ["backups"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return (client as any).backupList({
        page: 1,
        pageSize: 20,
      });
    },
  });

  // Fetch storage stats from API
  const storageStatsQuery = useQuery({
    queryKey: ["backupStorageStats"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return (client as any).backupGetStorageStats();
    },
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const { client } = await import("@/utils/orpc");
      return (client as any).backupCreate({
        name: `Manual Backup - ${new Date().toLocaleDateString()}`,
        description: "Manual backup created from settings",
        includeData: {
          clients: includeClients,
          documents: includeDocuments,
          invoices: includeInvoices,
          calculations: includeCalculations,
          settings: includeSettings,
        },
        storageLocation: backupLocation,
      });
    },
    onSuccess: () => {
      toast.success("Backup created successfully!");
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      queryClient.invalidateQueries({ queryKey: ["backupStorageStats"] });
    },
    onError: (error) => {
      toast.error(`Failed to create backup: ${error.message}`);
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const { client } = await import("@/utils/orpc");
      return (client as any).backupDelete({ id: backupId });
    },
    onSuccess: () => {
      toast.success("Backup deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      queryClient.invalidateQueries({ queryKey: ["backupStorageStats"] });
    },
    onError: (error) => {
      toast.error(`Failed to delete backup: ${error.message}`);
    },
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const { client } = await import("@/utils/orpc");
      return (client as any).backupRestore({
        backupId,
        restoreOptions: {
          clients: includeClients,
          documents: includeDocuments,
          invoices: includeInvoices,
          calculations: includeCalculations,
          settings: includeSettings,
        },
      });
    },
    onSuccess: () => {
      toast.success("Restore completed successfully!");
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
    onError: (error) => {
      toast.error(`Failed to restore backup: ${error.message}`);
    },
  });

  // Export settings mutation
  const exportSettingsMutation = useMutation({
    mutationFn: async (format: string) => {
      const { client } = await import("@/utils/orpc");
      return (client as any).backupExportSettings({ format });
    },
    onSuccess: (data) => {
      // Download the exported file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gk-nexus-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Export completed successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to export data: ${error.message}`);
    },
  });

  const handleBackupNow = () => {
    createBackupMutation.mutate();
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const { client } = await import("@/utils/orpc");
      const backup = await (client as any).backupGetById({ id: backupId });
      if (backup?.downloadUrl) {
        window.open(backup.downloadUrl, "_blank");
      } else {
        // Simulate download with backup data
        const blob = new Blob([JSON.stringify(backup, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup-${backupId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download backup");
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    deleteBackupMutation.mutate(backupId);
  };

  const handleRestoreBackup = (backupId: string) => {
    restoreBackupMutation.mutate(backupId);
  };

  const handleExportData = (format: string) => {
    exportSettingsMutation.mutate(format);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data = JSON.parse(content);
      // Call restore with the imported data
      const { client } = await import("@/utils/orpc");
      await (client as any).backupRestore({
        importData: data,
        restoreOptions: {
          clients: true,
          documents: true,
          invoices: true,
          calculations: true,
          settings: true,
        },
      });
      toast.success("Data imported successfully!");
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    } catch (error) {
      toast.error("Failed to import data. Please check the file format.");
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const backups = backupsQuery.data?.backups || [];
  const storageStats = storageStatsQuery.data || {
    usedBytes: 0,
    totalBytes: 53_687_091_200, // 50 GB default
    backupCount: 0,
    lastBackupAt: null,
  };
  const storagePercent =
    (storageStats.usedBytes / storageStats.totalBytes) * 100;

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
                  {storageStatsQuery.isLoading ? (
                    <Skeleton className="mt-2 h-6 w-24" />
                  ) : (
                    <>
                      <p className="mt-2 font-semibold">
                        {storageStats.lastBackupAt
                          ? formatDate(storageStats.lastBackupAt)
                          : "No backups yet"}
                      </p>
                    </>
                  )}
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      Storage Used
                    </span>
                  </div>
                  {storageStatsQuery.isLoading ? (
                    <Skeleton className="mt-2 h-6 w-24" />
                  ) : (
                    <>
                      <p className="mt-2 font-semibold">
                        {formatBytes(storageStats.usedBytes)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        of {formatBytes(storageStats.totalBytes)}
                      </p>
                    </>
                  )}
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      Total Backups
                    </span>
                  </div>
                  {storageStatsQuery.isLoading ? (
                    <Skeleton className="mt-2 h-6 w-16" />
                  ) : (
                    <>
                      <p className="mt-2 font-semibold">
                        {storageStats.backupCount}
                      </p>
                      <p className="text-muted-foreground text-xs">stored</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Storage Usage</span>
                  <span>{storagePercent.toFixed(1)}%</span>
                </div>
                <Progress value={storagePercent} />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                disabled={createBackupMutation.isPending}
                onClick={handleBackupNow}
              >
                {createBackupMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating backup...
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
              {backupsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton className="h-16 w-full" key={`skeleton-${i}`} />
                  ))}
                </div>
              ) : backups.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Archive className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No backups yet</p>
                  <p className="text-sm">
                    Create your first backup to see it here
                  </p>
                </div>
              ) : (
                backups.map(
                  (backup: {
                    id: string;
                    name: string;
                    createdAt: string;
                    sizeBytes: number;
                    type: string;
                    status: string;
                  }) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-4"
                      key={backup.id}
                    >
                      <div className="flex items-center gap-4">
                        <Archive className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {backup.name || formatDate(backup.createdAt)}
                          </p>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <span>{formatBytes(backup.sizeBytes || 0)}</span>
                            <span>•</span>
                            <Badge variant="outline">
                              {backup.type || "manual"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            backup.status === "COMPLETED"
                              ? "default"
                              : backup.status === "FAILED"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          <Check className="mr-1 h-3 w-3" />
                          {backup.status?.toLowerCase() || "completed"}
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Restore Backup
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to restore this backup?
                                This will overwrite current data with the backup
                                data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRestoreBackup(backup.id)}
                              >
                                Restore
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          onClick={() => handleDownloadBackup(backup.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this backup?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteBackup(backup.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )
                )
              )}
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
                  disabled={exportSettingsMutation.isPending}
                  onClick={() => handleExportData("csv")}
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
                  disabled={exportSettingsMutation.isPending}
                  onClick={() => handleExportData("json")}
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
                  disabled={exportSettingsMutation.isPending}
                  onClick={() => handleExportData("pdf")}
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
              <input
                accept=".csv,.json,.zip"
                className="hidden"
                onChange={handleFileUpload}
                ref={fileInputRef}
                type="file"
              />
              <div
                className="cursor-pointer rounded-lg border-2 border-muted-foreground/25 border-dashed p-8 text-center transition-colors hover:border-muted-foreground/50"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="font-medium">
                  Drop files here or click to upload
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Supports .csv, .json, or .zip backup files
                </p>
                <Button
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  variant="outline"
                >
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
