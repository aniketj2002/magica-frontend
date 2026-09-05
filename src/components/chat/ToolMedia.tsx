"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ToolMediaKind = { kind: "image" | "video"; urls: string[] };

export function extractToolMedia(content: unknown): ToolMediaKind | null {
  if (!content || typeof content !== "object") return null;
  const c = content as Record<string, unknown>;
  if (Array.isArray(c.image_url) && c.image_url.every((u) => typeof u === "string")) {
    return { kind: "image", urls: c.image_url as string[] };
  }
  if (Array.isArray(c.video_url) && c.video_url.every((u) => typeof u === "string")) {
    return { kind: "video", urls: c.video_url as string[] };
  }
  return null;
}

function DownloadButton({ url, className }: { url: string; className?: string }) {
  return (
    <a
      href={url}
      download
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-black/55 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/70",
        className,
      )}
      title="Download"
      onClick={(e) => e.stopPropagation()}
    >
      <Download className="h-3.5 w-3.5" />
      <span className="sr-only">Download</span>
    </a>
  );
}

export function ToolMedia({ media }: { media: ToolMediaKind }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (media.kind === "video") {
    return (
      <div className="space-y-2">
        {media.urls.map((url) => (
          <div key={url} className="relative overflow-hidden rounded-xl border border-border bg-muted/40">
            <video
              src={url}
              controls
              preload="metadata"
              className="max-h-[420px] w-full bg-black"
            />
            <DownloadButton url={url} className="absolute top-2 right-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid gap-2",
          media.urls.length === 1 ? "grid-cols-1" : "grid-cols-2",
        )}
      >
        {media.urls.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => setLightboxUrl(url)}
            className="group relative overflow-hidden rounded-xl border border-border bg-muted/40 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- R2 URLs; next/image needs host allowlist */}
            <img
              src={url}
              alt="Generated"
              className="max-h-[360px] w-full object-contain"
            />
            <DownloadButton
              url={url}
              className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </button>
        ))}
      </div>

      <Dialog open={lightboxUrl !== null} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>Image preview</DialogTitle>
          </DialogHeader>
          {lightboxUrl && (
            <div className="relative flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt="Preview"
                className="max-h-[85vh] max-w-full rounded-lg object-contain"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <DownloadButton url={lightboxUrl} />
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  className="inline-flex items-center justify-center rounded-md bg-black/55 p-1.5 text-white backdrop-blur-sm hover:bg-black/70"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
