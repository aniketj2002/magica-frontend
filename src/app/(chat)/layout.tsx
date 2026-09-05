import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ModelProvider } from "@/components/chat/ModelContext";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModelProvider>
      <SidebarProvider className="h-full max-h-full w-full overflow-hidden">
        <AppSidebar />
        <div className="relative flex flex-1 flex-col h-full min-h-0 overflow-hidden">
          <ChatHeader />
          <main className="flex-1 min-h-0 overflow-hidden flex flex-col relative">{children}</main>
          {/* Subtle bottom cloud mist overlay */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 sm:h-12 bg-gradient-to-t from-background/70 via-background/30 to-transparent z-20"
            aria-hidden="true"
          />
        </div>
      </SidebarProvider>
    </ModelProvider>
  );
}
