/** Mirrors magica-backend HTTP + stream contracts (hand-kept; no shared package). */

export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";

export type MessageStatus =
  | "PENDING"
  | "STREAMING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type RunStatus =
  | "QUEUED"
  | "RUNNING"
  | "WAITING"
  | "STOPPING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type FinishReason = "stop" | "length" | "tool_calls" | "content_filter";

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown; status?: string }
  | { type: "tool_result"; toolUseId: string; content: unknown; isError?: boolean }
  | {
      type: "usage";
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };

export type Chat = {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  chatId: string;
  userId: string;
  agentRunId: string | null;
  role: MessageRole;
  status: MessageStatus;
  content: ContentBlock[];
  metadata: unknown | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentRun = {
  id: string;
  chatId: string;
  userId: string;
  messageId: string;
  status: RunStatus;
  modelRequested: string | null;
  modelActual: string | null;
  triggerTaskId: string | null;
  triggerRunId: string | null;
  turnCount: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};

export type SendMessageResult = {
  chatId: string;
  messageId: string;
  /** AgentRun UUID — use for GET/cancel run APIs. */
  runId: string;
  realtime: {
    /** Trigger.dev run id — use for useRealtimeStream. */
    runId: string;
    streamId: string;
    publicAccessToken: string;
  };
};

export type AgentStreamPart =
  | { type: "status"; status: string }
  | { type: "turn"; turn: number }
  | { type: "model-resolved"; model: string }
  | { type: "text-delta"; text: string }
  | { type: "reasoning-delta"; text: string }
  | { type: "tool-call"; id: string; name: string; argumentsJson: string }
  | { type: "tool-result"; id: string; name: string; ok: boolean; output?: unknown }
  | { type: "tool-progress"; id: string; name: string; status: string }
  | {
      type: "usage";
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    }
  | { type: "finish"; reason: FinishReason }
  | { type: "error"; code: string; message: string };

export type AttachmentStatus =
  | "PENDING"
  | "UPLOADING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type Attachment = {
  id: string;
  userId: string;
  chatId: string;
  messageId: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: AttachmentStatus;
  storageProvider: string | null;
  storageKey: string | null;
  resultUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

/** POST /attachments — `params` is a JSON string, `signature` is sha384 hex. */
export type CreateAttachmentResult = {
  attachment: Attachment;
  upload: { params: string; signature: string };
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export const TERMINAL_RUN_STATUSES: ReadonlySet<RunStatus> = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

/* ── Credits ── */

export type CreditBalance = {
  balance: number;
};

export type CreditUsageShow = "debited" | "credited" | "all";

export type CreditUsageStep = {
  label: string;
  createdAt: string;
  /** Signed cost: positive = debit/hold, negative = credit/refund. */
  cost: number;
  type: string;
};

export type CreditUsageItem = {
  id: string;
  toolName: string;
  /** Net debit/credit shown in the table. */
  amount: number;
  reserved: number;
  released: number;
  direction: "debit" | "credit";
  ledgerType: string;
  agentRunId: string | null;
  createdAt: string;
  steps: CreditUsageStep[];
};

export type CreditUsageResponse = {
  totalDebited: number;
  totalCredited: number;
  totalExecutions: number;
  categories: number;
  periodStart: string;
  periodEnd: string;
  items: CreditUsageItem[];
};
