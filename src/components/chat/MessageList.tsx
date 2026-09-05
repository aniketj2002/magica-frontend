"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "./Message";
import type { ContentBlock, Message as ApiMessage } from "@/lib/api/types";

export type StreamingBuffer = {
  content: ContentBlock[];
  active: boolean;
} | null;

function roleForUi(
  role: ApiMessage["role"],
): "user" | "assistant" | "system" | "tool" {
  switch (role) {
    case "USER":
      return "user";
    case "ASSISTANT":
      return "assistant";
    case "SYSTEM":
      return "system";
    case "TOOL":
      return "tool";
  }
}

export function MessageList({
  messages,
  streaming,
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  errorCodeByRunId,
  streamingErrorCode,
  streamingAgentRunId,
}: {
  messages: ApiMessage[];
  streaming?: StreamingBuffer;
  hasOlder?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
  errorCodeByRunId?: Record<string, string | null | undefined>;
  streamingErrorCode?: string | null;
  streamingAgentRunId?: string | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Hide the live overlay once this run is already in the message list
  // (STREAMING or COMPLETED). Otherwise a late refetch can show the same
  // assistant output twice — once from DB, once from the stream buffer.
  const showStreaming =
    streaming?.active &&
    !messages.some(
      (m) =>
        m.role === "ASSISTANT" &&
        (m.status === "STREAMING" ||
          (streamingAgentRunId != null && m.agentRunId === streamingAgentRunId)),
    );

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streaming?.content.length]);

  return (
    <ScrollArea className="min-h-0 flex-1 overflow-hidden p-4">
      <div className="mx-auto max-w-3xl space-y-6 pt-4 pb-8">
        {hasOlder && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={isLoadingOlder}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
            >
              {isLoadingOlder ? "Loading…" : "Load older messages"}
            </button>
          </div>
        )}

        {messages.map((message) => (
          <Message
            key={message.id}
            role={roleForUi(message.role)}
            content={Array.isArray(message.content) ? message.content : []}
            status={message.status}
            streaming={message.status === "STREAMING"}
            createdAt={message.createdAt}
            agentRunId={message.agentRunId}
            errorCode={
              message.agentRunId
                ? (errorCodeByRunId?.[message.agentRunId] ?? null)
                : null
            }
          />
        ))}

        {showStreaming && (
          <Message
            role="assistant"
            content={streaming!.content}
            status="STREAMING"
            streaming
            agentRunId={streamingAgentRunId}
            errorCode={streamingErrorCode}
          />
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

