"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { MessageSquare, Plus, Settings } from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button, buttonVariants } from "@/components/ui/button";

const dummyChats = [
  { id: "1", title: "Website Clone Strategy" },
  { id: "2", title: "React Performance Tips" },
  { id: "3", title: "Next.js Authentication" },
];

export function AppSidebar() {
  const { user } = useUser();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <Link href="/chat" className={buttonVariants({ variant: "outline", className: "w-full justify-start gap-2" })}>
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dummyChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton>
                    <Link href={`/chat/${chat.id}`} className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>{chat.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <UserButton />
          <span className="truncate text-sm font-medium">
            {user?.fullName || "User"}
          </span>
        </div>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
