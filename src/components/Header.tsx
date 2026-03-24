"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Encontrar Espaço", path: "/encontrar" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border/90 bg-card/90 backdrop-blur-xl">
      <div className="page-container flex h-[72px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary transition-transform group-hover:scale-105">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">
            SP <span className="text-primary">Spaces</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
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
                  className={`rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-primary-soft text-primary"
                      : "hover:bg-secondary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
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
