"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Building2, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { spaceCatalog } from "@/lib/data/spaceCatalog";
import type { Category } from "@/lib/data/contracts";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Encontrar Espaço", path: "/encontrar" },
];

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState<Category[]>([]);
  const currentCategory = searchParams.get("category");

  const isActive = (path: string) => pathname === path;
  const isCategoryActive = (categoryId: string) =>
    pathname === "/encontrar" && currentCategory === categoryId;

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

  return (
    <header className="sticky top-0 z-50 border-b border-border/90 bg-card/90 backdrop-blur-xl">
      <div className="page-container grid h-[72px] grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary transition-transform group-hover:scale-105">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">
            SP <span className="text-primary">Spaces</span>
          </span>
        </Link>

        <nav
          aria-label="Categorias de espaços"
          className="hidden items-center justify-center gap-1 lg:flex"
        >
          {categoryItems.map((category) => {
            const active = isCategoryActive(category.id);

            return (
              <Link
                key={category.id}
                href={`/encontrar?category=${encodeURIComponent(category.id)}`}
                className={`rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {category.name}
              </Link>
            );
          })}
        </nav>

        <nav className="hidden items-center justify-end gap-2 md:flex">
          {navItems.map((item) => {
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  isActive(item.path)
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Button asChild className="ml-3">
            <Link href="/login">Entrar</Link>
          </Button>
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 transition-colors hover:bg-secondary md:hidden"
          aria-label="Abrir menu"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border bg-card md:hidden"
          >
            <div className="page-container flex flex-col gap-2 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    isActive(item.path)
                      ? "bg-primary-soft text-primary"
                      : "hover:bg-secondary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-1 border-t border-border/80 pt-2">
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Categorias
                </p>
                <div className="flex flex-col gap-1">
                  {categoryItems.map((category) => (
                    <Link
                      key={category.id}
                      href={`/encontrar?category=${encodeURIComponent(category.id)}`}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-md px-4 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                        isCategoryActive(category.id)
                          ? "bg-primary-soft text-primary"
                          : "hover:bg-secondary"
                      }`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Button asChild className="mt-1 w-full">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Entrar
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
