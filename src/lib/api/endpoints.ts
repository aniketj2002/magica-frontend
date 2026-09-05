import { apiFetch } from "./client";
import type {
  AgentRun,
  Attachment,
  Chat,
  CreateAttachmentResult,
  CreditBalance,
  CreditUsageResponse,
  CreditUsageShow,
  Message,
  Page,
  SendMessageResult,
} from "./types";

export type TokenProvider = () => Promise<string | null>;

async function withToken(getToken: TokenProvider): Promise<string> {
  const token = await getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return token;
}

export function createApi(getToken: TokenProvider) {
  return {
    listChats(opts?: { limit?: number; cursor?: string | null }) {
      return withToken(getToken).then((token) =>
        apiFetch<Page<Chat>>("/chats", {
          token,
          query: { limit: opts?.limit, cursor: opts?.cursor },
        }),
      );
    },

    createChat(body?: { title?: string | null }) {
      return withToken(getToken).then((token) =>
        apiFetch<Chat>("/chats", {
          method: "POST",
          token,
          body: body ?? {},
        }),
      );
    },

    getChat(chatId: string) {
      return withToken(getToken).then((token) =>
        apiFetch<Chat>(`/chats/${chatId}`, { token }),
      );
    },

    listMessages(
      chatId: string,
      opts?: { limit?: number; cursor?: string | null },
    ) {
      return withToken(getToken).then((token) =>
        apiFetch<Page<Message>>(`/chats/${chatId}/messages`, {
          token,
          query: { limit: opts?.limit, cursor: opts?.cursor },
        }),
      );
    },

    sendMessage(
      chatId: string,
      body: { text: string; modelId?: string; attachmentIds?: string[] },
      opts?: { idempotencyKey?: string },
    ) {
      return withToken(getToken).then((token) =>
        apiFetch<SendMessageResult>(`/chats/${chatId}/messages`, {
          method: "POST",
          token,
          body,
          idempotencyKey: opts?.idempotencyKey,
        }),
      );
    },

    createAttachment(body: {
      chatId: string;
      originalName: string;
      mimeType: string;
      sizeBytes?: number;
    }) {
      return withToken(getToken).then((token) =>
        apiFetch<CreateAttachmentResult>("/attachments", {
          method: "POST",
          token,
          body,
        }),
      );
    },

    getAttachment(id: string) {
      return withToken(getToken).then((token) =>
        apiFetch<{ attachment: Attachment }>(`/attachments/${id}`, { token }),
      );
    },

    reconcileAttachment(id: string, body: { assemblyUrl: string }) {
      return withToken(getToken).then((token) =>
        apiFetch<{ attachment: Attachment }>(`/attachments/${id}/reconcile`, {
          method: "POST",
          token,
          body,
        }),
      );
    },

    getRun(agentRunId: string) {
      return withToken(getToken).then((token) =>
        apiFetch<AgentRun>(`/runs/${agentRunId}`, { token }),
      );
    },

    cancelRun(agentRunId: string) {
      return withToken(getToken).then((token) =>
        apiFetch<AgentRun>(`/runs/${agentRunId}/cancel`, {
          method: "POST",
          token,
        }),
      );
    },

    approveToolCall(agentRunId: string, toolCallId: string) {
      return withToken(getToken).then((token) =>
        apiFetch<{ approved: boolean; toolCallId: string }>(
          `/runs/${agentRunId}/tool-calls/${encodeURIComponent(toolCallId)}/approve`,
          { method: "POST", token },
        ),
      );
    },

    rejectToolCall(agentRunId: string, toolCallId: string) {
      return withToken(getToken).then((token) =>
        apiFetch<{ approved: boolean; toolCallId: string }>(
          `/runs/${agentRunId}/tool-calls/${encodeURIComponent(toolCallId)}/reject`,
          { method: "POST", token },
        ),
      );
    },

    getBalance() {
      return withToken(getToken).then((token) =>
        apiFetch<CreditBalance>("/credits", { token }),
      );
    },

    getCreditUsage(opts?: {
      from?: string;
      to?: string;
      show?: CreditUsageShow;
    }) {
      return withToken(getToken).then((token) =>
        apiFetch<CreditUsageResponse>("/credits/usage", {
          token,
          query: { from: opts?.from, to: opts?.to, show: opts?.show },
        }),
      );
    },
  };
}

export type MagicaApi = ReturnType<typeof createApi>;
