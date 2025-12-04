/**
 * Global Search Component
 * Command palette with Cmd+K shortcut for quick navigation and search
 */

import { useNavigate } from "@tanstack/react-router";
import {
  Building,
  Calculator,
  Calendar,
  DollarSign,
  FileText,
  Globe,
  GraduationCap,
  Home,
  Plane,
  Plus,
  Receipt,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useBusinessContext } from "@/lib/business-context";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  type: "client" | "filing" | "document" | "page" | "action";
  icon?: typeof User;
  href?: string;
  onSelect?: () => void;
};

// Navigation pages
const navigationPages: SearchResult[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    type: "page",
    icon: Home,
    href: "/dashboard",
  },
  {
    id: "clients",
    title: "Clients",
    type: "page",
    icon: Users,
    href: "/clients",
  },
  {
    id: "filings",
    title: "Filings",
    type: "page",
    icon: FileText,
    href: "/filings",
  },
  {
    id: "documents",
    title: "Documents",
    type: "page",
    icon: FileText,
    href: "/documents",
  },
  {
    id: "calendar",
    title: "Calendar",
    type: "page",
    icon: Calendar,
    href: "/calendar",
  },
  {
    id: "settings",
    title: "Settings",
    type: "page",
    icon: Settings,
    href: "/settings",
  },
];

// KAJ-specific pages
const kajPages: SearchResult[] = [
  {
    id: "tax-services",
    title: "Tax Services",
    type: "page",
    icon: Calculator,
    href: "/tax",
  },
  {
    id: "payroll",
    title: "NIS & Payroll",
    type: "page",
    icon: DollarSign,
    href: "/payroll",
  },
  {
    id: "invoices",
    title: "Invoices",
    type: "page",
    icon: Receipt,
    href: "/invoices",
  },
];

// GCMC-specific pages
const gcmcPages: SearchResult[] = [
  {
    id: "immigration",
    title: "Immigration",
    type: "page",
    icon: Plane,
    href: "/immigration",
  },
  {
    id: "training",
    title: "Training",
    type: "page",
    icon: GraduationCap,
    href: "/training",
  },
  {
    id: "local-content",
    title: "Local Content",
    type: "page",
    icon: Building,
    href: "/local-content",
  },
];

// Quick actions
const quickActions: SearchResult[] = [
  {
    id: "new-client",
    title: "New Client",
    subtitle: "Add a new client",
    type: "action",
    icon: Plus,
    href: "/clients/new",
  },
  {
    id: "new-filing",
    title: "New Filing",
    subtitle: "Create a new filing",
    type: "action",
    icon: Plus,
    href: "/filings/new",
  },
  {
    id: "new-document",
    title: "Upload Document",
    subtitle: "Upload a new document",
    type: "action",
    icon: Plus,
    href: "/documents/upload",
  },
];

type GlobalSearchProps = {
  className?: string;
};

// Business display names
const businessNames: Record<string, string> = {
  kaj: "KAJ Financial",
  gcmc: "GCMC Consultancy",
};

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessContext();
  const businessHeading = activeBusiness
    ? (businessNames[activeBusiness] ?? "All Services")
    : "All Services";

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");
      if (result.onSelect) {
        result.onSelect();
      } else if (result.href) {
        navigate({ to: result.href });
      }
    },
    [navigate]
  );

  // Filter business-specific pages based on context
  const getBusinessPages = () => {
    if (activeBusiness === "kaj") return kajPages;
    if (activeBusiness === "gcmc") return gcmcPages;
    return [...kajPages, ...gcmcPages];
  };
  const businessPages = getBusinessPages();

  return (
    <>
      {/* Search trigger button */}
      <button
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm",
          "rounded-lg border transition-colors hover:bg-muted/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command dialog */}
      <CommandDialog onOpenChange={setOpen} open={open}>
        <CommandInput
          onValueChange={setQuery}
          placeholder="Search clients, filings, pages..."
          value={query}
        />
        <CommandList>
          <CommandEmpty>
            <div className="py-6 text-center text-sm">
              <p>No results found for "{query}"</p>
              <p className="mt-1 text-muted-foreground">
                Try searching for clients, filings, or pages
              </p>
            </div>
          </CommandEmpty>

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions">
            {quickActions.map((action) => (
              <CommandItem
                className="flex items-center gap-2"
                key={action.id}
                onSelect={() => handleSelect(action)}
                value={action.title}
              >
                {action.icon && (
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex flex-col">
                  <span>{action.title}</span>
                  {action.subtitle && (
                    <span className="text-muted-foreground text-xs">
                      {action.subtitle}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            {navigationPages.map((page) => (
              <CommandItem
                className="flex items-center gap-2"
                key={page.id}
                onSelect={() => handleSelect(page)}
                value={page.title}
              >
                {page.icon && (
                  <page.icon className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{page.title}</span>
                {page.id === "dashboard" && (
                  <CommandShortcut>G D</CommandShortcut>
                )}
                {page.id === "clients" && (
                  <CommandShortcut>G C</CommandShortcut>
                )}
                {page.id === "filings" && (
                  <CommandShortcut>G F</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Business-specific pages */}
          <CommandGroup heading={businessHeading}>
            {businessPages.map((page) => (
              <CommandItem
                className="flex items-center gap-2"
                key={page.id}
                onSelect={() => handleSelect(page)}
                value={page.title}
              >
                {page.icon && (
                  <page.icon className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{page.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Recent searches / clients (placeholder) */}
          <CommandGroup heading="Recent Clients">
            <CommandItem
              className="text-muted-foreground text-sm"
              disabled
              value="Recent clients placeholder"
            >
              <User className="mr-2 h-4 w-4" />
              Start typing to search clients...
            </CommandItem>
          </CommandGroup>
        </CommandList>

        {/* Footer with keyboard hints */}
        <div className="flex items-center justify-between border-t px-4 py-3 text-muted-foreground text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1.5 py-0.5">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1.5 py-0.5">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1.5 py-0.5">Esc</kbd>
              Close
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {activeBusiness === "all" ? "All" : activeBusiness.toUpperCase()}
          </span>
        </div>
      </CommandDialog>
    </>
  );
}

// Standalone search button for header
export function SearchButton({ className }: { className?: string }) {
  const [, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <button
      aria-label="Search (⌘K)"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md",
        "transition-colors hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      onClick={() => setOpen(true)}
    >
      <Search className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
