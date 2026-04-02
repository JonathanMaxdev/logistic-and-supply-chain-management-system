"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardRoutePerformanceDto } from "@/types/domain/dashboard";

type RouteSaturationWidgetProps = {
  items: DashboardRoutePerformanceDto[];
  loading?: boolean;
};

export function RouteSaturationWidget({ items, loading }: RouteSaturationWidgetProps) {
  const chartData = items.slice(0, 6).map((item) => ({
    name: item.routeName,
    sales: item.totalSales,
    netProfit: item.totalNetProfit
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Route Saturation</CardTitle>
        <CardDescription>Sales and profit concentration across top routes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-52 animate-pulse rounded-lg bg-slate-200" />
        ) : chartData.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            No route performance data found.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={54} />
                  <YAxis tick={{ fontSize: 12 }} width={42} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sales" stroke="#2563eb" fill="url(#salesFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="netProfit" stroke="#0f766e" fill="url(#profitFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-2 sm:hidden">
              {chartData.slice(0, 3).map((item) => (
                <div key={item.name} className="rounded-xl border border-slate-100 px-3 py-2.5 text-sm">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <div className="mt-1 flex items-center justify-between gap-3 text-slate-600">
                    <span>Sales</span>
                    <span className="font-semibold text-slate-900">{item.sales.toLocaleString("en-LK")}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-slate-600">
                    <span>Net Profit</span>
                    <span className="font-semibold text-slate-900">{item.netProfit.toLocaleString("en-LK")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
