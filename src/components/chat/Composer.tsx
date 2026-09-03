"use client";

import { useState } from "react";
import { Send, Paperclip, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Composer() {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false); // Dummy state for running agent

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
    <div className="mx-auto w-full max-w-3xl px-4 pb-4">
      <form
        onSubmit={handleSubmit}
        className="relative flex w-full flex-col overflow-hidden rounded-xl border bg-background p-2 shadow-sm focus-within:ring-1 focus-within:ring-ring"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Magica..."
          className="min-h-[60px] w-full resize-none bg-transparent px-3 py-2 text-sm focus:outline-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="flex items-center justify-between px-2 pt-2">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Attach file</span>
          </Button>
          
          {isTyping ? (
            <Button
              type="button"
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full bg-primary"
              onClick={() => setIsTyping(false)}
            >
              <StopCircle className="h-4 w-4" />
              <span className="sr-only">Stop generating</span>
            </Button>
          ) : (
            <Button
              type="submit"
              variant="default"
              size="icon"
              disabled={!input.trim()}
              className="h-8 w-8 rounded-full"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          )}
        </div>
      </form>
      <div className="px-2 pt-2 text-center text-xs text-muted-foreground">
        Magica can make mistakes. Consider verifying important information.
      </div>
    </div>
  );
}
