"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Suspense, useState, useEffect } from "react";
import { Plus, ArrowLeft, Sparkles, Compass } from "lucide-react";
import { AuthCheckpoint } from "./AuthCheckpoint";

function PlaceholderContent({ fallbackTitle }: { fallbackTitle?: string }) {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const pageTitle = searchParams.get("page") || fallbackTitle || "Coming Soon";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isAuthRequired = ["projects", "library", "tasks"].includes(pageTitle.toLowerCase());
  if (mounted && isLoaded && !user && isAuthRequired) {
    return <AuthCheckpoint title={pageTitle} />;
  }

  return (
    <div className="flex flex-1 h-full w-full flex-col items-center justify-center px-4 py-12 text-center select-none">
      {/* Glowing mascot / emblem container */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-purple-500/20 via-indigo-500/20 to-blue-500/20 blur-xl animate-pulse" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-100 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800 shadow-sm transition-transform hover:scale-105 duration-300">
          <svg
            width="44"
            height="44"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-11"
          >
            <path
              d="M16 95V44C16 31 27 23 39 27C43 17 57 14 65 22C75 14 91 20 91 33C101 34 107 42 105 52C104 59 100 63 96 66V95C96 104 90 108 84 108C77 108 72 103 72 95V72L67 80C63 87 56 87 52 80L47 72V95C47 104 41 108 32 108C23 108 16 103 16 95Z"
              fill="#4f46e5"
            />
            <ellipse cx="42" cy="51" rx="12" ry="13" fill="white" />
            <ellipse cx="78" cy="51" rx="12" ry="13" fill="white" />
            <circle cx="45" cy="51" r="3.6" fill="#202024" />
            <circle cx="81" cy="51" r="3.6" fill="#202024" />
          </svg>
        </div>
      </div>

      {/* Pill Badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-muted-foreground border border-neutral-200/60 dark:border-neutral-700/60">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
        <span>In Development</span>
      </div>

      {/* Title */}
      <h1 className="mb-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        {pageTitle}
      </h1>

      {/* Subtitle */}
      <p className="max-w-md text-sm sm:text-[15px] text-muted-foreground leading-relaxed mb-8">
        We&apos;re crafting an exceptional experience for {pageTitle.toLowerCase()}. This section will be available in an upcoming update.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98] shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New task</span>
        </Link>

        <Link
          href="/chat/tasks"
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-neutral-400 dark:hover:border-neutral-600 active:scale-[0.98]"
        >
          <Compass className="h-4 w-4 text-muted-foreground" />
          <span>View Tasks</span>
        </Link>
      </div>
    </div>
  );
}

export function PlaceholderScreen({ fallbackTitle }: { fallbackTitle?: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 h-full w-full items-center justify-center">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <PlaceholderContent fallbackTitle={fallbackTitle} />
    </Suspense>
  );
}
