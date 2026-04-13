"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { SpaceCard } from "@/components/SpaceCard";
import type { Space } from "@/lib/data/contracts";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
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

const heroMatches = [
  { name: "Auditório Premium Central", compatibility: 92 },
  { name: "Sala Executiva Alpha", compatibility: 87 },
  { name: "Sala Board Room", compatibility: 81 },
] as const;

interface HomeScreenProps {
  spaces: Space[];
}

export default function HomeScreen({ spaces }: HomeScreenProps) {
  const resolvedSpaces = useResolvedSpaces(spaces);
  const recommended = resolvedSpaces.filter((s) => s.recommended);

  const openAssistant = (message?: string, autoSend = false) => {
    window.dispatchEvent(
      new CustomEvent("spspaces:open-chat", {
        detail: { message, autoSend },
      }),
    );
  };

  return (
    <>
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-8 top-12 h-72 w-72 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-sky-200/30 blur-3xl" />
        </div>
        <div className="absolute inset-x-0 top-24 hidden h-px bg-white/10 lg:block" />
        <div className="page-container relative py-8 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/80 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Busca com IA
              </div>
              <h1 className="mb-5 max-w-4xl font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] text-primary-foreground sm:text-5xl lg:text-6xl">
                Encontre o espaço ideal em segundos
              </h1>
              <p className="mb-8 max-w-2xl text-base leading-8 text-primary-foreground/80 lg:text-[17px]">
                Descreva seu evento e receba recomendações personalizadas com base nas suas necessidades.
              </p>
              <div className="mb-7 flex flex-wrap gap-3 lg:flex-nowrap">
                {heroPrompts.map((prompt, index) => (
                  <motion.div
                    key={prompt}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.08 * index }}
                    className="lg:flex-1"
                  >
                    <FilterChip
                      size="md"
                      className="h-auto min-h-11 w-full border-white/20 bg-white/10 px-4 py-3 text-left text-sm text-primary-foreground shadow-none backdrop-blur-sm hover:border-white/30 hover:bg-white/20 hover:text-primary-foreground"
                      onClick={() => openAssistant(prompt, true)}
                    >
                      <WandSparkles className="h-4 w-4" />
                      {prompt}
                    </FilterChip>
                  </motion.div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  className="border-none bg-primary-foreground text-primary hover:bg-primary-foreground/95"
                  onClick={() => openAssistant()}
                >
                  <MessageCircle className="w-4 h-4" />
                  Conversar com assistente
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Link href="/encontrar">
                    Explorar espaços
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-5 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Recomendações personalizadas
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Resposta imediata
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.12 }}
              className="lg:pl-2"
            >
              <div className="premium-panel relative overflow-hidden p-4">
                <div className="absolute inset-x-8 top-0 h-24 rounded-full bg-sky-200/10 blur-3xl" />
                <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-slate-950/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary-foreground">
                          Assistente SP Spaces
                        </p>
                        <p className="text-xs text-primary-foreground/60">
                          Encontrando as melhores opções para o seu evento
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      Online
                    </div>
                  </div>

                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.22 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%] rounded-[24px] rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground shadow-lg shadow-slate-950/25">
                        Preciso de um espaço para 30 pessoas com projetor
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, delay: 0.35 }}
                      className="flex"
                    >
                      <div className="max-w-[92%] rounded-[28px] rounded-tl-md border border-white/10 bg-white/95 p-4 text-foreground shadow-2xl shadow-slate-950/15">
                        <p className="mb-4 text-sm leading-7 text-foreground/84">
                          Encontrei 3 opcoes ideais para esse perfil:
                        </p>
                        <div className="space-y-3">
                          {heroMatches.map((match, index) => (
                            <motion.div
                              key={match.name}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.5 + index * 0.09 }}
                              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {match.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Ambiente pronto para apresentacoes e reunioes
                                </p>
                              </div>
                              <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                                {match.compatibility}%
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          Compatibilidade calculada com base em capacidade e recursos
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.45, delay: 0.8 }}
                      className="flex items-center gap-2 pl-2 text-xs text-white/80"
                    >
                      <span className="h-2 w-2 animate-pulse rounded-full bg-sky-300" />
                      IA pronta para refinar a busca em segundos
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
              className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: categoryIndex * 0.08 }}
                >
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <span className="eyebrow mb-4">Categorias</span>
                      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-foreground lg:text-3xl">
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

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
