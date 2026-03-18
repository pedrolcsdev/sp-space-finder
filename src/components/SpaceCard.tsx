import { Check, MapPin, Users, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Space } from "@/data/mockData";

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
      className="group bg-card rounded-2xl overflow-hidden border border-border/50 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={space.image}
          alt={space.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {space.recommended && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            <Star className="w-3 h-3" />
            Recomendado
          </div>
        )}

        {space.matchPercentage && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success text-success-foreground text-xs font-semibold">
            <TrendingUp className="w-3 h-3" />
            {space.matchPercentage}% match
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="font-display font-semibold text-foreground text-base leading-tight line-clamp-1">
          {space.name}
        </h3>

        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[160px]">{space.location}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {space.capacity}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {space.resources.slice(0, 3).map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium"
            >
              <Check className="w-3 h-3" />
              {r}
            </span>
          ))}
          {space.resources.length > 3 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
              <Check className="w-3 h-3" />+{space.resources.length - 3}
            </span>
          )}
        </div>

        {showPricing && (
          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">
              R$ {space.pricePerHour}
              <span className="text-sm font-normal text-muted-foreground">
                /hora
              </span>
            </span>
            <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors">
              Ver detalhes
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
