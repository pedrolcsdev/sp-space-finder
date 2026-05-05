"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "footer" | "floating";
  className?: string;
}

export function ThemeToggle({
  variant = "footer",
  className,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full border border-border/80 text-foreground shadow-sm backdrop-blur-xl",
        variant === "footer"
          ? "bg-card/92 px-4 py-3"
          : "fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[75] bg-card/94 px-3 py-2.5 sm:right-6",
        className,
      )}
    >
      <span className="text-sm font-medium text-muted-foreground">Tema</span>
      <div className="flex items-center gap-2">
        <Sun
          className={cn(
            "h-4 w-4 transition-colors",
            isDark ? "text-muted-foreground/60" : "text-amber-500",
          )}
          aria-hidden="true"
        />
        <Switch
          checked={isDark}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          aria-label="Alternar entre tema claro e escuro"
        />
        <Moon
          className={cn(
            "h-4 w-4 transition-colors",
            isDark ? "text-foreground" : "text-muted-foreground/60",
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
