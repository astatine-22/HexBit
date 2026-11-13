import ChatBoard from "@/components/ChatBoard";
import RequireAuth from "@/components/RequireAuth";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = { title: "Chat", description: "Community chat." };

export default function ChatPage() {
  return (
    <>
      <SiteHeader active="chat" />
      <main id="main" className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
        <RequireAuth label="Loading chat…">
          <ChatBoard />
        </RequireAuth>
      </main>
      <SiteFooter />
    </>
  );
}
