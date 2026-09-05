"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { OutOfCreditsCard } from "./Message";
import { useModelSelection } from "./ModelContext";
import {
  flattenMessagesChronological,
  messageKeys,
  useCancelRun,
  useMessages,
  useRun,
  useSendMessage,
} from "@/hooks/queries";
import { useAgentStream } from "@/hooks/useAgentStream";
import { useActiveRunStore } from "@/store/activeRun";
import { TERMINAL_RUN_STATUSES } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

export function ChatConversation({ chatId }: { chatId: string }) {
  const queryClient = useQueryClient();
  const { apiModelId } = useModelSelection();
  const activeRun = useActiveRunStore((s) => s.byChatId[chatId]);
  const messagesQuery = useMessages(chatId);
  const sendMessage = useSendMessage(chatId);
  const cancelRun = useCancelRun();

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

  const agentRunId = activeRun?.agentRunId ?? streamingMessageRunId;
  const runQuery = useRun(agentRunId ?? latestFailedRunId);

  const stream = useAgentStream({
    chatId,
    triggerRunId: activeRun?.triggerRunId,
    publicAccessToken: activeRun?.publicAccessToken,
    agentRunId,
  });

  const runStatus = runQuery.data?.status;
  const runActive =
    Boolean(agentRunId) &&
    (!runStatus || !TERMINAL_RUN_STATUSES.has(runStatus));

  // While a run is active without a live realtime token, poll checkpointed messages.
  useEffect(() => {
    if (!runActive || activeRun?.publicAccessToken) return;
    const id = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.list(chatId) });
    }, 2000);
    return () => window.clearInterval(id);
  }, [runActive, activeRun?.publicAccessToken, chatId, queryClient]);

  const isStreaming =
    stream.isStreaming || runActive || sendMessage.isPending;

  const streamingBuffer =
    stream.isStreaming || (Boolean(activeRun) && stream.contentBlocks.length > 0)
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
