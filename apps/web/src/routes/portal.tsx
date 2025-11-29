import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import {
  Bell,
  Calendar,
  CreditCard,
  FileText,
  HelpCircle,
  Home,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

const navigation = [
  {
    name: "Dashboard",
    href: "/portal",
    icon: Home,
    description: "Overview of your account",
  },
  {
    name: "Profile",
    href: "/portal/profile",
    icon: User,
    description: "Manage your personal information",
  },
  {
    name: "Documents",
    href: "/portal/documents",
    icon: FileText,
    description: "Access your files and documents",
  },
  {
    name: "Appointments",
    href: "/portal/appointments",
    icon: Calendar,
    description: "Schedule and manage meetings",
  },
  {
    name: "Filing Status",
    href: "/portal/filings",
    icon: Settings,
    description: "Track GRA submissions and compliance",
  },
  {
    name: "Payments",
    href: "/portal/payments",
    icon: CreditCard,
    description: "View invoices and payment history",
  },
];

function PortalLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock user data - in real app this would come from auth context
  const user = {
    name: "John Smith",
    email: "john.smith@example.com",
    avatar: "",
    company: "Smith Enterprises Ltd.",
    notifications: 3,
  };

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Company Name */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="font-bold text-primary-foreground text-sm">
                    GK
                  </span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-semibold text-foreground text-lg">
                    GK-Nexus
                  </h1>
                  <p className="text-muted-foreground text-xs">Client Portal</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav
              aria-label="Main navigation"
              className="hidden items-center space-x-1 md:flex"
            >
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPath === item.href ||
                  (item.href !== "/portal" &&
                    currentPath.startsWith(item.href));

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center space-x-2 rounded-md px-3 py-2 font-medium text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    key={item.name}
                    to={item.href}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu and Controls */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button
                aria-label="Notifications"
                className="relative"
                size="sm"
                variant="ghost"
              >
                <Bell className="h-4 w-4" />
                {user.notifications > 0 && (
                  <Badge
                    aria-label={`${user.notifications} unread notifications`}
                    className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                    variant="destructive"
                  >
                    {user.notifications}
                  </Badge>
                )}
              </Button>

              {/* Help */}
              <Button aria-label="Help" size="sm" variant="ghost">
                <HelpCircle className="h-4 w-4" />
              </Button>

              {/* Theme Toggle */}
              <ModeToggle />

              {/* User Avatar */}
              <div className="flex items-center space-x-3">
                <div className="hidden text-right sm:block">
                  <p className="font-medium text-foreground text-sm">
                    {user.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {user.company}
                  </p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage alt={user.name} src={user.avatar} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Mobile Menu Button */}
              <Sheet onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    aria-label="Open menu"
                    className="md:hidden"
                    size="sm"
                    variant="ghost"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-80" side="right">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <span className="font-bold text-primary-foreground text-sm">
                          GK
                        </span>
                      </div>
                      <span className="font-semibold text-lg">Menu</span>
                    </div>
                    <Button
                      aria-label="Close menu"
                      onClick={() => setMobileMenuOpen(false)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* User Info */}
                  <div className="mb-6 flex items-center space-x-3 rounded-lg bg-muted p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage alt={user.name} src={user.avatar} />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {user.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {user.company}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <nav aria-label="Mobile navigation" className="space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        currentPath === item.href ||
                        (item.href !== "/portal" &&
                          currentPath.startsWith(item.href));

                      return (
                        <Link
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex items-center space-x-3 rounded-lg px-4 py-3 font-medium text-sm transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                          key={item.name}
                          onClick={() => setMobileMenuOpen(false)}
                          to={item.href}
                        >
                          <Icon aria-hidden="true" className="h-5 w-5" />
                          <div>
                            <div>{item.name}</div>
                            <div className="text-xs opacity-75">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="container mx-auto px-4 py-8 sm:px-6 lg:px-8"
        id="main-content"
      >
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t bg-muted/50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-4 font-semibold text-foreground text-sm">
                Support
              </h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <a
                    className="transition-colors hover:text-foreground"
                    href="#"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    className="transition-colors hover:text-foreground"
                    href="#"
                  >
                    Contact Support
                  </a>
                </li>
                <li>
                  <a
                    className="transition-colors hover:text-foreground"
                    href="#"
                  >
                    FAQs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-foreground text-sm">
                Resources
              </h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <a
                    className="transition-colors hover:text-foreground"
                    href="#"
                  >
                    Tax Calendar
                  </a>
                </li>
                <li>
                  <a
                    className="transition-colors hover:text-foreground"
                    href="#"
                  >
                    Compliance Guide
                  </a>
                </li>
                <li>
                  <a
                    className="transition-colors hover:text-foreground"
                    href="#"
                  >
                    Forms Library
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-foreground text-sm">
                Company
              </h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <a
                    className="transition-colors hover:text-foreground"
                    href="#"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    className="transition-colors hover:text-foreground"
                    href="#"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    className="transition-colors hover:text-foreground"
                    href="#"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-muted-foreground text-sm">
            <p>&copy; 2024 GK-Nexus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
