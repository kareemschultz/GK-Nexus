/**
 * Loading Skeleton Components
 * Provides visual placeholders during data loading
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ============================================
// Basic Skeleton Variants
// ============================================

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          className={cn("h-4", i === lines - 1 ? "w-4/5" : "w-full")}
          key={i}
        />
      ))}
    </div>
  );
}

// ============================================
// Table Skeleton
// ============================================

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
};

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex gap-4 border-b pb-2">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton className="h-4 flex-1" key={i} />
          ))}
        </div>
      )}
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="flex gap-4 py-2" key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              className={cn("h-8 flex-1", colIndex === 0 && "max-w-[200px]")}
              key={colIndex}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Card Skeleton
// ============================================

type CardSkeletonProps = {
  className?: string;
  showImage?: boolean;
  showFooter?: boolean;
};

export function CardSkeleton({
  className,
  showImage = false,
  showFooter = false,
}: CardSkeletonProps) {
  return (
    <div className={cn("space-y-4 rounded-lg border p-6", className)}>
      {showImage && <Skeleton className="h-32 w-full rounded-md" />}
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      {showFooter && (
        <div className="flex justify-between border-t pt-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      )}
    </div>
  );
}

// ============================================
// Stats Card Skeleton
// ============================================

export function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-6", className)}>
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="mb-1 h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// ============================================
// Dashboard Skeleton
// ============================================

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-6">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-64" />
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-64" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border p-6">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="flex items-center gap-3" key={i}>
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Client List Skeleton
// ============================================

export function ClientListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 max-w-sm flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Client cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div className="rounded-lg border p-4" key={i}>
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Client Detail Skeleton
// ============================================

export function ClientDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="mb-2 h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="rounded-lg border p-4" key={i}>
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton className="h-10 w-24" key={i} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border p-6">
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border p-6">
            <Skeleton className="mb-4 h-5 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="flex items-center gap-2" key={i}>
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Filings List Skeleton
// ============================================

export function FilingsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <TableSkeleton columns={6} rows={count} />
      </div>
    </div>
  );
}

// ============================================
// Form Skeleton
// ============================================

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

// ============================================
// Sidebar Skeleton
// ============================================

export function SidebarSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Navigation */}
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="flex items-center gap-3 px-2 py-2" key={i}>
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-1 h-4 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Activity Timeline Skeleton
// ============================================

export function ActivityTimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div className="flex gap-3" key={i}>
          <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Profile/Avatar Skeleton
// ============================================

type AvatarSkeletonProps = {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
};

export function AvatarSkeleton({
  size = "md",
  showName = true,
}: AvatarSkeletonProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex items-center gap-3">
      <Skeleton className={cn("rounded-full", sizeClasses[size])} />
      {showName && (
        <div>
          <Skeleton className="mb-1 h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      )}
    </div>
  );
}
