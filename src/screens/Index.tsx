"use client";

import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  Send,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { SpaceCard } from "@/components/SpaceCard";
import type { Space } from "@/lib/data/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResolvedSpaces } from "@/hooks/use-mock-store";

const categorySections = [
  { id: "auditorium", name: "Auditórios" },
  { id: "dental", name: "Salas Odontológicas" },
  { id: "meeting", name: "Salas de Reunião" },
] as const;

const heroPrompts = [
  "Evento corporativo para 50 pessoas",
  "Sala com projetor",
  "Cowork com Wi-Fi",
] as const;

interface HomeScreenProps {
  spaces: Space[];
}

export default function HomeScreen({ spaces }: HomeScreenProps) {
  const resolvedSpaces = useResolvedSpaces(spaces);
  const recommended = resolvedSpaces.filter((s) => s.recommended);
  const [heroQuery, setHeroQuery] = useState("");

  const openAssistant = (message?: string, autoSend = false) => {
    window.dispatchEvent(
      new CustomEvent("spspaces:open-chat", {
        detail: { message, autoSend },
      }),
    );
  };

  const handleHeroInputChange = (value: string) => {
    setHeroQuery(value);
  };

  const submitHeroQuery = () => {
    const query = heroQuery.trim();
    if (!query) return;

    openAssistant(query, true);
  };

  const selectHeroPrompt = (prompt: string) => {
    setHeroQuery(prompt);
    openAssistant(prompt, true);
  };

  return (
    <>
      <section className="gradient-hero relative overflow-hidden">
        <div className="page-container relative py-6 sm:py-10 lg:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="min-w-0"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-normal text-primary-foreground/80 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Busca com IA
              </div>
              <h1 className="mx-auto mb-3 max-w-2xl font-display text-2xl font-bold leading-tight tracking-normal text-primary-foreground sm:text-4xl lg:text-5xl">
                Encontre seu espaço ideal
              </h1>
              <p className="mx-auto mb-5 max-w-2xl text-sm leading-6 text-primary-foreground/80 sm:text-base sm:leading-7">
                Descreva seu evento e receba recomendações personalizadas com base nas suas necessidades.
              </p>

              <div className="mx-auto max-w-2xl">
                <form
                  className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/20 bg-white p-2 shadow-2xl shadow-slate-950/20"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitHeroQuery();
                  }}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <Input
                    value={heroQuery}
                    onChange={(event) => handleHeroInputChange(event.target.value)}
                    placeholder="Descreva seu evento…"
                    className="h-11 min-w-0 border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-xl"
                    aria-label="Buscar espaço"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>

                <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
                  {heroPrompts.map((prompt, index) => (
                    <motion.div
                      key={prompt}
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.08 * index }}
                      className="flex-none"
                    >
                      <button
                        type="button"
                        className="inline-flex h-full min-h-10 w-full items-center justify-start gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-2 text-left text-xs font-medium text-primary-foreground shadow-none backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 sm:min-h-11 sm:py-2.5 sm:text-sm"
                        onClick={() => selectHeroPrompt(prompt)}
                      >
                        <WandSparkles className="h-4 w-4 shrink-0" />
                        <span>{prompt}</span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-container">
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <h2 className="section-heading">
                Recomendados para você
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/72 sm:text-base">
                Espaços com melhor percepção de valor, boa localização e
                estrutura pronta.
              </p>
            </div>
            <Link
              href="/encontrar"
              className="hidden items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover md:inline-flex"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {recommended.map((space, i) => (
              <SpaceCard key={space.id} space={space} index={i} />
            ))}
          </div>

          <Link
            href="/encontrar"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary md:hidden"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="gradient-subtle section-space">
        <div className="page-container">
          <div className="space-y-12">
            {categorySections.map((category, categoryIndex) => {
              const spacesByCategory = resolvedSpaces
                .filter((space) => space.category === category.id)
                .slice(0, 3);

              return (
                <motion.div
                  key={category.id}
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: categoryIndex * 0.08 }}
                >
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <span className="eyebrow mb-4">Categorias</span>
                      <h2 className="font-display text-2xl font-semibold tracking-normal text-foreground lg:text-3xl">
                        {category.name}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                        Descubra opções com acabamento profissional, leitura
                        visual mais elegante e comparação mais simples.
                      </p>
                    </div>
                    <Link
                      href={`/encontrar?category=${category.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                    >
                      Ver mais &gt;
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {spacesByCategory.map((space, i) => (
                      <SpaceCard
                        key={space.id}
                        space={space}
                        index={i}
                        showPricing={false}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
