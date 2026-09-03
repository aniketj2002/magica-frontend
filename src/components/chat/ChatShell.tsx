import { MessageList } from "./MessageList";
import { Composer } from "./Composer";

export function ChatShell() {
  return (
    <div className="flex h-full w-full flex-col bg-muted/20">
      <MessageList />
      <Composer />
    </div>
  );
}
