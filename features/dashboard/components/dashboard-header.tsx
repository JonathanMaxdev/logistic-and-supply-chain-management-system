"use client";

import { useMemo, useState } from "react";
import { CalendarRange, ChevronDown, Filter, RefreshCw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardFilters } from "@/features/dashboard/types";

type DashboardHeaderProps = {
  filters: DashboardFilters;
  refreshing: boolean;
  onApplyFilters: (filters: DashboardFilters) => void;
  onRefresh: () => void;
};

function buildDateRangeLabel(filters: DashboardFilters, today: Date, past: Date) {
  const dateFrom = filters.dateFrom ?? past.toISOString().slice(0, 10);
  const dateTo = filters.dateTo ?? today.toISOString().slice(0, 10);

  const formatter = new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short"
  });

  return `${formatter.format(new Date(dateFrom))} - ${formatter.format(new Date(dateTo))}`;
}

export function DashboardHeader({ filters, refreshing, onApplyFilters, onRefresh }: DashboardHeaderProps) {
  const today = new Date();
  const past = new Date(today);
  past.setDate(today.getDate() - 6);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const dateRangeLabel = useMemo(() => buildDateRangeLabel(filters, today, past), [filters, today, past]);

  return (
    <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="space-y-4 p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:text-xs">Operations / Dashboard</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">Dashboard Overview</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-[15px]">Live sales, route movement, expenses, and stock health in one operational snapshot.</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:hidden">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Window</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{dateRangeLabel}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Top N</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{filters.top ?? 5} items</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-auto min-h-[54px] justify-between rounded-xl px-3 py-2.5"
                onClick={() => setFiltersOpen((previous) => !previous)}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", filtersOpen ? "rotate-180" : "")}
                />
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:justify-end">
            <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Filter Window</p>
              <p className="mt-1 font-semibold text-slate-900">{dateRangeLabel}</p>
            </div>
            <Button variant="outline" className="w-full sm:w-auto" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="hidden w-full sm:w-auto lg:inline-flex"
              onClick={() => setFiltersOpen((previous) => !previous)}
            >
              <Filter className="h-4 w-4" />
              {filtersOpen ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            filtersOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0 lg:max-h-[420px] lg:opacity-100"
          )}
        >
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px] lg:p-4">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date From</span>
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none ring-offset-2 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  value={filters.dateFrom ?? past.toISOString().slice(0, 10)}
                  onChange={(event) => onApplyFilters({ ...filters, dateFrom: event.target.value })}
                />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date To</span>
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none ring-offset-2 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  value={filters.dateTo ?? today.toISOString().slice(0, 10)}
                  onChange={(event) => onApplyFilters({ ...filters, dateTo: event.target.value })}
                />
              </div>
            </label>

            <label className="space-y-1.5 sm:max-w-[180px] lg:max-w-none">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Top N</span>
              <input
                type="number"
                min={1}
                max={100}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-offset-2 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                value={filters.top ?? 5}
                onChange={(event) => onApplyFilters({ ...filters, top: Number(event.target.value) || 5 })}
              />
            </label>
          </div>
        </div>
      </div>
    </header>
  );
}
