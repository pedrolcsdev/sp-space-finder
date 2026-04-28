"use client";

import { CalendarClock, ClipboardList, MessageCircle } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMockStore } from "@/hooks/use-mock-store";
import { getUserReservations } from "@/lib/mock/mockStore";
import { ReservationStatusBadge } from "@/components/ReservationStatusBadge";

export default function MyReservationsScreen() {
  const { session, isReady } = useAuth();
  const store = useMockStore();

  if (!isReady || !session) {
    return null;
  }

  const reservations = getUserReservations(session.user.id, store);

  return (
    <AccountShell
      title="Minhas reservas"
      description="Acompanhe suas reservas, novas solicitações pendentes e o status atualizado pela equipe."
      currentPath="/minhas-reservas"
    >
      <div className="grid gap-4">
        {reservations.map((reservation) => (
          <Card key={reservation.id} className="min-w-0 space-y-4 p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Código da reserva
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-normal text-foreground">
                  {reservation.code}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{reservation.spaceName}</p>
              </div>
              <ReservationStatusBadge status={reservation.status} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-[22px] border border-border/70 bg-secondary/35 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Agenda
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{reservation.scheduleLabel}</p>
              </div>
              <div className="rounded-[22px] border border-border/70 bg-secondary/35 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Dados do espaço
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{reservation.spaceLocation}</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  R$ {reservation.spacePricePerHour}/hora
                </p>
              </div>
              <div className="rounded-[22px] border border-border/70 bg-secondary/35 p-4">
                <p className="text-sm font-semibold text-foreground">Contato</p>
                <p className="mt-2 text-sm text-muted-foreground">{reservation.email}</p>
                <p className="mt-1 text-sm text-muted-foreground">{reservation.phone}</p>
              </div>
            </div>

            {reservation.notes && (
              <div className="rounded-[22px] border border-border/70 bg-white/90 p-4">
                <p className="text-sm font-semibold text-foreground">Observações</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{reservation.notes}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="secondary" className="w-full sm:w-auto">
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </AccountShell>
  );
}
