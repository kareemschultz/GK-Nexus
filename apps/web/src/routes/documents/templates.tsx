import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Calculator,
  Calendar,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Plus,
  Scale,
  Search,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents/templates")({
  component: DocumentTemplatesPage,
});

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fileType: string;
  size: number;
  downloadCount: number;
  rating: number;
  lastUpdated: string;
  tags: string[];
  previewUrl?: string;
  downloadUrl: string;
  isFavorite?: boolean;
  isOfficial?: boolean;
}

const mockTemplates: DocumentTemplate[] = [
  {
    id: "1",
    name: "GRA Income Tax Return Form",
    description:
      "Official Guyana Revenue Authority income tax return form for individuals",
    category: "Tax Forms",
    fileType: "PDF",
    size: 2_048_576,
    downloadCount: 1245,
    rating: 4.8,
    lastUpdated: "2024-01-15",
    tags: ["gra", "tax", "income", "official"],
    downloadUrl: "/templates/gra-income-tax-return.pdf",
    isOfficial: true,
    isFavorite: false,
  },
  {
    id: "2",
    name: "Corporate Tax Return Template",
    description:
      "Comprehensive template for corporate tax filings with calculation worksheets",
    category: "Tax Forms",
    fileType: "Excel",
    size: 1_024_000,
    downloadCount: 892,
    rating: 4.6,
    lastUpdated: "2024-01-10",
    tags: ["corporate", "tax", "business", "calculations"],
    downloadUrl: "/templates/corporate-tax-return.xlsx",
    isOfficial: false,
    isFavorite: true,
  },
  {
    id: "3",
    name: "Payroll Summary Report",
    description:
      "Monthly payroll summary template with employee details and deductions",
    category: "Payroll",
    fileType: "Excel",
    size: 512_000,
    downloadCount: 654,
    rating: 4.4,
    lastUpdated: "2024-01-08",
    tags: ["payroll", "employees", "summary", "monthly"],
    downloadUrl: "/templates/payroll-summary.xlsx",
    isOfficial: false,
    isFavorite: false,
  },
  {
    id: "4",
    name: "Client Service Agreement",
    description:
      "Professional service agreement template for accounting and tax services",
    category: "Legal",
    fileType: "Word",
    size: 256_000,
    downloadCount: 789,
    rating: 4.7,
    lastUpdated: "2024-01-12",
    tags: ["agreement", "contract", "client", "services"],
    downloadUrl: "/templates/service-agreement.docx",
    isOfficial: false,
    isFavorite: false,
  },
  {
    id: "5",
    name: "VAT Return Form",
    description: "Value Added Tax return form for quarterly submissions",
    category: "Tax Forms",
    fileType: "PDF",
    size: 1_536_000,
    downloadCount: 1001,
    rating: 4.5,
    lastUpdated: "2024-01-14",
    tags: ["vat", "quarterly", "tax", "return"],
    downloadUrl: "/templates/vat-return.pdf",
    isOfficial: true,
    isFavorite: true,
  },
  {
    id: "6",
    name: "Financial Statement Template",
    description:
      "Comprehensive financial statement template with balance sheet and P&L",
    category: "Financial",
    fileType: "Excel",
    size: 3_072_000,
    downloadCount: 567,
    rating: 4.9,
    lastUpdated: "2024-01-11",
    tags: ["financial", "statements", "balance-sheet", "profit-loss"],
    downloadUrl: "/templates/financial-statements.xlsx",
    isOfficial: false,
    isFavorite: false,
  },
  {
    id: "7",
    name: "Expense Report Template",
    description: "Employee expense report template with receipt tracking",
    category: "Expense",
    fileType: "Excel",
    size: 384_000,
    downloadCount: 432,
    rating: 4.3,
    lastUpdated: "2024-01-09",
    tags: ["expenses", "receipts", "employee", "tracking"],
    downloadUrl: "/templates/expense-report.xlsx",
    isOfficial: false,
    isFavorite: false,
  },
  {
    id: "8",
    name: "Audit Checklist",
    description:
      "Comprehensive audit checklist for internal and external audits",
    category: "Audit",
    fileType: "Word",
    size: 128_000,
    downloadCount: 298,
    rating: 4.6,
    lastUpdated: "2024-01-07",
    tags: ["audit", "checklist", "compliance", "procedures"],
    downloadUrl: "/templates/audit-checklist.docx",
    isOfficial: false,
    isFavorite: false,
  },
];

const categories = [
  "All Categories",
  "Tax Forms",
  "Financial",
  "Payroll",
  "Legal",
  "Audit",
  "Expense",
];

const fileTypes = ["All Types", "PDF", "Excel", "Word", "PowerPoint"];

function DocumentTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedFileType, setSelectedFileType] = useState("All Types");
  const [sortBy, setSortBy] = useState("popular");
  const [favorites, setFavorites] = useState<string[]>(["2", "5"]);

  const formatFileSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />;
      case "excel":
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case "word":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "powerpoint":
        return <Image className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Tax Forms":
        return <Calculator className="h-4 w-4" />;
      case "Financial":
        return <Building2 className="h-4 w-4" />;
      case "Legal":
        return <Scale className="h-4 w-4" />;
      case "Audit":
        return <Search className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const toggleFavorite = (templateId: string) => {
    setFavorites((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  const filteredTemplates = mockTemplates
    .filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        template.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "All Categories" ||
        template.category === selectedCategory;

      const matchesFileType =
        selectedFileType === "All Types" ||
        template.fileType === selectedFileType;

      return matchesSearch && matchesCategory && matchesFileType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.downloadCount - a.downloadCount;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return (
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleDownload = (template: DocumentTemplate) => {
    // Simulate file download
    const link = document.createElement("a");
    link.href = template.downloadUrl;
    link.download = template.name;
    link.click();

    console.log(`Downloaded template: ${template.name}`);
  };

  const handleCreateFromTemplate = (template: DocumentTemplate) => {
    console.log(`Create document from template: ${template.name}`);
    // TODO: Redirect to document creation with template
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
            Document Templates
          </h1>
          <p className="text-muted-foreground">
            Professional templates for GRA forms, contracts, and business
            documents
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-bold text-2xl">{mockTemplates.length}</p>
                <p className="text-muted-foreground text-sm">Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-bold text-2xl">
                  {mockTemplates.filter((t) => t.isOfficial).length}
                </p>
                <p className="text-muted-foreground text-sm">Official Forms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-bold text-2xl">
                  {mockTemplates
                    .reduce((sum, t) => sum + t.downloadCount, 0)
                    .toLocaleString()}
                </p>
                <p className="text-muted-foreground text-sm">Total Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-bold text-2xl">{categories.length - 1}</p>
                <p className="text-muted-foreground text-sm">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative max-w-md flex-1">
                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  value={searchQuery}
                />
              </div>

              <Select
                onValueChange={setSelectedCategory}
                value={selectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        {category !== "All Categories" &&
                          getCategoryIcon(category)}
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={setSelectedFileType}
                value={selectedFileType}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fileTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setSortBy} value={sortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {filteredTemplates.length} of {mockTemplates.length}{" "}
                templates
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTemplates.map((template) => (
          <Card
            className="group transition-shadow hover:shadow-md"
            key={template.id}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getFileTypeIcon(template.fileType)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm leading-tight">
                        {template.name}
                      </h3>
                      {template.isOfficial && (
                        <Badge className="text-xs" variant="default">
                          Official
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs" variant="outline">
                        {template.category}
                      </Badge>
                      <Badge className="text-xs" variant="secondary">
                        {template.fileType}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  className="h-8 w-8 p-0"
                  onClick={() => toggleFavorite(template.id)}
                  size="sm"
                  variant="ghost"
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      favorites.includes(template.id)
                        ? "fill-current text-yellow-500"
                        : "text-muted-foreground"
                    )}
                  />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="line-clamp-3 text-muted-foreground text-sm">
                {template.description}
              </p>

              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                  <span>{template.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  <span>{template.downloadCount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge className="text-xs" key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge className="text-xs" variant="outline">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleDownload(template)}
                  size="sm"
                >
                  <Download className="mr-2 h-3 w-3" />
                  Download
                </Button>
                <Button
                  onClick={() => handleCreateFromTemplate(template)}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-muted-foreground text-xs">
                <p>Size: {formatFileSize(template.size)}</p>
                <p>
                  Updated: {new Date(template.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 font-medium text-lg">No templates found</h3>
          <p className="mb-4 text-muted-foreground">
            Try adjusting your search criteria or browse all categories
          </p>
          <Button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All Categories");
              setSelectedFileType("All Types");
            }}
            variant="outline"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
