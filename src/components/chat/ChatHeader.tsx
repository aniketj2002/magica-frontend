"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ModelSelector } from "./ModelSelector";

export function ChatHeader() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between pt-5 sm:pt-7 pb-2.5 px-3 sm:px-6 bg-background/85 backdrop-blur-md shrink-0">
      {/* Left: Model selector */}
      <div className="flex items-center">
        <ModelSelector />
      </div>

      {/* Center: Magica 101 pill */}
      <Link
        href="/chat/placeholder?page=Magica%20101"
        className="rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-xs sm:text-[13.5px] font-medium text-foreground transition-colors inline-flex items-center justify-center cursor-pointer"
      >
        <span className="hidden sm:inline">Magica </span>
        <span>101</span>
      </Link>

      {/* Right: Auth buttons */}
      <div className="flex items-center gap-2">
        {mounted && user ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{user.fullName}</span>
          </div>
        ) : mounted ? (
          <>
            <SignInButton mode="modal">
              <button className="text-xs sm:text-sm font-medium text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full px-3 py-1.5 transition-colors">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-full bg-foreground px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-background transition-colors hover:opacity-90">
                Sign up
              </button>
            </SignUpButton>
          </>
        ) : null}
      </div>
    </header>
  );
}
