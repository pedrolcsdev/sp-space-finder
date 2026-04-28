"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCircle2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { spaceCatalog } from "@/lib/data/spaceCatalog";
import type { Category } from "@/lib/data/contracts";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Encontrar espaços", path: "/encontrar" },
];

const categoryLabelById: Partial<Record<Category["id"], string>> = {
  auditorium: "Auditórios",
  meeting: "Salas de reuniões",
  dental: "Consultórios",
};

const categoryOrder: Partial<Record<Category["id"], number>> = {
  auditorium: 0,
  meeting: 1,
  dental: 2,
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState<Category[]>([]);
  const currentCategory = searchParams.get("category");
  const { session, isReady, isAuthenticated, isAdmin, logout } = useAuth();
  const user = session?.user;

  const isActive = (path: string) => pathname === path;
  const isCategoryActive = (categoryId: string) =>
    pathname === "/encontrar" && currentCategory === categoryId;
  const orderedCategoryItems = [...categoryItems].sort(
    (left, right) =>
      (categoryOrder[left.id] ?? 99) - (categoryOrder[right.id] ?? 99),
  );

  useEffect(() => {
    let cancelled = false;

    spaceCatalog.listCategories().then((items) => {
      if (!cancelled) {
        setCategoryItems(items);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[80] border-b border-white/50 bg-background/90 backdrop-blur-xl">
      <div className="page-container flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link href="/" className="group block">
          <div className="relative h-11 w-[140px] sm:h-[54px] sm:w-[188px]">
            <Image
              src="/logo-sp-header.png"
              alt="Grupo São Paulo"
              fill
              priority
              sizes="(min-width: 640px) 188px, 140px"
              className="object-contain object-left transition-transform group-hover:scale-[1.02]"
            />
          </div>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-end gap-1 lg:flex xl:gap-2"
          aria-label="Navegação principal"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`whitespace-nowrap rounded-full px-2.5 py-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 xl:px-4 xl:text-sm ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                  : "text-foreground/72 hover:bg-white hover:text-foreground hover:shadow-sm"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {orderedCategoryItems.map((category) => (
            <Link
              key={category.id}
              href={`/encontrar?category=${encodeURIComponent(category.id)}`}
              className={`whitespace-nowrap rounded-full px-2.5 py-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 xl:px-4 xl:text-sm ${
                isCategoryActive(category.id)
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                  : "text-foreground/72 hover:bg-white hover:text-foreground hover:shadow-sm"
              }`}
            >
              {categoryLabelById[category.id] ?? category.name}
            </Link>
          ))}
          {isReady && isAuthenticated && user ? (
            <Button
              variant="secondary"
              className="ml-1 rounded-full px-4 xl:ml-2 xl:px-5"
              onClick={() => router.push(isAdmin ? "/admin" : "/perfil")}
            >
              {isAdmin ? "Painel" : "Perfil"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button asChild className="ml-1 rounded-full px-4 xl:ml-2 xl:px-5">
              <Link href="/login">
                Entrar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </nav>

        <button
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-white/90 text-primary shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 lg:hidden"
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="absolute inset-0 bg-slate-950/58 backdrop-blur-[2px]"
              aria-label="Fechar menu"
              onClick={closeMenu}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu principal"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.26, ease: "easeOut" }}
              className="absolute right-0 top-0 flex h-dvh w-[min(88vw,390px)] flex-col overflow-y-auto border-l border-white/70 bg-background px-5 py-5 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <Link href="/" className="block" onClick={closeMenu}>
                  <div className="relative h-10 w-[132px]">
                    <Image
                      src="/logo-sp-header.png"
                      alt="Grupo São Paulo"
                      fill
                      sizes="132px"
                      className="object-contain object-left"
                    />
                  </div>
                </Link>
                <button
                  onClick={closeMenu}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-white text-foreground shadow-sm transition-colors hover:bg-secondary"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-2" aria-label="Menu principal">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={closeMenu}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/80 text-foreground hover:bg-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="my-3 border-t border-border/80 pt-4">
                  <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Categorias
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {orderedCategoryItems.map((category) => (
                      <Link
                        key={category.id}
                        href={`/encontrar?category=${encodeURIComponent(category.id)}`}
                        onClick={closeMenu}
                        className={`rounded-2xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                          isCategoryActive(category.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/80 text-foreground hover:bg-white"
                        }`}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {isReady && isAuthenticated && user ? (
                  <div className="mt-auto space-y-3 rounded-2xl border border-border/80 bg-white/80 p-4">
                    <div>
                      <p className="break-words text-sm font-semibold text-foreground">
                        {user.fullName}
                      </p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {isAdmin ? "Administrador" : user.email}
                      </p>
                    </div>
                    {!isAdmin && (
                      <div className="space-y-2">
                        <Button asChild variant="secondary" className="w-full justify-start">
                          <Link href="/perfil" onClick={closeMenu}>
                            <UserCircle2 className="h-4 w-4" />
                            Meu perfil
                          </Link>
                        </Button>
                        <Button asChild variant="secondary" className="w-full justify-start">
                          <Link href="/minhas-reservas" onClick={closeMenu}>
                            <LayoutDashboard className="h-4 w-4" />
                            Minhas reservas
                          </Link>
                        </Button>
                        <Button asChild variant="secondary" className="w-full justify-start">
                          <Link href="/favoritos" onClick={closeMenu}>
                            <Heart className="h-4 w-4" />
                            Espaços favoritos
                          </Link>
                        </Button>
                      </div>
                    )}
                    {isAdmin && (
                      <Button asChild variant="secondary" className="w-full justify-start">
                        <Link href="/admin" onClick={closeMenu}>
                          <LayoutDashboard className="h-4 w-4" />
                          Painel administrativo
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={() => {
                        logout();
                        closeMenu();
                        router.push("/");
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="mt-auto w-full rounded-xl">
                    <Link href="/login" onClick={closeMenu}>
                      Entrar
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      </header>
      <div className="h-16 sm:h-20" aria-hidden="true" />
    </>
  );
}
