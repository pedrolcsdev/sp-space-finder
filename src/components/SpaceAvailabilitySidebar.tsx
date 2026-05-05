"use client";

import Link from "next/link";
import { CalendarDays, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SpaceAvailabilitySidebarProps {
  spaceId: string;
  reservePath: string;
}

export function SpaceAvailabilitySidebar({
  reservePath,
}: SpaceAvailabilitySidebarProps) {
  return (
    <Card className="min-w-0 space-y-5 p-4 sm:p-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Disponibilidade
        </p>
        <p className="text-sm text-muted-foreground">
          Escolha dias específicos ou um período contínuo na próxima etapa.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 text-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          Datas flexíveis no calendário
        </p>
        <p className="flex items-center gap-2 text-foreground">
          <Clock3 className="h-4 w-4 text-primary" />
          Horários gerais ou por dia
        </p>
      </div>

      <Button asChild size="lg" className="w-full gap-2">
        <Link href={reservePath}>
          <CalendarDays className="h-4 w-4" />
          Verificar disponibilidade
        </Link>
      </Button>
    </Card>
  );
}
