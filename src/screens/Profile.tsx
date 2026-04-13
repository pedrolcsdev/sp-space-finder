"use client";

import { Mail, MapPin, Phone, UserCircle2 } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function ProfileScreen() {
  const { session, isReady } = useAuth();

  if (!isReady || !session) {
    return null;
  }

  const profileItems = [
    { label: "Nome completo", value: session.user.fullName, icon: UserCircle2 },
    { label: "E-mail", value: session.user.email, icon: Mail },
    { label: "Telefone", value: session.user.phone, icon: Phone },
    { label: "Endereço", value: session.user.address, icon: MapPin },
  ];

  return (
    <AccountShell
      title="Meu perfil"
      description="Consulte seus dados de cadastro e mantenha suas informações sempre acessíveis."
      currentPath="/perfil"
    >
      <Card className="grid gap-4 p-6 sm:grid-cols-2 sm:p-7">
        {profileItems.map((item) => (
          <div
            key={item.label}
            className="rounded-[22px] border border-border/70 bg-secondary/35 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </AccountShell>
  );
}
