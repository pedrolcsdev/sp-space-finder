import { useState } from "react";
import { Building2, Mail, Lock, Chrome } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              SP <span className="text-primary">Spaces</span>
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
          <p className="text-sm text-muted-foreground mt-1">Entre na sua conta para continuar</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 card-shadow p-8 space-y-5">
          <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium">
            <Chrome className="w-4 h-4" />
            Entrar com Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-hover transition-colors">
            Entrar
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/onboarding" className="text-primary font-medium hover:text-primary-hover">
              Cadastre-se
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
