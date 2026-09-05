import type { LucideIcon } from "lucide-react";
import { Crop, Film, Sparkles, Wrench } from "lucide-react";

export type ToolMeta = {
  label: string;
  Icon: LucideIcon;
};

const TOOL_META: Record<string, ToolMeta> = {
  crop_image: { label: "Crop", Icon: Crop },
  gpt_image_2: { label: "Image", Icon: Sparkles },
  merge_videos: { label: "Merge videos", Icon: Film },
};

export function getToolMeta(name: string): ToolMeta {
  return TOOL_META[name] ?? { label: name, Icon: Wrench };
}

export function toolLabel(name: string): string {
  return getToolMeta(name).label;
}

/** One-line summary from tool input for the card header. */
export function summarizeToolInput(name: string, input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const i = input as Record<string, unknown>;

  if (name === "gpt_image_2") {
    const parts: string[] = [];
    if (typeof i.prompt === "string" && i.prompt.trim()) {
      const p = i.prompt.trim();
      parts.push(p.length > 60 ? `${p.slice(0, 57)}…` : p);
    }
    if (typeof i.size === "string") parts.push(i.size);
    if (typeof i.quality === "string") {
      parts.push(i.quality.charAt(0).toUpperCase() + i.quality.slice(1));
    }
    if (Array.isArray(i.uploadedImages) && i.uploadedImages.length > 0) {
      parts.push(`edit ×${i.uploadedImages.length}`);
    }
    return parts.join(" · ");
  }

  if (name === "crop_image") {
    const parts: string[] = [];
    if (typeof i.width_percent === "number" && typeof i.height_percent === "number") {
      parts.push(`${i.width_percent}×${i.height_percent}%`);
    } else if (typeof i.width_px === "number" && typeof i.height_px === "number") {
      parts.push(`${i.width_px}×${i.height_px}px`);
    }
    if (typeof i.image_url === "string") {
      try {
        const path = new URL(i.image_url).pathname.split("/").pop() ?? "image";
        parts.push(path.length > 28 ? `${path.slice(0, 25)}…` : path);
      } catch {
        parts.push("image");
      }
    }
    return parts.join(" · ");
  }

  if (name === "merge_videos") {
    const parts: string[] = [];
    if (Array.isArray(i.video_urls)) parts.push(`${i.video_urls.length} clips`);
    if (typeof i.transition === "string" && i.transition !== "none") {
      parts.push(i.transition);
    }
    return parts.join(" · ");
  }

  try {
    const s = JSON.stringify(input);
    return s.length > 80 ? `${s.slice(0, 77)}…` : s;
  } catch {
    return "";
  }
}
