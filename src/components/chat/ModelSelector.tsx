"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const models = [
  { id: "magica-auto", name: "Magica Auto", description: "Automatically picks the best model for your task" },
  { id: "magica-fast", name: "Magica Fast", description: "Fast reasoning for everyday tasks" },
  { id: "magica-max", name: "Magica Max", description: "Maximum intelligence for complex tasks" },
  { id: "magica-pro-max", name: "Magica Pro Max", description: "Most capable model for ambitious projects" },
];

export function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(models[0]);
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
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[280px] rounded-2xl border border-border bg-card p-1.5 shadow-xl">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelected(model);
                setIsOpen(false);
              }}
              className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left text-sm transition-colors hover:bg-accent ${
                selected.id === model.id ? "bg-accent/80" : ""
              }`}
            >
              <img
                src="/magica_favicon_black.svg"
                alt="Magica"
                className="h-4 w-4 mt-0.5 rounded-[4px] shrink-0 dark:invert"
              />
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{model.name}</span>
                <span className="text-xs text-muted-foreground leading-snug">{model.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
