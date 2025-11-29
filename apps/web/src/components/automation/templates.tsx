import { Copy, Play, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AutomationTemplates() {
  const templates = [
    {
      id: "1",
      name: "Client Onboarding",
      description: "Complete client setup and welcome process",
      category: "Onboarding",
      steps: 8,
      rating: 4.9,
      uses: 234,
      tags: ["Popular", "Client Management"],
    },
    {
      id: "2",
      name: "Invoice Reminder",
      description: "Automated payment reminder sequence",
      category: "Billing",
      steps: 5,
      rating: 4.7,
      uses: 189,
      tags: ["Billing", "Payments"],
    },
    {
      id: "3",
      name: "Tax Document Collection",
      description: "Gather required tax documents from clients",
      category: "Tax",
      steps: 6,
      rating: 4.8,
      uses: 156,
      tags: ["Tax", "Compliance"],
    },
    {
      id: "4",
      name: "Monthly Report Generation",
      description: "Generate and send monthly client reports",
      category: "Reporting",
      steps: 4,
      rating: 4.6,
      uses: 98,
      tags: ["Reports", "Monthly"],
    },
  ];

  const categories = [
    { name: "All", count: 24 },
    { name: "Onboarding", count: 8 },
    { name: "Billing", count: 6 },
    { name: "Tax", count: 5 },
    { name: "Reporting", count: 5 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl">Automation Templates</h1>
        <p className="text-muted-foreground">
          Pre-built automation workflows you can customize for your business.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-4 border-b">
        {categories.map((category) => (
          <Button
            className="border-transparent border-b-2 data-[state=active]:border-primary"
            key={category.name}
            size="sm"
            variant={category.name === "All" ? "default" : "ghost"}
          >
            {category.name}
            <Badge className="ml-2" variant="secondary">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {templates.map((template) => (
          <Card className="transition-shadow hover:shadow-md" key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-muted-foreground text-sm">
                        {template.rating}
                      </span>
                    </div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                      <Badge className="text-xs" key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-muted-foreground text-sm">
                  <div>Category: {template.category}</div>
                  <div>{template.steps} steps</div>
                  <div>{template.uses} uses</div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Play className="mr-2 h-4 w-4" />
                    Use Template
                  </Button>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Templates</CardTitle>
          <CardDescription>
            Hand-picked templates for common business scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-24 flex-col gap-2" variant="outline">
              <Zap className="h-8 w-8" />
              <div className="text-center">
                <div className="font-medium">Quick Setup</div>
                <div className="text-muted-foreground text-xs">
                  Basic client automation
                </div>
              </div>
            </Button>
            <Button className="h-24 flex-col gap-2" variant="outline">
              <Zap className="h-8 w-8" />
              <div className="text-center">
                <div className="font-medium">Advanced Workflow</div>
                <div className="text-muted-foreground text-xs">
                  Multi-step processes
                </div>
              </div>
            </Button>
            <Button className="h-24 flex-col gap-2" variant="outline">
              <Zap className="h-8 w-8" />
              <div className="text-center">
                <div className="font-medium">Custom Builder</div>
                <div className="text-muted-foreground text-xs">
                  Build from scratch
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
