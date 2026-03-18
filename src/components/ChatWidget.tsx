import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatFlow } from "@/data/mockData";

interface Message {
  type: "bot" | "user";
  text: string;
  options?: string[];
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([chatFlow[0]]);
  const [step, setStep] = useState(1);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

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
          navigate("/chat-resultados");
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
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl gradient-hero text-primary-foreground flex items-center justify-center card-shadow-lg hover:scale-105 transition-transform"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[520px] bg-card rounded-2xl border border-border/50 card-shadow-lg flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="gradient-hero px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">Assistente SP Spaces</p>
                  <p className="text-xs text-primary-foreground/60">Online agora</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors">
                <X className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end gap-2 max-w-[85%] ${msg.type === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.type === "bot" ? "bg-primary/10" : "bg-muted"
                    }`}>
                      {msg.type === "bot" ? <Bot className="w-3 h-3 text-primary" /> : <User className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                      msg.type === "bot"
                        ? "bg-muted text-foreground rounded-bl-md"
                        : "bg-primary text-primary-foreground rounded-br-md"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {/* Options */}
              {lastMsg?.options && (
                <div className="flex flex-wrap gap-2 pl-8">
                  {lastMsg.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleOption(opt)}
                      className="px-3.5 py-2 rounded-xl border border-primary/30 text-primary text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={handleSend}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
