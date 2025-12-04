import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Grid3X3,
  List,
  Loader2,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DocumentList } from "@/components/documents/document-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  type DocumentFilter,
  type DocumentSort,
  useDocuments,
} from "@/hooks/useDocuments";

export const Route = createFileRoute("/documents/search")({
  component: DocumentAdvancedSearchPage,
});

interface SavedSearch {
  id: string;
  name: string;
  filter: DocumentFilter;
  sort?: DocumentSort;
  createdAt: string;
  resultCount: number;
}

interface ClientOption {
  id: string;
  name: string;
}

function DocumentAdvancedSearchPage() {
  const { getDocuments, folderTree } = useDocuments();

  // Fetch clients from API
  const { data: clientsResponse, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.clients.list({ page: 1, limit: 100 });
    },
  });

  const clients: ClientOption[] = (clientsResponse?.data?.items || []).map(
    (client: { id: string; name: string }) => ({
      id: client.id,
      name: client.name,
    })
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<DocumentFilter>({});
  const [sort, setSort] = useState<DocumentSort>({
    field: "uploadDate",
    direction: "desc",
  });
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Advanced filter state
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [sizeRange, setSizeRange] = useState([0, 100]);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  // Saved searches
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: "1",
      name: "Tax Documents 2024",
      filter: { search: "", type: ["Tax Document"], tags: ["2024"] },
      sort: { field: "uploadDate", direction: "desc" },
      createdAt: "2024-01-15",
      resultCount: 23,
    },
    {
      id: "2",
      name: "Confidential Files",
      filter: { isConfidential: true },
      sort: { field: "lastModified", direction: "desc" },
      createdAt: "2024-01-10",
      resultCount: 45,
    },
  ]);
  const [saveSearchName, setSaveSearchName] = useState("");

  // Options data
  const documentTypes = [
    "Financial Report",
    "Tax Document",
    "Payroll",
    "Audit Document",
    "Contract",
    "Invoice",
    "Receipt",
    "Legal Document",
    "Insurance",
    "Government Filing",
  ];

  const statusOptions = ["draft", "review", "approved", "archived"];

  const commonTags = [
    "quarterly",
    "annual",
    "monthly",
    "urgent",
    "pending-review",
    "approved",
    "financial",
    "tax",
    "payroll",
    "legal",
    "compliance",
    "client",
    "internal",
    "2024",
    "2023",
  ];

  useEffect(() => {
    performSearch();
  }, [filter, sort]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const searchFilter = {
        ...filter,
        search: searchQuery,
        tags: tags.length > 0 ? tags : undefined,
        dateRange:
          fromDate && toDate ? { from: fromDate, to: toDate } : undefined,
        size:
          sizeRange[0] > 0 || sizeRange[1] < 100
            ? {
                min: sizeRange[0] * 10_000_000, // Convert to approximate bytes
                max: sizeRange[1] * 10_000_000,
              }
            : undefined,
      };

      const results = await getDocuments(searchFilter, sort);
      setDocuments(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilter({});
    setTags([]);
    setSizeRange([0, 100]);
    setFromDate(undefined);
    setToDate(undefined);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const saveSearch = () => {
    if (!saveSearchName.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: saveSearchName,
      filter: {
        ...filter,
        search: searchQuery,
        tags: tags.length > 0 ? tags : undefined,
        dateRange:
          fromDate && toDate ? { from: fromDate, to: toDate } : undefined,
      },
      sort,
      createdAt: new Date().toISOString(),
      resultCount: documents.length,
    };

    setSavedSearches([newSearch, ...savedSearches]);
    setSaveSearchName("");
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setSearchQuery(savedSearch.filter.search || "");
    setFilter(savedSearch.filter);
    setSort(savedSearch.sort || { field: "uploadDate", direction: "desc" });
    setTags(savedSearch.filter.tags || []);
    if (savedSearch.filter.dateRange) {
      setFromDate(savedSearch.filter.dateRange.from);
      setToDate(savedSearch.filter.dateRange.to);
    }
  };

  const deleteSavedSearch = (id: string) => {
    setSavedSearches(savedSearches.filter((search) => search.id !== id));
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedDocuments(selected ? documents.map((doc) => doc.id) : []);
  };

  const handleDocumentAction = (action: string, documentId: string) => {
    const { toast } = require("sonner");
    toast.success(`${action} action completed`, {
      description: `Document ${documentId} has been processed`,
    });
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <Button asChild size="sm" variant="ghost">
            <Link to="/documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Advanced Document Search
          </h1>
          <p className="text-muted-foreground">
            Use powerful filters to find exactly the documents you need
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Search Filters Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Basic Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Search Query</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Search documents..."
                  value={searchQuery}
                />
              </div>

              <Button className="w-full" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </CardContent>
          </Card>

          {/* Document Properties */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Document Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Document Type</Label>
                <Select
                  onValueChange={(value) =>
                    setFilter({ ...filter, type: value ? [value] : undefined })
                  }
                  value={filter.type?.[0] || ""}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  onValueChange={(value) =>
                    setFilter({
                      ...filter,
                      status: value ? [value] : undefined,
                    })
                  }
                  value={filter.status?.[0] || ""}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        <span className="capitalize">{status}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Client</Label>
                <Select
                  onValueChange={(value) =>
                    setFilter({ ...filter, clientId: value || undefined })
                  }
                  value={filter.clientId || ""}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Clients</SelectItem>
                    {isLoadingClients ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Folder</Label>
                <Select
                  onValueChange={(value) =>
                    setFilter({ ...filter, folderId: value || undefined })
                  }
                  value={filter.folderId || ""}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Folders</SelectItem>
                    {folderTree.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        📁 {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={filter.isConfidential === true}
                  id="confidential"
                  onCheckedChange={(checked) =>
                    setFilter({
                      ...filter,
                      isConfidential: checked ? true : undefined,
                    })
                  }
                />
                <Label
                  className="flex items-center gap-2"
                  htmlFor="confidential"
                >
                  <Shield className="h-4 w-4 text-red-500" />
                  Confidential only
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Date Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>From Date</Label>
                <DatePicker
                  className="mt-1 w-full"
                  date={fromDate}
                  onDateChange={setFromDate}
                />
              </div>

              <div>
                <Label>To Date</Label>
                <DatePicker
                  className="mt-1 w-full"
                  date={toDate}
                  onDateChange={setToDate}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Size */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">File Size Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{sizeRange[0]}MB</span>
                  <span>{sizeRange[1]}MB</span>
                </div>
                <Slider
                  className="w-full"
                  max={100}
                  onValueChange={setSizeRange}
                  step={1}
                  value={sizeRange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Quick Tags</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {commonTags.map((tag) => (
                    <Badge
                      className="cursor-pointer text-xs"
                      key={tag}
                      onClick={() => {
                        if (tags.includes(tag)) {
                          removeTag(tag);
                        } else {
                          setTags([...tags, tag]);
                        }
                      }}
                      variant={tags.includes(tag) ? "default" : "outline"}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label>Custom Tags</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add tag..."
                    value={newTag}
                  />
                  <Button disabled={!newTag.trim()} onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {tags.length > 0 && (
                <div>
                  <Label>Selected Tags</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        className="cursor-pointer text-xs"
                        key={tag}
                        variant="secondary"
                      >
                        {tag}
                        <button
                          className="ml-1 hover:text-destructive"
                          onClick={() => removeTag(tag)}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={clearFilters} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>

          {/* Saved Searches */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Saved Searches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  placeholder="Search name..."
                  value={saveSearchName}
                />
                <Button
                  className="w-full"
                  disabled={!saveSearchName.trim()}
                  onClick={saveSearch}
                  size="sm"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Search
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                {savedSearches.map((search) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-2 hover:bg-muted/50"
                    key={search.id}
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => loadSavedSearch(search)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          loadSavedSearch(search);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <p className="font-medium text-sm">{search.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {search.resultCount} results
                      </p>
                    </div>
                    <Button
                      className="h-6 w-6 p-0"
                      onClick={() => deleteSavedSearch(search.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {savedSearches.length === 0 && (
                  <p className="py-4 text-center text-muted-foreground text-sm">
                    No saved searches
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:col-span-3">
          {/* Results Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="font-semibold text-lg">Search Results</h2>
                  <Badge variant="secondary">
                    {documents.length} document
                    {documents.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(value) => {
                      const [field, direction] = value.split("-");
                      setSort({
                        field: field as any,
                        direction: direction as "asc" | "desc",
                      });
                    }}
                    value={`${sort.field}-${sort.direction}`}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uploadDate-desc">
                        Newest First
                      </SelectItem>
                      <SelectItem value="uploadDate-asc">
                        Oldest First
                      </SelectItem>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="size-desc">Largest First</SelectItem>
                      <SelectItem value="size-asc">Smallest First</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() =>
                      setViewMode(viewMode === "grid" ? "list" : "grid")
                    }
                    size="sm"
                    variant="outline"
                  >
                    {viewMode === "grid" ? (
                      <List className="h-4 w-4" />
                    ) : (
                      <Grid3X3 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Results */}
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDocumentAction={handleDocumentAction}
            onDocumentSelect={handleDocumentSelect}
            onSelectAll={handleSelectAll}
            selectedDocuments={selectedDocuments}
            viewMode={viewMode}
          />
        </div>
      </div>
    </div>
  );
}
