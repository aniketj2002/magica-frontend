"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import { uploadToTransloadit } from "@/lib/upload/transloadit";
import type { AttachmentStatus } from "@/lib/api/types";

export const MAX_ATTACHMENTS_PER_MESSAGE = 20;

export type UploadItemStatus =
  | "queued"
  | "creating"
  | "uploading"
  | "settling"
  | "ready"
  | "failed";

export type AttachmentUploadItem = {
  localId: string;
  file: File;
  previewUrl: string;
  attachmentId: string | null;
  assemblySslUrl: string | null;
  status: UploadItemStatus;
  /** 0–100 while uploading; otherwise undefined. */
  progress: number | undefined;
  error: string | null;
  serverStatus: AttachmentStatus | null;
};

export type UseAttachmentUploadOptions = {
  /** Existing chat id, or resolved via ensureChatId when attaching. */
  chatId?: string | null;
  /** New-chat flow: create a chat before the first upload. */
  ensureChatId?: () => Promise<string>;
};

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = window.setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export function useAttachmentUpload(opts: UseAttachmentUploadOptions = {}) {
  const api = useApiClient();
  const [items, setItems] = useState<AttachmentUploadItem[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const chatIdRef = useRef(opts.chatId ?? null);
  chatIdRef.current = opts.chatId ?? chatIdRef.current;

  const ensureChatIdRef = useRef(opts.ensureChatId);
  ensureChatIdRef.current = opts.ensureChatId;

  const abortByLocalId = useRef(new Map<string, AbortController>());

  const updateItem = useCallback(
    (localId: string, patch: Partial<AttachmentUploadItem>) => {
      setItems((prev) => {
        const next = prev.map((item) =>
          item.localId === localId ? { ...item, ...patch } : item,
        );
        itemsRef.current = next;
        return next;
      });
    },
    [],
  );

  const resolveChatId = useCallback(async () => {
    if (chatIdRef.current) return chatIdRef.current;
    const ensure = ensureChatIdRef.current;
    if (!ensure) {
      throw new Error("chatId is required to upload attachments");
    }
    const id = await ensure();
    chatIdRef.current = id;
    return id;
  }, []);

  const settleAttachment = useCallback(
    async (
      localId: string,
      attachmentId: string,
      assemblySslUrl: string,
      signal: AbortSignal,
    ) => {
      updateItem(localId, { status: "settling", progress: undefined });

      const pollIntervalMs = 1500;
      const maxWaitMs = 60_000;
      const started = Date.now();
      let pollCount = 0;

      while (!signal.aborted) {
        if (Date.now() - started > maxWaitMs) {
          updateItem(localId, {
            status: "failed",
            error: "Upload timed out waiting for processing",
          });
          return;
        }

        pollCount += 1;

        if (pollCount >= 2) {
          try {
            const { attachment } = await api.reconcileAttachment(attachmentId, {
              assemblyUrl: assemblySslUrl,
            });
            if (attachment.status === "COMPLETED") {
              updateItem(localId, {
                status: "ready",
                serverStatus: attachment.status,
                error: null,
              });
              return;
            }
            if (
              attachment.status === "FAILED" ||
              attachment.status === "CANCELLED" ||
              attachment.status === "EXPIRED"
            ) {
              updateItem(localId, {
                status: "failed",
                serverStatus: attachment.status,
                error: `Attachment ${attachment.status.toLowerCase()}`,
              });
              return;
            }
            updateItem(localId, { serverStatus: attachment.status });
          } catch {
            // Fall through to GET poll; reconcile may fail if assembly incomplete.
          }
        }

        try {
          const { attachment } = await api.getAttachment(attachmentId);
          updateItem(localId, { serverStatus: attachment.status });
          if (attachment.status === "COMPLETED") {
            updateItem(localId, {
              status: "ready",
              serverStatus: attachment.status,
              error: null,
            });
            return;
          }
          if (
            attachment.status === "FAILED" ||
            attachment.status === "CANCELLED" ||
            attachment.status === "EXPIRED"
          ) {
            updateItem(localId, {
              status: "failed",
              serverStatus: attachment.status,
              error: `Attachment ${attachment.status.toLowerCase()}`,
            });
            return;
          }
        } catch (err) {
          updateItem(localId, {
            status: "failed",
            error:
              err instanceof Error
                ? err.message
                : "Failed to check attachment status",
          });
          return;
        }

        await sleep(pollIntervalMs, signal);
      }
    },
    [api, updateItem],
  );

  const processFile = useCallback(
    async (localId: string, file: File) => {
      const controller = new AbortController();
      abortByLocalId.current.get(localId)?.abort();
      abortByLocalId.current.set(localId, controller);
      const { signal } = controller;

      try {
        updateItem(localId, {
          status: "creating",
          error: null,
          progress: undefined,
        });

        const chatId = await resolveChatId();
        const created = await api.createAttachment({
          chatId,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });

        if (signal.aborted) return;

        updateItem(localId, {
          attachmentId: created.attachment.id,
          status: "uploading",
          progress: 0,
          serverStatus: created.attachment.status,
        });

        const uploaded = await uploadToTransloadit({
          file,
          params: created.upload.params,
          signature: created.upload.signature,
          signal,
          onProgress: (percent) => {
            updateItem(localId, { progress: percent, status: "uploading" });
          },
        });

        if (signal.aborted) return;

        updateItem(localId, {
          assemblySslUrl: uploaded.assemblySslUrl,
          progress: 100,
        });

        await settleAttachment(
          localId,
          created.attachment.id,
          uploaded.assemblySslUrl,
          signal,
        );
      } catch (err) {
        if (signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        updateItem(localId, {
          status: "failed",
          error: err instanceof Error ? err.message : "Upload failed",
          progress: undefined,
        });
      } finally {
        abortByLocalId.current.delete(localId);
      }
    },
    [api, resolveChatId, settleAttachment, updateItem],
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files).filter(
        (f) =>
          f.type.startsWith("image/") ||
          f.type.startsWith("video/") ||
          /\.(png|jpe?g|gif|webp|mp4|webm|mov)$/i.test(f.name),
      );
      if (list.length === 0) return;

      // Build pending items outside setState so side effects (upload start)
      // never run inside the updater. React Strict Mode double-invokes
      // updaters in development, which previously scheduled processFile twice.
      const prev = itemsRef.current;
      const room = MAX_ATTACHMENTS_PER_MESSAGE - prev.length;
      if (room <= 0) return;

      const accepted = list.slice(0, room);
      const next: AttachmentUploadItem[] = accepted.map((file) => {
        const localId = crypto.randomUUID();
        return {
          localId,
          file,
          previewUrl: URL.createObjectURL(file),
          attachmentId: null,
          assemblySslUrl: null,
          status: "queued" as const,
          progress: undefined,
          error: null,
          serverStatus: null,
        };
      });

      // Optimistic ref update so concurrent addFiles calls don't drop items.
      itemsRef.current = [...prev, ...next];
      setItems(itemsRef.current);

      for (const item of next) {
        queueMicrotask(() => {
          void processFile(item.localId, item.file);
        });
      }
    },
    [processFile],
  );

  const removeItem = useCallback((localId: string) => {
    abortByLocalId.current.get(localId)?.abort();
    abortByLocalId.current.delete(localId);
    setItems((prev) => {
      const target = prev.find((i) => i.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((i) => i.localId !== localId);
      itemsRef.current = next;
      return next;
    });
  }, []);

  const retryItem = useCallback(
    (localId: string) => {
      const item = itemsRef.current.find((i) => i.localId === localId);
      if (!item) return;
      updateItem(localId, {
        status: "queued",
        error: null,
        progress: undefined,
        attachmentId: null,
        assemblySslUrl: null,
        serverStatus: null,
      });
      void processFile(localId, item.file);
    },
    [processFile, updateItem],
  );

  const reset = useCallback(() => {
    for (const controller of abortByLocalId.current.values()) {
      controller.abort();
    }
    abortByLocalId.current.clear();
    setItems((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.previewUrl);
      itemsRef.current = [];
      return [];
    });
  }, []);

  useEffect(() => {
    return () => {
      for (const controller of abortByLocalId.current.values()) {
        controller.abort();
      }
      abortByLocalId.current.clear();
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  const readyIds = useMemo(
    () =>
      items
        .filter((i) => i.status === "ready" && i.attachmentId)
        .map((i) => i.attachmentId!),
    [items],
  );

  const isSettling = items.some(
    (i) =>
      i.status === "queued" ||
      i.status === "creating" ||
      i.status === "uploading" ||
      i.status === "settling",
  );

  const allSettled =
    items.length === 0 ||
    items.every((i) => i.status === "ready" || i.status === "failed");

  const allReady =
    items.length === 0 || items.every((i) => i.status === "ready");

  return {
    items,
    addFiles,
    removeItem,
    retryItem,
    reset,
    isSettling,
    allSettled,
    allReady,
    readyIds,
    resolvedChatId: chatIdRef.current,
  };
}
