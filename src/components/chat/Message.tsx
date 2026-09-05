"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Copy,
  Check,
  GitBranch,
  ThumbsUp,
  ThumbsDown,
  CircleAlert,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentBlock, MessageStatus } from "@/lib/api/types";
import { ToolCallCard } from "./ToolCallCard";

const ATTACHMENT_MARKER =
  "Attached media URLs (use these with image/video tools):";
const BILLING_HREF = "/settings/billing/credit-usage";

interface MessageProps {
  role: "user" | "assistant" | "system" | "tool";
  content: ContentBlock[];
  status?: MessageStatus;
  streaming?: boolean;
  createdAt?: string | null;
  errorCode?: string | null;
  onRetry?: () => void;
}

function textFromBlocks(blocks: ContentBlock[]): string {
  return blocks
    .filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function splitUserAttachmentText(text: string): {
  body: string;
  urls: string[];
} {
  const markerIdx = text.indexOf(ATTACHMENT_MARKER);
  if (markerIdx === -1) {
    return { body: text, urls: [] };
  }
  const body = text.slice(0, markerIdx).trimEnd();
  const urls = text
    .slice(markerIdx + ATTACHMENT_MARKER.length)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter((url) => /^https?:\/\//i.test(url));
  return { body, urls };
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

function formatTime(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard failures
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={!text}
      title={copied ? "Copied" : "Copy message"}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40",
        className,
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">{copied ? "Copied" : "Copy message"}</span>
    </button>
  );
}

function pairToolCalls(content: ContentBlock[]) {
  type ToolUse = Extract<ContentBlock, { type: "tool_use" }>;
  type ToolResult = Extract<ContentBlock, { type: "tool_result" }>;

  const uses = content.filter((b): b is ToolUse => b.type === "tool_use");
  const results = new Map<string, ToolResult>();
  for (const b of content) {
    if (b.type === "tool_result") results.set(b.toolUseId, b);
  }

  return uses.map((use) => {
    const result = results.get(use.id);
    return {
      use,
      result: result
        ? { content: result.content, isError: result.isError }
        : undefined,
    };
  });
}

export function OutOfCreditsCard({
  title = "Out of credits",
  description = "You don’t have enough credits to continue. Top up or review usage to keep generating.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50/80 px-3.5 py-3 text-sm dark:border-amber-500/30 dark:bg-amber-950/25">
      <Coins className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        <Link
          href={BILLING_HREF}
          className="mt-2 inline-flex text-xs font-medium text-foreground underline-offset-2 hover:underline"
        >
          View credit usage
        </Link>
      </div>
    </div>
  );
}

export function Message({
  role,
  content,
  status = "COMPLETED",
  streaming = false,
  createdAt,
  errorCode,
  onRetry,
}: MessageProps) {
  const isUser = role === "user";
  const [thinkingOpen, setThinkingOpen] = useState(false);

  const thinking = content.filter(
    (b): b is Extract<ContentBlock, { type: "thinking" }> => b.type === "thinking",
  );
  const toolPairs = pairToolCalls(content);
  const text = textFromBlocks(content);
  const failed = status === "FAILED" || status === "CANCELLED";
  const outOfCredits = errorCode === "insufficient_credits";
  const time = formatTime(createdAt);

  if (isUser) {
    const { body, urls } = splitUserAttachmentText(text);
    return (
      <div className="group animate-message-in flex flex-col items-end gap-1.5">
        <div className="message-bubble-user text-[14px] leading-relaxed">
          {body ? <p className="whitespace-pre-wrap">{body}</p> : null}
          {urls.length > 0 && (
            <div
              className={cn(
                "flex flex-wrap gap-2",
                body ? "mt-2.5" : undefined,
              )}
            >
              {urls.map((url) =>
                isVideoUrl(url) ? (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
                  >
                    <video
                      src={url}
                      preload="metadata"
                      muted
                      className="h-20 w-28 object-cover"
                    />
                  </a>
                ) : (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Attachment"
                      className="h-20 w-20 object-cover"
                    />
                  </a>
                ),
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 pr-0.5 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
          {time && (
            <span className="text-[11px] tabular-nums leading-none">{time}</span>
          )}
          <CopyButton text={body || text} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-message-in flex w-full flex-col gap-2.5">
      <div className="message-area-assistant min-w-0 max-w-3xl space-y-2.5">
        {thinking.length > 0 && (
          <div className="thinking-block text-sm">
            <button
              type="button"
              onClick={() => setThinkingOpen((v) => !v)}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  thinkingOpen ? "rotate-0" : "-rotate-90",
                )}
              />
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                Thinking
              </span>
            </button>
            {thinkingOpen && (
              <div className="border-t border-[rgba(124,92,252,0.12)] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {thinking.map((b) => b.text).join("")}
              </div>
            )}
          </div>
        )}

        {toolPairs.length > 0 && (
          <div className="space-y-2">
            {toolPairs.map(({ use, result }) => (
              <ToolCallCard
                key={use.id}
                name={use.name}
                input={use.input}
                status={use.status}
                result={result}
              />
            ))}
          </div>
        )}

        <div className="max-w-none text-[15px] leading-relaxed break-words text-foreground">
          {text ? (
            <p className="whitespace-pre-wrap">
              {text}
              {streaming && <span className="streaming-cursor" />}
            </p>
          ) : streaming ? (
            <p className="text-muted-foreground">
              <span className="streaming-cursor" />
            </p>
          ) : null}
        </div>

        {failed && outOfCredits && (
          <OutOfCreditsCard
            title="Ran out of credits mid-generation"
            description="This run stopped because your balance hit zero. Add credits to continue where you left off."
          />
        )}

        {failed && !outOfCredits && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/60 px-3.5 py-2.5 text-sm text-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <CircleAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                {status === "CANCELLED"
                  ? "Response was interrupted"
                  : "Generation failed"}
              </span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="shrink-0 text-sm font-medium text-foreground underline-offset-2 hover:underline"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {!streaming && (
        <div className="flex items-center gap-0.5 text-muted-foreground">
          <CopyButton text={text} />
          <button
            type="button"
            title="Branch"
            className="inline-flex items-center justify-center rounded-md p-1 transition-colors hover:bg-accent hover:text-foreground"
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span className="sr-only">Branch</span>
          </button>
          <button
            type="button"
            title="Good response"
            className="inline-flex items-center justify-center rounded-md p-1 transition-colors hover:bg-accent hover:text-foreground"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span className="sr-only">Good response</span>
          </button>
          <button
            type="button"
            title="Bad response"
            className="inline-flex items-center justify-center rounded-md p-1 transition-colors hover:bg-accent hover:text-foreground"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            <span className="sr-only">Bad response</span>
          </button>
          {time && (
            <span className="ml-1.5 text-[11px] tabular-nums leading-none">
              {time}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
