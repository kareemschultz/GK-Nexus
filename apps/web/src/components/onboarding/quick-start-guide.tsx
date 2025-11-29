import {
  ArrowRight,
  BookOpen,
  Building2,
  Calculator,
  CheckCircle,
  Circle,
  Clock,
  CreditCard,
  FileText,
  PlayCircle,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  estimatedTime: string;
  category: "setup" | "configuration" | "usage";
  required: boolean;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface QuickStartGuideProps {
  userRole: "owner" | "accountant" | "bookkeeper" | "admin";
  onStepComplete: (stepId: string) => void;
  onStepAction: (stepId: string, action?: () => void) => void;
  completedSteps: string[];
}

const baseSteps: Omit<QuickStartStep, "completed">[] = [
  {
    id: "setup-organization",
    title: "Set Up Your Organization",
    description:
      "Complete your organization profile with business details, contact information, and tax configuration.",
    icon: Building2,
    estimatedTime: "5-10 min",
    category: "setup",
    required: true,
    actionLabel: "Complete Setup",
  },
  {
    id: "configure-tax-settings",
    title: "Configure Tax Settings",
    description:
      "Set up VAT registration, tax rates, and compliance requirements for your Guyanese business.",
    icon: Calculator,
    estimatedTime: "3-5 min",
    category: "configuration",
    required: true,
    actionLabel: "Configure Taxes",
  },
  {
    id: "add-first-client",
    title: "Add Your First Client",
    description:
      "Create a client profile to start managing customer information and transactions.",
    icon: Users,
    estimatedTime: "2-3 min",
    category: "usage",
    required: false,
    actionLabel: "Add Client",
  },
  {
    id: "create-first-invoice",
    title: "Create Your First Invoice",
    description:
      "Generate a professional invoice with automatic tax calculations and compliance features.",
    icon: FileText,
    estimatedTime: "5-7 min",
    category: "usage",
    required: false,
    actionLabel: "Create Invoice",
  },
  {
    id: "setup-payment-methods",
    title: "Set Up Payment Methods",
    description:
      "Configure payment options and bank account details for seamless transaction processing.",
    icon: CreditCard,
    estimatedTime: "3-5 min",
    category: "configuration",
    required: false,
    actionLabel: "Configure Payments",
  },
  {
    id: "explore-dashboard",
    title: "Explore Your Dashboard",
    description:
      "Familiarize yourself with key metrics, recent activities, and business insights.",
    icon: PlayCircle,
    estimatedTime: "2-3 min",
    category: "usage",
    required: false,
    actionLabel: "View Dashboard",
  },
];

// Role-specific additional steps
const roleSpecificSteps: Record<string, Omit<QuickStartStep, "completed">[]> = {
  owner: [
    {
      id: "setup-user-permissions",
      title: "Set Up User Permissions",
      description:
        "Configure access levels and invite team members to collaborate on your business management.",
      icon: Settings,
      estimatedTime: "5-10 min",
      category: "setup",
      required: false,
      actionLabel: "Manage Users",
    },
  ],
  accountant: [
    {
      id: "configure-chart-accounts",
      title: "Configure Chart of Accounts",
      description:
        "Set up your accounting structure and categories for proper financial tracking.",
      icon: BookOpen,
      estimatedTime: "10-15 min",
      category: "configuration",
      required: true,
      actionLabel: "Configure Accounts",
    },
  ],
  bookkeeper: [
    {
      id: "setup-automation-rules",
      title: "Set Up Automation Rules",
      description:
        "Configure automatic categorization and processing rules to streamline data entry.",
      icon: Zap,
      estimatedTime: "7-10 min",
      category: "configuration",
      required: false,
      actionLabel: "Setup Automation",
    },
  ],
  admin: [
    {
      id: "configure-integrations",
      title: "Configure Integrations",
      description:
        "Connect external tools and services to enhance your workflow efficiency.",
      icon: Settings,
      estimatedTime: "10-15 min",
      category: "configuration",
      required: false,
      actionLabel: "Setup Integrations",
    },
  ],
};

export function QuickStartGuide({
  userRole,
  onStepComplete,
  onStepAction,
  completedSteps,
}: QuickStartGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Combine base steps with role-specific steps
  const allSteps: QuickStartStep[] = [
    ...baseSteps,
    ...(roleSpecificSteps[userRole] || []),
  ].map((step) => ({
    ...step,
    completed: completedSteps.includes(step.id),
  }));

  const totalSteps = allSteps.length;
  const completedCount = allSteps.filter((step) => step.completed).length;
  const requiredSteps = allSteps.filter((step) => step.required);
  const completedRequired = requiredSteps.filter(
    (step) => step.completed
  ).length;
  const progress = (completedCount / totalSteps) * 100;

  const nextStep = allSteps.find((step) => !step.completed);
  const setupComplete = completedRequired === requiredSteps.length;

  const getCategoryIcon = (category: QuickStartStep["category"]) => {
    switch (category) {
      case "setup":
        return Building2;
      case "configuration":
        return Settings;
      case "usage":
        return PlayCircle;
      default:
        return Circle;
    }
  };

  const getCategoryColor = (category: QuickStartStep["category"]) => {
    switch (category) {
      case "setup":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "configuration":
        return "bg-purple-500/10 text-purple-700 border-purple-200";
      case "usage":
        return "bg-green-500/10 text-green-700 border-green-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  // Compact view when not expanded
  if (!isExpanded) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Quick Start
            </CardTitle>
            {setupComplete && (
              <Badge
                className="bg-green-500/10 text-green-700"
                variant="secondary"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Ready
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {completedCount} of {totalSteps} steps completed
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress className="h-2" value={progress} />
          </div>

          {!setupComplete && nextStep && (
            <div className="space-y-3">
              <div className="font-medium text-sm">Next Step:</div>
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="rounded-md bg-primary/10 p-2">
                  <nextStep.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{nextStep.title}</div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Clock className="h-3 w-3" />
                    {nextStep.estimatedTime}
                    {nextStep.required && (
                      <Badge className="px-1 text-xs" variant="secondary">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => onStepAction(nextStep.id, nextStep.action)}
                  size="sm"
                >
                  {nextStep.actionLabel || "Start"}
                </Button>
                <Button
                  onClick={() => setIsExpanded(true)}
                  size="sm"
                  variant="outline"
                >
                  View All
                </Button>
              </div>
            </div>
          )}

          {setupComplete && (
            <div className="space-y-3 text-center">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
                <div className="font-medium text-green-800 text-sm">
                  Setup Complete!
                </div>
                <div className="text-green-600 text-xs">
                  You're ready to start using GK-Nexus
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => setIsExpanded(true)}
                size="sm"
                variant="outline"
              >
                View All Steps
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Expanded view
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Quick Start Guide
            </CardTitle>
            <p className="mt-1 text-muted-foreground text-sm">
              Get started with GK-Nexus in a few simple steps
            </p>
          </div>
          <Button
            onClick={() => setIsExpanded(false)}
            size="sm"
            variant="ghost"
          >
            Minimize
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Progress: {completedCount} of {totalSteps} steps completed
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress className="h-2" value={progress} />

          <div className="mt-4 grid grid-cols-3 gap-4">
            {(["setup", "configuration", "usage"] as const).map((category) => {
              const categorySteps = allSteps.filter(
                (step) => step.category === category
              );
              const categoryCompleted = categorySteps.filter(
                (step) => step.completed
              ).length;
              const CategoryIcon = getCategoryIcon(category);

              return (
                <div
                  className={`rounded-lg border p-3 ${getCategoryColor(category)}`}
                  key={category}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4" />
                    <span className="font-medium text-sm capitalize">
                      {category}
                    </span>
                  </div>
                  <div className="text-xs opacity-80">
                    {categoryCompleted} / {categorySteps.length} completed
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {(["setup", "configuration", "usage"] as const).map((category) => {
          const categorySteps = allSteps.filter(
            (step) => step.category === category
          );
          if (categorySteps.length === 0) return null;

          return (
            <div key={category}>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="font-semibold text-sm capitalize">
                  {category} Steps
                </h3>
                <Separator className="flex-1" />
              </div>

              <div className="space-y-3">
                {categorySteps.map((step) => (
                  <div
                    className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                      step.completed
                        ? "border-green-200 bg-green-50"
                        : "border-border hover:bg-accent"
                    }`}
                    key={step.id}
                  >
                    <div className="flex-shrink-0">
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-sm">{step.title}</h4>
                        <div className="flex items-center gap-1">
                          {step.required && (
                            <Badge className="text-xs" variant="secondary">
                              Required
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Clock className="h-3 w-3" />
                            {step.estimatedTime}
                          </div>
                        </div>
                      </div>
                      <p className="mt-1 text-muted-foreground text-sm">
                        {step.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      {step.completed ? (
                        <Badge
                          className="bg-green-100 text-green-700"
                          variant="secondary"
                        >
                          Completed
                        </Badge>
                      ) : (
                        <Button
                          className="flex items-center gap-1"
                          onClick={() => onStepAction(step.id, step.action)}
                          size="sm"
                        >
                          {step.actionLabel || "Start"}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {setupComplete && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
            <div className="mb-1 font-semibold text-green-800">
              Congratulations! Setup Complete
            </div>
            <p className="text-green-700 text-sm">
              You've completed all the essential setup steps. Your GK-Nexus
              system is ready to use!
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <Button size="sm" variant="outline">
                Take a Feature Tour
              </Button>
              <Button size="sm">Go to Dashboard</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for managing quick start progress
export function useQuickStart(userRole: QuickStartGuideProps["userRole"]) {
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    const saved = localStorage.getItem(`gk-nexus-quickstart-${userRole}`);
    return saved ? JSON.parse(saved) : [];
  });

  const completeStep = (stepId: string) => {
    const updated = [...completedSteps, stepId];
    setCompletedSteps(updated);
    localStorage.setItem(
      `gk-nexus-quickstart-${userRole}`,
      JSON.stringify(updated)
    );
  };

  const resetProgress = () => {
    setCompletedSteps([]);
    localStorage.removeItem(`gk-nexus-quickstart-${userRole}`);
  };

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);

  return {
    completedSteps,
    completeStep,
    resetProgress,
    isStepCompleted,
  };
}
