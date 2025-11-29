import { Plus, Search, Settings, Trash2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AutomationRules() {
  const rules = [
    {
      id: "1",
      name: "Invoice Due Date Alert",
      description: "Send alert 7 days before invoice due date",
      trigger: "Schedule",
      status: "active",
      category: "Billing",
      lastModified: "2 days ago",
    },
    {
      id: "2",
      name: "New Client Onboarding",
      description: "Auto-create welcome package and setup tasks",
      trigger: "Client Created",
      status: "active",
      category: "Onboarding",
      lastModified: "1 week ago",
    },
    {
      id: "3",
      name: "Tax Document Collection",
      description: "Request missing tax documents from clients",
      trigger: "Tax Season",
      status: "paused",
      category: "Tax",
      lastModified: "3 days ago",
    },
  ];

  const categories = ["All", "Billing", "Onboarding", "Tax", "Compliance"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Automation Rules</h1>
          <p className="text-muted-foreground">
            Create and manage automation rules for your business processes.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Rule
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search rules..." />
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={category === "All" ? "default" : "outline"}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <Badge
                      variant={
                        rule.status === "active" ? "default" : "secondary"
                      }
                    >
                      {rule.status}
                    </Badge>
                    <Badge variant="outline">{rule.category}</Badge>
                  </div>
                  <CardDescription>{rule.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-muted-foreground text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Trigger: {rule.trigger}
                  </div>
                  <div>Last modified: {rule.lastModified}</div>
                </div>
                <Button size="sm" variant="outline">
                  Edit Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rule Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Templates</CardTitle>
          <CardDescription>
            Quick start templates for common automation scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Zap className="h-6 w-6" />
              Payment Reminder
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Zap className="h-6 w-6" />
              Document Request
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Zap className="h-6 w-6" />
              Compliance Check
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
