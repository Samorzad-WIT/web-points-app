import type { LucideIcon } from "lucide-react";

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
  icon?: LucideIcon;
}

export function DashboardHeader({
  heading,
  text,
  children,
  icon: Icon,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {Icon !== undefined && (
          <div className="bg-primary/10 flex size-12 items-center justify-center rounded-lg">
            <Icon className="text-primary size-6" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
          {text !== undefined && (
            <p className="text-muted-foreground">{text}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
