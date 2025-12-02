import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Check,
  Languages,
  Moon,
  Palette,
  Save,
  Sun,
  SunMoon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SettingsLayout } from "@/components/settings-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings/appearance")({
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

const themes = [
  { id: "light", name: "Light", icon: Sun },
  { id: "dark", name: "Dark", icon: Moon },
  { id: "system", name: "System", icon: SunMoon },
] as const;

const accentColors = [
  { id: "blue", name: "Blue", color: "#3b82f6" },
  { id: "green", name: "Green", color: "#22c55e" },
  { id: "purple", name: "Purple", color: "#a855f7" },
  { id: "orange", name: "Orange", color: "#f97316" },
  { id: "red", name: "Red", color: "#ef4444" },
  { id: "pink", name: "Pink", color: "#ec4899" },
];

function RouteComponent() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [accentColor, setAccentColor] = useState("blue");
  const [language, setLanguage] = useState("en");
  const [fontSize, setFontSize] = useState([16]);
  const [compactMode, setCompactMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(
        "appearance-settings",
        JSON.stringify({
          theme,
          accentColor,
          language,
          fontSize: fontSize[0],
          compactMode,
        })
      );
      toast.success("Appearance settings saved successfully");
    } catch (error) {
      toast.error("Failed to save appearance settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold text-2xl">Appearance</h2>
          <p className="text-muted-foreground">
            Customize the look and feel of your application.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme
              </CardTitle>
              <CardDescription>
                Choose your preferred color scheme for the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {themes.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      className={cn(
                        "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-primary/50",
                        theme === t.id
                          ? "border-primary bg-primary/10"
                          : "border-muted"
                      )}
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      type="button"
                    >
                      <Icon className="h-6 w-6" />
                      <span className="font-medium text-sm">{t.name}</span>
                      {theme === t.id && (
                        <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Accent Color */}
          <Card>
            <CardHeader>
              <CardTitle>Accent Color</CardTitle>
              <CardDescription>
                Choose the primary accent color for buttons and interactive
                elements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {accentColors.map((color) => (
                  <button
                    className={cn(
                      "relative h-10 w-10 rounded-full transition-all hover:scale-110",
                      accentColor === color.id && "ring-2 ring-offset-2"
                    )}
                    key={color.id}
                    onClick={() => setAccentColor(color.id)}
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                    type="button"
                  >
                    {accentColor === color.id && (
                      <Check className="absolute inset-0 m-auto h-5 w-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Language
              </CardTitle>
              <CardDescription>
                Select your preferred language for the interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Display Language</Label>
                <Select onValueChange={setLanguage} value={language}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Select defaultValue="mdy">
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-format">Time Format</Label>
                <Select defaultValue="12h">
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Font Size */}
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Adjust the display size and density of the interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Font Size</Label>
                  <span className="text-muted-foreground text-sm">
                    {fontSize[0]}px
                  </span>
                </div>
                <Slider
                  max={24}
                  min={12}
                  onValueChange={setFontSize}
                  step={1}
                  value={fontSize}
                />
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Small</span>
                  <span>Default</span>
                  <span>Large</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-muted-foreground text-xs">
                    Reduce padding and spacing for a denser layout
                  </p>
                </div>
                <Button
                  onClick={() => setCompactMode(!compactMode)}
                  size="sm"
                  variant={compactMode ? "default" : "outline"}
                >
                  {compactMode ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button disabled={isSaving} onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
