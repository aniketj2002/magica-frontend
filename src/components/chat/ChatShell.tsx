"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WelcomeScreen } from "./WelcomeScreen";
import { Composer } from "./Composer";
import { CategoryTabs } from "./CategoryTabs";
import { ShowcaseGrid } from "./ShowcaseGrid";
import { useModelSelection } from "./ModelContext";
import { useApiClient } from "@/hooks/useApiClient";
import { useActiveRunStore } from "@/store/activeRun";
import { ApiError } from "@/lib/api/client";
import { chatKeys, messageKeys } from "@/hooks/queries";

function titleFromText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 57)}…`;
}

export function ChatShell() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { apiModelId } = useModelSelection();
  const setActiveRun = useActiveRunStore((s) => s.setActiveRun);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const pendingChatIdRef = useRef<string | null>(null);

  const ensureChatId = useCallback(async () => {
    if (pendingChatIdRef.current) return pendingChatIdRef.current;
    if (!user) throw new Error("Sign in to start a chat.");
    const chat = await api.createChat({});
    pendingChatIdRef.current = chat.id;
    return chat.id;
  }, [api, user]);

  const handleSend = async (text: string, attachmentIds: string[]) => {
    if (!user) {
      setError("Sign in to start a chat.");
      return;
    }
    setError(null);
    setStarting(true);
    try {
      const title = titleFromText(text);
      let chatId = pendingChatIdRef.current;
      if (!chatId) {
        const chat = await api.createChat({ title });
        chatId = chat.id;
        pendingChatIdRef.current = chatId;
      } else {
        // Chat was created early for attachment upload (untitled) — backfill now.
        void api
          .updateChat(chatId, { title })
          .then(() =>
            queryClient.invalidateQueries({ queryKey: chatKeys.all }),
          )
          .catch(() => undefined);
      }

      // Optimistically populate the chat with the user's message
      const optimisticMessage = {
        id: `optimistic-${crypto.randomUUID()}`,
        chatId,
        userId: "me",
        agentRunId: null,
        role: "USER" as const,
        status: "COMPLETED" as const,
        content: [{ type: "text" as const, text }],
        metadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(messageKeys.list(chatId), {
        pages: [{ items: [optimisticMessage], nextCursor: null }],
        pageParams: [null],
      });

      // Navigate immediately
      router.push(`/chat/c/${chatId}`);

      // Fire the message request in the background
      api.sendMessage(
        chatId,
        {
          text,
          modelId: apiModelId,
          attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
        },
        { idempotencyKey: crypto.randomUUID() }
      ).then((result) => {
        setActiveRun(chatId, {
          agentRunId: result.runId,
          triggerRunId: result.realtime.runId,
          publicAccessToken: result.realtime.publicAccessToken,
        });
        void queryClient.invalidateQueries({ queryKey: messageKeys.list(chatId) });
        void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      }).catch((err) => {
        console.error("Failed to send background message:", err);
        // Optionally handle background error (e.g., toast notification)
      });

    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to start chat";
      setError(message);
      setStarting(false);
    }
  };

  return (
    <div className="flex flex-1 h-full min-h-0 w-full flex-col overflow-y-auto hide-scrollbar">
      <div className="flex flex-col items-center px-4 pt-6 sm:pt-12 md:pt-24">
        <WelcomeScreen />
        <div className="mt-6 md:mt-10 w-full">
          <Composer
            onSend={handleSend}
            ensureChatId={user ? ensureChatId : undefined}
            disabled={!isLoaded || starting}
            isStreaming={starting}
          />
          {error && (
            <p className="mx-auto mt-3 max-w-[900px] px-4 text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[900px] px-3 sm:px-4 pb-12">
        <div className="mt-4 sm:mt-6">
          <CategoryTabs />
        </div>
        <div className="mt-3 sm:mt-4">
          <ShowcaseGrid />
        </div>
      </div>
    </div>
  );
}
