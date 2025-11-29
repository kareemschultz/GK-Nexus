import {
  AlertTriangle,
  Book,
  CheckCircle,
  ExternalLink,
  HelpCircle,
  Info,
  Play,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type TooltipType = "info" | "help" | "warning" | "success" | "feature";
type TooltipSize = "sm" | "md" | "lg" | "xl";

interface TooltipAction {
  label: string;
  action: () => void;
  variant?: "primary" | "secondary" | "ghost";
}

interface SmartTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  type?: TooltipType;
  size?: TooltipSize;
  title?: string;
  actions?: TooltipAction[];
  learnMore?: {
    url: string;
    label?: string;
  };
  videoTutorial?: {
    url: string;
    duration?: string;
  };
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  trigger?: "hover" | "click" | "focus";
  delay?: number;
  maxWidth?: number;
  disabled?: boolean;
  showOnMount?: boolean;
  persistent?: boolean;
  contextual?: boolean;
  className?: string;
}

const tooltipIcons = {
  info: Info,
  help: HelpCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  feature: Play,
};

const tooltipColors = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  help: "border-purple-200 bg-purple-50 text-purple-900",
  warning: "border-orange-200 bg-orange-50 text-orange-900",
  success: "border-green-200 bg-green-50 text-green-900",
  feature: "border-indigo-200 bg-indigo-50 text-indigo-900",
};

const sizeClasses = {
  sm: "w-64 text-xs",
  md: "w-80 text-sm",
  lg: "w-96 text-sm",
  xl: "w-[28rem] text-sm",
};

export function SmartTooltip({
  children,
  content,
  type = "info",
  size = "md",
  title,
  actions = [],
  learnMore,
  videoTutorial,
  placement = "auto",
  trigger = "hover",
  delay = 300,
  maxWidth,
  disabled = false,
  showOnMount = false,
  persistent = false,
  contextual = false,
  className = "",
}: SmartTooltipProps) {
  const [isVisible, setIsVisible] = useState(showOnMount);
  const [actualPlacement, setActualPlacement] = useState(placement);
  const [isDismissed, setIsDismissed] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const IconComponent = tooltipIcons[type];

  // Auto-placement calculation
  useEffect(() => {
    if (
      !(isVisible && triggerRef.current && tooltipRef.current) ||
      placement !== "auto"
    )
      return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let bestPlacement = "bottom";

    // Check if there's enough space for each placement
    const spaces = {
      top: triggerRect.top,
      bottom: viewport.height - triggerRect.bottom,
      left: triggerRect.left,
      right: viewport.width - triggerRect.right,
    };

    // Choose placement with most space
    const maxSpace = Math.max(...Object.values(spaces));
    if (spaces.top === maxSpace && spaces.top > tooltipRect.height + 10) {
      bestPlacement = "top";
    } else if (
      spaces.bottom === maxSpace &&
      spaces.bottom > tooltipRect.height + 10
    ) {
      bestPlacement = "bottom";
    } else if (
      spaces.left === maxSpace &&
      spaces.left > tooltipRect.width + 10
    ) {
      bestPlacement = "left";
    } else if (
      spaces.right === maxSpace &&
      spaces.right > tooltipRect.width + 10
    ) {
      bestPlacement = "right";
    }

    setActualPlacement(bestPlacement as typeof placement);
  }, [isVisible, placement]);

  // Position calculation
  const getTooltipPosition = (): React.CSSProperties => {
    if (!(triggerRef.current && tooltipRef.current)) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let top = 0;
    let left = 0;

    switch (actualPlacement) {
      case "top":
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case "left":
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case "right":
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + 8;
        break;
    }

    // Ensure tooltip stays within viewport
    if (left < 8) left = 8;
    if (left + tooltipRect.width > viewport.width - 8) {
      left = viewport.width - tooltipRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + tooltipRect.height > viewport.height - 8) {
      top = viewport.height - tooltipRect.height - 8;
    }

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 50,
      maxWidth: maxWidth ? `${maxWidth}px` : undefined,
    };
  };

  const handleShow = () => {
    if (disabled || isDismissed) return;

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  };

  const handleHide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!persistent) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  const triggerProps: any = {};
  if (trigger === "hover") {
    triggerProps.onMouseEnter = handleShow;
    triggerProps.onMouseLeave = handleHide;
  } else if (trigger === "click") {
    triggerProps.onClick = () => {
      if (isVisible) {
        handleHide();
      } else {
        handleShow();
      }
    };
  } else if (trigger === "focus") {
    triggerProps.onFocus = handleShow;
    triggerProps.onBlur = handleHide;
  }

  // Handle contextual tooltips (show based on user behavior patterns)
  useEffect(() => {
    if (!contextual) return;

    const handleContextualTrigger = (event: MouseEvent) => {
      const target = event.target as Element;
      if (triggerRef.current?.contains(target)) {
        // User is interacting with the trigger element
        handleShow();
      }
    };

    // Show tooltip if user seems confused (multiple clicks, hovering)
    document.addEventListener("click", handleContextualTrigger);
    return () => document.removeEventListener("click", handleContextualTrigger);
  }, [contextual]);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="inline-block" ref={triggerRef} {...triggerProps}>
        {children}
      </div>

      {isVisible && (
        <>
          {/* Backdrop for click-outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={trigger === "click" ? handleHide : undefined}
          />

          {/* Tooltip */}
          <div
            className={`fade-in animate-in duration-200 ${
              actualPlacement === "top"
                ? "slide-in-from-bottom-2"
                : actualPlacement === "bottom"
                  ? "slide-in-from-top-2"
                  : actualPlacement === "left"
                    ? "slide-in-from-right-2"
                    : "slide-in-from-left-2"
            }`}
            ref={tooltipRef}
            style={getTooltipPosition()}
          >
            <Card
              className={`border-2 shadow-lg ${tooltipColors[type]} ${sizeClasses[size]} ${className}`}
            >
              <CardContent className="p-3">
                {title && (
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <h3 className="font-semibold text-sm">{title}</h3>
                    </div>
                    {persistent && (
                      <Button
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                        onClick={handleDismiss}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}

                <div
                  className={`${title ? "text-xs" : "text-sm"} leading-relaxed`}
                >
                  {content}
                </div>

                {(actions.length > 0 || learnMore || videoTutorial) && (
                  <div className="mt-3 space-y-2">
                    {actions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {actions.map((action, index) => (
                          <Button
                            className="h-7 text-xs"
                            key={index}
                            onClick={() => {
                              action.action();
                              if (!persistent) handleHide();
                            }}
                            size="sm"
                            variant={action.variant || "secondary"}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}

                    {(learnMore || videoTutorial) && (
                      <div className="flex items-center gap-2 text-xs">
                        {learnMore && (
                          <a
                            className="inline-flex items-center gap-1 text-current opacity-80 hover:underline hover:opacity-100"
                            href={learnMore.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <Book className="h-3 w-3" />
                            {learnMore.label || "Learn More"}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        {videoTutorial && (
                          <a
                            className="inline-flex items-center gap-1 text-current opacity-80 hover:underline hover:opacity-100"
                            href={videoTutorial.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <Play className="h-3 w-3" />
                            Video Tutorial
                            {videoTutorial.duration && (
                              <Badge
                                className="ml-1 px-1 text-xs"
                                variant="secondary"
                              >
                                {videoTutorial.duration}
                              </Badge>
                            )}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Arrow indicator */}
                <div
                  className={`absolute h-2 w-2 rotate-45 transform bg-current ${
                    actualPlacement === "top"
                      ? "-translate-x-1/2 bottom-[-5px] left-1/2"
                      : actualPlacement === "bottom"
                        ? "-translate-x-1/2 top-[-5px] left-1/2"
                        : actualPlacement === "left"
                          ? "-translate-y-1/2 top-1/2 right-[-5px]"
                          : "-translate-y-1/2 top-1/2 left-[-5px]"
                  }`}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

// Helper components for common tooltip types
export function HelpTooltip(props: Omit<SmartTooltipProps, "type">) {
  return <SmartTooltip {...props} type="help" />;
}

export function InfoTooltip(props: Omit<SmartTooltipProps, "type">) {
  return <SmartTooltip {...props} type="info" />;
}

export function WarningTooltip(props: Omit<SmartTooltipProps, "type">) {
  return <SmartTooltip {...props} type="warning" />;
}

export function SuccessTooltip(props: Omit<SmartTooltipProps, "type">) {
  return <SmartTooltip {...props} type="success" />;
}

export function FeatureTooltip(props: Omit<SmartTooltipProps, "type">) {
  return <SmartTooltip {...props} type="feature" />;
}

// Field description component for forms
interface FieldDescriptionProps {
  description: string;
  helpText?: string;
  examples?: string[];
  validation?: {
    rules: string[];
    examples?: string[];
  };
  learnMore?: SmartTooltipProps["learnMore"];
}

export function FieldDescription({
  description,
  helpText,
  examples,
  validation,
  learnMore,
}: FieldDescriptionProps) {
  const content = (
    <div className="space-y-2">
      <p>{description}</p>

      {helpText && <p className="text-xs opacity-90">{helpText}</p>}

      {examples && examples.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-xs">Examples:</p>
          <ul className="space-y-0.5 text-xs">
            {examples.map((example, index) => (
              <li className="opacity-90" key={index}>
                • {example}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation && (
        <div>
          <p className="mb-1 font-medium text-xs">Requirements:</p>
          <ul className="space-y-0.5 text-xs">
            {validation.rules.map((rule, index) => (
              <li className="opacity-90" key={index}>
                • {rule}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <SmartTooltip
      content={content}
      learnMore={learnMore}
      placement="right"
      size="lg"
      trigger="click"
      type="help"
    >
      <Button
        className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
        size="sm"
        variant="ghost"
      >
        <HelpCircle className="h-3 w-3" />
      </Button>
    </SmartTooltip>
  );
}
