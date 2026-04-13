"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { SpaceCard } from "@/components/SpaceCard";
import type { Space } from "@/lib/data/contracts";
import { Button } from "@/components/ui/button";
import { useResolvedSpaces } from "@/hooks/use-mock-store";

const categorySections = [
  { id: "auditorium", name: "Auditórios" },
  { id: "dental", name: "Salas Odontológicas" },
  { id: "meeting", name: "Salas de Reunião" },
] as const;

interface HomeScreenProps {
  spaces: Space[];
}

export default function HomeScreen({ spaces }: HomeScreenProps) {
  const resolvedSpaces = useResolvedSpaces(spaces);
  const recommended = resolvedSpaces.filter((s) => s.recommended);
  const heroSpace = resolvedSpaces[0];

  const openAssistant = () => {
    window.dispatchEvent(new CustomEvent("spspaces:open-chat"));
  };

  return (
    <>
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-8 top-16 h-72 w-72 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-8 right-10 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
        </div>
        <div className="page-container relative py-10 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl"
            >
              <h1 className="mb-5 max-w-4xl font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] text-primary-foreground sm:text-5xl lg:text-6xl">
                Encontre o espaço ideal com nosso assistente virtual
              </h1>
              <p className="mb-8 max-w-2xl text-base leading-8 text-primary-foreground lg:text-[17px]">
                Explore os espaços da maneira tracicional ou consulte o assistente virtual para receber recomendações personalizadas com base nas suas preferências.
              </p>
              <div className="flex flex-wrap gap-4">
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
                  variant="ghost"
                  size="lg"
                  className="border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/18"
                  onClick={openAssistant}
                >
                  <MessageCircle className="w-4 h-4" />
                  Conversar com assistente
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.12 }}
              className="lg:pl-6"
            >
              <div className="premium-panel overflow-hidden p-4">
                <div className="overflow-hidden rounded-[30px] border border-white/15">
                  <img
                    src={heroSpace?.image}
                    alt={heroSpace?.name}
                    className="aspect-[4/3.35] w-full object-cover"
                  />
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
