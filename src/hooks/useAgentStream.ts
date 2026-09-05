"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeStream } from "@trigger.dev/react-hooks";
import type { AgentStreamPart, ContentBlock } from "@/lib/api/types";
import { creditKeys, messageKeys, runKeys } from "@/hooks/queries";
import { useActiveRunStore } from "@/store/activeRun";

export type StreamToolCall = {
  id: string;
  name: string;
  argumentsJson: string;
  ok?: boolean;
  status?: string;
  credits?: number;
  output?: unknown;
};

export type FoldedStream = {
  text: string;
  reasoning: string;
  toolCalls: StreamToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
  finished: boolean;
  finishReason: string | null;
  error: { code: string; message: string } | null;
  status: string | null;
  contentBlocks: ContentBlock[];
};

function foldParts(parts: AgentStreamPart[] | undefined): FoldedStream {
  const result: FoldedStream = {
    text: "",
    reasoning: "",
    toolCalls: [],
    usage: null,
    finished: false,
    finishReason: null,
    error: null,
    status: null,
    contentBlocks: [],
  };

  if (!parts?.length) return result;

  const toolById = new Map<string, StreamToolCall>();

  for (const part of parts) {
    switch (part.type) {
      case "status":
        result.status = part.status;
        break;
      case "text-delta":
        result.text += part.text;
        break;
      case "reasoning-delta":
        result.reasoning += part.text;
        break;
      case "tool-call": {
        const existing = toolById.get(part.id);
        if (existing) {
          existing.name = part.name;
          existing.argumentsJson = part.argumentsJson;
        } else {
          toolById.set(part.id, {
            id: part.id,
            name: part.name,
            argumentsJson: part.argumentsJson,
          });
        }
        break;
      }
      case "tool-progress": {
        const existing = toolById.get(part.id);
        if (existing) {
          existing.status = part.status;
          if (!existing.name) existing.name = part.name;
        } else {
          toolById.set(part.id, {
            id: part.id,
            name: part.name,
            argumentsJson: "",
            status: part.status,
          });
        }
        break;
      }
      case "tool-approval-required": {
        const existing = toolById.get(part.id);
        if (existing) {
          existing.status = "AWAITING_APPROVAL";
          existing.credits = part.credits;
          if (!existing.name) existing.name = part.name;
        } else {
          toolById.set(part.id, {
            id: part.id,
            name: part.name,
            argumentsJson: "",
            status: "AWAITING_APPROVAL",
            credits: part.credits,
          });
        }
        break;
      }
      case "tool-result": {
        const existing = toolById.get(part.id);
        if (existing) {
          existing.ok = part.ok;
          existing.output = part.output;
          existing.status = part.ok ? "COMPLETED" : "FAILED";
        } else {
          toolById.set(part.id, {
            id: part.id,
            name: part.name,
            argumentsJson: "",
            ok: part.ok,
            output: part.output,
            status: part.ok ? "COMPLETED" : "FAILED",
          });
        }
        break;
      }
      case "usage":
        result.usage = {
          promptTokens: part.promptTokens,
          completionTokens: part.completionTokens,
          totalTokens: part.totalTokens,
        };
        break;
      case "finish":
        result.finished = true;
        result.finishReason = part.reason;
        break;
      case "error":
        result.error = { code: part.code, message: part.message };
        result.finished = true;
        break;
      default:
        break;
    }
  }

  result.toolCalls = [...toolById.values()];

  const blocks: ContentBlock[] = [];
  if (result.reasoning) {
    blocks.push({ type: "thinking", text: result.reasoning });
  }
  if (result.text) {
    blocks.push({ type: "text", text: result.text });
  }
  for (const tool of result.toolCalls) {
    let input: unknown = tool.argumentsJson;
    try {
      input = tool.argumentsJson ? JSON.parse(tool.argumentsJson) : {};
    } catch {
      input = tool.argumentsJson;
    }
    blocks.push({
      type: "tool_use",
      id: tool.id,
      name: tool.name,
      input,
      ...(tool.status ? { status: tool.status } : {}),
      ...(tool.credits !== undefined ? { credits: tool.credits } : {}),
    });
    if (tool.ok !== undefined) {
      blocks.push({
        type: "tool_result",
        toolUseId: tool.id,
        content:
          tool.output ??
          (tool.ok
            ? "ok"
            : { error: "tool_execution_error", message: "Tool failed" }),
        isError: !tool.ok,
      });
    }
  }
  if (result.usage) {
    blocks.push({ type: "usage", ...result.usage });
  }
  result.contentBlocks = blocks;

  return result;
}

export function useAgentStream(opts: {
  chatId: string;
  triggerRunId: string | undefined;
  publicAccessToken: string | undefined;
  agentRunId: string | undefined;
}) {
  const { chatId, triggerRunId, publicAccessToken, agentRunId } = opts;
  const queryClient = useQueryClient();
  const clearActiveRun = useActiveRunStore((s) => s.clearActiveRun);
  const invalidatedRef = useRef<string | null>(null);

  const enabled = Boolean(triggerRunId && publicAccessToken);

  const { parts, error } = useRealtimeStream<AgentStreamPart>(
    triggerRunId ?? "",
    "agent",
    {
      accessToken: publicAccessToken ?? "",
      // Trigger realtime API rejects timeout-seconds >= 600
      timeoutInSeconds: 599,
      throttleInMs: 50,
      enabled,
    },
  );

  const folded = useMemo(() => foldParts(parts), [parts]);

  const approvalInvalidateKey = useMemo(() => {
    const awaiting = folded.toolCalls.find(
      (t) => t.status === "AWAITING_APPROVAL",
    );
    return awaiting ? `${awaiting.id}:${awaiting.credits ?? ""}` : null;
  }, [folded.toolCalls]);

  const approvalInvalidatedRef = useRef<string | null>(null);

  // Persist approval UI via message refetch — stream overlay is hidden once the
  // STREAMING assistant row exists, so reopen/live both need DB tool_use.status.
  useEffect(() => {
    if (!approvalInvalidateKey) return;
    if (approvalInvalidatedRef.current === approvalInvalidateKey) return;
    approvalInvalidatedRef.current = approvalInvalidateKey;
    void queryClient.invalidateQueries({ queryKey: messageKeys.list(chatId) });
  }, [approvalInvalidateKey, chatId, queryClient]);

  useEffect(() => {
    if (!folded.finished && !folded.error && !error) return;
    const key = agentRunId ?? triggerRunId ?? null;
    if (!key || invalidatedRef.current === key) return;
    invalidatedRef.current = key;

    clearActiveRun(chatId);
    void queryClient.invalidateQueries({ queryKey: messageKeys.list(chatId) });
    void queryClient.invalidateQueries({ queryKey: creditKeys.balance });
    if (agentRunId) {
      void queryClient.invalidateQueries({ queryKey: runKeys.detail(agentRunId) });
    }
  }, [
    folded.finished,
    folded.error,
    error,
    agentRunId,
    triggerRunId,
    chatId,
    clearActiveRun,
    queryClient,
  ]);

  return {
    ...folded,
    streamError: error ?? null,
    isStreaming: enabled && !folded.finished && !folded.error && !error,
  };
}
