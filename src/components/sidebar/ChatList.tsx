"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChats } from "@/hooks/queries";
import { cn } from "@/lib/utils";

export function ChatList() {
  const pathname = usePathname();
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useChats(true);

  const chats = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-1 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-7 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800/80"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-2 py-4 text-center text-xs text-muted-foreground">
        Couldn&apos;t load chats
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <span className="text-xs text-muted-foreground/70 select-none">No tasks yet</span>
      </div>
    );
  }

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col">
      <div className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
        Recent
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto hide-scrollbar pr-0.5">
        {chats.map((chat) => {
          const href = `/chat/c/${chat.id}`;
          const active = pathname === href;
          return (
            <Link
              key={chat.id}
              href={href}
              className={cn(
                "block truncate rounded-lg px-2 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-accent text-foreground font-medium"
                  : "text-neutral-700 dark:text-[#a1a1aa] hover:bg-accent hover:text-foreground",
              )}
              title={chat.title ?? "Untitled"}
            >
              {chat.title?.trim() || "Untitled chat"}
            </Link>
          );
        })}
        {hasNextPage && (
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full rounded-lg px-2 py-1.5 text-left text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
