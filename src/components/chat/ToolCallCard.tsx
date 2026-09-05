"use client";

import { useState } from "react";
import { ChevronDown, CircleAlert, Coins, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToolMeta, summarizeToolInput } from "@/lib/tools/registry";
import { extractToolMedia, ToolMedia } from "./ToolMedia";
import {
  useApproveToolCall,
  useRejectToolCall,
} from "@/hooks/queries";

export type ToolCallCardProps = {
  name: string;
  toolCallId: string;
  input: unknown;
  status?: string;
  credits?: number;
  agentRunId?: string | null;
  result?: { content: unknown; isError?: boolean };
};

function errorMessage(content: unknown): string {
  if (!content) return "Tool failed";
  if (typeof content === "string") return content;
  if (typeof content === "object") {
    const c = content as Record<string, unknown>;
    if (typeof c.message === "string") return c.message;
    if (typeof c.error === "string") return c.error;
  }
  try {
    return JSON.stringify(content);
  } catch {
    return "Tool failed";
  }
}

function formatCredits(credits: number): string {
  if (Number.isInteger(credits)) return String(credits);
  return credits.toFixed(2);
}

export function ToolCallCard({
  name,
  toolCallId,
  input,
  status,
  credits,
  agentRunId,
  result,
}: ToolCallCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [decisionPending, setDecisionPending] = useState(false);
  const approve = useApproveToolCall();
  const reject = useRejectToolCall();
  const { label, Icon } = getToolMeta(name);
  const summary = summarizeToolInput(name, input);

  const isError = Boolean(result?.isError);
  const isDone = result !== undefined && !isError;
  const isRunning = result === undefined;
  const awaitingApproval =
    isRunning && status === "AWAITING_APPROVAL" && Boolean(agentRunId);
  const waiting =
    isRunning &&
    !awaitingApproval &&
    (status === "WAITING" ||
      status === "QUEUED" ||
      !status ||
      status === "RUNNING");

  const media = isDone ? extractToolMedia(result.content) : null;
  const busy = decisionPending || approve.isPending || reject.isPending;

  const onApprove = async () => {
    if (!agentRunId || busy) return;
    setDecisionPending(true);
    try {
      await approve.mutateAsync({ agentRunId, toolCallId });
    } catch (err) {
      console.error(err);
      setDecisionPending(false);
    }
  };

  const onReject = async () => {
    if (!agentRunId || busy) return;
    setDecisionPending(true);
    try {
      await reject.mutateAsync({ agentRunId, toolCallId });
    } catch (err) {
      console.error(err);
      setDecisionPending(false);
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border text-sm",
        isError
          ? "border-red-300/50 bg-red-50/50 dark:border-red-500/30 dark:bg-red-950/20"
          : awaitingApproval
            ? "border-amber-300/50 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-950/20"
            : "border-border bg-card",
      )}
    >
      <div className="flex items-start gap-2.5 px-3.5 py-2.5">
        <div
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            isError
              ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
              : awaitingApproval
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                : "bg-[rgba(124,92,252,0.1)] text-[#7c5cfc]",
          )}
        >
          {waiting || busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isError ? (
            <CircleAlert className="h-3.5 w-3.5" />
          ) : awaitingApproval ? (
            <Coins className="h-3.5 w-3.5" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-medium text-foreground">{label}</span>
            {awaitingApproval && (
              <span className="text-xs text-amber-700 dark:text-amber-400">
                Needs approval
              </span>
            )}
            {waiting && (
              <span className="text-xs text-muted-foreground">Generating…</span>
            )}
            {isDone && !media && (
              <span className="text-xs text-muted-foreground">Done</span>
            )}
            {isError && (
              <span className="text-xs text-red-600 dark:text-red-400">Failed</span>
            )}
          </div>
          {summary && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{summary}</p>
          )}
          {awaitingApproval && typeof credits === "number" && (
            <p className="mt-1.5 text-xs text-foreground">
              Cost:{" "}
              <span className="font-semibold tabular-nums">
                {formatCredits(credits)}
              </span>{" "}
              {credits === 1 ? "credit" : "credits"}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Toggle details"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              detailsOpen ? "rotate-0" : "-rotate-90",
            )}
          />
        </button>
      </div>

      {awaitingApproval && (
        <div className="flex items-center gap-2 border-t border-amber-200/60 px-3.5 py-2.5 dark:border-amber-500/20">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onApprove()}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy && approve.isPending ? "Approving…" : "Approve"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onReject()}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {busy && reject.isPending ? "Rejecting…" : "Reject"}
          </button>
        </div>
      )}

      {waiting && (
        <div className="tool-shimmer mx-3.5 mb-3 h-24 rounded-lg" aria-hidden />
      )}

      {isError && (
        <div className="border-t border-red-200/60 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-500/20 dark:text-red-300">
          {errorMessage(result?.content)}
        </div>
      )}

      {media && (
        <div className="border-t border-border px-3.5 py-3">
          <ToolMedia media={media} />
        </div>
      )}

      {detailsOpen && (
        <div className="border-t border-border bg-muted/30 px-3.5 py-2.5">
          <pre className="overflow-x-auto text-[11px] break-all whitespace-pre-wrap text-muted-foreground">
            {typeof input === "string" ? input : JSON.stringify(input, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
