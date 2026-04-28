"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, X, Send, Bot, User, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-chip";
import { useChatAssistant } from "@/hooks/use-chat-assistant";

export function ChatWidget() {
  const {
    open,
    messages,
    introSuggestions,
    followUpActions,
    locationSuggestions,
    resourceOptions,
    hasSearchContext,
    conversationStage,
    selectedResourceOptions,
    isSearching,
    closeChat,
    openChat,
    resetConversation,
    sendMessage,
    handleQuickAction,
    toggleResourceOption,
    confirmResourceSelection,
  } = useChatAssistant();
  const [input, setInput] = useState("");
  const [showInitialTooltip, setShowInitialTooltip] = useState(true);

  const showIntroSuggestions = useMemo(
    () => conversationStage === "initial",
    [conversationStage],
  );

  const showFollowUpActions = useMemo(
    () => hasSearchContext && messages.length > 2 && conversationStage === "results",
    [conversationStage, hasSearchContext, messages.length],
  );

  const showLocationSuggestions = conversationStage === "awaitingLocation";
  const showResourceSelector = conversationStage === "awaitingResources";

  useEffect(() => {
    if (open) {
      setShowInitialTooltip(false);
    }
  }, [open]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
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
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 flex items-center gap-3 sm:bottom-6 sm:right-6"
          >
            {showInitialTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="pointer-events-none max-w-[210px] rounded-xl border border-border/80 bg-white px-3 py-2 text-xs font-medium leading-5 text-foreground shadow-lg"
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
            className="fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 flex h-[calc(100dvh-1rem-env(safe-area-inset-bottom))] max-h-[640px] flex-col overflow-hidden rounded-2xl border border-border bg-card card-shadow-lg sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[74vh] sm:max-h-[560px] sm:w-[380px]"
          >
            <div className="gradient-hero flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary-foreground">
                    Assistente SP Spaces
                  </p>
                  <p className="truncate text-xs text-primary-foreground/60">
                    Recomendações consultivas em tempo real
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={resetConversation}
                  className="rounded-md p-1.5 transition-colors hover:bg-primary-foreground/10"
                  aria-label="Nova busca"
                  title="Nova busca"
                >
                  <RotateCcw className="h-4 w-4 text-primary-foreground" />
                </button>
                <button
                  onClick={closeChat}
                  className="rounded-md p-1.5 transition-colors hover:bg-primary-foreground/10"
                  aria-label="Fechar chat"
                >
                  <X className="h-4 w-4 text-primary-foreground" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
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
                            onClick={() => sendMessage(suggestion)}
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

                  {showLocationSuggestions &&
                    index === messages.length - 1 &&
                    message.type === "bot" && (
                      <div className="space-y-2 pl-0 sm:pl-8">
                        <div className="flex flex-wrap gap-2">
                          {locationSuggestions.map((suggestion) => (
                            <FilterChip
                              key={suggestion}
                              onClick={() => sendMessage(suggestion)}
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

                  {showResourceSelector &&
                    index === messages.length - 1 &&
                    message.type === "bot" && (
                      <div className="space-y-3 pl-0 sm:pl-8">
                        <div className="flex flex-wrap gap-2">
                          {resourceOptions.map((resource) => {
                            const selected = selectedResourceOptions.includes(resource);

                            return (
                              <FilterChip
                                key={resource}
                                onClick={() => toggleResourceOption(resource)}
                                variant={selected ? "selected" : "default"}
                                size="sm"
                              >
                                {resource}
                              </FilterChip>
                            );
                          })}
                        </div>
                        <Button
                          onClick={confirmResourceSelection}
                          size="sm"
                          className="h-9 rounded-full px-4"
                        >
                          Continuar busca
                        </Button>
                      </div>
                    )}
                </div>
              ))}

              {isSearching && (
                <div className="pl-0 sm:pl-8">
                  <p className="text-sm italic text-muted-foreground/70">
                    Buscando os espaços ideais para você...
                  </p>
                </div>
              )}
            </div>

            {showFollowUpActions && (
              <div className="border-t border-border/80 px-3 py-3">
                <p className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Continuar recomendação
                </p>
                <div className="flex flex-wrap gap-2">
                  {followUpActions.map((action) => (
                    <FilterChip
                      key={action}
                      size="sm"
                      variant="default"
                      className="hover:border-primary/40"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action}
                    </FilterChip>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleSend()}
                  placeholder="Descreva cidade, evento, capacidade ou recurso"
                  className="h-10 rounded-md border-border bg-secondary"
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="h-10 w-10 rounded-md"
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
