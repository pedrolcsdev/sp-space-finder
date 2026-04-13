"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
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

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setFeedback({
        type: "error",
        title: "Preencha e-mail e senha",
        description: "Use uma das credenciais disponíveis para acessar sua conta.",
      });
      return;
    }

    setIsSubmitting(true);
    const result = login(email, password);

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

  return (
    <div className="gradient-subtle flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              SP <span className="text-primary">Spaces</span>
            </span>
          </Link>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com o perfil de cliente ou administrador para continuar.
          </p>
        </div>

        <Card size="lg" className="space-y-5">
          <div className="grid gap-3 rounded-2xl border border-border/70 bg-secondary/35 p-4">
            <div className="rounded-xl border border-border/70 bg-white/90 p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Administrador</p>
                  <p className="text-xs text-muted-foreground">
                    admin@gmail.com / admin123
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-white/90 p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <UserCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Cliente</p>
                  <p className="text-xs text-muted-foreground">
                    cliente@gmail.com / cliente123
                  </p>
                </div>
              </div>
            </div>
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
