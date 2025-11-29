import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  Lightbulb,
  SkipForward,
  Target,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  placement: "top" | "bottom" | "left" | "right";
  spotlight?: boolean;
  action?: () => void;
}

interface TourConfig {
  id: string;
  title: string;
  description: string;
  category: "getting-started" | "advanced" | "tips" | "feature-specific";
  steps: TourStep[];
}

const tours: TourConfig[] = [
  {
    id: "getting-started",
    title: "Getting Started with GK-Nexus",
    description: "Learn the basics of navigating and using the platform",
    category: "getting-started",
    steps: [
      {
        id: "welcome",
        title: "Welcome to GK-Nexus",
        content:
          "Welcome to GK-Nexus, your comprehensive business management solution designed specifically for Guyanese businesses. Let's take a quick tour!",
        target: '[data-tour="dashboard"]',
        placement: "bottom",
      },
      {
        id: "navigation",
        title: "Main Navigation",
        content:
          "Use this sidebar to navigate between different modules. Each section is designed to handle specific aspects of your business operations.",
        target: '[data-tour="sidebar"]',
        placement: "right",
        spotlight: true,
      },
      {
        id: "dashboard",
        title: "Your Dashboard",
        content:
          "Your dashboard gives you a quick overview of your business metrics, recent activities, and important notifications.",
        target: '[data-tour="dashboard-content"]',
        placement: "top",
      },
      {
        id: "search",
        title: "Global Search",
        content:
          "Use the global search to quickly find clients, invoices, documents, and other important information across your entire system.",
        target: '[data-tour="search"]',
        placement: "bottom",
      },
      {
        id: "notifications",
        title: "Notifications & Alerts",
        content:
          "Stay informed with real-time notifications about deadlines, payments, compliance requirements, and system updates.",
        target: '[data-tour="notifications"]',
        placement: "left",
      },
    ],
  },
  {
    id: "tax-calculations",
    title: "Tax Calculation Features",
    description: "Master VAT, PAYE, and other tax calculations",
    category: "feature-specific",
    steps: [
      {
        id: "tax-nav",
        title: "Tax Module",
        content:
          "Access all tax-related features from the Tax section. This includes VAT calculations, PAYE processing, and compliance tracking.",
        target: '[data-tour="tax-nav"]',
        placement: "right",
      },
      {
        id: "vat-calculator",
        title: "VAT Calculator",
        content:
          "Calculate VAT quickly and accurately. The calculator supports different VAT rates and can handle complex scenarios.",
        target: '[data-tour="vat-calculator"]',
        placement: "top",
      },
      {
        id: "paye-calculator",
        title: "PAYE Calculator",
        content:
          "Calculate employee PAYE taxes automatically based on current Guyanese tax brackets and regulations.",
        target: '[data-tour="paye-calculator"]',
        placement: "bottom",
      },
    ],
  },
  {
    id: "client-management",
    title: "Client Management",
    description: "Efficiently manage your client relationships",
    category: "feature-specific",
    steps: [
      {
        id: "clients-overview",
        title: "Client Management Hub",
        content:
          "Manage all your clients from one central location. View client details, track interactions, and monitor account status.",
        target: '[data-tour="clients"]',
        placement: "bottom",
      },
      {
        id: "client-portal",
        title: "Client Portal Access",
        content:
          "Give clients secure access to their information through the client portal. They can view invoices, documents, and communicate with you directly.",
        target: '[data-tour="client-portal"]',
        placement: "left",
      },
    ],
  },
];

interface FeatureTourProps {
  activeTour?: string;
  onTourComplete?: (tourId: string) => void;
  onTourSkip?: (tourId: string) => void;
  onTourExit?: () => void;
}

export function FeatureTour({
  activeTour,
  onTourComplete,
  onTourSkip,
  onTourExit,
}: FeatureTourProps) {
  const [currentTour, setCurrentTour] = useState<TourConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightElement, setHighlightElement] = useState<Element | null>(
    null
  );
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Find and start the requested tour
  useEffect(() => {
    if (activeTour) {
      const tour = tours.find((t) => t.id === activeTour);
      if (tour) {
        setCurrentTour(tour);
        setCurrentStep(0);
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
      setCurrentTour(null);
    }
  }, [activeTour]);

  // Update spotlight when step changes
  useEffect(() => {
    if (!(currentTour && isVisible)) return;

    const step = currentTour.steps[currentStep];
    if (step?.target) {
      const element = document.querySelector(step.target);
      setHighlightElement(element);

      // Position the tooltip
      if (element && tooltipRef.current) {
        const rect = element.getBoundingClientRect();
        const tooltip = tooltipRef.current;

        let top = 0;
        let left = 0;

        switch (step.placement) {
          case "top":
            top = rect.top - tooltip.offsetHeight - 10;
            left = rect.left + (rect.width - tooltip.offsetWidth) / 2;
            break;
          case "bottom":
            top = rect.bottom + 10;
            left = rect.left + (rect.width - tooltip.offsetWidth) / 2;
            break;
          case "left":
            top = rect.top + (rect.height - tooltip.offsetHeight) / 2;
            left = rect.left - tooltip.offsetWidth - 10;
            break;
          case "right":
            top = rect.top + (rect.height - tooltip.offsetHeight) / 2;
            left = rect.right + 10;
            break;
        }

        // Ensure tooltip stays within viewport
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        if (left < 10) left = 10;
        if (left + tooltip.offsetWidth > viewport.width - 10) {
          left = viewport.width - tooltip.offsetWidth - 10;
        }
        if (top < 10) top = 10;
        if (top + tooltip.offsetHeight > viewport.height - 10) {
          top = viewport.height - tooltip.offsetHeight - 10;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
      }
    }
  }, [currentTour, currentStep, isVisible]);

  const handleNext = () => {
    if (!currentTour) return;

    if (currentStep < currentTour.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    if (currentTour) {
      onTourComplete?.(currentTour.id);
    }
    handleClose();
  };

  const handleSkip = () => {
    if (currentTour) {
      onTourSkip?.(currentTour.id);
    }
    handleClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setCurrentTour(null);
    setCurrentStep(0);
    setHighlightElement(null);
    onTourExit?.();
  };

  if (!(isVisible && currentTour)) return null;

  const step = currentTour.steps[currentStep];
  const progress = ((currentStep + 1) / currentTour.steps.length) * 100;
  const isLastStep = currentStep === currentTour.steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={(e) => {
          if (e.target === overlayRef.current) {
            handleClose();
          }
        }}
        ref={overlayRef}
        style={{
          background:
            highlightElement && step?.spotlight
              ? `radial-gradient(circle at ${highlightElement.getBoundingClientRect().left + highlightElement.getBoundingClientRect().width / 2}px ${highlightElement.getBoundingClientRect().top + highlightElement.getBoundingClientRect().height / 2}px, transparent 100px, rgba(0, 0, 0, 0.7) 100px)`
              : "rgba(0, 0, 0, 0.5)",
        }}
      />

      {/* Tooltip */}
      <div
        className="fade-in fixed z-50 w-80 animate-in duration-200"
        ref={tooltipRef}
        style={{ top: 0, left: 0 }}
      >
        <Card className="border-2 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-1.5">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-semibold text-sm">
                    {step.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <span>
                      {currentStep + 1} of {currentTour.steps.length}
                    </span>
                    <Badge className="text-xs" variant="secondary">
                      {currentTour.category}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                className="h-6 w-6 p-0"
                onClick={handleClose}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress className="mt-2 h-1" value={progress} />
          </CardHeader>

          <CardContent className="pt-0">
            <p className="mb-4 text-foreground text-sm leading-relaxed">
              {step.content}
            </p>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button
                    className="flex h-8 items-center gap-1"
                    onClick={handlePrevious}
                    size="sm"
                    variant="outline"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="flex h-8 items-center gap-1 text-muted-foreground"
                  onClick={handleSkip}
                  size="sm"
                  variant="ghost"
                >
                  <SkipForward className="h-3 w-3" />
                  Skip Tour
                </Button>
                <Button
                  className="flex h-8 items-center gap-1"
                  onClick={handleNext}
                  size="sm"
                >
                  {isLastStep ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Tour selection component
interface TourSelectorProps {
  onTourStart: (tourId: string) => void;
  completedTours: string[];
}

export function TourSelector({
  onTourStart,
  completedTours,
}: TourSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categoryIcons = {
    "getting-started": Eye,
    advanced: Target,
    tips: Lightbulb,
    "feature-specific": CheckCircle,
  };

  const categoryColors = {
    "getting-started": "bg-blue-500/10 text-blue-700 border-blue-200",
    advanced: "bg-purple-500/10 text-purple-700 border-purple-200",
    tips: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
    "feature-specific": "bg-green-500/10 text-green-700 border-green-200",
  };

  if (!isOpen) {
    return (
      <Button
        className="flex items-center gap-2"
        onClick={() => setIsOpen(true)}
        variant="outline"
      >
        <Eye className="h-4 w-4" />
        Take a Tour
      </Button>
    );
  }

  return (
    <Card className="w-96">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Feature Tours
          </CardTitle>
          <Button
            className="h-6 w-6 p-0"
            onClick={() => setIsOpen(false)}
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tours.map((tour) => {
          const IconComponent = categoryIcons[tour.category];
          const isCompleted = completedTours.includes(tour.id);

          return (
            <div
              className={`rounded-lg border p-3 transition-colors ${categoryColors[tour.category]} ${
                isCompleted ? "opacity-60" : "cursor-pointer hover:shadow-sm"
              }`}
              key={tour.id}
              onClick={() => {
                if (!isCompleted) {
                  onTourStart(tour.id);
                  setIsOpen(false);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <IconComponent className="mt-0.5 h-5 w-5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{tour.title}</h3>
                    {isCompleted && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <p className="mt-1 text-xs opacity-80">{tour.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="text-xs capitalize" variant="secondary">
                      {tour.category.replace("-", " ")}
                    </Badge>
                    <span className="text-xs opacity-60">
                      {tour.steps.length} steps
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Hook for managing tours
export function useTours() {
  const [completedTours, setCompletedTours] = useState<string[]>(() => {
    const saved = localStorage.getItem("gk-nexus-completed-tours");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTour, setActiveTour] = useState<string | undefined>();

  const startTour = (tourId: string) => {
    setActiveTour(tourId);
  };

  const completeTour = (tourId: string) => {
    const updated = [...completedTours, tourId];
    setCompletedTours(updated);
    localStorage.setItem("gk-nexus-completed-tours", JSON.stringify(updated));
    setActiveTour(undefined);
  };

  const skipTour = (tourId: string) => {
    setActiveTour(undefined);
  };

  const exitTour = () => {
    setActiveTour(undefined);
  };

  const resetTours = () => {
    setCompletedTours([]);
    localStorage.removeItem("gk-nexus-completed-tours");
  };

  return {
    activeTour,
    completedTours,
    startTour,
    completeTour,
    skipTour,
    exitTour,
    resetTours,
    allTours: tours,
  };
}
