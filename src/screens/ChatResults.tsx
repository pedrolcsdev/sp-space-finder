"use client";

import Link from "next/link";
import { Bot, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { SpaceCard } from "@/components/SpaceCard";
import type { Space } from "@/lib/data/contracts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ChatResultsScreenProps {
  spaces: Space[];
}

export default function ChatResultsScreen({ spaces }: ChatResultsScreenProps) {
  const chatResults = spaces.slice(0, 5).map((s, i) => ({
    ...s,
    matchPercentage: [96, 91, 87, 82, 74][i],
  }));

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
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <Card className="p-6 sm:p-7">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" size="sm">
              Assistente
            </Badge>
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground lg:text-3xl">
              Resultados do Assistente
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Espaços ordenados por relevância
            </p>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {chatResults.map((space, i) => (
          <SpaceCard key={space.id} space={space} index={i} />
        ))}
      </div>
    </div>
  );
}
