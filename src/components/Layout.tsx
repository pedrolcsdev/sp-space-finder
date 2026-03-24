import { ReactNode } from "react";
import type { ChatFlowStep } from "@/lib/data/contracts";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ChatWidget } from "./ChatWidget";

interface LayoutProps {
  children: ReactNode;
  chatFlow: ChatFlowStep[];
}

export function Layout({ children, chatFlow }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget chatFlow={chatFlow} />
    </div>
  );
}
