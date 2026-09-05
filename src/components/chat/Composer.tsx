"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useRef, useState } from "react";
import { Paperclip, Plug, ArrowUp, Mic, StopCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AttachmentChip } from "./AttachmentChip";
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  useAttachmentUpload,
} from "@/hooks/useAttachmentUpload";
import { blockForSignIn } from "@/lib/authGate";
import { cn } from "@/lib/utils";

export type ComposerProps = {
  onSend: (text: string, attachmentIds: string[]) => void | Promise<void>;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Required for uploads in an existing chat. */
  chatId?: string | null;
  /** New-chat flow: create a chat lazily before the first upload. */
  ensureChatId?: () => Promise<string>;
};

export function Composer({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = "Send a message...",
  chatId = null,
  ensureChatId,
}: ComposerProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const {
    items,
    addFiles,
    removeItem,
    retryItem,
    reset,
    isSettling,
    allReady,
    readyIds,
  } = useAttachmentUpload({ chatId, ensureChatId });
  const { isSignedIn } = useAuth();
  const clerk = useClerk();

  const requireSignIn = (): boolean =>
    blockForSignIn({
      isSignedIn: Boolean(isSignedIn),
      openSignIn: () => clerk.openSignIn({}),
    });

  const busy = isStreaming || sending;
  const canAttachInfrastructure = Boolean(chatId || ensureChatId);
  const attachDisabled =
    disabled ||
    busy ||
    items.length >= MAX_ATTACHMENTS_PER_MESSAGE ||
    (Boolean(isSignedIn) && !canAttachInfrastructure);
  const canSend =
    Boolean(input.trim()) &&
    !busy &&
    !disabled &&
    allReady &&
    !isSettling;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy || disabled || !allReady || isSettling) return;
    if (requireSignIn()) return;
    const attachmentIds = [...readyIds];
    setSending(true);
    setInput("");
    try {
      await onSend(text, attachmentIds);
      reset();
    } finally {
      setSending(false);
    }
  };

  const tryAddFiles = (files: FileList | File[]) => {
    if (requireSignIn()) return;
    addFiles(files);
  };

  const openFilePicker = () => {
    if (disabled || busy) return;
    if (requireSignIn()) return;
    fileInputRef.current?.click();
  };

  const onFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    tryAddFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-4">
      <form
        onSubmit={handleSubmit}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragDepth.current = 0;
          setDragging(false);
          if (disabled || busy) return;
          if (e.dataTransfer.files?.length) tryAddFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative flex w-full flex-col overflow-hidden rounded-3xl border border-neutral-300 dark:border-neutral-700 bg-card shadow-sm transition-all focus-within:shadow-md focus-within:border-neutral-400 dark:focus-within:border-neutral-500",
          dragging && "border-neutral-500 ring-2 ring-neutral-400/40 dark:border-neutral-400",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => onFilesSelected(e.target.files)}
        />

        {items.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 pt-3">
            {items.map((item) => (
              <AttachmentChip
                key={item.localId}
                item={item}
                onRemove={() => removeItem(item.localId)}
                onRetry={
                  item.status === "failed"
                    ? () => retryItem(item.localId)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files ?? []);
            if (files.length > 0) {
              e.preventDefault();
              tryAddFiles(files);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[78px] w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[15px] leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit(e);
            }
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 220) + "px";
          }}
        />
        <div className="flex items-center justify-between px-4 pb-3.5">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                type="button"
                disabled={attachDisabled}
                onClick={openFilePicker}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-40"
              >
                <Paperclip className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent className="bg-foreground text-background text-xs px-2 py-1 rounded-md">
                Attach files
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
              >
                <Plug className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent className="bg-foreground text-background text-xs px-2 py-1 rounded-md">
                Connect apps
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
              >
                <Mic className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent className="bg-foreground text-background text-xs px-2 py-1 rounded-md">
                Voice input
              </TooltipContent>
            </Tooltip>

            {isStreaming ? (
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  onClick={() => onStop?.()}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background transition-all hover:opacity-85 cursor-pointer"
                >
                  <StopCircle className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent className="bg-foreground text-background text-xs px-2 py-1 rounded-md">
                  Stop generating
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  type="submit"
                  disabled={!canSend}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                    canSend
                      ? "bg-foreground text-background hover:opacity-85 cursor-pointer"
                      : "text-neutral-300 dark:text-neutral-600 cursor-not-allowed bg-transparent"
                  }`}
                >
                  <ArrowUp className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent className="bg-foreground text-background text-xs px-2 py-1 rounded-md">
                  Send message
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
