"use client";

import { ListTree } from "lucide-react";
import type { CreditUsageItem } from "@/lib/api/types";
import { toolLabel } from "@/lib/tools/registry";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatCredits(amount: number): string {
  const abs = Math.abs(amount);
  let body: string;
  if (abs >= 1_000_000) {
    body = `${(abs / 1_000_000).toFixed(4)}M`;
  } else if (abs >= 1_000) {
    body = `${(abs / 1_000).toFixed(1)}K`;
  } else {
    body = abs.toFixed(4);
  }
  if (amount < 0) return `-${body}`;
  return body;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })}, ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })}`;
}

type UsageDetailsDialogProps = {
  item: CreditUsageItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UsageDetailsDialog({
  item,
  open,
  onOpenChange,
}: UsageDetailsDialogProps) {
  const steps = item?.steps ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="border-b-0 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <ListTree className="h-4 w-4 text-muted-foreground" />
            Usage details
          </DialogTitle>
          <DialogDescription className="sr-only">
            Step-level credit costs for this execution
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="px-5 pb-5">
            <div className="mt-2 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card px-4 py-3.5 sm:grid-cols-3">
              <SummaryCell label="MODEL" value={toolLabel(item.toolName)} />
              <SummaryCell
                label="TOTAL CREDITS"
                value={formatCredits(item.amount)}
              />
              <SummaryCell
                label="TIMESTAMP"
                value={formatDateTime(item.createdAt)}
              />
            </div>

            <div className="mt-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Step breakdown
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Execution costs recorded for this usage entry
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {steps.length} step{steps.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">
                      Step
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">
                      Timestamp
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground text-right">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {steps.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No step costs recorded
                      </td>
                    </tr>
                  ) : (
                    steps.map((step, idx) => (
                      <tr
                        key={`${step.type}-${step.createdAt}-${idx}`}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {step.label}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                          {formatDateTime(step.createdAt)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium tabular-nums ${
                            step.cost < 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          {formatCredits(step.cost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
