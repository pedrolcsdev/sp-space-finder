"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  MapPin,
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  RotateCcw,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-chip";
import { useChatAssistant } from "@/hooks/use-chat-assistant";

export function ChatWidget() {
  const pathname = usePathname();
  const {
    open,
    messages,
    introSuggestions,
    conversationStage,
    isSearching,
    closeChat,
    openChat,
    resetConversation,
    sendMessage,
  } = useChatAssistant();
  const [input, setInput] = useState("");
  const [showInitialTooltip, setShowInitialTooltip] = useState(true);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const isSpaceDetailsPage = /^\/espacos\/[^/]+$/.test(pathname);

  const showIntroSuggestions = useMemo(
    () => conversationStage === "initial",
    [conversationStage],
  );

  const closedChatBottomClass = isSpaceDetailsPage
    ? "bottom-[calc(7rem+env(safe-area-inset-bottom))] sm:bottom-6"
    : "bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-6";

  const openChatBottomClass = isSpaceDetailsPage
    ? "bottom-[calc(7rem+env(safe-area-inset-bottom))] h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] sm:bottom-6 sm:h-[74vh]"
    : "bottom-[calc(0.5rem+env(safe-area-inset-bottom))] h-[calc(100dvh-1rem-env(safe-area-inset-bottom))] sm:bottom-6 sm:h-[74vh]";

  useEffect(() => {
    if (open) {
      setShowInitialTooltip(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    bottomAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [open, messages, isSearching]);

  const handleSend = () => {
    if (!input.trim() || isSearching) return;
    void sendMessage(input.trim());
    setInput("");
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={`fixed right-4 z-50 flex items-center gap-3 sm:right-6 ${closedChatBottomClass}`}
          >
            {showInitialTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="pointer-events-none max-w-[210px] rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-medium leading-5 text-foreground shadow-lg"
              >
                Precisa de ajuda? Fale com o assistente
              </motion.div>
            )}
            <button
              onClick={() => {
                setShowInitialTooltip(false);
                openChat();
              }}
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground card-shadow-lg transition-transform hover:scale-105 hover:bg-primary-hover"
              aria-label="Abrir chat"
            >
              <span className="absolute inset-0 rounded-xl bg-primary/30 motion-safe:animate-ping" />
              <MessageCircle className="relative h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed inset-x-2 z-50 flex max-h-[640px] flex-col overflow-hidden rounded-2xl border border-border bg-card card-shadow-lg sm:inset-x-auto sm:right-6 sm:max-h-[560px] sm:w-[380px] ${openChatBottomClass}`}
          >
            <div className="gradient-hero flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/14">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    Assistente SP Spaces
                  </p>
                  <p className="truncate text-xs text-white">
                    Recomendações consultivas em tempo real
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={resetConversation}
                  className="rounded-md p-1.5 transition-colors hover:bg-white/10"
                  aria-label="Nova busca"
                  title="Nova busca"
                >
                  <RotateCcw className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={closeChat}
                  className="rounded-md p-1.5 transition-colors hover:bg-white/10"
                  aria-label="Fechar chat"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            <div
              ref={messagesViewportRef}
              className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4"
            >
              {messages.map((message, index) => (
                <div key={message.id} className="space-y-2">
                  <div
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[92%] items-end gap-2 sm:max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                          message.type === "bot" ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        {message.type === "bot" ? (
                          <Bot className="h-3 w-3 text-primary" />
                        ) : (
                          <User className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                          message.type === "bot"
                            ? "rounded-bl-sm bg-secondary text-foreground"
                            : "rounded-br-sm bg-primary text-primary-foreground"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  </div>

                  {showIntroSuggestions && index === 0 && (
                    <div className="space-y-2 pl-0 sm:pl-8">
                      <div className="flex flex-wrap gap-2">
                        {introSuggestions.map((suggestion) => (
                          <FilterChip
                            key={suggestion}
                            onClick={() => void sendMessage(suggestion)}
                            variant="default"
                            size="sm"
                            className="hover:border-primary/40"
                          >
                            {suggestion}
                          </FilterChip>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.recommendations && message.recommendations.length > 0 && (
                    <div className="space-y-2 pl-0 sm:pl-8">
                      {message.recommendations.map((space) => (
                        <Link
                          key={space.id}
                          href={`/espacos/${space.id}`}
                          className="block rounded-lg border border-border/80 bg-card/92 p-3 text-left shadow-sm transition-colors hover:border-primary/45 hover:bg-secondary/40"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                                {space.name}
                              </p>
                              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{space.location}</span>
                              </p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">
                              <TrendingUp className="h-3 w-3" />
                              {space.matchPercent}%
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground/75">
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1">
                              <Users className="h-3 w-3" />
                              Até {space.capacity}
                            </span>
                            <span className="rounded-full bg-secondary px-2 py-1">
                              R$ {space.pricePerHour}/hora
                            </span>
                          </div>

                          <div className="mt-3 space-y-1">
                            {space.reasons.slice(0, 2).map((reason) => (
                              <p
                                key={reason}
                                className="text-xs leading-5 text-muted-foreground"
                              >
                                {reason}
                              </p>
                            ))}
                          </div>

                          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            Ver detalhes
                            <ArrowUpRight className="h-3 w-3" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                </div>
              ))}

              {isSearching && (
                <div className="flex justify-start pl-0 sm:pl-8">
                  <div className="flex max-w-[92%] items-end gap-2 sm:max-w-[85%]">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 text-foreground">
                      <div className="flex items-center gap-1.5" aria-label="Assistente digitando">
                        <span className="sr-only">Assistente digitando</span>
                        {[0, 1, 2].map((dot) => (
                          <motion.span
                            key={dot}
                            className="h-2 w-2 rounded-full bg-primary/60"
                            animate={{
                              opacity: [0.35, 1, 0.35],
                              y: [0, -3, 0],
                            }}
                            transition={{
                              duration: 0.9,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                              delay: dot * 0.15,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomAnchorRef} />
            </div>

            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleSend()}
                  placeholder="Descreva o espaço que você precisa"
                  className="h-10 rounded-md border-border bg-secondary text-base shadow-none"
                  disabled={isSearching}
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="h-10 w-10 rounded-md"
                  disabled={isSearching}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
