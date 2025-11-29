import {
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Search,
  Star,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  type: "article" | "video" | "faq" | "tutorial";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime?: string;
  videoUrl?: string;
  lastUpdated: string;
  helpful: number;
  views: number;
  featured?: boolean;
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  articles: HelpArticle[];
  subcategories?: HelpCategory[];
}

const helpCategories: HelpCategory[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    description: "Basic setup and initial configuration",
    icon: BookOpen,
    articles: [
      {
        id: "setup-organization",
        title: "Setting Up Your Organization",
        content:
          "Learn how to configure your organization profile with business details, contact information, and tax settings for Guyanese businesses.",
        category: "getting-started",
        tags: ["setup", "organization", "configuration"],
        type: "tutorial",
        difficulty: "beginner",
        estimatedTime: "10 min",
        lastUpdated: "2024-01-15",
        helpful: 45,
        views: 234,
        featured: true,
      },
      {
        id: "first-invoice",
        title: "Creating Your First Invoice",
        content:
          "Step-by-step guide to creating professional invoices with automatic tax calculations.",
        category: "getting-started",
        tags: ["invoices", "billing", "tutorial"],
        type: "tutorial",
        difficulty: "beginner",
        estimatedTime: "5 min",
        videoUrl: "https://example.com/video",
        lastUpdated: "2024-01-10",
        helpful: 67,
        views: 456,
      },
    ],
  },
  {
    id: "tax-calculations",
    name: "Tax Calculations",
    description: "VAT, PAYE, and other Guyanese tax requirements",
    icon: Calculator,
    articles: [
      {
        id: "vat-calculator",
        title: "Using the VAT Calculator",
        content:
          "Complete guide to calculating VAT for different business scenarios in Guyana.",
        category: "tax-calculations",
        tags: ["vat", "taxes", "calculator"],
        type: "article",
        difficulty: "intermediate",
        estimatedTime: "8 min",
        lastUpdated: "2024-01-12",
        helpful: 89,
        views: 678,
        featured: true,
      },
      {
        id: "paye-guide",
        title: "PAYE Tax Calculation Guide",
        content: "Understanding PAYE calculations and compliance requirements.",
        category: "tax-calculations",
        tags: ["paye", "payroll", "taxes"],
        type: "article",
        difficulty: "advanced",
        estimatedTime: "15 min",
        lastUpdated: "2024-01-08",
        helpful: 34,
        views: 123,
      },
    ],
  },
  {
    id: "client-management",
    name: "Client Management",
    description: "Managing customers and relationships",
    icon: Users,
    articles: [
      {
        id: "add-clients",
        title: "Adding and Managing Clients",
        content:
          "How to create client profiles and manage customer information effectively.",
        category: "client-management",
        tags: ["clients", "customers", "management"],
        type: "tutorial",
        difficulty: "beginner",
        estimatedTime: "6 min",
        lastUpdated: "2024-01-14",
        helpful: 56,
        views: 345,
      },
    ],
  },
  {
    id: "payments",
    name: "Payments & Billing",
    description: "Payment processing and financial transactions",
    icon: CreditCard,
    articles: [
      {
        id: "payment-methods",
        title: "Setting Up Payment Methods",
        content:
          "Configure payment options and bank account details for your business.",
        category: "payments",
        tags: ["payments", "banking", "setup"],
        type: "article",
        difficulty: "intermediate",
        estimatedTime: "12 min",
        lastUpdated: "2024-01-11",
        helpful: 23,
        views: 189,
      },
    ],
  },
];

interface HelpSidepanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultCategory?: string;
  contextualHelp?: {
    title: string;
    content: string;
    relatedArticles?: string[];
  };
}

export function HelpSidepanel({
  isOpen = false,
  onClose,
  defaultCategory,
  contextualHelp,
}: HelpSidepanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    defaultCategory || "getting-started"
  );
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(
    null
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([selectedCategory])
  );
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const allArticles = helpCategories.flatMap((cat) => cat.articles);
    const results = allArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    setSearchResults(results);
  }, [searchTerm]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedArticle(null);
    setExpandedCategories((prev) => new Set([...prev, categoryId]));
  };

  const handleArticleSelect = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getTypeIcon = (type: HelpArticle["type"]) => {
    switch (type) {
      case "video":
        return Video;
      case "tutorial":
        return BookOpen;
      case "faq":
        return MessageSquare;
      default:
        return FileText;
    }
  };

  const getDifficultyColor = (difficulty: HelpArticle["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-600 bg-green-50";
      case "intermediate":
        return "text-yellow-600 bg-yellow-50";
      case "advanced":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const currentCategory = helpCategories.find(
    (cat) => cat.id === selectedCategory
  );
  const isSearching = searchTerm.trim().length > 0;

  const content = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="space-y-4 border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Help Center</h2>
          {onClose && (
            <Button onClick={onClose} size="sm" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
          <Input
            className="pl-10"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for help..."
            ref={searchInputRef}
            value={searchTerm}
          />
        </div>

        {/* Contextual Help */}
        {contextualHelp && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900 text-sm">
                    {contextualHelp.title}
                  </h3>
                  <p className="mt-1 text-blue-700 text-xs">
                    {contextualHelp.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 overflow-hidden border-r">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-4">
              {isSearching ? (
                // Search Results
                <div className="space-y-2">
                  <div className="text-muted-foreground text-sm">
                    {searchResults.length} result(s) for "{searchTerm}"
                  </div>
                  {searchResults.map((article) => {
                    const TypeIcon = getTypeIcon(article.type);
                    return (
                      <Button
                        className="h-auto w-full justify-start p-3"
                        key={article.id}
                        onClick={() => handleArticleSelect(article)}
                        variant="ghost"
                      >
                        <div className="flex items-center gap-2 text-left">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">
                              {article.title}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {article.category}
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              ) : (
                // Categories
                helpCategories.map((category) => {
                  const isExpanded = expandedCategories.has(category.id);
                  const isSelected = selectedCategory === category.id;
                  const IconComponent = category.icon;

                  return (
                    <div className="space-y-1" key={category.id}>
                      <Button
                        className="h-auto w-full justify-between p-3"
                        onClick={() => {
                          handleCategorySelect(category.id);
                          toggleCategoryExpanded(category.id);
                        }}
                        variant={isSelected ? "secondary" : "ghost"}
                      >
                        <div className="flex items-center gap-2 text-left">
                          <IconComponent className="h-4 w-4" />
                          <div>
                            <div className="font-medium text-sm">
                              {category.name}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {category.articles.length} articles
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>

                      {isExpanded && (
                        <div className="ml-6 space-y-1">
                          {category.articles.map((article) => {
                            const TypeIcon = getTypeIcon(article.type);
                            return (
                              <Button
                                className="h-auto w-full justify-start p-2"
                                key={article.id}
                                onClick={() => handleArticleSelect(article)}
                                variant="ghost"
                              >
                                <div className="flex items-center gap-2 text-left">
                                  <TypeIcon className="h-3 w-3 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium text-xs">
                                      {article.title}
                                    </div>
                                    {article.estimatedTime && (
                                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                        <Clock className="h-3 w-3" />
                                        {article.estimatedTime}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {selectedArticle ? (
                // Article View
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        className={getDifficultyColor(
                          selectedArticle.difficulty
                        )}
                      >
                        {selectedArticle.difficulty}
                      </Badge>
                      <Badge variant="outline">{selectedArticle.type}</Badge>
                      {selectedArticle.featured && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="mr-1 h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <h1 className="font-bold text-2xl">
                      {selectedArticle.title}
                    </h1>
                    <div className="mt-2 flex items-center gap-4 text-muted-foreground text-sm">
                      {selectedArticle.estimatedTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {selectedArticle.estimatedTime}
                        </div>
                      )}
                      <div>{selectedArticle.views} views</div>
                      <div>{selectedArticle.helpful} helpful</div>
                    </div>
                  </div>

                  {selectedArticle.videoUrl && (
                    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Video className="h-8 w-8 text-blue-600" />
                          <div className="flex-1">
                            <h3 className="font-medium text-blue-900">
                              Video Tutorial Available
                            </h3>
                            <p className="text-blue-700 text-sm">
                              Watch along for visual guidance
                            </p>
                          </div>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            Watch Video
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">
                      {selectedArticle.content}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 font-medium">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedArticle.tags.map((tag) => (
                          <Badge
                            className="text-xs"
                            key={tag}
                            variant="secondary"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground text-sm">
                        Last updated:{" "}
                        {new Date(
                          selectedArticle.lastUpdated
                        ).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Was this helpful?
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentCategory && !isSearching ? (
                // Category Overview
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <currentCategory.icon className="h-8 w-8 text-primary" />
                      <h1 className="font-bold text-2xl">
                        {currentCategory.name}
                      </h1>
                    </div>
                    <p className="text-muted-foreground">
                      {currentCategory.description}
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {currentCategory.articles
                      .filter((article) => article.featured)
                      .map((article) => {
                        const TypeIcon = getTypeIcon(article.type);
                        return (
                          <Card
                            className="cursor-pointer transition-shadow hover:shadow-md"
                            key={article.id}
                            onClick={() => handleArticleSelect(article)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <TypeIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                  <h3 className="mb-1 font-medium">
                                    {article.title}
                                  </h3>
                                  <p className="mb-2 text-muted-foreground text-sm">
                                    {article.content.substring(0, 120)}...
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={getDifficultyColor(
                                        article.difficulty
                                      )}
                                      variant="secondary"
                                    >
                                      {article.difficulty}
                                    </Badge>
                                    {article.estimatedTime && (
                                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                        <Clock className="h-3 w-3" />
                                        {article.estimatedTime}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                    <div>
                      <h3 className="mb-3 font-medium">All Articles</h3>
                      <div className="space-y-2">
                        {currentCategory.articles.map((article) => {
                          const TypeIcon = getTypeIcon(article.type);
                          return (
                            <div
                              className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-accent"
                              key={article.id}
                              onClick={() => handleArticleSelect(article)}
                            >
                              <TypeIcon className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {article.title}
                                </div>
                                {article.estimatedTime && (
                                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                    <Clock className="h-3 w-3" />
                                    {article.estimatedTime}
                                  </div>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Default welcome view
                <div className="space-y-6">
                  <div className="text-center">
                    <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h1 className="mb-2 font-bold text-2xl">
                      Welcome to the Help Center
                    </h1>
                    <p className="text-muted-foreground">
                      Find answers, guides, and tutorials to get the most out of
                      GK-Nexus
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <h2 className="font-semibold">Popular Articles</h2>
                    {helpCategories
                      .flatMap((cat) => cat.articles)
                      .filter(
                        (article) => article.featured || article.helpful > 50
                      )
                      .slice(0, 3)
                      .map((article) => {
                        const TypeIcon = getTypeIcon(article.type);
                        return (
                          <Card
                            className="cursor-pointer transition-shadow hover:shadow-md"
                            key={article.id}
                            onClick={() => handleArticleSelect(article)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <TypeIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                  <h3 className="mb-1 font-medium">
                                    {article.title}
                                  </h3>
                                  <p className="text-muted-foreground text-sm">
                                    {article.content.substring(0, 120)}...
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );

  if (isOpen !== undefined) {
    // Controlled mode - render as Sheet
    return (
      <Sheet onOpenChange={onClose} open={isOpen}>
        <SheetContent
          className="w-full p-0 sm:w-[800px] sm:max-w-none"
          side="right"
        >
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  // Uncontrolled mode - render as trigger + sheet
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="flex items-center gap-2" variant="outline">
          <HelpCircle className="h-4 w-4" />
          Help
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-full p-0 sm:w-[800px] sm:max-w-none"
        side="right"
      >
        {content}
      </SheetContent>
    </Sheet>
  );
}

// Hook for managing help system
export function useHelp() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpContext, setHelpContext] = useState<string | undefined>();

  const openHelp = (category?: string) => {
    setHelpContext(category);
    setIsHelpOpen(true);
  };

  const closeHelp = () => {
    setIsHelpOpen(false);
    setHelpContext(undefined);
  };

  return {
    isHelpOpen,
    helpContext,
    openHelp,
    closeHelp,
  };
}
