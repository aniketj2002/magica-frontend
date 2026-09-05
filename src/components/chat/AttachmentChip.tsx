"use client";

import { X, RotateCcw, Film } from "lucide-react";
import type { AttachmentUploadItem } from "@/hooks/useAttachmentUpload";
import { cn } from "@/lib/utils";

function ProgressRing({ progress }: { progress: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, progress)) / 100) * circumference;

  return (
    <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36" aria-hidden>
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-white/30"
      />
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-white"
      />
    </svg>
  );
}

export type AttachmentChipProps = {
  item: AttachmentUploadItem;
  onRemove: () => void;
  onRetry?: () => void;
};

export function AttachmentChip({ item, onRemove, onRetry }: AttachmentChipProps) {
  const isVideo = item.file.type.startsWith("video/");
  const showProgress =
    item.status === "uploading" ||
    item.status === "creating" ||
    item.status === "queued" ||
    item.status === "settling";
  const progressValue =
    item.status === "uploading" ? (item.progress ?? 0) : item.status === "settling" ? 100 : 8;

  return (
    <div
      className={cn(
        "group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted",
        item.status === "failed" && "border-red-400/80",
      )}
    >
      {isVideo ? (
        <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-white">
          <Film className="h-5 w-5 opacity-80" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- blob preview URL
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="h-full w-full object-cover"
        />
      )}

      {showProgress && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
          <ProgressRing progress={progressValue} />
        </div>
      )}

      {item.status === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 p-1">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-white/90 p-1 text-foreground hover:bg-white"
              aria-label="Retry upload"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
        aria-label={`Remove ${item.file.name}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
