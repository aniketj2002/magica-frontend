"use client";

import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Lock, ArrowLeft, Sparkles } from "lucide-react";

interface AuthCheckpointProps {
  title: string;
  description?: string;
}

export function AuthCheckpoint({ title, description }: AuthCheckpointProps) {
  return (
    <div className="flex flex-1 h-full w-full flex-col items-center justify-center px-4 py-12 text-center select-none">
      {/* Icon with glow */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-purple-500/20 via-indigo-500/20 to-blue-500/20 blur-xl animate-pulse" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-100 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800 shadow-sm transition-transform hover:scale-105 duration-300">
          <Lock className="h-9 w-9 text-foreground" />
        </div>
      </div>

      {/* Pill Badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-muted-foreground border border-neutral-200/60 dark:border-neutral-700/60">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
        <span>Sign In Required</span>
      </div>

      {/* Title */}
      <h1 className="mb-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        Sign in to access {title}
      </h1>

      {/* Description */}
      <p className="max-w-md text-sm sm:text-[15px] text-muted-foreground leading-relaxed mb-8">
        {description || `You need an account to view and manage your ${title.toLowerCase()}.`}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
        <SignInButton mode="modal">
          <button className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 active:scale-[0.98] shadow-sm cursor-pointer">
            Sign in
          </button>
        </SignInButton>

        <SignUpButton mode="modal">
          <button className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-neutral-400 dark:hover:border-neutral-600 active:scale-[0.98] cursor-pointer">
            Sign up
          </button>
        </SignUpButton>
      </div>

      {/* Back to chat link */}
      <Link
        href="/chat"
        className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to New task</span>
      </Link>
    </div>
  );
}
