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

const fallbackImageByCategory: Record<Space["category"], string> = {
  auditorium:
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop",
  dental:
    "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600&h=400&fit=crop",
  meeting:
    "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=600&h=400&fit=crop",
};

interface SpaceCardProps {
  space: Space;
  index?: number;
  showPricing?: boolean;
}

const MAX_VISIBLE_RESOURCES = 2;

export function SpaceCard({
  space,
  index = 0,
  showPricing = true,
}: SpaceCardProps) {
  const visibleResources = space.resources.slice(0, MAX_VISIBLE_RESOURCES);
  const hiddenResourcesCount = space.resources.length - visibleResources.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="h-full motion-safe:will-change-transform"
    >
      <Link
        href={`/espacos/${space.id}`}
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-white/70 bg-card/95 shadow-sm shadow-slate-950/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_64px_rgb(15_23_42_/_0.12)] focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={space.image}
            alt={space.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 group-focus-visible:scale-105"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackImageByCategory[space.category];
            }}
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

        <div className="flex h-full flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <h3 className="line-clamp-2 text-[20px] font-semibold leading-tight tracking-[-0.03em] text-foreground">
                {space.name}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/72">
                <span className="flex min-w-0 items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{space.location}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Até {space.capacity} pessoas
                </span>
              </div>
            </div>
            <div className="shrink-0 whitespace-nowrap rounded-full border border-border/70 bg-secondary/80 px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                4.9
              </span>
            </div>
          </div>

          <p className="min-h-[3.5rem] line-clamp-2 text-sm leading-6 text-foreground/68">
            {space.description}
          </p>

          <div className="flex min-h-[5.5rem] flex-wrap content-start gap-2">
            {visibleResources.map((r) => (
              <span
                key={r}
                className="inline-flex max-w-[42%] min-w-0 items-center gap-1.5 rounded-full border border-border/70 bg-secondary/70 px-3 py-1.5 text-xs font-medium text-secondary-foreground"
              >
                <Check className="w-3 h-3" />
                <span className="truncate">{r}</span>
              </span>
            ))}
            {hiddenResourcesCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/70 px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                <Check className="w-3 h-3" />+{hiddenResourcesCount}
              </span>
            )}
          </div>

          {showPricing && (
            <div className="mt-auto flex items-center justify-between border-t border-border/80 pt-4">
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
