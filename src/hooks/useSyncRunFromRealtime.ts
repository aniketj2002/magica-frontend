"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { AgentRun, RunStatus } from "@/lib/api/types";
import { runKeys } from "@/hooks/queries";

/**
 * Subscribe to Trigger run metadata and mirror `metadata.status` into the
 * TanStack Query run cache — replaces HTTP polling of GET /runs/:id.
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
    const status =
      typeof meta.status === "string" ? (meta.status as RunStatus) : undefined;
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
