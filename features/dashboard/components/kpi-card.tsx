"use client";

import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  badgeText?: string;
  badgeTone?: "success" | "warning" | "danger" | "secondary";
  icon: LucideIcon;
  accent?: string;
  progress?: number;
};

export function KpiCard({ title, value, subtitle, badgeText, badgeTone = "secondary", icon: Icon, accent, progress }: KpiCardProps) {
  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={cn("rounded-2xl p-2.5 sm:p-3", accent ?? "bg-blue-100 text-blue-700")}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          {badgeText ? <Badge variant={badgeTone} className="shrink-0">{badgeText}</Badge> : null}
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">{title}</p>
          <p className="break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl xl:text-4xl">{value}</p>
          {subtitle ? <p className="text-sm leading-5 text-slate-500">{subtitle}</p> : null}
        </div>

        {typeof progress === "number" ? (
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">{Math.max(0, Math.min(100, progress)).toFixed(1)}% utilization</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
