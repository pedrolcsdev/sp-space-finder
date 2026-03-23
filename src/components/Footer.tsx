import Link from "next/link";
import { Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="page-container py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-semibold text-foreground">
                SP Spaces
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Grupo São Paulo - conectando profissionais aos
              melhores espaços corporativos da cidade.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Navegação
            </h4>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/"
                className="text-sm text-secondary-foreground transition-colors hover:text-primary"
              >
                Início
              </Link>
              <Link
                href="/encontrar"
                className="text-sm text-secondary-foreground transition-colors hover:text-primary"
              >
                Encontrar Espaço
              </Link>
              <Link
                href="/login"
                className="text-sm text-secondary-foreground transition-colors hover:text-primary"
              >
                Entrar
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Institucional
            </h4>
            <p className="text-sm leading-relaxed text-secondary-foreground">
              O Grupo São Paulo atua no mercado de espaços
              corporativos com foco em qualidade e inovação.
            </p>
            <Button variant="secondary" size="sm" asChild>
              <a href="https://example.com" target="_blank" rel="noopener noreferrer">
                Visite nosso site <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Grupo São Paulo. Todos os
            direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
