"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CircleDollarSign,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { Space } from "@/lib/data/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SpaceAvailabilitySidebar } from "@/components/SpaceAvailabilitySidebar";
import { useResolvedSpace } from "@/hooks/use-mock-store";
import { FavoriteSpaceButton } from "@/components/FavoriteSpaceButton";
import { getResourceIcon } from "@/lib/resource-icons";

interface SpaceDetailsScreenProps {
  space: Space;
}

const categoryLabel: Record<Space["category"], string> = {
  auditorium: "Auditório",
  dental: "Consultório Odontológico",
  meeting: "Sala de Reunião",
};

const defaultRules = [
  "Respeitar o horário contratado para evitar cobranças extras.",
  "Zelar pelos equipamentos e pelo mobiliário durante o uso.",
  "Manter o espaço organizado ao final da reserva.",
];

export default function SpaceDetailsScreen({ space }: SpaceDetailsScreenProps) {
  const resolvedSpace = useResolvedSpace(space);
  const gallery = resolvedSpace.images?.length ? resolvedSpace.images : [resolvedSpace.image];
  const rules = resolvedSpace.usageRules?.length ? resolvedSpace.usageRules : defaultRules;
  const reservePath = `/reservar/${resolvedSpace.id}`;
  const commercialInfo =
    resolvedSpace.commercialInfo ??
    `Disponível por hora, a partir de R$ ${resolvedSpace.pricePerHour}/hora.`;

  return (
    <div className="page-container section-space pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Link
        href="/encontrar"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para resultados
      </Link>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow">
            <img
              src={gallery[0]}
              alt={resolvedSpace.name}
              className="h-64 w-full object-cover sm:h-[420px]"
            />
          </div>

          {gallery.length > 1 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {gallery.slice(1).map((image, index) => (
                <div
                  key={`${space.id}-${index + 1}`}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <img
                  src={image}
                    alt={`${resolvedSpace.name} - foto ${index + 2}`}
                    className="h-28 w-full object-cover sm:h-32"
                  />
                </div>
              ))}
            </div>
          )}

          <Card className="space-y-6 p-5 sm:p-7">
            <div className="space-y-3">
              <Badge variant="outline" className="w-fit">
                {categoryLabel[resolvedSpace.category]}
              </Badge>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <h1 className="font-display text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
                    {resolvedSpace.name}
                  </h1>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {resolvedSpace.description}
                  </p>
                </div>
                <FavoriteSpaceButton
                  spaceId={resolvedSpace.id}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Localização
                  </p>
                  <p className="text-sm text-foreground">{resolvedSpace.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-3">
                <Users className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Capacidade
                  </p>
                  <p className="text-sm text-foreground">
                    Até {resolvedSpace.capacity} pessoas
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Comodidades
            </h2>
            <div className="flex flex-wrap gap-2">
              {resolvedSpace.resources.map((resource) => {
                const ResourceIcon = getResourceIcon(resource);

                return (
                  <Badge
                    key={resource}
                    variant="secondary"
                    className="h-auto rounded-full px-3 py-1.5 text-xs font-medium"
                  >
                    <ResourceIcon className="mr-1 h-3.5 w-3.5 shrink-0" />
                    {resource}
                  </Badge>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-4 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Regras de uso
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {rules.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card className="space-y-5 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Faixa comercial
              </p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                R$ {resolvedSpace.pricePerHour}
                <span className="text-base font-medium text-muted-foreground">
                  /hora
                </span>
              </p>
            </div>

            <div className="rounded-lg border border-border bg-secondary/50 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CircleDollarSign className="h-4 w-4 text-primary" />
                Informação comercial
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{commercialInfo}</p>
            </div>
          </Card>

          <SpaceAvailabilitySidebar
            spaceId={resolvedSpace.id}
            reservePath={reservePath}
          />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-border/80 bg-card/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgb(15_23_42_/_0.08)] backdrop-blur-xl motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in-0 md:hidden">
        <div className="mx-auto flex max-w-screen-sm items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none text-foreground">
              R$ {resolvedSpace.pricePerHour}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">/hora</p>
          </div>

          <Button
            asChild
            size="lg"
            className="h-12 min-w-[198px] rounded-2xl px-6 shadow-sm shadow-primary/20 active:scale-[0.98]"
          >
            <Link href={reservePath}>Verificar disponibilidade</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
