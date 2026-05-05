import Link from "next/link";
import { Heart, LayoutDashboard, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const accountItems = [
  { href: "/perfil", label: "Meu perfil", icon: UserCircle2 },
  { href: "/minhas-reservas", label: "Minhas reservas", icon: LayoutDashboard },
  { href: "/favoritos", label: "Espaços favoritos", icon: Heart },
];

interface AccountShellProps {
  title: string;
  description: string;
  currentPath: string;
  children: React.ReactNode;
}

export function AccountShell({
  title,
  description,
  currentPath,
  children,
}: AccountShellProps) {
  return (
    <div className="section-space">
      <div className="page-container grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-8">
        <aside className="xl:sticky xl:top-24 xl:h-fit">
          <div className="glass-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Área do cliente
            </p>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:block xl:space-y-2 xl:overflow-visible xl:pb-0">
              {accountItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all xl:shrink",
                    currentPath === item.href
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/50 text-foreground hover:bg-secondary",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <div className="glass-card p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Minha conta
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>

          {children}
        </section>
      </div>
    </div>
  );
}
