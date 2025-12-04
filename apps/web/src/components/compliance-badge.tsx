/**
 * Compliance Badge Component
 * Displays client compliance status with visual indicators
 */

import { AlertTriangle, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ComplianceCheck, ComplianceStatus } from "@/lib/utils/compliance";

type ComplianceBadgeProps = {
  score: number;
  status: ComplianceStatus;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const statusConfig = {
  compliant: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    label: "Compliant",
  },
  "at-risk": {
    icon: AlertTriangle,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800",
    label: "At Risk",
  },
  "non-compliant": {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    label: "Non-Compliant",
  },
};

const sizeClasses = {
  sm: {
    badge: "px-1.5 py-0.5 gap-1",
    icon: "h-3 w-3",
    text: "text-xs",
  },
  md: {
    badge: "px-2 py-1 gap-1.5",
    icon: "h-4 w-4",
    text: "text-sm",
  },
  lg: {
    badge: "px-3 py-1.5 gap-2",
    icon: "h-5 w-5",
    text: "text-base",
  },
};

export function ComplianceBadge({
  score,
  status,
  showScore = true,
  size = "md",
  className,
}: ComplianceBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeClasses[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border",
        config.bg,
        config.border,
        sizes.badge,
        className
      )}
    >
      <Icon className={cn(sizes.icon, config.color)} />
      {showScore && (
        <span className={cn("font-medium", sizes.text, config.color)}>
          {score}%
        </span>
      )}
    </div>
  );
}

// Detailed compliance card with check list
type ComplianceDetailCardProps = {
  score: number;
  status: ComplianceStatus;
  checks: ComplianceCheck[];
  summary?: string;
};

export function ComplianceDetailCard({
  score,
  status,
  checks,
  summary,
}: ComplianceDetailCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-lg border p-4", config.bg, config.border)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", config.color)} />
          <span className={cn("font-semibold", config.color)}>
            {config.label}
          </span>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            config.bg,
            "border-2",
            config.border
          )}
        >
          <span className={cn("font-bold text-lg", config.color)}>{score}</span>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <p className="mb-4 text-muted-foreground text-sm">{summary}</p>
      )}

      {/* Checks list */}
      <div className="space-y-2">
        {checks.map((check) => (
          <ComplianceCheckItem check={check} key={check.name} />
        ))}
      </div>
    </div>
  );
}

// Individual check item
type ComplianceCheckItemProps = {
  check: ComplianceCheck;
};

const checkStatusConfig = {
  compliant: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/20",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/20",
  },
  "non-compliant": {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/20",
  },
  unknown: {
    icon: HelpCircle,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900/20",
  },
};

function ComplianceCheckItem({ check }: ComplianceCheckItemProps) {
  const config = checkStatusConfig[check.status];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 py-1">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full",
                config.bg
              )}
            >
              <Icon className={cn("h-3 w-3", config.color)} />
            </div>
            <span className="flex-1 text-sm">{check.name}</span>
            <span className={cn("text-xs", config.color)}>
              {check.weight} pts
            </span>
          </div>
        </TooltipTrigger>
        {check.details && (
          <TooltipContent>
            <p>{check.details}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

// Score ring component for visual display
type ComplianceScoreRingProps = {
  score: number;
  status: ComplianceStatus;
  size?: "sm" | "md" | "lg";
};

export function ComplianceScoreRing({
  score,
  status,
  size = "md",
}: ComplianceScoreRingProps) {
  const config = statusConfig[status];

  const sizes = {
    sm: { ring: 40, stroke: 4, text: "text-sm" },
    md: { ring: 60, stroke: 5, text: "text-lg" },
    lg: { ring: 80, stroke: 6, text: "text-xl" },
  };

  const s = sizes[size];
  const radius = (s.ring - s.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="-rotate-90 transform" height={s.ring} width={s.ring}>
        {/* Background circle */}
        <circle
          className="text-muted/20"
          cx={s.ring / 2}
          cy={s.ring / 2}
          fill="none"
          r={radius}
          stroke="currentColor"
          strokeWidth={s.stroke}
        />
        {/* Progress circle */}
        <circle
          className={config.color}
          cx={s.ring / 2}
          cy={s.ring / 2}
          fill="none"
          r={radius}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={s.stroke}
        />
      </svg>
      <span className={cn("absolute font-bold", s.text, config.color)}>
        {score}
      </span>
    </div>
  );
}

// Inline status indicator
type ComplianceStatusIndicatorProps = {
  status: ComplianceStatus;
  showLabel?: boolean;
};

export function ComplianceStatusIndicator({
  status,
  showLabel = true,
}: ComplianceStatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5">
      <Icon className={cn("h-4 w-4", config.color)} />
      {showLabel && (
        <span className={cn("font-medium text-sm", config.color)}>
          {config.label}
        </span>
      )}
    </div>
  );
}
