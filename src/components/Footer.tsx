import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="mt-14 border-t border-border bg-card">
      <div className="page-container py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_0.8fr_0.9fr] md:items-start">
          <div className="space-y-3">
            <Link href="/" className="inline-block">
              <div className="relative h-12 w-[160px]">
                <Image
                  src="/logo-sp-header.png"
                  alt="Grupo São Paulo"
                  fill
                  sizes="160px"
                  className="object-contain object-left"
                />
              </div>
            </Link>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              O Grupo São Paulo oferece soluções imobiliárias em São Luís (MA), Imperatriz (MA), Belém (PA), Distrito Federal e Fortaleza(CE).
            </p>
          </div>

          <nav className="space-y-3" aria-label="Navegação do rodapé">
            <h4 className="font-display text-xs font-semibold uppercase tracking-normal text-primary">
              Navegação
            </h4>
            <div className="flex flex-col gap-2">
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
          </nav>

          <div className="space-y-3">
            <Button variant="secondary" size="sm" className="rounded-xl" asChild>
              <a href="https://saopauloparticipacoes.com.br" target="_blank" rel="noopener noreferrer">
                Visite nosso site <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-left sm:text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Grupo São Paulo. Todos os
            direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
