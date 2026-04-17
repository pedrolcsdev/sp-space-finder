"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Bot, ArrowLeft, MapPin, Users, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { SpaceCard } from "@/components/SpaceCard";
import type { Space } from "@/lib/data/contracts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import { useChatAssistant, getRankedChatResults } from "@/hooks/use-chat-assistant";

interface ChatResultsScreenProps {
  spaces: Space[];
}

export default function ChatResultsScreen({ spaces }: ChatResultsScreenProps) {
  const { criteria, announceResults } = useChatAssistant();

  const rankedSpaces = useMemo(
    () => getRankedChatResults(spaces, criteria).slice(0, 6),
    [criteria, spaces],
  );

  useEffect(() => {
    announceResults(rankedSpaces.length);
  }, [announceResults, rankedSpaces.length]);

  const activeChips = [
    criteria.city,
    criteria.eventType,
    criteria.capacity ? `${criteria.capacity} pessoas` : undefined,
    ...criteria.resources.slice(0, 2),
    criteria.pricePreference === "lowest" ? "Mais baratos" : "Mais compatíveis",
  ].filter(Boolean) as string[];

  return (
    <div className="page-container section-space">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <Card className="overflow-hidden p-6 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" size="sm">
                Assistente
              </Badge>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-3 py-2 text-xs font-medium text-muted-foreground sm:flex">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Continue refinando pelo chat
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground lg:text-3xl">
                Resultados guiados pela conversa
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Aqui estão os melhores espaços com base no que você me contou.
                A seleção foi organizada para manter continuidade entre diálogo,
                filtros e recomendação.
              </p>

              {activeChips.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {activeChips.map((chip) => (
                    <FilterChip
                      key={chip}
                      variant="default"
                      size="sm"
                      className="cursor-default"
                    >
                      {chip}
                    </FilterChip>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-border/70 bg-secondary/45 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Critérios lembrados
              </p>
              <div className="mt-4 space-y-3 text-sm text-foreground/78">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {criteria.city ?? "Cidade em aberto"}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {criteria.capacity
                    ? `Capacidade aproximada para ${criteria.capacity} pessoas`
                    : "Capacidade ainda flexível"}
                </p>
                <p>
                  {criteria.eventType
                    ? `Tipo de evento: ${criteria.eventType}`
                    : "Tipo de evento ainda pode ser refinado"}
                </p>
                <p>
                  Ordenação atual:{" "}
                  {criteria.pricePreference === "lowest"
                    ? "valores mais baixos"
                    : "melhor compatibilidade"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rankedSpaces.map((space, index) => (
          <SpaceCard key={space.id} space={space} index={index} />
        ))}
      </div>

      {rankedSpaces.length === 0 && (
        <div className="mt-8 rounded-[28px] border border-dashed border-border bg-white/65 px-6 py-14 text-center shadow-sm shadow-slate-950/5">
          <p className="text-xl font-semibold tracking-[-0.03em] text-foreground">
            Nenhum espaço apareceu com esse recorte.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            Continue no chat para ajustar cidade, orçamento, capacidade ou
            recursos sem perder o que já foi informado.
          </p>
        </div>
      )}
    </div>
  );
}
