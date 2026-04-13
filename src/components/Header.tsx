"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Encontrar Espaço", path: "/encontrar" },
];

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
  const initials = user?.fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

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
    <header className="sticky top-0 z-50 border-b border-white/50 bg-background/80 backdrop-blur-xl">
      <div className="page-container grid h-[82px] grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-[1.03]">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
            SP <span className="text-primary">Spaces</span>
          </span>
        </Link>

        <nav
          aria-label="Categorias de espaços"
          className="hidden items-center justify-center gap-1 xl:flex"
        >
          {categoryItems.map((category) => {
            const active = isCategoryActive(category.id);

            return (
              <Link
                key={category.id}
                href={`/encontrar?category=${encodeURIComponent(category.id)}`}
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm"
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
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  isActive(item.path)
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {isReady && isAuthenticated && user ? (
            <div className="ml-3 flex items-center gap-2">
              {isAdmin && (
                <Button asChild variant="secondary" className="rounded-full px-4">
                  <Link href="/admin">
                    Painel administrativo
                    <LayoutDashboard className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-full border border-border/70 bg-white/90 px-3 py-2 shadow-sm transition-all hover:bg-white">
                    <Avatar className="h-10 w-10 border border-primary/15">
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="max-w-[140px] truncate text-sm font-semibold text-foreground">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isAdmin ? "Administrador" : "Cliente"}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2">
                  <DropdownMenuLabel className="px-3 py-2">
                    <p className="font-semibold text-foreground">{user.fullName}</p>
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!isAdmin && (
                    <>
                      <DropdownMenuItem
                        className="cursor-pointer rounded-xl px-3 py-2"
                        onClick={() => router.push("/perfil")}
                      >
                        <UserCircle2 className="mr-2 h-4 w-4" />
                        Meu perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer rounded-xl px-3 py-2"
                        onClick={() => router.push("/minhas-reservas")}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Minhas reservas
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer rounded-xl px-3 py-2"
                        onClick={() => router.push("/favoritos")}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Espaços favoritos
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl px-3 py-2"
                      onClick={() => router.push("/admin")}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Painel administrativo
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl px-3 py-2 text-destructive focus:text-destructive"
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button asChild className="ml-3 rounded-full px-5">
              <Link href="/login">
                Entrar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-2xl border border-border/70 bg-white/80 p-2.5 shadow-sm transition-colors hover:bg-white md:hidden"
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
            className="overflow-hidden border-t border-white/60 bg-background/95 md:hidden"
          >
            <div className="page-container flex flex-col gap-2 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/75 hover:bg-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-1 border-t border-border/80 pt-3">
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Categorias
                </p>
                <div className="flex flex-col gap-1">
                  {categoryItems.map((category) => (
                    <Link
                      key={category.id}
                      href={`/encontrar?category=${encodeURIComponent(category.id)}`}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-2xl px-4 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                        isCategoryActive(category.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/75 hover:bg-white"
                      }`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
              {isReady && isAuthenticated && user ? (
                <div className="space-y-2 rounded-2xl border border-border/80 bg-white/75 p-3">
                  <div className="px-1">
                    <p className="text-sm font-semibold text-foreground">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {isAdmin ? "Administrador" : "Cliente"}
                    </p>
                  </div>
                  {!isAdmin && (
                    <>
                      <Button asChild variant="secondary" className="w-full justify-start">
                        <Link href="/perfil" onClick={() => setMobileOpen(false)}>
                          <UserCircle2 className="h-4 w-4" />
                          Meu perfil
                        </Link>
                      </Button>
                      <Button asChild variant="secondary" className="w-full justify-start">
                        <Link href="/minhas-reservas" onClick={() => setMobileOpen(false)}>
                          <LayoutDashboard className="h-4 w-4" />
                          Minhas reservas
                        </Link>
                      </Button>
                      <Button asChild variant="secondary" className="w-full justify-start">
                        <Link href="/favoritos" onClick={() => setMobileOpen(false)}>
                          <Heart className="h-4 w-4" />
                          Espaços favoritos
                        </Link>
                      </Button>
                    </>
                  )}
                  {isAdmin && (
                    <Button asChild variant="secondary" className="w-full justify-start">
                      <Link href="/admin" onClick={() => setMobileOpen(false)}>
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
                      setMobileOpen(false);
                      router.push("/");
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                </div>
              ) : (
                <Button asChild className="mt-1 w-full">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    Entrar
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
