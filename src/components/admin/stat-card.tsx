"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: number;
  changeLabel?: string;
  color?: "primary" | "blue" | "amber" | "rose" | "violet";
  subtitle?: string;
}

const COLOR_MAP = {
  primary: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-500",
  amber: "bg-amber-500/10 text-amber-500",
  rose: "bg-rose-500/10 text-rose-500",
  violet: "bg-violet-500/10 text-violet-500",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  color = "primary",
  subtitle,
}: StatCardProps) {
  return (
    <Card className="p-5 premium-shadow hover:premium-shadow-lg transition-all duration-300 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", COLOR_MAP[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg",
              change >= 0 ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-500"
            )}
          >
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      {changeLabel && (
        <p className="text-xs text-muted-foreground mt-2">{changeLabel}</p>
      )}
    </Card>
  );
}
