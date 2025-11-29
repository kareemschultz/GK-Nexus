import {
  ArrowUpRight,
  Building2,
  Calculator,
  Clock,
  CreditCard,
  FileText,
  History,
  Search,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type SearchResultType =
  | "client"
  | "invoice"
  | "document"
  | "transaction"
  | "tax"
  | "user"
  | "setting";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: SearchResultType;
  url: string;
  metadata?: Record<string, any>;
  score?: number;
  lastAccessed?: Date;
  featured?: boolean;
}

interface SearchCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  count: number;
}

interface SmartSearchProps {
  placeholder?: string;
  categories?: SearchCategory[];
  onSearch?: (query: string, filters?: string[]) => SearchResult[];
  onSelectResult?: (result: SearchResult) => void;
  onClose?: () => void;
  recentSearches?: string[];
  suggestedSearches?: string[];
  maxResults?: number;
  showCategories?: boolean;
  showRecent?: boolean;
  showSuggestions?: boolean;
  autoFocus?: boolean;
  className?: string;
}

// Mock data for demonstration
const mockSearchData: SearchResult[] = [
  {
    id: "1",
    title: "ABC Corporation",
    description: "Client • Active • Georgetown, Guyana",
    type: "client",
    url: "/clients/abc-corporation",
    metadata: { status: "active", location: "Georgetown" },
    score: 0.95,
    featured: true,
  },
  {
    id: "2",
    title: "Invoice #INV-2024-001",
    description: "GYD 150,000 • Due Dec 15, 2024 • ABC Corporation",
    type: "invoice",
    url: "/invoices/inv-2024-001",
    metadata: { amount: 150_000, currency: "GYD", dueDate: "2024-12-15" },
    score: 0.88,
  },
  {
    id: "3",
    title: "VAT Calculation Guide",
    description: "Document • Updated Nov 2024",
    type: "document",
    url: "/documents/vat-guide",
    metadata: { lastModified: "2024-11-15" },
    score: 0.75,
  },
  {
    id: "4",
    title: "PAYE Tax Calculator",
    description: "Tool • Calculate employee taxes",
    type: "tax",
    url: "/tax/paye-calculator",
    metadata: { category: "calculator" },
    score: 0.82,
    featured: true,
  },
  {
    id: "5",
    title: "Bank Transfer - GT&T",
    description: "Transaction • GYD 45,000 • Nov 20, 2024",
    type: "transaction",
    url: "/transactions/gtt-transfer",
    metadata: { amount: 45_000, date: "2024-11-20" },
    score: 0.7,
  },
];

const defaultCategories: SearchCategory[] = [
  { id: "all", label: "All", icon: Search, count: 0 },
  { id: "client", label: "Clients", icon: Users, count: 0 },
  { id: "invoice", label: "Invoices", icon: FileText, count: 0 },
  { id: "tax", label: "Tax", icon: Calculator, count: 0 },
  { id: "transaction", label: "Transactions", icon: CreditCard, count: 0 },
  { id: "document", label: "Documents", icon: Building2, count: 0 },
];

export function SmartSearch({
  placeholder = "Search clients, invoices, documents...",
  categories = defaultCategories,
  onSearch,
  onSelectResult,
  onClose,
  recentSearches = [],
  suggestedSearches = [
    "Outstanding invoices",
    "VAT returns due",
    "PAYE calculations",
    "Monthly reports",
  ],
  maxResults = 8,
  showCategories = true,
  showRecent = true,
  showSuggestions = true,
  autoFocus = true,
  className = "",
}: SmartSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Perform search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    const searchFn = onSearch || defaultSearch;
    const searchResults = searchFn(
      query,
      selectedCategory !== "all" ? [selectedCategory] : []
    );

    // Simulate search delay for better UX
    setTimeout(() => {
      setResults(searchResults.slice(0, maxResults));
      setIsSearching(false);
      setSelectedIndex(-1);
    }, 200);
  }, [query, selectedCategory, maxResults, onSearch]);

  // Default search implementation
  const defaultSearch = (
    searchQuery: string,
    filters: string[] = []
  ): SearchResult[] => {
    const normalizedQuery = searchQuery.toLowerCase();

    return mockSearchData
      .filter((item) => {
        // Filter by category if specified
        if (filters.length > 0 && !filters.includes(item.type)) return false;

        // Search in title, description, and metadata
        return (
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery) ||
          Object.values(item.metadata || {}).some((value) =>
            String(value).toLowerCase().includes(normalizedQuery)
          )
        );
      })
      .sort((a, b) => {
        // Sort by score (relevance) and featured status
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.score || 0) - (a.score || 0);
      });
  };

  // Update category counts
  const categoriesWithCounts = useMemo(() => {
    if (!query) return categories;

    return categories.map((category) => {
      if (category.id === "all") {
        return { ...category, count: results.length };
      }

      const count = results.filter(
        (result) => result.type === category.id
      ).length;
      return { ...category, count };
    });
  }, [categories, results, query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelectResult(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult?.(result);
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
    onClose?.();
  };

  const getTypeIcon = (type: SearchResultType) => {
    switch (type) {
      case "client":
        return Users;
      case "invoice":
        return FileText;
      case "tax":
        return Calculator;
      case "transaction":
        return CreditCard;
      case "document":
        return Building2;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: SearchResultType) => {
    switch (type) {
      case "client":
        return "text-blue-600 bg-blue-50";
      case "invoice":
        return "text-green-600 bg-green-50";
      case "tax":
        return "text-purple-600 bg-purple-50";
      case "transaction":
        return "text-orange-600 bg-orange-50";
      case "document":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
        <Input
          autoFocus={autoFocus}
          className="pr-10 pl-10"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          ref={searchInputRef}
          value={query}
        />
        {(query || isOpen) && (
          <Button
            className="-translate-y-1/2 absolute top-1/2 right-1 h-6 w-6 transform p-0"
            onClick={handleClose}
            size="sm"
            variant="ghost"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={handleClose} />

          {/* Results Panel */}
          <Card className="absolute top-full right-0 left-0 z-50 mt-1 shadow-lg">
            <CardContent className="p-0">
              {/* Category Filters */}
              {showCategories && query && (
                <div className="border-b p-4">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {categoriesWithCounts.map((category) => {
                      const IconComponent = category.icon;
                      const isSelected = selectedCategory === category.id;
                      const hasResults = category.count > 0;

                      return (
                        <Button
                          className={`flex items-center gap-2 whitespace-nowrap ${
                            !hasResults && query ? "opacity-50" : ""
                          }`}
                          disabled={!hasResults && query}
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          size="sm"
                          variant={isSelected ? "secondary" : "ghost"}
                        >
                          <IconComponent className="h-3 w-3" />
                          {category.label}
                          {query && (
                            <Badge className="ml-1 text-xs" variant="secondary">
                              {category.count}
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              <ScrollArea className="max-h-96">
                {/* Search Results */}
                {query && (
                  <div className="p-2">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-primary border-b-2" />
                        <span className="ml-2 text-muted-foreground text-sm">
                          Searching...
                        </span>
                      </div>
                    ) : results.length > 0 ? (
                      <div className="space-y-1">
                        {results.map((result, index) => {
                          const TypeIcon = getTypeIcon(result.type);
                          const isSelected = index === selectedIndex;

                          return (
                            <div
                              className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ${
                                isSelected ? "bg-accent" : "hover:bg-accent/50"
                              }`}
                              key={result.id}
                              onClick={() => handleSelectResult(result)}
                              onMouseEnter={() => setSelectedIndex(index)}
                            >
                              <div
                                className={`rounded-md p-2 ${getTypeColor(result.type)}`}
                              >
                                <TypeIcon className="h-4 w-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="truncate font-medium text-sm">
                                    {result.title}
                                  </h4>
                                  {result.featured && (
                                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                                  )}
                                </div>
                                <p className="truncate text-muted-foreground text-xs">
                                  {result.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Search className="mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="font-medium text-sm">No results found</p>
                        <p className="text-muted-foreground text-xs">
                          Try adjusting your search terms or filters
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Searches */}
                {!query && showRecent && recentSearches.length > 0 && (
                  <div className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm">Recent Searches</h3>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.slice(0, 5).map((search, index) => (
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-accent"
                          key={index}
                          onClick={() => setQuery(search)}
                        >
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{search}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Searches */}
                {!query && showSuggestions && suggestedSearches.length > 0 && (
                  <div className="p-4">
                    {recentSearches.length > 0 && (
                      <Separator className="mb-4" />
                    )}
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm">Suggested</h3>
                    </div>
                    <div className="space-y-1">
                      {suggestedSearches.map((suggestion, index) => (
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-accent"
                          key={index}
                          onClick={() => setQuery(suggestion)}
                        >
                          <Search className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!query &&
                  recentSearches.length === 0 &&
                  suggestedSearches.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Search className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="font-medium text-sm">
                        Start typing to search
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Search across clients, invoices, documents, and more
                      </p>
                    </div>
                  )}
              </ScrollArea>

              {/* Search Tips */}
              {query && results.length > 0 && (
                <div className="border-t bg-muted/30 p-3">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>
                      Use ↑↓ to navigate, Enter to select, Esc to close
                    </span>
                    <span>
                      {results.length} of {maxResults} results
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Compact search component for headers/toolbars
export function CompactSearch({
  onSearch,
  placeholder = "Search...",
  className = "",
}: {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center transition-all ${isExpanded ? "w-64" : "w-10"}`}
      >
        {isExpanded ? (
          <div className="relative w-full">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
            <Input
              autoFocus
              className="pr-10 pl-10"
              onBlur={() => {
                if (!query) setIsExpanded(false);
              }}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={placeholder}
              value={query}
            />
            <Button
              className="-translate-y-1/2 absolute top-1/2 right-1 h-6 w-6 transform p-0"
              onClick={() => {
                setIsExpanded(false);
                setQuery("");
                onSearch?.("");
              }}
              size="sm"
              variant="ghost"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            className="h-10 w-10 p-0"
            onClick={() => setIsExpanded(true)}
            size="sm"
            variant="ghost"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Hook for managing search functionality
export function useSmartSearch() {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem("gk-nexus-recent-searches");
    return saved ? JSON.parse(saved) : [];
  });

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;

    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(
      0,
      10
    );
    setRecentSearches(updated);
    localStorage.setItem("gk-nexus-recent-searches", JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("gk-nexus-recent-searches");
  };

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
}
