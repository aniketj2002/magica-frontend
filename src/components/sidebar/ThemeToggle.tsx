"use client";

import { Monitor, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("magica-theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else if (t === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      // system — follow OS preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
    }
  };

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("magica-theme", t);
    applyTheme(t);
  };

  if (compact) {
    // In collapsed sidebar, just show a single cycling button
    const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
    return (
      <button
        onClick={() => handleThemeChange(nextTheme)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700/80 bg-background text-neutral-600 dark:text-[#a1a1aa] hover:bg-neutral-200/80 dark:hover:bg-neutral-800 hover:text-foreground dark:hover:text-white transition-colors"
        title={`Theme: ${theme}`}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex w-full items-center rounded-full border border-neutral-300 dark:border-neutral-700/80 bg-background p-0.5 gap-0.5 shadow-sm">
      <button
        onClick={() => handleThemeChange("system")}
        className={`flex flex-1 items-center justify-center rounded-full py-1.5 transition-colors ${
          theme === "system"
            ? "bg-neutral-200/80 dark:bg-neutral-800 text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-neutral-100/50 dark:hover:bg-neutral-850/50"
        }`}
        title="System theme"
      >
        <Monitor className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => handleThemeChange("light")}
        className={`flex flex-1 items-center justify-center rounded-full py-1.5 transition-colors ${
          theme === "light"
            ? "bg-neutral-200/80 dark:bg-neutral-800 text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-neutral-100/50 dark:hover:bg-neutral-850/50"
        }`}
        title="Light theme"
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => handleThemeChange("dark")}
        className={`flex flex-1 items-center justify-center rounded-full py-1.5 transition-colors ${
          theme === "dark"
            ? "bg-neutral-200/80 dark:bg-neutral-800 text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-neutral-100/50 dark:hover:bg-neutral-850/50"
        }`}
        title="Dark theme"
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
