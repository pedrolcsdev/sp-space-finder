"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_TIME_SLOTS,
  getDayAvailabilityStatus,
  getTodayISODate,
  getUnavailableTimes,
  isTimeAvailableForDate,
  parseISODate,
  toISODate,
} from "@/lib/availability/spaceAvailability";
import { cn } from "@/lib/utils";

interface SpaceAvailabilitySidebarProps {
  spaceId: string;
  reservePath: string;
}

const formatDateLabel = (value: string) => {
  const parsedDate = parseISODate(value);

  if (!parsedDate) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
};

export function SpaceAvailabilitySidebar({
  spaceId,
  reservePath,
}: SpaceAvailabilitySidebarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const todayISODate = useMemo(() => getTodayISODate(), []);
  const selectedDay = selectedDate ? parseISODate(selectedDate) ?? undefined : undefined;

  const unavailableTimes = useMemo(
    () => (selectedDate ? getUnavailableTimes(spaceId, selectedDate) : []),
    [spaceId, selectedDate],
  );

  const reserveHref = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedDate) {
      params.set("date", selectedDate);
    }

    if (
      selectedDate &&
      selectedTime &&
      isTimeAvailableForDate(spaceId, selectedDate, selectedTime)
    ) {
      params.set("time", selectedTime);
    }

    const query = params.toString();

    return query ? `${reservePath}?${query}` : reservePath;
  }, [reservePath, selectedDate, selectedTime, spaceId]);

  return (
    <Card className="min-w-0 space-y-5 p-4 sm:p-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Disponibilidade
        </p>
        <p className="text-sm text-muted-foreground">
          Selecione a data e o horário para chegar na reserva com tudo preenchido.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-secondary/50 p-2 sm:p-3">
        <Calendar
          mode="single"
          selected={selectedDay}
          onSelect={(day) => {
            const nextDate = day ? toISODate(day) : null;
            setSelectedDate(nextDate);

            if (!nextDate) {
              setSelectedTime("");
              return;
            }

            if (selectedTime && !isTimeAvailableForDate(spaceId, nextDate, selectedTime)) {
              setSelectedTime("");
            }
          }}
          disabled={(day) => toISODate(day) < todayISODate}
          modifiers={{
            available: (day) => {
              const dayISODate = toISODate(day);
              return (
                dayISODate >= todayISODate &&
                getDayAvailabilityStatus(spaceId, dayISODate) === "available"
              );
            },
            partial: (day) => {
              const dayISODate = toISODate(day);
              return (
                dayISODate >= todayISODate &&
                getDayAvailabilityStatus(spaceId, dayISODate) === "partial"
              );
            },
            unavailable: (day) => {
              const dayISODate = toISODate(day);
              return (
                dayISODate >= todayISODate &&
                getDayAvailabilityStatus(spaceId, dayISODate) === "unavailable"
              );
            },
          }}
          modifiersClassNames={{
            available:
              "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-emerald-500",
            partial:
              "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-amber-500",
            unavailable:
              "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-rose-500",
          }}
          className="mx-auto w-fit p-0"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Disponível
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Parcial
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Indisponível
        </span>
      </div>

      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock3 className="h-4 w-4 text-primary" />
          Horários
        </p>

        {!selectedDate && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            Escolha uma data no calendário para visualizar os horários disponíveis.
          </p>
        )}

        {selectedDate && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Data selecionada:{" "}
              <span className="font-medium text-foreground">
                {formatDateLabel(selectedDate)}
              </span>
            </p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEFAULT_TIME_SLOTS.map((timeSlot) => {
                const blocked = unavailableTimes.includes(timeSlot);
                const selected = selectedTime === timeSlot;

                return (
                  <button
                    key={timeSlot}
                    type="button"
                    disabled={blocked}
                    onClick={() => setSelectedTime(timeSlot)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      blocked && "cursor-not-allowed border-border/70 bg-muted/50 text-muted-foreground",
                      !blocked && "border-border bg-background hover:border-primary/40 hover:text-foreground",
                      selected && "border-primary bg-primary-soft text-foreground",
                    )}
                  >
                    <span className="block font-medium">{timeSlot}</span>
                    <span className="block text-xs">
                      {blocked ? "Indisponível" : selected ? "Selecionado" : "Livre"}
                    </span>
                  </button>
                );
              })}
            </div>

            {unavailableTimes.length >= DEFAULT_TIME_SLOTS.length && (
              <p className="text-sm text-rose-600">
                Esse dia está totalmente ocupado. Tente outra data.
              </p>
            )}
          </div>
        )}
      </div>

      <Button asChild size="lg" className="w-full gap-2">
        <Link href={reserveHref}>
          <CalendarDays className="h-4 w-4" />
          Reservar
        </Link>
      </Button>
    </Card>
  );
}
