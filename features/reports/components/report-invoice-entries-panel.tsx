"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyReportInvoiceEntryDto } from "@/types/domain/report";
import type { ReportInvoiceBatchSaveItemInput } from "@/features/reports/types";

type EditableInvoiceRow = {
  id?: string;
  clientId: string;
  invoiceNo: string;
  cashAmount: string;
  chequeAmount: string;
  creditAmount: string;
  notes: string;
};

type RowErrors = {
  invoiceNo?: string;
  cashAmount?: string;
  chequeAmount?: string;
  creditAmount?: string;
  notes?: string;
  amountGroup?: string;
};

type ReportInvoiceEntriesPanelProps = {
  rows: DailyReportInvoiceEntryDto[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  canEdit: boolean;
  onSave: (items: ReportInvoiceBatchSaveItemInput[]) => Promise<void>;
};

const moneyFormat = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 2
});

function toEditableRow(row: DailyReportInvoiceEntryDto): EditableInvoiceRow {
  return {
    id: row.id,
    clientId: row.id,
    invoiceNo: row.invoiceNo,
    cashAmount: String(row.cashAmount),
    chequeAmount: String(row.chequeAmount),
    creditAmount: String(row.creditAmount),
    notes: row.notes ?? ""
  };
}

function createEmptyRow(seed = 0): EditableInvoiceRow {
  const suffix = `${Date.now()}-${seed}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    clientId: `new-${suffix}`,
    invoiceNo: "",
    cashAmount: "0",
    chequeAmount: "0",
    creditAmount: "0",
    notes: ""
  };
}

function parseMoneyInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

function normalizeMoney(value: number) {
  return Number(value.toFixed(2));
}

function MoneyField({
  label,
  value,
  onChange,
  disabled,
  error
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-slate-200 px-3 text-right text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
        disabled={disabled}
      />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </label>
  );
}

export function ReportInvoiceEntriesPanel({
  rows,
  loading,
  saving,
  error,
  canEdit,
  onSave
}: ReportInvoiceEntriesPanelProps) {
  const [editableRows, setEditableRows] = useState<EditableInvoiceRow[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, RowErrors>>({});

  useEffect(() => {
    setEditableRows(rows.map(toEditableRow));
    setFieldErrors({});
  }, [rows]);

  const updateRow = (clientId: string, field: keyof EditableInvoiceRow, value: string) => {
    setEditableRows((previous) => previous.map((row) => (row.clientId === clientId ? { ...row, [field]: value } : row)));
    setFieldErrors((previous) => {
      if (!previous[clientId]) return previous;
      const next = { ...previous };
      next[clientId] = { ...next[clientId], [field]: undefined, amountGroup: undefined };
      return next;
    });
  };

  const addRow = () => {
    setEditableRows((previous) => [...previous, createEmptyRow(previous.length)]);
  };

  const removeRow = (clientId: string) => {
    setEditableRows((previous) => previous.filter((row) => row.clientId !== clientId));
    setFieldErrors((previous) => {
      if (!previous[clientId]) return previous;
      const next = { ...previous };
      delete next[clientId];
      return next;
    });
  };

  const totals = useMemo(() => {
    return editableRows.reduce(
      (acc, row) => {
        const cash = parseMoneyInput(row.cashAmount);
        const cheque = parseMoneyInput(row.chequeAmount);
        const credit = parseMoneyInput(row.creditAmount);

        acc.cash += Number.isFinite(cash) ? cash : 0;
        acc.cheque += Number.isFinite(cheque) ? cheque : 0;
        acc.credit += Number.isFinite(credit) ? credit : 0;

        return acc;
      },
      { cash: 0, cheque: 0, credit: 0 }
    );
  }, [editableRows]);

  const validateRows = () => {
    const errors: Record<string, RowErrors> = {};
    const normalizedInvoiceNos = new Set<string>();

    editableRows.forEach((row) => {
      const rowErrors: RowErrors = {};
      const invoiceNo = row.invoiceNo.trim();

      if (!invoiceNo) {
        rowErrors.invoiceNo = "Invoice number is required.";
      } else if (invoiceNo.length > 80) {
        rowErrors.invoiceNo = "Max 80 characters.";
      } else {
        const normalized = invoiceNo.toLowerCase();
        if (normalizedInvoiceNos.has(normalized)) {
          rowErrors.invoiceNo = "Duplicate invoice number in this batch.";
        }
        normalizedInvoiceNos.add(normalized);
      }

      const cash = parseMoneyInput(row.cashAmount);
      const cheque = parseMoneyInput(row.chequeAmount);
      const credit = parseMoneyInput(row.creditAmount);

      if (!Number.isFinite(cash) || cash < 0) rowErrors.cashAmount = "Enter a non-negative number.";
      if (!Number.isFinite(cheque) || cheque < 0) rowErrors.chequeAmount = "Enter a non-negative number.";
      if (!Number.isFinite(credit) || credit < 0) rowErrors.creditAmount = "Enter a non-negative number.";

      if (Number.isFinite(cash) && Number.isFinite(cheque) && Number.isFinite(credit)) {
        if (cash + cheque + credit <= 0) {
          rowErrors.amountGroup = "At least one amount must be greater than zero.";
        }
      }

      if (row.notes.trim().length > 500) {
        rowErrors.notes = "Max 500 characters.";
      }

      if (Object.values(rowErrors).some(Boolean)) {
        errors[row.clientId] = rowErrors;
      }
    });

    return errors;
  };

  const handleSave = async () => {
    const nextErrors = validateRows();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: ReportInvoiceBatchSaveItemInput[] = editableRows.map((row) => ({
      id: row.id,
      invoiceNo: row.invoiceNo.trim(),
      cashAmount: normalizeMoney(parseMoneyInput(row.cashAmount)),
      chequeAmount: normalizeMoney(parseMoneyInput(row.chequeAmount)),
      creditAmount: normalizeMoney(parseMoneyInput(row.creditAmount)),
      notes: row.notes.trim() || undefined
    }));

    await onSave(payload);
  };

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Invoice Entries</CardTitle>
            <CardDescription>Capture invoice-level payment split for this report.</CardDescription>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:flex print:hidden">
            <Button className="w-full lg:w-auto" variant="outline" onClick={addRow} disabled={!canEdit || saving || loading}>
              <Plus className="h-4 w-4" />
              Add Row
            </Button>
            <Button className="w-full lg:w-auto" onClick={handleSave} disabled={!canEdit || saving || loading}>
              <Save className={`h-4 w-4 ${saving ? "animate-pulse" : ""}`} />
              Save Entries
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? <Alert variant="destructive">{error}</Alert> : null}

        {!canEdit ? (
          <Alert>Invoice entries are read-only because this report is no longer in draft.</Alert>
        ) : null}

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Cash</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{moneyFormat.format(totals.cash)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Cheque</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{moneyFormat.format(totals.cheque)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Credit</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{moneyFormat.format(totals.credit)}</p>
          </div>
        </div>

        <div className="space-y-4 md:hidden">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={`invoice-mobile-${index}`} className="h-72 w-full rounded-xl" />)
          ) : editableRows.length === 0 ? (
            <div className="rounded-lg border border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
              No invoice entries yet. Add a row to begin data entry.
            </div>
          ) : (
            editableRows.map((row, index) => {
              const rowError = fieldErrors[row.clientId];
              const lineTotal = (Number.isFinite(parseMoneyInput(row.cashAmount)) ? parseMoneyInput(row.cashAmount) : 0)
                + (Number.isFinite(parseMoneyInput(row.chequeAmount)) ? parseMoneyInput(row.chequeAmount) : 0)
                + (Number.isFinite(parseMoneyInput(row.creditAmount)) ? parseMoneyInput(row.creditAmount) : 0);

              return (
                <article key={row.clientId} className="space-y-4 rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Invoice Line {index + 1}</p>
                      <p className="mt-1 text-sm text-slate-500">Capture payment split and notes for this invoice.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeRow(row.clientId)} disabled={!canEdit || saving}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <label className="space-y-1.5 block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Invoice No</span>
                    <input
                      value={row.invoiceNo}
                      onChange={(event) => updateRow(row.clientId, "invoiceNo", event.target.value)}
                      className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                      disabled={!canEdit || saving}
                    />
                    {rowError?.invoiceNo ? <p className="text-xs text-rose-600">{rowError.invoiceNo}</p> : null}
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MoneyField label="Cash (LKR)" value={row.cashAmount} onChange={(value) => updateRow(row.clientId, "cashAmount", value)} disabled={!canEdit || saving} error={rowError?.cashAmount} />
                    <MoneyField label="Cheque (LKR)" value={row.chequeAmount} onChange={(value) => updateRow(row.clientId, "chequeAmount", value)} disabled={!canEdit || saving} error={rowError?.chequeAmount} />
                    <MoneyField label="Credit (LKR)" value={row.creditAmount} onChange={(value) => updateRow(row.clientId, "creditAmount", value)} disabled={!canEdit || saving} error={rowError?.creditAmount} />
                  </div>

                  {rowError?.amountGroup ? <p className="text-xs text-rose-600">{rowError.amountGroup}</p> : null}

                  <label className="space-y-1.5 block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Notes</span>
                    <textarea
                      rows={3}
                      value={row.notes}
                      onChange={(event) => updateRow(row.clientId, "notes", event.target.value)}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                      disabled={!canEdit || saving}
                    />
                    {rowError?.notes ? <p className="text-xs text-rose-600">{rowError.notes}</p> : null}
                  </label>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Line Total</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{moneyFormat.format(lineTotal)}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
          <table className="min-w-[900px] text-sm xl:min-w-full">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Line #</th>
                <th className="px-3 py-3">Invoice No</th>
                <th className="px-3 py-3 text-right">Cash (LKR)</th>
                <th className="px-3 py-3 text-right">Cheque (LKR)</th>
                <th className="px-3 py-3 text-right">Credit (LKR)</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`loading-${index}`}>
                    <td className="px-3 py-3" colSpan={7}>
                      <Skeleton className="h-9 w-full" />
                    </td>
                  </tr>
                ))
              ) : editableRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-slate-500" colSpan={7}>
                    No invoice entries yet. Add a row to begin data entry.
                  </td>
                </tr>
              ) : (
                editableRows.map((row, index) => {
                  const rowError = fieldErrors[row.clientId];

                  return (
                    <tr key={row.clientId}>
                      <td className="px-3 py-3 font-semibold text-slate-900">{index + 1}</td>
                      <td className="px-3 py-3 align-top">
                        <input
                          value={row.invoiceNo}
                          onChange={(event) => updateRow(row.clientId, "invoiceNo", event.target.value)}
                          className="h-9 w-44 rounded-md border border-slate-200 px-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                          disabled={!canEdit || saving}
                        />
                        {rowError?.invoiceNo ? <p className="mt-1 text-xs text-rose-600">{rowError.invoiceNo}</p> : null}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.cashAmount}
                          onChange={(event) => updateRow(row.clientId, "cashAmount", event.target.value)}
                          className="h-9 w-28 rounded-md border border-slate-200 px-2 text-right text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                          disabled={!canEdit || saving}
                        />
                        {rowError?.cashAmount ? <p className="mt-1 text-right text-xs text-rose-600">{rowError.cashAmount}</p> : null}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.chequeAmount}
                          onChange={(event) => updateRow(row.clientId, "chequeAmount", event.target.value)}
                          className="h-9 w-28 rounded-md border border-slate-200 px-2 text-right text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                          disabled={!canEdit || saving}
                        />
                        {rowError?.chequeAmount ? <p className="mt-1 text-right text-xs text-rose-600">{rowError.chequeAmount}</p> : null}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.creditAmount}
                          onChange={(event) => updateRow(row.clientId, "creditAmount", event.target.value)}
                          className="h-9 w-28 rounded-md border border-slate-200 px-2 text-right text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                          disabled={!canEdit || saving}
                        />
                        {rowError?.creditAmount ? <p className="mt-1 text-right text-xs text-rose-600">{rowError.creditAmount}</p> : null}
                        {rowError?.amountGroup ? <p className="mt-1 text-right text-xs text-rose-600">{rowError.amountGroup}</p> : null}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          value={row.notes}
                          onChange={(event) => updateRow(row.clientId, "notes", event.target.value)}
                          className="h-9 w-52 rounded-md border border-slate-200 px-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                          disabled={!canEdit || saving}
                        />
                        {rowError?.notes ? <p className="mt-1 text-xs text-rose-600">{rowError.notes}</p> : null}
                      </td>
                      <td className="px-3 py-3 text-right align-top">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRow(row.clientId)}
                          disabled={!canEdit || saving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-50 text-sm font-semibold text-slate-900">
              <tr>
                <td className="px-3 py-3" colSpan={2}>Totals</td>
                <td className="px-3 py-3 text-right">{moneyFormat.format(totals.cash)}</td>
                <td className="px-3 py-3 text-right">{moneyFormat.format(totals.cheque)}</td>
                <td className="px-3 py-3 text-right">{moneyFormat.format(totals.credit)}</td>
                <td className="px-3 py-3" colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
