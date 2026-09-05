"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useApiClient } from "@/hooks/useApiClient";
import {
  type CreditUsageShow,
  type Message,
} from "@/lib/api/types";
import { useActiveRunStore } from "@/store/activeRun";

/** HTTP poll interval for GET /runs/:id. Trigger Realtime owns live status. */
const RUN_STATUS_HTTP_REFETCH_INTERVAL_MS: false | number = false;

export const chatKeys = {
  all: ["chats"] as const,
  list: () => [...chatKeys.all, "list"] as const,
  detail: (id: string) => [...chatKeys.all, id] as const,
};

export const messageKeys = {
  all: ["messages"] as const,
  list: (chatId: string) => [...messageKeys.all, chatId] as const,
};

export const runKeys = {
  detail: (agentRunId: string) => ["run", agentRunId] as const,
};

export function useChats(enabled = true) {
  const api = useApiClient();

  return useInfiniteQuery({
    queryKey: chatKeys.list(),
    enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.listChats({ limit: 30, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useCreateChat() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body?: { title?: string | null }) => api.createChat(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}

export function useChat(chatId: string | undefined, enabled = true) {
  const api = useApiClient();

  return useQuery({
    queryKey: chatKeys.detail(chatId ?? ""),
    enabled: Boolean(chatId) && enabled,
    queryFn: () => api.getChat(chatId!),
  });
}

export function useMessages(chatId: string | undefined, enabled = true) {
  const api = useApiClient();

  return useInfiniteQuery({
    queryKey: messageKeys.list(chatId ?? ""),
    enabled: Boolean(chatId) && enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.listMessages(chatId!, { limit: 50, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor,
  });
}

/** Flatten infinite pages (newest-first from API) into chronological display order. */
export function flattenMessagesChronological(
  pages: { items: Message[] }[] | undefined,
): Message[] {
  if (!pages?.length) return [];
  const newestFirst = pages.flatMap((p) => p.items);
  return [...newestFirst].reverse();
}

export function useSendMessage(chatId: string | undefined) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const setActiveRun = useActiveRunStore((s) => s.setActiveRun);

  return useMutation({
    mutationFn: async (input: {
      text: string;
      modelId?: string;
      attachmentIds?: string[];
    }) => {
      if (!chatId) throw new Error("chatId is required");
      const idempotencyKey = crypto.randomUUID();
      return api.sendMessage(
        chatId,
        {
          text: input.text,
          modelId: input.modelId,
          attachmentIds: input.attachmentIds,
        },
        { idempotencyKey },
      );
    },
    onMutate: async (input) => {
      if (!chatId) return;
      await queryClient.cancelQueries({ queryKey: messageKeys.list(chatId) });
      const previous = queryClient.getQueryData(messageKeys.list(chatId));

      const optimistic: Message = {
        id: `optimistic-${crypto.randomUUID()}`,
        chatId,
        userId: "me",
        agentRunId: null,
        role: "USER",
        status: "COMPLETED",
        content: [{ type: "text", text: input.text }],
        metadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(
        messageKeys.list(chatId),
        (old: { pages: { items: Message[]; nextCursor: string | null }[]; pageParams: unknown[] } | undefined) => {
          if (!old) {
            return {
              pages: [{ items: [optimistic], nextCursor: null }],
              pageParams: [null],
            };
          }
          const pages = [...old.pages];
          // Newest-first: prepend optimistic user message to first page.
          pages[0] = {
            ...pages[0]!,
            items: [optimistic, ...pages[0]!.items],
          };
          return { ...old, pages };
        },
      );

      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (chatId && ctx?.previous !== undefined) {
        queryClient.setQueryData(messageKeys.list(chatId), ctx.previous);
      }
    },
    onSuccess: (result) => {
      setActiveRun(result.chatId, {
        agentRunId: result.runId,
        triggerRunId: result.realtime.runId,
        publicAccessToken: result.realtime.publicAccessToken,
      });
      void queryClient.invalidateQueries({
        queryKey: messageKeys.list(result.chatId),
      });
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}

export function useRun(agentRunId: string | undefined) {
  const api = useApiClient();

  return useQuery({
    queryKey: runKeys.detail(agentRunId ?? ""),
    enabled: Boolean(agentRunId),
    queryFn: () => api.getRun(agentRunId!),
    // Status updates come from Trigger Realtime metadata (useSyncRunFromRealtime).
    refetchInterval: RUN_STATUS_HTTP_REFETCH_INTERVAL_MS,
  });
}

export function useCancelRun() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const clearActiveRun = useActiveRunStore((s) => s.clearActiveRun);

  return useMutation({
    mutationFn: (input: { agentRunId: string; chatId: string }) =>
      api.cancelRun(input.agentRunId),
    onSuccess: (run, input) => {
      clearActiveRun(input.chatId);
      void queryClient.invalidateQueries({
        queryKey: runKeys.detail(input.agentRunId),
      });
      void queryClient.invalidateQueries({
        queryKey: messageKeys.list(input.chatId),
      });
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}

export function useApproveToolCall() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { agentRunId: string; toolCallId: string }) =>
      api.approveToolCall(input.agentRunId, input.toolCallId),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: runKeys.detail(input.agentRunId),
      });
      void queryClient.invalidateQueries({ queryKey: creditKeys.balance });
    },
  });
}

export function useRejectToolCall() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { agentRunId: string; toolCallId: string }) =>
      api.rejectToolCall(input.agentRunId, input.toolCallId),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: runKeys.detail(input.agentRunId),
      });
    },
  });
}

/* ── Credits ── */

export const creditKeys = {
  balance: ["credits", "balance"] as const,
  usage: (from?: string, to?: string, show?: CreditUsageShow) =>
    ["credits", "usage", from, to, show] as const,
};

export function useBalance(enabled = true) {
  const api = useApiClient();

  return useQuery({
    queryKey: creditKeys.balance,
    enabled,
    queryFn: () => api.getBalance(),
    staleTime: 30_000, // re-fetch at most every 30s
  });
}

export function useCreditUsage(opts?: {
  from?: string;
  to?: string;
  show?: CreditUsageShow;
  enabled?: boolean;
}) {
  const api = useApiClient();
  const { enabled = true, ...queryOpts } = opts ?? {};

  return useQuery({
    queryKey: creditKeys.usage(queryOpts.from, queryOpts.to, queryOpts.show),
    enabled,
    queryFn: () => api.getCreditUsage(queryOpts),
    staleTime: 60_000,
  });
}

/* ── Attachments ── */

export const attachmentKeys = {
  all: ["attachments"] as const,
  detail: (id: string) => [...attachmentKeys.all, id] as const,
};

