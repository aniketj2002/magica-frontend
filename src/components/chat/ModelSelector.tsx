"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { MODEL_OPTIONS, useModelSelection } from "./ModelContext";

export function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { selected, setSelectedId } = useModelSelection();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/60"
      >
        <img
          src="/magica_favicon_black.svg"
          alt="Magica"
          className="h-4 w-4 rounded-[4px] shrink-0 dark:invert"
        />
        <span className="font-semibold">{selected.name}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[280px] rounded-2xl border border-border bg-card p-1.5 shadow-xl">
          {MODEL_OPTIONS.map((model) => (
            <button
              key={model.id}
              disabled={model.disabled}
              onClick={() => {
                if (model.disabled) return;
                setSelectedId(model.id);
                setIsOpen(false);
              }}
              className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left text-sm transition-colors ${
                model.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-accent cursor-pointer"
              } ${selected.id === model.id ? "bg-accent/80" : ""}`}
            >
              <img
                src="/magica_favicon_black.svg"
                alt="Magica"
                className="h-4 w-4 mt-0.5 rounded-[4px] shrink-0 dark:invert"
              />
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {model.name}
                  {model.disabled ? (
                    <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Soon
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground leading-snug">
                  {model.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
