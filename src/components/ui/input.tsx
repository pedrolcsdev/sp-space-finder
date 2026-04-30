import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-input/90 bg-white/92 px-4 py-2 text-base text-foreground shadow-sm shadow-slate-950/5 ring-offset-background transition-[border-color,box-shadow,background-color] file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground/80 focus:border-input/90 focus:bg-white focus:shadow-sm focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground/80",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
