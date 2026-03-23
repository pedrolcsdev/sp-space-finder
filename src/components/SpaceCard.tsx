import { Check, MapPin, Users, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Space } from "@/lib/data/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      className="group overflow-hidden rounded-xl border border-border bg-card card-shadow transition-all duration-300 hover:-translate-y-0.5 hover:card-shadow-hover"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={space.image}
          alt={space.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {space.recommended && (
          <Badge className="absolute top-3 left-3 gap-1.5">
            <Star className="w-3 h-3" />
            Recomendado
          </Badge>
        )}

        {space.matchPercentage && (
          <Badge
            variant="success"
            className="absolute top-3 right-3 gap-1.5 bg-success text-success-foreground"
          >
            <TrendingUp className="w-3 h-3" />
            {space.matchPercentage}% match
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3 p-5">
        <h3 className="line-clamp-1 text-[17px] font-semibold leading-tight text-foreground">
          {space.name}
        </h3>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              <Check className="w-3 h-3" />
              {r}
            </span>
          ))}
          {space.resources.length > 3 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              <Check className="w-3 h-3" />+{space.resources.length - 3}
            </span>
          )}
        </div>

        {showPricing && (
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-lg font-bold text-foreground">
              R$ {space.pricePerHour}
              <span className="text-sm font-medium text-muted-foreground">
                /hora
              </span>
            </span>
            <Button size="sm" className="h-9 rounded-md px-3.5 text-xs">
              Ver detalhes
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
