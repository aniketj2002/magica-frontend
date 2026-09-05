"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Plus, Search, ClipboardList } from "lucide-react";
import { AuthCheckpoint } from "./AuthCheckpoint";
import { useChats } from "@/hooks/queries";

export function TasksScreen() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chatsQuery = useChats(Boolean(mounted && isLoaded && user));
  const chats = useMemo(
    () => chatsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [chatsQuery.data],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => (c.title ?? "").toLowerCase().includes(q));
  }, [chats, searchQuery]);

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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 pb-6">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-850 rounded-xl w-fit">
          {(
            [
              ["all", "All"],
              ["active", "In Progress"],
              ["completed", "Completed"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={
                id === "all"
                  ? undefined
                  : "Run-status filters need a runs list API (coming soon)"
              }
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeTab === id
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
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

      {chatsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-850"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center select-none">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-850 border border-border/60 mb-4 text-muted-foreground">
            <ClipboardList className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No tasks yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            When you assign work to your AI worker in chat, your running and completed tasks will
            appear here.
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Assign a task</span>
          </Link>
        </div>
      ) : (
        <ul className="space-y-2 pb-10">
          {filtered.map((chat) => (
            <li key={chat.id}>
              <Link
                href={`/chat/c/${chat.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {chat.title?.trim() || "Untitled chat"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Updated {new Date(chat.updatedAt).toLocaleString()}
                  </div>
                </div>
                <span className="shrink-0 text-neutral-400">&rarr;</span>
              </Link>
            </li>
          ))}
          {chatsQuery.hasNextPage && (
            <li className="pt-2">
              <button
                type="button"
                onClick={() => void chatsQuery.fetchNextPage()}
                disabled={chatsQuery.isFetchingNextPage}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {chatsQuery.isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
