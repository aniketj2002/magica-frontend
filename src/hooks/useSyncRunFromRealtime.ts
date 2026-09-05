"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { AgentRun, RunStatus } from "@/lib/api/types";
import { TERMINAL_RUN_STATUSES } from "@/lib/api/types";
import { runKeys } from "@/hooks/queries";

/**
 * Map Trigger's engine run status onto our AgentRun status when metadata is
 * missing or stale (e.g. stream parts dropped after a Magica waitpoint resume).
 */
function mapTriggerStatusToRunStatus(
  status: string | undefined,
): RunStatus | undefined {
  switch (status) {
    case "COMPLETED":
      return "COMPLETED";
    case "FAILED":
    case "CRASHED":
    case "SYSTEM_FAILURE":
    case "EXPIRED":
    case "TIMED_OUT":
      return "FAILED";
    case "CANCELED":
      return "CANCELLED";
    default:
      return undefined;
  }
}

/**
 * Subscribe to Trigger run metadata and mirror status into the TanStack Query
 * run cache — replaces HTTP polling of GET /runs/:id.
 */
export function useSyncRunFromRealtime(opts: {
  agentRunId: string | undefined;
  triggerRunId: string | undefined;
  publicAccessToken: string | undefined;
}) {
  const { agentRunId, triggerRunId, publicAccessToken } = opts;
  const queryClient = useQueryClient();
  const enabled = Boolean(triggerRunId && publicAccessToken);

  const { run, error } = useRealtimeRun(enabled ? triggerRunId : undefined, {
    accessToken: publicAccessToken,
    enabled,
  });

  useEffect(() => {
    if (!agentRunId || !run) return;

    const meta = (run.metadata ?? {}) as Record<string, unknown>;
    const metaStatus =
      typeof meta.status === "string" ? (meta.status as RunStatus) : undefined;
    const triggerStatus = mapTriggerStatusToRunStatus(run.status);
    // Prefer Trigger's terminal status over stale metadata (e.g. WAITING left
    // behind when the agent stream never delivered `finish`).
    const status =
      triggerStatus && TERMINAL_RUN_STATUSES.has(triggerStatus)
        ? triggerStatus
        : metaStatus;
    const turnCount =
      typeof meta.turn === "number"
        ? meta.turn
        : typeof meta.turn === "string" && Number.isFinite(Number(meta.turn))
          ? Number(meta.turn)
          : undefined;

    queryClient.setQueryData<AgentRun>(runKeys.detail(agentRunId), (prev) => {
      if (!prev) {
        // Wait for the initial GET /runs/:id to seed the cache.
        return prev;
      }
      return {
        ...prev,
        ...(status ? { status } : {}),
        ...(turnCount !== undefined ? { turnCount } : {}),
        triggerRunId: prev.triggerRunId ?? triggerRunId ?? prev.triggerRunId,
      };
    });
  }, [agentRunId, run, triggerRunId, queryClient]);

  return { realtimeRunError: error ?? null };
}
