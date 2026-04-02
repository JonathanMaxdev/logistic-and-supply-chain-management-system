"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer, RefreshCw, Save } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import {
  fetchLoadingSummaryItems,
  fetchProductOptions,
  saveLoadingSummaryItems
} from "@/features/loading-summaries/api/loading-summaries-api";
import { LoadingSummaryFinalizeConfirmDialog } from "@/features/loading-summaries/components/loading-summary-finalize-confirm-dialog";
import { LoadingSummaryItemsPanel } from "@/features/loading-summaries/components/loading-summary-items-panel";
import { useLoadingSummaryWorkspace } from "@/features/loading-summaries/hooks/use-loading-summary-workspace";
import type { LoadingSummaryItem, LoadingSummaryItemBatchSaveInput, ProductOption } from "@/features/loading-summaries/types";
import { DailyReportStatusBadge } from "@/features/reports/components/daily-report-status-badge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function LoadingSummaryWorkspaceView({ summaryId }: { summaryId: string }) {
  const {
    loading,
    saving,
    error,
    isNotFound,
    successMessage,
    summary,
    draftForm,
    setDraftForm,
    canManage,
    canEditMorningLoading,
    canEditEveningReconciliation,
    reload,
    actions
  } = useLoadingSummaryWorkspace(summaryId);

  const [itemRows, setItemRows] = useState<LoadingSummaryItem[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsSaving, setItemsSaving] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);

  const loadItemsData = useCallback(async () => {
    if (!summary) return;

    setItemsLoading(true);
    setItemsError(null);

    try {
      const [items, products] = await Promise.all([
        fetchLoadingSummaryItems(summary.id),
        fetchProductOptions()
      ]);

      setItemRows(items);
      setProductOptions(products);
    } catch (requestError) {
      setItemsError(requestError instanceof Error ? requestError.message : "Failed to load route-sheet line items.");
    } finally {
      setItemsLoading(false);
    }
  }, [summary]);

  useEffect(() => {
    if (!summary) {
      setItemRows([]);
      setProductOptions([]);
      setItemsError(null);
      return;
    }

    void loadItemsData();
  }, [summary, loadItemsData]);

  const handleSaveItems = useCallback(async (items: LoadingSummaryItemBatchSaveInput[]) => {
    if (!summary) return;

    setItemsSaving(true);
    setItemsError(null);

    try {
      const saved = await saveLoadingSummaryItems(summary.id, items);
      setItemRows(saved);
      await reload();
    } catch (requestError) {
      setItemsError(requestError instanceof Error ? requestError.message : "Failed to save route-sheet line items.");
    } finally {
      setItemsSaving(false);
    }
  }, [reload, summary]);

  const isRouteSheetEditable = useMemo(() => {
    if (!summary) return false;
    if (summary.status !== "draft") return false;
    return canManage;
  }, [canManage, summary]);

  const loadingCompletionLabel = summary?.loadingCompletedAt ? "Morning Loading Completed" : "Morning Loading Pending";

  const handleRequestFinalize = () => {
    if (!summary || !canEditMorningLoading) return;
    setConfirmFinalizeOpen(true);
  };

  const handleConfirmFinalize = async () => {
    const didFinalize = await actions.finalize();
    if (didFinalize) {
      setConfirmFinalizeOpen(false);
    }
  };

  const handleCancelFinalize = () => {
    if (saving) return;
    setConfirmFinalizeOpen(false);
  };

  return (
    <AppShell sidebar={<DashboardSidebar activeKey="loading-summaries" />}>
      {loading ? (
        <>
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
          <Skeleton className="h-80" />
        </>
      ) : null}

      {!loading && error && !isNotFound ? (
        <Alert variant="destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={reload} disabled={saving}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </Alert>
      ) : null}

      {!loading && isNotFound && !summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading summary not found</CardTitle>
            <CardDescription>
              The selected loading summary may have been removed or you may not have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/loading-summaries" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Loading Summaries
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && summary ? (
        <>
          <header className="app-page-header">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="mb-2">
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href="/loading-summaries" className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Loading Summaries
                    </Link>
                  </Button>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Operations / Route Product Movement</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Loading Summary Route Sheet</h1>
                <p className="mt-1 text-sm text-slate-500">Use this same document for morning loading and evening lorry reconciliation.</p>
                <p className="mt-1 break-all text-sm text-slate-500">ID: {summary.id}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-start xl:justify-end">
                <DailyReportStatusBadge status={summary.status} />
                <span
                  className={
                    summary.loadingCompletedAt
                      ? "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                      : "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                  }
                >
                  {loadingCompletionLabel}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2 xl:grid-cols-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date</p>
                <p className="mt-1 font-semibold text-slate-900">{formatDate(summary.reportDate)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Route</p>
                <p className="mt-1 font-semibold text-slate-900">{summary.routeNameSnapshot}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Territory</p>
                <p className="mt-1 font-semibold text-slate-900">{summary.territoryNameSnapshot}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prepared By</p>
                <p className="mt-1 font-semibold text-slate-900">{summary.staffName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Morning Finalized At</p>
                <p className="mt-1 font-semibold text-slate-900">{formatDateTime(summary.loadingCompletedAt)}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
              {canEditMorningLoading ? (
                <Button className="w-full xl:w-auto" variant="outline" onClick={actions.saveDraft} disabled={saving}>
                  <Save className="h-4 w-4" />
                  Save Morning Draft
                </Button>
              ) : null}

              {canEditMorningLoading ? (
                <Button className="w-full xl:w-auto" onClick={handleRequestFinalize} disabled={saving}>
                  Finalize Morning Loading
                </Button>
              ) : null}

              <Button asChild className="w-full xl:w-auto" variant="outline">
                <Link href={`/reports/${summary.dateReportId}/date`}>
                  Open DATE Sheet
                </Link>
              </Button>

              <Button asChild className="w-full xl:w-auto" variant="outline">
                <Link href={`/reports/${summary.dateReportId}`}>
                  Open Backoffice Report
                </Link>
              </Button>

              <Button asChild className="w-full xl:w-auto" variant="secondary">
                <Link href={`/loading-summaries/${summary.id}/print`} target="_blank" rel="noopener noreferrer">
                  <Printer className="h-4 w-4" />
                  Print Route Sheet
                </Link>
              </Button>
            </div>
          </header>

          {summary.loadingCompletedAt ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
              Morning loading is finalized. This route sheet is now in <span className="font-semibold">evening reconciliation mode</span>: enter sales and lorry quantities here when the vehicle returns, then complete invoices and final submission in the {" "}
              <Link href={`/reports/${summary.dateReportId}/date`} className="font-semibold underline underline-offset-2">
                DATE end-of-day sheet
              </Link>.
            </Alert>
          ) : (
            <Alert className="border-amber-200 bg-amber-50 text-amber-800">
              Morning stage: record only loading quantities here. Finalizing locks the morning loading structure and keeps this same document ready for evening reconciliation later.
            </Alert>
          )}

          {successMessage ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">{successMessage}</Alert>
          ) : null}

          <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Summary Metadata</CardTitle>
                <CardDescription>Morning loading metadata for this route-day document.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Report Date</span>
                    <input
                      type="date"
                      value={draftForm.reportDate}
                      onChange={(event) => setDraftForm((previous) => ({ ...previous, reportDate: event.target.value }))}
                      disabled={!canEditMorningLoading || saving}
                      className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none ring-offset-2 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prepared By / Staff Name</span>
                    <input
                      value={draftForm.staffName}
                      onChange={(event) => setDraftForm((previous) => ({ ...previous, staffName: event.target.value }))}
                      disabled={!canEditMorningLoading || saving}
                      className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none ring-offset-2 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Remarks</span>
                  <textarea
                    rows={4}
                    value={draftForm.remarks}
                    onChange={(event) => setDraftForm((previous) => ({ ...previous, remarks: event.target.value }))}
                    disabled={!canEditMorningLoading || saving}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-offset-2 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Loading Notes</span>
                  <textarea
                    rows={4}
                    value={draftForm.loadingNotes}
                    onChange={(event) => setDraftForm((previous) => ({ ...previous, loadingNotes: event.target.value }))}
                    disabled={!canEditMorningLoading || saving}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-offset-2 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                  />
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Route Lifecycle</CardTitle>
                <CardDescription>Morning completion and route-sheet status for this document.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Morning Completed At</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDateTime(summary.loadingCompletedAt)}</p>
                </div>
                <div className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Completed By</p>
                  <p className="mt-1 break-all font-semibold text-slate-900">{summary.loadingCompletedBy ?? "-"}</p>
                </div>
                <div className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Current Stage</p>
                  <p className="mt-1 font-semibold text-slate-900">{summary.loadingCompletedAt ? "Evening Reconciliation" : "Morning Loading"}</p>
                </div>
                <div className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Last Updated</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDateTime(summary.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <LoadingSummaryItemsPanel
            rows={itemRows}
            products={productOptions}
            loading={itemsLoading}
            saving={itemsSaving || saving}
            error={itemsError}
            canEditMorningLoading={canEditMorningLoading}
            canEditEveningReconciliation={canEditEveningReconciliation}
            canEditStructure={canEditMorningLoading}
            canEdit={isRouteSheetEditable}
            onSave={handleSaveItems}
          />

          <LoadingSummaryFinalizeConfirmDialog
            summary={confirmFinalizeOpen ? summary : null}
            submitting={saving}
            onCancel={handleCancelFinalize}
            onConfirm={handleConfirmFinalize}
          />
        </>
      ) : null}
    </AppShell>
  );
}

