"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatFlowStep } from "@/lib/data/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-chip";

interface Message {
  type: "bot" | "user";
  text: string;
  options?: string[];
}

interface ChatWidgetProps {
  chatFlow: ChatFlowStep[];
}

export function ChatWidget({ chatFlow }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(
    chatFlow.length > 0 ? [chatFlow[0]] : [],
  );
  const [step, setStep] = useState(1);
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleOption = (option: string) => {
    const userMsg: Message = { type: "user", text: option };
    const nextMessages = [...messages, userMsg];

    if (step < chatFlow.length) {
      const botMsg = chatFlow[step];
      nextMessages.push(botMsg);
      setMessages(nextMessages);
      setStep(step + 1);

      if (step === chatFlow.length - 1) {
        setTimeout(() => {
          setOpen(false);
          router.push("/chat-resultados");
        }, 2000);
      }
    } else {
      setMessages(nextMessages);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    handleOption(input.trim());
    setInput("");
  };

  const lastMsg = messages[messages.length - 1];

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground card-shadow-lg transition-transform hover:scale-105 hover:bg-primary-hover"
            aria-label="Abrir chat"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 right-4 z-50 flex h-[78vh] max-h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card card-shadow-lg sm:bottom-6 sm:right-6"
          >
            <div className="gradient-hero flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">
                    Assistente SP Spaces
                  </p>
                  <p className="text-xs text-primary-foreground/60">
                    Online agora
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 transition-colors hover:bg-primary-foreground/10"
                aria-label="Fechar chat"
              >
                <X className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[85%] ${msg.type === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.type === "bot" ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      {msg.type === "bot" ? (
                        <Bot className="w-3 h-3 text-primary" />
                      ) : (
                        <User className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        msg.type === "bot"
                          ? "rounded-bl-sm bg-secondary text-foreground"
                          : "rounded-br-sm bg-primary text-primary-foreground"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {lastMsg?.options && (
                <div className="flex flex-wrap gap-2 pl-8">
                  {lastMsg.options.map((opt) => (
                    <FilterChip
                      key={opt}
                      onClick={() => handleOption(opt)}
                      variant="default"
                      size="sm"
                      className="hover:border-primary/40"
                    >
                      {opt}
                    </FilterChip>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Digite sua mensagem..."
                  className="h-10 rounded-md border-border bg-secondary"
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="h-10 w-10 rounded-md"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
