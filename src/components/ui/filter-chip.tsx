import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const filterChipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border text-sm font-medium transition-colors focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-secondary-foreground hover:bg-secondary",
        selected: "border-primary bg-primary text-primary-foreground",
        count: "border-transparent bg-foreground text-background",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-3.5 text-sm",
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
