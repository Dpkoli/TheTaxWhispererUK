import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatWindow } from "@/components/chat/chat-window";
import { auth } from "@/lib/auth";
import { getOrCreateSessionForUser, listMessages } from "@/db/queries/chat";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await auth();

  let initialMessages: { id: string; role: "user" | "assistant"; body: string }[] = [];

  if (session?.user?.id) {
    const chatSession = await getOrCreateSessionForUser(session.user.id);
    const messages = await listMessages(chatSession.id);
    initialMessages = messages.map((m) => ({
      id: m.id,
      role: m.role,
      body: m.body,
    }));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <ChatWindow isGuest={!session?.user} initialMessages={initialMessages} />
      <SiteFooter />
    </div>
  );
}
