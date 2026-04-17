import { ReactNode, Suspense } from "react";
import type { ChatFlowStep } from "@/lib/data/contracts";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ChatWidget } from "./ChatWidget";
import { ChatAssistantProvider } from "@/hooks/use-chat-assistant";

interface LayoutProps {
  children: ReactNode;
  chatFlow: ChatFlowStep[];
}

export function Layout({ children, chatFlow }: LayoutProps) {
  return (
    <ChatAssistantProvider chatFlow={chatFlow}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Suspense
          fallback={
            <div className="h-[82px] border-b border-white/50 bg-background/80 backdrop-blur-xl" />
          }
        >
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
      </div>
    </ChatAssistantProvider>
  );
}
