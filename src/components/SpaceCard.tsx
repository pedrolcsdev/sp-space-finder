import {
  ArrowUpRight,
  Check,
  MapPin,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Space } from "@/lib/data/contracts";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SpaceCardProps {
  space: Space;
  index?: number;
  showPricing?: boolean;
}

export function SpaceCard({
  space,
  index = 0,
  showPricing = true,
}: SpaceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="motion-safe:will-change-transform"
    >
      <Link
        href={`/espacos/${space.id}`}
        className="group block cursor-pointer overflow-hidden rounded-[28px] border border-white/70 bg-card/95 shadow-sm shadow-slate-950/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_64px_rgb(15_23_42_/_0.12)] focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={space.image}
            alt={space.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 group-focus-visible:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-foreground/5 to-transparent opacity-80" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/65 via-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />

          {space.recommended && (
            <Badge className="absolute left-4 top-4 gap-1.5 rounded-full border-none bg-white/92 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary shadow-lg shadow-slate-950/10">
              <Sparkles className="w-3 h-3" />
              Recomendado
            </Badge>
          )}

          {space.matchPercentage && (
            <Badge
              variant="success"
              className="absolute right-4 top-4 gap-1.5 rounded-full border-none bg-success/95 px-3 py-1.5 text-xs text-success-foreground shadow-lg shadow-success/15"
            >
              <TrendingUp className="w-3 h-3" />
              {space.matchPercentage}% match
            </Badge>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div className="rounded-full bg-black/20 px-3 py-1.5 backdrop-blur-md">
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <MapPin className="h-3.5 w-3.5" />
                {space.location.split("—")[0].trim()}
              </span>
            </div>
            <div className="rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg shadow-slate-950/10">
              {space.category === "auditorium"
                ? "Eventos"
                : space.category === "dental"
                  ? "Saúde"
                  : "Reuniões"}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h3 className="line-clamp-2 text-[20px] font-semibold leading-tight tracking-[-0.03em] text-foreground">
                {space.name}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/72">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[210px]">{space.location}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Até {space.capacity} pessoas
                </span>
              </div>
            </div>
            <div className="rounded-full border border-border/70 bg-secondary/80 px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                4.9
              </span>
            </div>
          </div>

          <p className="line-clamp-2 text-sm leading-6 text-foreground/68">
            {space.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {space.resources.slice(0, 3).map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/70 px-3 py-1.5 text-xs font-medium text-secondary-foreground"
              >
                <Check className="w-3 h-3" />
                {r}
              </span>
            ))}
            {space.resources.length > 3 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/70 px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                <Check className="w-3 h-3" />+{space.resources.length - 3}
              </span>
            )}
          </div>

          {showPricing && (
            <div className="flex items-center justify-between border-t border-border/80 pt-4">
              <div>
                <span className="text-2xl font-bold tracking-[-0.04em] text-foreground">
                  R$ {space.pricePerHour}
                </span>
                <span className="ml-1 text-sm font-medium text-foreground/65">
                  /hora
                </span>
              </div>
              <span
                aria-hidden="true"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "pointer-events-none h-10 rounded-full px-4 text-xs",
                )}
              >
                Ver detalhes
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
