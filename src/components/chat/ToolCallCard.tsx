"use client";

import { useState } from "react";
import { ChevronDown, CircleAlert, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToolMeta, summarizeToolInput } from "@/lib/tools/registry";
import { extractToolMedia, ToolMedia } from "./ToolMedia";

export type ToolCallCardProps = {
  name: string;
  input: unknown;
  status?: string;
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

export function ToolCallCard({ name, input, status, result }: ToolCallCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { label, Icon } = getToolMeta(name);
  const summary = summarizeToolInput(name, input);

  const isError = Boolean(result?.isError);
  const isDone = result !== undefined && !isError;
  const isRunning = result === undefined;
  const waiting =
    isRunning &&
    (status === "WAITING" || status === "QUEUED" || !status || status === "RUNNING");

  const media = isDone ? extractToolMedia(result.content) : null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border text-sm",
        isError
          ? "border-red-300/50 bg-red-50/50 dark:border-red-500/30 dark:bg-red-950/20"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-start gap-2.5 px-3.5 py-2.5">
        <div
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            isError
              ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
              : "bg-[rgba(124,92,252,0.1)] text-[#7c5cfc]",
          )}
        >
          {waiting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isError ? (
            <CircleAlert className="h-3.5 w-3.5" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-medium text-foreground">{label}</span>
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
