import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CreditCard,
  Database,
  Globe,
  Key,
  Palette,
  Search,
  Settings,
  Shield,
  User,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const settingsNavItems = [
  {
    title: "General",
    href: "/settings",
    icon: Settings,
    description: "Basic application settings",
  },
  {
    title: "Profile",
    href: "/settings/profile",
    icon: User,
    description: "Personal information and preferences",
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: Shield,
    description: "Password, 2FA, and security options",
    badge: "2FA Required",
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Email, SMS, and in-app notifications",
  },
  {
    title: "Appearance",
    href: "/settings/appearance",
    icon: Palette,
    description: "Theme, colors, and language",
  },
  {
    title: "Integrations",
    href: "/settings/integrations",
    icon: Zap,
    description: "External services and API connections",
    badge: "3 Active",
  },
  {
    title: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
    description: "Subscription and payment methods",
  },
  {
    title: "Backup & Data",
    href: "/settings/backup",
    icon: Database,
    description: "Export, backup, and data management",
  },
];

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = settingsNavItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and preferences.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Settings Navigation */}
        <div className="lg:col-span-3">
          <div className="sticky top-8 space-y-4">
            {/* Search Settings */}
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings..."
                value={searchQuery}
              />
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;

                return (
                  <Link
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                    key={item.href}
                    to={item.href}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.title}</span>
                        {item.badge && (
                          <Badge className="ml-2 text-xs" variant="secondary">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-muted-foreground text-xs">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Quick Actions</h3>
              <div className="space-y-1">
                <Button
                  className="w-full justify-start text-sm"
                  size="sm"
                  variant="ghost"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Export Settings
                </Button>
                <Button
                  className="w-full justify-start text-sm"
                  size="sm"
                  variant="ghost"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Generate API Key
                </Button>
                <Button
                  className="w-full justify-start text-destructive text-sm hover:text-destructive"
                  size="sm"
                  variant="ghost"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Reset All Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
