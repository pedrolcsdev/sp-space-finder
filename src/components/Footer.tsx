import { Building2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="gradient-hero text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">SP Spaces</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-xs">
              Grupo São Paulo Participações — conectando profissionais aos melhores espaços corporativos da cidade.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-primary-foreground/50">
              Navegação
            </h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Início</Link>
              <Link to="/encontrar" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Encontrar Espaço</Link>
              <Link to="/login" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Entrar</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-primary-foreground/50">
              Institucional
            </h4>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              O Grupo São Paulo Participações atua no mercado de espaços corporativos com foco em qualidade e inovação.
            </p>
            <a
              href="https://example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-primary-foreground/20 text-sm font-medium transition-colors"
            >
              Visite nosso site <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center">
          <p className="text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} Grupo São Paulo Participações. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
