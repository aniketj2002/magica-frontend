"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { AuthCheckpoint } from "./AuthCheckpoint";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { OutOfCreditsCard } from "./Message";
import { useModelSelection } from "./ModelContext";
import {
  creditKeys,
  flattenMessagesChronological,
  messageKeys,
  runKeys,
  useCancelRun,
  useMessages,
  useRun,
  useSendMessage,
} from "@/hooks/queries";
import { useAgentStream } from "@/hooks/useAgentStream";
import { useSyncRunFromRealtime } from "@/hooks/useSyncRunFromRealtime";
import { useActiveRunStore } from "@/store/activeRun";
import { TERMINAL_RUN_STATUSES } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

export function ChatConversation({ chatId }: { chatId: string }) {
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const signedIn = Boolean(mounted && isLoaded && user);

  const { apiModelId } = useModelSelection();
  const queryClient = useQueryClient();
  const activeRun = useActiveRunStore((s) => s.byChatId[chatId]);
  const setActiveRun = useActiveRunStore((s) => s.setActiveRun);
  const clearActiveRun = useActiveRunStore((s) => s.clearActiveRun);
  const messagesQuery = useMessages(chatId, signedIn);
  const sendMessage = useSendMessage(chatId);
  const cancelRun = useCancelRun();
  const reconciledTerminalRunRef = useRef<string | null>(null);
  const messages = useMemo(
    () => flattenMessagesChronological(messagesQuery.data?.pages),
    [messagesQuery.data?.pages],
  );

  // After a hard refresh, recover agentRunId from a STREAMING assistant message.
  // Also keep the latest FAILED run so insufficient_credits (and similar) errorCodes
  // remain available for the failed-message UI after the stream clears.
  const streamingMessageRunId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]!;
      if (m.role === "ASSISTANT" && m.status === "STREAMING" && m.agentRunId) {
        return m.agentRunId;
      }
    }
    return undefined;
  }, [messages]);

  const latestFailedRunId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]!;
      if (
        m.role === "ASSISTANT" &&
        (m.status === "FAILED" || m.status === "CANCELLED") &&
        m.agentRunId
      ) {
        return m.agentRunId;
      }
    }
    return undefined;
  }, [messages]);

  const agentRunId = signedIn
    ? (activeRun?.agentRunId ?? streamingMessageRunId)
    : undefined;
  const runQuery = useRun(signedIn ? (agentRunId ?? latestFailedRunId) : undefined);

  // Reattach Trigger Realtime after refresh: GET /runs/:id returns a fresh token.
  useEffect(() => {
    const run = runQuery.data;
    const realtime = run?.realtime;
    if (!run || !realtime) return;
    if (TERMINAL_RUN_STATUSES.has(run.status)) return;
    if (
      activeRun?.publicAccessToken === realtime.publicAccessToken &&
      activeRun?.triggerRunId === realtime.runId
    ) {
      return;
    }
    setActiveRun(chatId, {
      agentRunId: run.id,
      triggerRunId: realtime.runId,
      publicAccessToken: realtime.publicAccessToken,
    });
  }, [runQuery.data, activeRun, chatId, setActiveRun]);

  const triggerRunId = activeRun?.triggerRunId ?? runQuery.data?.triggerRunId ?? undefined;
  const publicAccessToken = activeRun?.publicAccessToken;

  useSyncRunFromRealtime({
    agentRunId,
    triggerRunId,
    publicAccessToken,
  });

  const stream = useAgentStream({
    chatId,
    triggerRunId,
    publicAccessToken,
    agentRunId,
  });

  const runStatus = runQuery.data?.status;

  // Stream `finish` can be missed after Magica waitpoint resume / socket drops.
  // Run metadata (or GET /runs) is still authoritative — reconcile messages so
  // we don't leave a cached STREAMING bubble stuck on "Generating…".
  useEffect(() => {
    if (!agentRunId || !runStatus) return;
    if (!TERMINAL_RUN_STATUSES.has(runStatus)) return;
    const tracking =
      activeRun?.agentRunId === agentRunId ||
      streamingMessageRunId === agentRunId;
    if (!tracking) return;
    if (reconciledTerminalRunRef.current === agentRunId) return;
    reconciledTerminalRunRef.current = agentRunId;

    clearActiveRun(chatId);
    void queryClient.invalidateQueries({ queryKey: messageKeys.list(chatId) });
    void queryClient.invalidateQueries({ queryKey: creditKeys.balance });
    void queryClient.invalidateQueries({
      queryKey: runKeys.detail(agentRunId),
    });
  }, [
    agentRunId,
    runStatus,
    activeRun?.agentRunId,
    streamingMessageRunId,
    chatId,
    clearActiveRun,
    queryClient,
  ]);

  const runActive =
    Boolean(agentRunId) &&
    (!runStatus || !TERMINAL_RUN_STATUSES.has(runStatus));
  const isStreaming =
    stream.isStreaming || runActive || sendMessage.isPending;

  // Only while the Trigger stream is live. Keeping the buffer after
  // `activeRun` alone caused a duplicate assistant bubble once the
  // checkpointed message flipped to COMPLETED but the stream hadn't
  // finished clearing yet.
  const streamingBuffer = stream.isStreaming
    ? { content: stream.contentBlocks, active: true }
    : null;

  const handleSend = async (text: string, attachmentIds: string[]) => {
    try {
      await sendMessage.mutateAsync({
        text,
        modelId: apiModelId,
        attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStop = () => {
    if (!agentRunId) return;
    cancelRun.mutate({ agentRunId, chatId });
  };

  const paymentRequired =
    sendMessage.error instanceof ApiError &&
    sendMessage.error.code === "payment_required";
  const genericSendError =
    !paymentRequired && sendMessage.error
      ? sendMessage.error instanceof ApiError
        ? sendMessage.error.message
        : "Failed to send message"
      : null;
  const streamInsufficientCredits =
    stream.error?.code === "insufficient_credits";

  const errorCodeByRunId = useMemo(() => {
    const code = runQuery.data?.errorCode;
    const runId = runQuery.data?.id ?? agentRunId ?? latestFailedRunId;
    if (!runId || !code) return undefined;
    return { [runId]: code };
  }, [runQuery.data?.errorCode, runQuery.data?.id, agentRunId, latestFailedRunId]);

  if (mounted && isLoaded && !user) {
    return (
      <AuthCheckpoint
        title="Chat"
        description="Sign in to view this conversation and continue your AI worker tasks."
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {messagesQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading messages…
        </div>
      ) : messagesQuery.isError ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-600 dark:text-red-400">
          Failed to load messages
        </div>
      ) : (
        <MessageList
          messages={messages}
          streaming={streamingBuffer}
          hasOlder={Boolean(messagesQuery.hasNextPage)}
          isLoadingOlder={messagesQuery.isFetchingNextPage}
          onLoadOlder={() => void messagesQuery.fetchNextPage()}
          errorCodeByRunId={errorCodeByRunId}
          streamingErrorCode={stream.error?.code}
          streamingAgentRunId={agentRunId}
        />
      )}

      <div className="relative z-30 shrink-0 bg-background pb-4 pt-1">
        <Composer
          chatId={chatId}
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
          disabled={sendMessage.isPending}
        />
        {paymentRequired && (
          <div className="mx-auto mt-2 max-w-[900px] px-4">
            <OutOfCreditsCard />
          </div>
        )}
        {genericSendError && (
          <p className="mx-auto mt-2 max-w-[900px] px-4 text-center text-sm text-red-600 dark:text-red-400">
            {genericSendError}
          </p>
        )}
        {stream.error && !streamInsufficientCredits && (
          <p className="mx-auto mt-2 max-w-[900px] px-4 text-center text-sm text-red-600 dark:text-red-400">
            {stream.error.message}
          </p>
        )}
        {streamInsufficientCredits && !paymentRequired && (
          <div className="mx-auto mt-2 max-w-[900px] px-4">
            <OutOfCreditsCard
              title="Ran out of credits mid-generation"
              description="This run stopped because your balance hit zero. Add credits to continue where you left off."
            />
          </div>
        )}
      </div>
    </div>
  );
}
