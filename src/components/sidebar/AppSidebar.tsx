"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import { useBalance } from "@/hooks/queries";
import {
  Plus,
  ClipboardList,
  FolderKanban,
  Library,
  Wrench,
  Blocks,
  HelpCircle,
  Sparkles,
  Search,
  PanelLeft,
  MoreVertical,
  Gift,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { ChatList } from "./ChatList";
import { SettingsDialog } from "@/components/settings/SettingsDialog";

const navItems = [
  { icon: Plus, label: "New task", href: "/chat" },
  { icon: ClipboardList, label: "Tasks", href: "/chat/tasks" },
  { icon: FolderKanban, label: "Projects", href: "/chat/placeholder?page=Projects" },
  { icon: Library, label: "Library", href: "/chat/placeholder?page=Library" },
  { icon: Wrench, label: "Tools", href: "/chat/placeholder?page=Tools" },
  { icon: Blocks, label: "API / MCP", href: "https://self-01775291.mintlify.app/" },
  { icon: HelpCircle, label: "Help & Support", href: "/chat/placeholder?page=Help%20%26%20Support" },
  { icon: Sparkles, label: "Unfair Advantage", href: "/chat/placeholder?page=Unfair%20Advantage" },
];

function formatCredits(balance: number): string {
  if (Math.abs(balance) >= 1_000_000) {
    return `${(balance / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(balance) >= 1_000) {
    return `${(balance / 1_000).toFixed(1)}K`;
  }
  return balance.toFixed(2);
}

function CreditBalanceDisplay() {
  const { data, isLoading } = useBalance();

  return (
    <Link
      href="/settings/billing/credit-usage"
      className="flex items-center justify-between w-full rounded-lg px-2 py-2 hover:bg-accent transition-colors group"
    >
      <span className="text-[12.5px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        Available Credits
      </span>
      <span className="text-[13px] font-semibold text-foreground tabular-nums">
        {isLoading ? "—" : formatCredits(data?.balance ?? 0)}
      </span>
    </Link>
  );
}

export function AppSidebar() {
  const { user } = useUser();
  const { toggleSidebar, state, isMobile } = useSidebar();
  const isCollapsed = !isMobile && state === "collapsed";
  const [showMore, setShowMore] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Sidebar collapsible="icon" variant="floating" className="border-none border-r-0 overflow-hidden">
      {/* Header: Logo + icons */}
      <SidebarHeader className={`pt-3.5 ${isCollapsed ? "px-0 pb-0 flex items-center justify-center" : "px-2.5 pb-2.5"}`}>
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors mb-3"
            title="Expand sidebar"
          >
            <img
              src="/magica_logo_collapsed_light.svg"
              alt="Magica"
              width={20}
              height={15}
              className="dark:hidden"
            />
            <img
              src="/magica_logo_collapsed_dark.svg"
              alt="Magica"
              width={20}
              height={15}
              className="hidden dark:block"
            />
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <Link href="/chat" className="text-lg font-bold tracking-tight text-foreground pl-0.5">
              Magica
            </Link>
            <div className="flex items-center gap-0.5">
              <button
                className="rounded-lg p-1.5 text-neutral-600 dark:text-[#a1a1aa] hover:bg-accent hover:text-foreground dark:hover:text-white transition-colors"
                title="Search"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                onClick={toggleSidebar}
                className="rounded-lg p-1.5 text-neutral-600 dark:text-[#a1a1aa] hover:bg-accent hover:text-foreground dark:hover:text-white transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className={`pt-0 ${isCollapsed ? "px-0" : "px-2"}`}>
        <SidebarMenu className={`flex flex-col ${isCollapsed ? "items-center gap-2.5" : "gap-1"}`}>
          {isCollapsed && (
            <SidebarMenuItem className="flex justify-center w-full">
              <SidebarMenuButton
                tooltip="Search"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 dark:text-[#a1a1aa] hover:bg-accent hover:text-foreground dark:hover:text-white transition-colors p-0"
              >
                <Search className="h-5 w-5 shrink-0" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {navItems.map((item) => {
            const requiresAuth = mounted && !user && ["Tasks", "Projects", "Library"].includes(item.label);
            const isExternal = item.href.startsWith("http://") || item.href.startsWith("https://");

            const buttonContent = (
              <SidebarMenuButton
                tooltip={item.label}
                render={
                  requiresAuth ? (
                    <button type="button" />
                  ) : isExternal ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" />
                  ) : (
                    <Link href={item.href} />
                  )
                }
                className={`flex items-center rounded-lg font-medium text-neutral-700 dark:text-[#a1a1aa] transition-colors hover:bg-accent hover:text-foreground dark:hover:text-white cursor-pointer ${
                  isCollapsed
                    ? "h-9 w-9 justify-center p-0"
                    : "w-full gap-2.5 px-2 py-1.5 text-[13.5px]"
                }`}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0 text-neutral-600 dark:text-[#a1a1aa] group-hover:text-foreground transition-colors" />
                {!isCollapsed && <span>{item.label}</span>}
              </SidebarMenuButton>
            );

            return (
              <SidebarMenuItem key={item.label} className={isCollapsed ? "flex justify-center w-full" : ""}>
                {requiresAuth ? (
                  <SignInButton mode="modal">
                    {buttonContent}
                  </SignInButton>
                ) : (
                  buttonContent
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        {/* Recent chats */}
        {!isCollapsed && (
          mounted && user ? (
            <ChatList />
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <span className="text-xs text-muted-foreground/70 select-none">No tasks yet</span>
            </div>
          )
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className={`border-t-0 pb-3.5 pt-1.5 ${isCollapsed ? "px-0 items-center gap-2" : "px-2 gap-1.5"}`}>
        {/* Line break / divider over Magica 101 */}
        <div className={`h-px bg-neutral-200/80 dark:bg-neutral-800/80 my-1 ${isCollapsed ? "w-6" : "w-full"}`} />

        {/* Magica 101 item */}
        {!isCollapsed ? (
          <Link
            href="/chat/placeholder?page=Magica%20101"
            className="group relative flex w-full flex-col justify-center rounded-xl bg-white dark:bg-[#1f1f23] border border-neutral-200/80 dark:border-neutral-800/80 p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-[#27272b] mb-1 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="size-4 shrink-0"
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
              <span className="text-[13.5px] font-medium text-foreground">
                Magica 101
              </span>
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              Learn what Magica can do
            </div>
          </Link>
        ) : (
          <Link
            href="/chat/placeholder?page=Magica%20101"
            title="Magica 101"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="size-[18px] shrink-0"
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
          </Link>
        )}

        {/* More / Less toggle button */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] font-medium text-neutral-700 dark:text-[#a1a1aa] hover:bg-accent hover:text-foreground dark:hover:text-white transition-colors w-full cursor-pointer"
          >
            <MoreVertical className="h-[18px] w-[18px] text-neutral-600 dark:text-[#a1a1aa]" />
            <span>{showMore ? "Less" : "More"}</span>
          </button>
        )}

        {/* Collapsible items (Credits, Settings, Offers, Theme) */}
        {!isCollapsed ? (
          showMore && (
            <>
              {/* Available Credits */}
              {mounted && user && <CreditBalanceDisplay />}

              {/* Settings */}
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-background px-3 py-1.5 text-[13.5px] font-medium text-neutral-700 dark:text-[#a1a1aa] hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors w-full mb-1.5 cursor-pointer"
              >
                <Settings className="h-4 w-4 shrink-0 text-neutral-600 dark:text-[#a1a1aa]" />
                <span>Settings</span>
              </button>

              {/* Invite Team Members */}
              <button
                type="button"
                className="flex items-center justify-between rounded-full border border-neutral-200 dark:border-neutral-800 bg-background px-3 py-1.5 text-[13.5px] font-medium text-neutral-700 dark:text-[#a1a1aa] hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors w-full mb-1.5"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 shrink-0 text-neutral-600 dark:text-[#a1a1aa]" />
                  <span>Invite team members</span>
                </div>
                <span className="text-neutral-400 dark:text-neutral-500 text-lg leading-none">&rarr;</span>
              </button>

              {/* Claim Offer Pill */}
              <button
                type="button"
                className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#1c1c1c] dark:bg-[#202024] px-3.5 text-[13.5px] font-medium text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25),inset_0px_1px_0px_0px_rgba(255,255,255,0.15)] hover:bg-[#282828] dark:hover:bg-[#2a2a2e] active:translate-y-px transition-all cursor-pointer"
              >
                <Gift className="h-4 w-4 shrink-0" />
                <span>Claim Offer</span>
              </button>

              {/* Theme Toggle */}
              <div className="flex justify-center py-1 w-full">
                <ThemeToggle compact={false} />
              </div>
            </>
          )
        ) : (
          /* In collapsed view, keep Theme Toggle accessible */
          <div className="flex justify-center py-1 px-0">
            <ThemeToggle compact={true} />
          </div>
        )}

        {/* Auth section */}
        {mounted && user ? (
          <div className={`mt-1 flex w-full items-center ${isCollapsed ? "justify-center" : ""}`}>
            {isCollapsed ? (
              <UserButton />
            ) : (
              <div className="flex w-full items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-background hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors p-1 pr-3 cursor-pointer">
                <UserButton appearance={{ elements: { userButtonAvatarBox: "h-7 w-7" } }} />
                <span className="truncate text-[13.5px] font-medium text-foreground">
                  {user.fullName || "User"}
                </span>
              </div>
            )}
          </div>
        ) : mounted ? (
          <SignInButton mode="modal">
            <button className={`rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:bg-accent ${
              isCollapsed ? "flex h-9 w-9 items-center justify-center p-0" : "w-full px-3 py-2"
            }`}>
              {isCollapsed ? "→" : "Sign in"}
            </button>
          </SignInButton>
        ) : null}
      </SidebarFooter>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  );
}
