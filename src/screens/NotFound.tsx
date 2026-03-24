"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFoundScreen() {
  const pathname = usePathname();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname,
    );
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg text-center" size="lg">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Erro 404
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-foreground">
          Página não encontrada
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          O endereço <span className="font-medium text-foreground">{pathname}</span>{" "}
          não existe ou foi movido.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Voltar para o início</Link>
        </Button>
      </Card>
    </div>
  );
}
