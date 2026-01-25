import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  children?: ReactNode;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  children,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card relative overflow-hidden rounded-xl border p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {description === undefined ? null : (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
          {trend === undefined ? null : (
            <div
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                trend.isPositive
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </div>
          )}
        </div>
        {Icon === undefined ? null : (
          <div className="bg-primary/10 rounded-lg p-3">
            <Icon className="text-primary size-5" />
          </div>
        )}
      </div>
      {children}
      <div className="bg-primary/5 absolute -right-8 -bottom-8 size-24 rounded-full" />
    </div>
  );
}
