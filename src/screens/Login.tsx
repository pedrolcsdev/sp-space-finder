"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Mail, Lock, Chrome } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
            Entre na sua conta para continuar
          </p>
        </div>

        <Card size="lg" className="space-y-5">
          <Button variant="secondary" className="w-full gap-3">
            <Chrome className="w-4 h-4" />
            Entrar com Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

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

          <Button className="w-full">Entrar</Button>

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link
              href="/onboarding"
              className="text-primary font-medium hover:text-primary-hover"
            >
              Cadastre-se
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
