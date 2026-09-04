"use client";

import { useState } from "react";
import { Paperclip, Plug, ArrowUp, Mic, Zap, StopCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Composer() {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsTyping(true);
    setInput("");

    // Simulate thinking state reset
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-4">
      <form
        onSubmit={handleSubmit}
        className="relative flex w-full flex-col overflow-hidden rounded-3xl border border-neutral-300 dark:border-neutral-700 bg-card shadow-sm transition-all focus-within:shadow-md focus-within:border-neutral-400 dark:focus-within:border-neutral-500"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Assign a task or ask anything..."
          className="min-h-[78px] w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[15px] leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
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
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
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

            {isTyping ? (
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  onClick={() => setIsTyping(false)}
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
                  disabled={!input.trim()}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                    input.trim()
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
