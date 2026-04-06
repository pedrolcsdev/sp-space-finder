import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleDollarSign,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { Space } from "@/lib/data/contracts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SpaceAvailabilitySidebar } from "@/components/SpaceAvailabilitySidebar";

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
  const gallery = space.images?.length ? space.images : [space.image];
  const rules = space.usageRules?.length ? space.usageRules : defaultRules;
  const commercialInfo =
    space.commercialInfo ??
    `Disponível por hora, a partir de R$ ${space.pricePerHour}/hora.`;

  return (
    <div className="page-container section-space">
      <Link
        href="/encontrar"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para resultados
      </Link>

      <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow">
            <img
              src={gallery[0]}
              alt={space.name}
              className="h-[320px] w-full object-cover sm:h-[420px]"
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
                    alt={`${space.name} - foto ${index + 2}`}
                    className="h-28 w-full object-cover sm:h-32"
                  />
                </div>
              ))}
            </div>
          )}

          <Card className="space-y-6 p-6 sm:p-7">
            <div className="space-y-3">
              <Badge variant="outline" className="w-fit">
                {categoryLabel[space.category]}
              </Badge>
              <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                {space.name}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground">
                {space.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Localização
                  </p>
                  <p className="text-sm text-foreground">{space.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-3">
                <Users className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Capacidade
                  </p>
                  <p className="text-sm text-foreground">
                    Até {space.capacity} pessoas
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Comodidades
            </h2>
            <div className="flex flex-wrap gap-2">
              {space.resources.map((resource) => (
                <Badge
                  key={resource}
                  variant="secondary"
                  className="h-auto rounded-full px-3 py-1.5 text-xs font-medium"
                >
                  <Check className="mr-1 h-3 w-3" />
                  {resource}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="space-y-4 p-6">
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

        <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card className="space-y-5 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Faixa comercial
              </p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                R$ {space.pricePerHour}
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
            spaceId={space.id}
            reservePath={`/reservar/${space.id}`}
          />
        </aside>
      </div>
    </div>
  );
}
