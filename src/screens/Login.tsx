"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

interface LoginScreenProps {
  redirectTo?: string;
}

const QUICK_LOGIN_OPTIONS = [
  {
    label: "Entrar como administrador",
    helper: "Acesso rápido ao painel administrativo",
    email: "admin@gmail.com",
    password: "admin123",
    icon: ShieldCheck,
  },
  {
    label: "Entrar como cliente",
    helper: "Acesso rápido ao fluxo de reserva",
    email: "cliente@gmail.com",
    password: "cliente123",
    icon: UserCircle2,
  },
] as const;

const normalizeRedirectPath = (value?: string) => {
  if (!value) {
    return "/encontrar";
  }

  let parsed = value;

  try {
    parsed = decodeURIComponent(value);
  } catch {
    parsed = value;
  }

  if (!parsed.startsWith("/") || parsed.startsWith("//")) {
    return "/encontrar";
  }

  if (parsed === "/login") {
    return "/encontrar";
  }

  return parsed;
};

export default function LoginScreen({ redirectTo }: LoginScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const safeRedirectTo = normalizeRedirectPath(redirectTo);
  const hasRedirectedRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    title: string;
    description: string;
  } | null>(null);
  const { login, isAuthenticated, session, isReady } = useAuth();

  useEffect(() => {
    if (
      hasRedirectedRef.current ||
      pathname !== "/login" ||
      !isReady ||
      !isAuthenticated ||
      !session
    ) {
      return;
    }

    const redirectTarget =
      session.user.role === "admin" ? "/admin" : safeRedirectTo;

    if (redirectTarget === pathname) {
      return;
    }

    hasRedirectedRef.current = true;
    router.replace(redirectTarget);
  }, [isAuthenticated, isReady, pathname, router, safeRedirectTo, session]);

  const submitLogin = (nextEmail: string, nextPassword: string) => {
    if (!nextEmail.trim() || !nextPassword.trim()) {
      setFeedback({
        type: "error",
        title: "Preencha e-mail e senha",
        description: "Use uma das credenciais disponíveis para acessar sua conta.",
      });
      return;
    }

    setIsSubmitting(true);
    const result = login(nextEmail, nextPassword);

    if (!result.ok || !result.session) {
      setFeedback({
        type: "error",
        title: "Não foi possível entrar",
        description: result.error ?? "Confira as credenciais e tente novamente.",
      });
      setIsSubmitting(false);
      return;
    }

    const redirectTarget =
      result.session.user.role === "admin" ? "/admin" : safeRedirectTo;

    setFeedback({
      type: "success",
      title: "Login realizado com sucesso",
      description:
        result.session.user.role === "admin"
          ? "Redirecionando para o painel administrativo."
          : "Redirecionando para sua experiência no SP Spaces.",
    });

    toast({
      title: "Sessão iniciada",
      description:
        result.session.user.role === "admin"
          ? "Painel administrativo liberado."
          : "Seu perfil e suas reservas já estão disponíveis.",
    });

    window.setTimeout(() => {
      hasRedirectedRef.current = true;
      router.replace(redirectTarget);
    }, 600);
  };

  const handleLogin = () => {
    submitLogin(email, password);
  };

  const handleQuickLogin = (nextEmail: string, nextPassword: string) => {
    setEmail(nextEmail);
    setPassword(nextPassword);
    submitLogin(nextEmail, nextPassword);
  };

  return (
    <div className="gradient-subtle flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 sm:space-y-8"
      >
        <div className="text-center">
          <Link href="/" className="mb-6 inline-flex">
            <Image
              src="/logo-sp-header.png"
              alt="Grupo São Paulo"
              width={320}
              height={96}
              priority
              className="h-auto w-[220px] sm:w-[260px]"
            />
          </Link>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com o perfil de cliente ou administrador para continuar.
          </p>
        </div>

        <Card size="lg" className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-3 rounded-2xl border border-border/70 bg-secondary/35 p-4">
            <p className="text-sm font-medium text-foreground">Acesso rápido</p>
            {QUICK_LOGIN_OPTIONS.map((option) => {
              const Icon = option.icon;

              return (
                <Button
                  key={option.email}
                  type="button"
                  variant="secondary"
                  className="h-auto justify-start rounded-xl border border-border/70 bg-white/90 p-3 text-left"
                  disabled={isSubmitting}
                  onClick={() => handleQuickLogin(option.email, option.password)}
                >
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {option.label}
                    </p>
                    <p className="break-words text-xs text-muted-foreground">
                      {option.helper}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>

          {feedback && (
            <Alert
              variant={feedback.type === "error" ? "destructive" : "default"}
              className={
                feedback.type === "success"
                  ? "border-success/25 bg-success/10 [&>svg]:text-success"
                  : undefined
              }
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{feedback.title}</AlertTitle>
              <AlertDescription>{feedback.description}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={handleLogin} disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link
              href="/onboarding"
              className="text-primary font-medium hover:text-primary-hover"
            >
              Conheça o onboarding
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
