import { Message } from "./Message";
import { ScrollArea } from "@/components/ui/scroll-area";

const dummyMessages = [
  { id: "1", role: "user" as const, content: "Hello Magica, can you help me build a website clone?" },
  { id: "2", role: "assistant" as const, content: "Of course! I can help you with that. What specific features are you looking to clone?" },
  { id: "3", role: "user" as const, content: "I need the sidebar, authentication, and the main chat UI built with React and Tailwind CSS." },
  { id: "4", role: "assistant" as const, content: "Great choices! We can use Next.js App Router, Tailwind CSS for styling, Shadcn/ui for components, and Clerk for authentication. I'll provide you with the structure and code." },
];

export function MessageList() {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="mx-auto max-w-3xl space-y-8 pt-4 pb-8">
        {dummyMessages.map((message) => (
          <Message key={message.id} role={message.role} content={message.content} />
        ))}
      </div>
    </ScrollArea>
  );
}
