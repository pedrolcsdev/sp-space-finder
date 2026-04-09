"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  Search,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { SpaceCard } from "@/components/SpaceCard";
import type { Space } from "@/lib/data/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const categorySections = [
  { id: "auditorium", name: "Auditórios" },
  { id: "dental", name: "Salas Odontológicas" },
  { id: "meeting", name: "Salas de Reunião" },
] as const;

interface HomeScreenProps {
  spaces: Space[];
}

export default function HomeScreen({ spaces }: HomeScreenProps) {
  const recommended = spaces.filter((s) => s.recommended);
  const heroSpaces = spaces.slice(0, 2);

  return (
    <>
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-8 top-16 h-72 w-72 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-8 right-10 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
        </div>
        <div className="page-container relative py-10 lg:py-14">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.82fr)]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl"
            >
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/80 backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5" />
                Plataforma premium de reserva de espaços
              </span>
              <h1 className="mb-5 max-w-4xl font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] text-primary-foreground sm:text-5xl lg:text-6xl">
                Encontre o espaço ideal com uma experiência mais elegante,
                clara e confiável.
              </h1>
              <p className="mb-8 max-w-2xl text-base leading-8 text-primary-foreground/72 lg:text-[17px]">
                Explore auditórios, salas de reunião e salas odontológicas com
                comparação simples, visual profissional e decisão mais segura.
              </p>
              <div className="mb-10 flex flex-wrap gap-4">
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="border-none bg-primary-foreground text-primary hover:bg-primary-foreground/92"
                >
                  <Link href="/encontrar">
                    Explorar espaços
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/18"
                >
                  <Link href="/onboarding">Receber recomendações</Link>
                </Button>
              </div>

              <div className="glass-card subtle-ring max-w-4xl p-3 sm:p-4">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_0.72fr_0.72fr_auto]">
                  <div className="rounded-[22px] border border-border/70 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <Search className="h-3.5 w-3.5" />
                      Buscar espaço
                    </div>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Auditório, reunião ou consultório"
                        className="h-12 border-none bg-secondary pl-11 shadow-none"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-border/70 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      Curadoria
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      Seleção qualificada
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Espaços com melhor apresentação e leitura de valor
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-border/70 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <CalendarRange className="h-3.5 w-3.5" />
                      Reserva
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      Sob demanda
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Comparação rápida e decisão mais segura
                    </p>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="h-full min-h-14 rounded-[22px] px-6"
                  >
                    <Link href="/encontrar">
                      Buscar agora
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.12 }}
              className="lg:pl-4"
            >
              <div className="premium-panel overflow-hidden p-4 sm:p-5">
                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-[30px] border border-white/15">
                    <img
                      src={heroSpaces[0]?.image}
                      alt={heroSpaces[0]?.name}
                      className="aspect-[4/3.2] w-full object-cover"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] bg-white/92 p-5 text-foreground shadow-xl shadow-slate-950/10">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Destaque
                      </p>
                      <p className="mt-3 text-xl font-semibold leading-tight tracking-[-0.03em]">
                        Busca melhor organizada, filtros mais elegantes e cards
                        com leitura mais profissional.
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-white/12 bg-black/15 p-5 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
                        Categorias
                      </p>
                      <div className="mt-3 space-y-3 text-sm text-white/80">
                        <p>Auditórios para eventos e apresentações</p>
                        <p>Salas odontológicas com estrutura profissional</p>
                        <p>Salas de reunião para encontros executivos</p>
                      </div>
                    </div>
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
              <span className="eyebrow mb-4">Seleção curada</span>
              <h2 className="section-heading">
                Recomendados para você
              </h2>
              <p className="section-copy mt-3">
                Espaços com melhor percepção de valor, boa localização e
                estrutura pronta para receber reuniões, atendimentos ou eventos.
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
              const spacesByCategory = spaces
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
