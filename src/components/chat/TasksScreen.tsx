"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Plus, Search, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { AuthCheckpoint } from "./AuthCheckpoint";

export function TasksScreen() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (mounted && isLoaded && !user) {
    return (
      <AuthCheckpoint
        title="Tasks"
        description="Sign in to track your assigned tasks and monitor your AI worker progress."
      />
    );
  }

  return (
    <div className="flex flex-1 h-full w-full flex-col overflow-y-auto hide-scrollbar px-4 sm:px-8 py-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor and review the tasks assigned to your AI workers.
          </p>
        </div>

        <Link
          href="/chat"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98] shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New task</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 pb-6">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-850 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "active"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "completed"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Completed
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card pl-9 pr-3.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Empty State */}
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-850 border border-border/60 mb-4 text-muted-foreground">
          <ClipboardList className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No tasks yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          When you assign work to your AI worker in chat, your running and completed tasks will appear here.
        </p>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Assign a task</span>
        </Link>
      </div>
    </div>
  );
}
