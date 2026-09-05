import { ChatConversation } from "@/components/chat/ChatConversation";

export default async function ChatByIdPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  return <ChatConversation chatId={chatId} />;
}
