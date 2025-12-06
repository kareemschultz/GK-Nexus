import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Copy,
  Home,
  MoreHorizontal,
  Share,
  Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ElementType;
  onClick?: () => void;
  metadata?: {
    type?: "page" | "section" | "item";
    status?: string;
    favorite?: boolean;
    lastVisited?: Date;
  };
}

interface SmartBreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (item: BreadcrumbItem) => void;
  showActions?: boolean;
  showMetadata?: boolean;
  showBackButton?: boolean;
  collapsible?: boolean;
  maxVisibleItems?: number;
  className?: string;
}

export function SmartBreadcrumbs({
  items = [],
  onNavigate,
  showActions = true,
  showMetadata = false,
  showBackButton = false,
  collapsible = true,
  maxVisibleItems = 4,
  className = "",
}: SmartBreadcrumbsProps) {
  const [showCollapsed, setShowCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("gk-nexus-favorite-paths");
    return saved ? JSON.parse(saved) : [];
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (onNavigate) {
      onNavigate(item);
    }
  };

  const shouldCollapse = collapsible && items.length > maxVisibleItems;

  const visibleItems =
    shouldCollapse && !showCollapsed
      ? [
          ...items.slice(0, 1), // First item (usually home)
          ...items.slice(-2), // Last 2 items
        ]
      : items;

  const collapsedItems = shouldCollapse
    ? items.slice(1, -2) // Middle items that are hidden
    : [];

  const getCurrentPath = () => items.map((item) => item.label).join(" > ");

  const toggleFavorite = (itemId: string) => {
    const updated = favorites.includes(itemId)
      ? favorites.filter((id) => id !== itemId)
      : [...favorites, itemId];

    setFavorites(updated);
    localStorage.setItem("gk-nexus-favorite-paths", JSON.stringify(updated));
  };

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentPath());
    } catch (err) {
      console.error("Failed to copy path:", err);
    }
  };

  const sharePath = () => {
    if (navigator.share && items.length > 0) {
      const currentItem = items[items.length - 1];
      navigator.share({
        title: currentItem.label,
        text: getCurrentPath(),
        url: window.location.href,
      });
    }
  };

  const currentItem = items[items.length - 1];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Back Button */}
      {showBackButton && items.length > 1 && (
        <Button
          className="flex items-center gap-1 px-2"
          onClick={() => {
            const previousItem = items[items.length - 2];
            if (previousItem) {
              handleItemClick(previousItem);
            }
          }}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-1 items-center space-x-1"
      >
        <ol className="flex min-w-0 items-center space-x-1">
          {/* Render visible items */}
          {visibleItems.map((item, index) => {
            const isLast = index === visibleItems.length - 1;
            const actualIndex =
              shouldCollapse && !showCollapsed && index > 0
                ? items.length - (visibleItems.length - index)
                : index;
            const showCollapsedIndicator =
              shouldCollapse && !showCollapsed && index === 1;

            return (
              <li className="flex items-center" key={item.id || index}>
                {/* Collapsed items indicator */}
                {showCollapsedIndicator && (
                  <>
                    <div className="relative">
                      <Button
                        className="h-auto px-2 py-1"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        ref={buttonRef}
                        size="sm"
                        variant="ghost"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>

                      {/* Dropdown with collapsed items */}
                      {dropdownOpen && (
                        <Card
                          className="absolute top-full left-0 z-50 mt-1 min-w-48 shadow-lg"
                          ref={dropdownRef}
                        >
                          <CardContent className="p-2">
                            <div className="space-y-1">
                              {collapsedItems.map(
                                (collapsedItem, collapsedIndex) => {
                                  const IconComponent = collapsedItem.icon;
                                  return (
                                    <Button
                                      className="h-auto w-full justify-start py-2"
                                      key={collapsedItem.id || collapsedIndex}
                                      onClick={() => {
                                        handleItemClick(collapsedItem);
                                        setDropdownOpen(false);
                                      }}
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <div className="flex w-full min-w-0 items-center gap-2">
                                        {IconComponent && (
                                          <IconComponent className="h-4 w-4 flex-shrink-0" />
                                        )}
                                        <span className="truncate text-sm">
                                          {collapsedItem.label}
                                        </span>
                                        {collapsedItem.metadata?.favorite && (
                                          <Star className="h-3 w-3 flex-shrink-0 text-yellow-500" />
                                        )}
                                      </div>
                                    </Button>
                                  );
                                }
                              )}

                              <Separator className="my-2" />

                              <Button
                                className="w-full justify-start text-muted-foreground text-xs"
                                onClick={() => {
                                  setShowCollapsed(true);
                                  setDropdownOpen(false);
                                }}
                                size="sm"
                                variant="ghost"
                              >
                                Show all items
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <ChevronRight className="mx-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </>
                )}

                {/* Breadcrumb Item */}
                <div className="flex min-w-0 items-center gap-1">
                  <Button
                    className={`h-auto min-w-0 max-w-48 px-2 py-1 ${
                      isLast
                        ? "cursor-default text-foreground hover:bg-transparent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    disabled={isLast}
                    onClick={() => handleItemClick(item)}
                    size="sm"
                    variant="ghost"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {item.icon && actualIndex === 0 ? (
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                      ) : actualIndex === 0 ? (
                        <Home className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        item.icon && (
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                        )
                      )}

                      <span className="truncate font-medium text-sm">
                        {item.label}
                      </span>

                      {/* Metadata badges */}
                      {showMetadata && item.metadata && (
                        <div className="flex flex-shrink-0 items-center gap-1">
                          {item.metadata.favorite && (
                            <Star className="h-3 w-3 text-yellow-500" />
                          )}
                          {item.metadata.status && (
                            <Badge className="px-1 text-xs" variant="secondary">
                              {item.metadata.status}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Button>
                </div>

                {/* Separator */}
                {!isLast && (
                  <ChevronRight className="mx-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
              </li>
            );
          })}
        </ol>

        {/* Show All Button */}
        {shouldCollapse && !showCollapsed && (
          <Button
            className="px-2 text-muted-foreground text-xs"
            onClick={() => setShowCollapsed(true)}
            size="sm"
            variant="ghost"
          >
            Show all
          </Button>
        )}

        {/* Collapse Button */}
        {shouldCollapse && showCollapsed && items.length > maxVisibleItems && (
          <Button
            className="px-2 text-muted-foreground text-xs"
            onClick={() => setShowCollapsed(false)}
            size="sm"
            variant="ghost"
          >
            Collapse
          </Button>
        )}
      </nav>

      {/* Actions */}
      {showActions && currentItem && (
        <div className="flex flex-shrink-0 items-center gap-1">
          <Button
            className="h-8 w-8 p-0"
            onClick={() => toggleFavorite(currentItem.id)}
            size="sm"
            title={
              favorites.includes(currentItem.id)
                ? "Remove from favorites"
                : "Add to favorites"
            }
            variant="ghost"
          >
            <Star
              className={`h-4 w-4 ${
                favorites.includes(currentItem.id)
                  ? "fill-yellow-500 text-yellow-500"
                  : ""
              }`}
            />
          </Button>

          <Button
            className="h-8 w-8 p-0"
            onClick={copyPath}
            size="sm"
            title="Copy path"
            variant="ghost"
          >
            <Copy className="h-4 w-4" />
          </Button>

          {typeof navigator !== "undefined" && navigator.share && (
            <Button
              className="h-8 w-8 p-0"
              onClick={sharePath}
              size="sm"
              title="Share"
              variant="ghost"
            >
              <Share className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Compact breadcrumbs for mobile or tight spaces
export function CompactBreadcrumbs({
  items,
  onNavigate,
  showBackButton = true,
}: {
  items: BreadcrumbItem[];
  onNavigate?: (item: BreadcrumbItem) => void;
  showBackButton?: boolean;
}) {
  if (items.length === 0) return null;

  const currentItem = items[items.length - 1];
  const parentItem = items.length > 1 ? items[items.length - 2] : null;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {showBackButton && parentItem && (
        <Button
          className="h-8 w-8 flex-shrink-0 p-0"
          onClick={() => onNavigate?.(parentItem)}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      <div className="min-w-0 flex-1">
        {parentItem && (
          <div className="mb-1 truncate text-muted-foreground text-xs">
            {parentItem.label}
          </div>
        )}
        <div className="truncate font-medium text-sm">{currentItem.label}</div>
      </div>
    </div>
  );
}

// Recently visited items component
export function RecentlyVisited({
  maxItems = 5,
  onNavigate,
  className = "",
}: {
  maxItems?: number;
  onNavigate?: (item: BreadcrumbItem) => void;
  className?: string;
}) {
  const [recentItems, setRecentItems] = useState<BreadcrumbItem[]>(() => {
    const saved = localStorage.getItem("gk-nexus-recent-paths");
    return saved ? JSON.parse(saved) : [];
  });

  const handleNavigate = (item: BreadcrumbItem) => {
    // Move to front of recent items
    const updated = [
      item,
      ...recentItems.filter((i) => i.id !== item.id),
    ].slice(0, maxItems);
    setRecentItems(updated);
    localStorage.setItem("gk-nexus-recent-paths", JSON.stringify(updated));
    onNavigate?.(item);
  };

  const clearRecent = () => {
    setRecentItems([]);
    localStorage.removeItem("gk-nexus-recent-paths");
  };

  if (recentItems.length === 0) return null;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Recently Visited</h3>
          </div>
          <Button
            className="text-muted-foreground text-xs"
            onClick={clearRecent}
            size="sm"
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        <div className="space-y-1">
          {recentItems.slice(0, maxItems).map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Button
                className="h-auto w-full justify-start py-2"
                key={item.id || index}
                onClick={() => handleNavigate(item)}
                size="sm"
                variant="ghost"
              >
                <div className="flex w-full min-w-0 items-center gap-2">
                  {IconComponent ? (
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 flex-shrink-0 rounded bg-muted" />
                  )}
                  <span className="truncate text-sm">{item.label}</span>
                  {item.metadata?.lastVisited && (
                    <span className="flex-shrink-0 text-muted-foreground text-xs">
                      {formatRelativeTime(item.metadata.lastVisited)}
                    </span>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// Hook for managing breadcrumb navigation
export function useBreadcrumbs() {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);

  const updateBreadcrumbs = (newItems: BreadcrumbItem[]) => {
    setItems(newItems);

    // Update recently visited
    if (newItems.length > 0) {
      const currentItem = {
        ...newItems[newItems.length - 1],
        metadata: {
          ...newItems[newItems.length - 1].metadata,
          lastVisited: new Date(),
        },
      };

      const recentItems = JSON.parse(
        localStorage.getItem("gk-nexus-recent-paths") || "[]"
      );
      const updated = [
        currentItem,
        ...recentItems.filter((i: BreadcrumbItem) => i.id !== currentItem.id),
      ].slice(0, 10);
      localStorage.setItem("gk-nexus-recent-paths", JSON.stringify(updated));
    }
  };

  const pushBreadcrumb = (item: BreadcrumbItem) => {
    setItems((prev) => [...prev, item]);
  };

  const popBreadcrumb = () => {
    setItems((prev) => prev.slice(0, -1));
  };

  const setBreadcrumbAt = (index: number, item: BreadcrumbItem) => {
    setItems((prev) => [
      ...prev.slice(0, index),
      item,
      ...prev.slice(index + 1),
    ]);
  };

  return {
    items,
    updateBreadcrumbs,
    pushBreadcrumb,
    popBreadcrumb,
    setBreadcrumbAt,
  };
}
