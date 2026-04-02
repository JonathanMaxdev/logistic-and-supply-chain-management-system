"use client";

import Link from "next/link";
import { ArrowDownUp, ChevronLeft, ChevronRight, ExternalLink, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyReportStatusBadge } from "@/features/reports/components/daily-report-status-badge";
import type { ReportsSortDirection, ReportsSortKey } from "@/features/reports/types";
import type { DailyReportBaseDto } from "@/types/domain/report";

function formatCurrencyLkr(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2
  }).format(amount);
}

function formatReportDate(dateString: string) {
  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(dateString));
}

function formatRelativeDate(dateString: string) {
  const updated = new Date(dateString);
  const diffMs = Date.now() - updated.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

type DailyReportsTableProps = {
  rows: DailyReportBaseDto[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  sortKey: ReportsSortKey;
  sortDirection: ReportsSortDirection;
  onSort: (key: ReportsSortKey) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const sortableColumns: Array<{ label: string; key: ReportsSortKey }> = [
  { label: "Report Date", key: "reportDate" },
  { label: "Route Name", key: "routeNameSnapshot" },
  { label: "Territory", key: "territoryNameSnapshot" },
  { label: "Prepared By", key: "staffName" },
  { label: "Status", key: "status" },
  { label: "Total Sale (LKR)", key: "totalSale" },
  { label: "Net Profit", key: "netProfit" },
  { label: "Updated At", key: "updatedAt" }
];

export function DailyReportsTable({
  rows,
  loading,
  page,
  pageSize,
  total,
  sortKey,
  sortDirection,
  onSort,
  onPageChange,
  onPageSizeChange
}: DailyReportsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100 md:hidden">
          {loading ? (
            Array.from({ length: Math.min(pageSize, 4) }).map((_, index) => (
              <div key={index} className="p-4">
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              No daily reports found for the selected filters.
            </div>
          ) : (
            rows.map((row) => (
              <article key={row.id} className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{formatReportDate(row.reportDate)}</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{row.routeNameSnapshot}</p>
                    <p className="text-sm text-slate-500">{row.territoryNameSnapshot}</p>
                  </div>
                  <DailyReportStatusBadge status={row.status} />
                </div>

                <dl className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Prepared By</dt>
                    <dd className="mt-1 text-slate-900">{row.staffName}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Updated</dt>
                    <dd className="mt-1 text-slate-900">{formatRelativeDate(row.updatedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Total Sale</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{formatCurrencyLkr(row.totalSale)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Net Profit</dt>
                    <dd className="mt-1 font-semibold text-blue-700">{formatCurrencyLkr(row.netProfit)}</dd>
                  </div>
                </dl>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/reports/${row.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </Link>
                  </Button>
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/reports/${row.id}/date`}>
                      <FileText className="h-3.5 w-3.5" />
                      DATE
                    </Link>
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[1120px] xl:min-w-full">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                {sortableColumns.map((column) => (
                  <th key={column.key} className="px-5 py-4 font-semibold">
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className="inline-flex items-center gap-1.5 text-left"
                    >
                      <span>{column.label}</span>
                      <ArrowDownUp className={`h-3.5 w-3.5 ${sortKey === column.key ? "text-blue-700" : "text-slate-400"} ${sortKey === column.key && sortDirection === "desc" ? "rotate-180" : ""}`} />
                    </button>
                  </th>
                ))}
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-5 py-4" colSpan={9}><Skeleton className="h-10 w-full" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-5 py-12 text-center text-slate-500" colSpan={9}>
                    No daily reports found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      <Link className="hover:text-blue-700" href={`/reports/${row.id}`}>
                        {formatReportDate(row.reportDate)}
                      </Link>
                    </td>
                    <td className="px-5 py-4">{row.routeNameSnapshot}</td>
                    <td className="px-5 py-4">{row.territoryNameSnapshot}</td>
                    <td className="px-5 py-4">{row.staffName}</td>
                    <td className="px-5 py-4"><DailyReportStatusBadge status={row.status} /></td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{formatCurrencyLkr(row.totalSale)}</td>
                    <td className="px-5 py-4 font-semibold text-blue-700">{formatCurrencyLkr(row.netProfit)}</td>
                    <td className="px-5 py-4 text-slate-500">{formatRelativeDate(row.updatedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/reports/${row.id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/reports/${row.id}/date`}>
                            <FileText className="h-3.5 w-3.5" />
                            DATE
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 text-sm text-slate-600 sm:px-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 sm:w-auto"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>{from}-{to} of {total} items</span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button className="shrink-0" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-20 flex-1 text-center font-semibold text-slate-700 sm:flex-none">Page {page} / {totalPages}</span>
            <Button className="shrink-0" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

