import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const filterChipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border text-sm font-medium transition-all duration-200 focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-border/80 bg-white/88 text-secondary-foreground shadow-sm shadow-slate-950/5 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white",
        selected:
          "border-primary/20 bg-primary text-primary-foreground shadow-sm shadow-primary/20",
        count: "border-transparent bg-foreground text-background shadow-sm",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        md: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface FilterChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof filterChipVariants> {
  removable?: boolean;
}

export function FilterChip({
  className,
  variant,
  size,
  removable = false,
  children,
  ...props
}: FilterChipProps) {
  return (
    <button
      type="button"
      className={cn(filterChipVariants({ variant, size, className }))}
      {...props}
    >
      <span className="truncate">{children}</span>
      {removable && <X className="h-3.5 w-3.5" />}
    </button>
  );
}

export { filterChipVariants };
