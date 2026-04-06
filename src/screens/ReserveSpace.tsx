"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MessageCircle,
  Users,
} from "lucide-react";
import type { Space } from "@/lib/data/contracts";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_AUTH_COOKIE } from "@/lib/auth/mockAuth";

type AvailabilityStatus = "idle" | "available" | "unavailable";
type ReservationType = "single" | "package";
type PackageRecurrence = "weekly" | "monthly" | "specific-dates";

type ReservationForm = {
  date: string;
  time: string;
  people: number;
  notes: string;
};

type PackageForm = {
  recurrence: PackageRecurrence;
  occurrences: number;
  notes: string;
};

const TIME_OPTIONS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

const WHATSAPP_PHONE = "5511999999999";
const PACKAGE_RECURRENCE_OPTIONS: Array<{
  value: PackageRecurrence;
  label: string;
}> = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "specific-dates", label: "Datas específicas" },
];

const packageRecurrenceLabel: Record<PackageRecurrence, string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  "specific-dates": "Datas específicas",
};

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getDefaultDate = () => {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
};

const getUnavailableTimes = (spaceId: string, date: string): string[] => {
  if (!date) {
    return [];
  }

  const day = Number(date.slice(-2));
  const numericSpaceId = Number.parseInt(spaceId, 10) || 1;
  const ruleSeed = (day + numericSpaceId) % 4;

  if (ruleSeed === 0) {
    return ["10:00", "14:00", "17:00"];
  }

  if (ruleSeed === 1) {
    return ["09:00", "13:00"];
  }

  if (ruleSeed === 2) {
    return ["11:00", "15:00", "18:00"];
  }

  return ["08:00", "16:00"];
};

const buildWhatsAppMessage = (space: Space, form: ReservationForm) => {
  const lines = [
    "Olá! Gostaria de reservar este espaço:",
    "",
    `Espaço: ${space.name}`,
    `Local: ${space.location}`,
    `Data: ${formatDate(form.date)}`,
    `Horário: ${form.time}`,
    `Pessoas: ${form.people}`,
    `Referência de valor: R$ ${space.pricePerHour}/hora`,
  ];

  if (form.notes.trim()) {
    lines.push(`Observações: ${form.notes.trim()}`);
  }

  lines.push("", "Aguardo a confirmação da disponibilidade. Obrigado!");

  return lines.join("\n");
};

const buildPackageWhatsAppMessage = (space: Space, packageForm: PackageForm) => {
  const lines = [
    "Olá! Gostaria de solicitar um pacote de reservas:",
    "",
    `Espaço: ${space.name}`,
    `Local: ${space.location}`,
    `Recorrência: ${packageRecurrenceLabel[packageForm.recurrence]}`,
    `Quantidade de ocorrências: ${packageForm.occurrences}`,
    `Referência de valor: R$ ${space.pricePerHour}/hora`,
  ];

  if (packageForm.notes.trim()) {
    lines.push(`Observações: ${packageForm.notes.trim()}`);
  }

  lines.push(
    "",
    "Entendo que o pacote será analisado e confirmado via WhatsApp. Obrigado!",
  );

  return lines.join("\n");
};

interface ReserveSpaceScreenProps {
  space: Space;
}

export default function ReserveSpaceScreen({ space }: ReserveSpaceScreenProps) {
  const [reservationType, setReservationType] = useState<ReservationType>("single");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [form, setForm] = useState<ReservationForm>({
    date: getDefaultDate(),
    time: "",
    people: Math.min(2, space.capacity),
    notes: "",
  });
  const [packageForm, setPackageForm] = useState<PackageForm>({
    recurrence: "weekly",
    occurrences: 4,
    notes: "",
  });
  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus>("idle");

  const unavailableTimes = useMemo(
    () => getUnavailableTimes(space.id, form.date),
    [space.id, form.date],
  );

  const isTimeUnavailable = form.time ? unavailableTimes.includes(form.time) : false;
  const canCheckAvailability = Boolean(form.date && form.time && form.people > 0);
  const isPackageReady = Boolean(packageForm.recurrence && packageForm.occurrences > 0);

  const whatsappLink = useMemo(() => {
    const message = buildWhatsAppMessage(space, form);

    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  }, [space, form]);
  const packageWhatsappLink = useMemo(() => {
    const message = buildPackageWhatsAppMessage(space, packageForm);

    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  }, [space, packageForm]);

  const handleCheckAvailability = () => {
    if (!canCheckAvailability) {
      return;
    }

    if (isTimeUnavailable) {
      setAvailabilityStatus("unavailable");
      return;
    }

    setAvailabilityStatus("available");
  };

  const handleEditReservation = () => {
    setAvailabilityStatus("idle");
  };

  useEffect(() => {
    setIsLoggedIn(document.cookie.includes(`${MOCK_AUTH_COOKIE}=1`));
  }, []);

  const ensureLoginBeforeCheckout = (targetUrl: string) => {
    const logged = document.cookie.includes(`${MOCK_AUTH_COOKIE}=1`);
    setIsLoggedIn(logged);

    if (!logged) {
      window.location.assign(`/login?redirect=${encodeURIComponent(`/reservar/${space.id}`)}`);
      return;
    }

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="page-container section-space">
      <Link
        href={`/espacos/${space.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar aos detalhes
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="space-y-6 p-6 sm:p-7">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fluxo de reserva
            </p>
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Reservar espaço
            </h1>
            <p className="text-sm text-muted-foreground">
              Preencha os dados abaixo para verificar disponibilidade e continuar no
              WhatsApp.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Espaço selecionado
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">{space.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{space.location}</p>
            <p className="mt-2 text-sm text-foreground">
              Capacidade até <span className="font-semibold">{space.capacity} pessoas</span>
              {" "}
              · R$ {space.pricePerHour}/hora
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tipo de reserva</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant={reservationType === "single" ? "default" : "secondary"}
                onClick={() => setReservationType("single")}
              >
                Avulsa
              </Button>
              <Button
                type="button"
                variant={reservationType === "package" ? "default" : "secondary"}
                onClick={() => setReservationType("package")}
              >
                Pacote
              </Button>
            </div>
          </div>

          {reservationType === "single" && availabilityStatus !== "available" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-date">Data</Label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reservation-date"
                      type="date"
                      min={getDefaultDate()}
                      value={form.date}
                      onChange={(event) => {
                        const nextDate = event.target.value;
                        setForm((current) => ({ ...current, date: nextDate }));
                        setAvailabilityStatus("idle");
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reservation-time">Horário</Label>
                  <Select
                    value={form.time}
                    onValueChange={(time) => {
                      setForm((current) => ({ ...current, time }));
                      setAvailabilityStatus("idle");
                    }}
                  >
                    <SelectTrigger id="reservation-time" className="gap-2">
                      <Clock3 className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((timeOption) => {
                        const blocked = unavailableTimes.includes(timeOption);

                        return (
                          <SelectItem
                            key={timeOption}
                            value={timeOption}
                            disabled={blocked}
                            className={blocked ? "text-muted-foreground/60" : undefined}
                          >
                            {blocked ? `${timeOption} · indisponível` : timeOption}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-people">Quantidade de pessoas</Label>
                  <div className="relative">
                    <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reservation-people"
                      type="number"
                      min={1}
                      max={space.capacity}
                      value={form.people}
                      onChange={(event) => {
                        const parsed = Number(event.target.value);
                        const nextPeople = Number.isNaN(parsed) ? 1 : parsed;
                        const clampedPeople = Math.max(1, Math.min(space.capacity, nextPeople));
                        setForm((current) => ({ ...current, people: clampedPeople }));
                        setAvailabilityStatus("idle");
                      }}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Máximo permitido para este espaço: {space.capacity} pessoas.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reservation-notes">Observações (opcional)</Label>
                  <Textarea
                    id="reservation-notes"
                    placeholder="Ex: preciso de mesa de apoio e extensão elétrica."
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    className="min-h-[96px]"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                Horários simulados como indisponíveis para {formatDate(form.date)}:{" "}
                <span className="font-medium text-foreground">
                  {unavailableTimes.join(", ")}
                </span>
              </div>

              {availabilityStatus === "unavailable" && (
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Horário indisponível</AlertTitle>
                    <AlertDescription>
                      Este horário já está reservado no protótipo. Tente outro horário
                      ou outra data para continuar.
                    </AlertDescription>
                  </Alert>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setForm((current) => ({ ...current, time: "" }));
                      setAvailabilityStatus("idle");
                    }}
                  >
                    Tentar outra data/horário
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={handleCheckAvailability} disabled={!canCheckAvailability}>
                  Verificar disponibilidade
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href={`/espacos/${space.id}`}>Voltar aos detalhes</Link>
                </Button>
              </div>
            </div>
          )}

          {reservationType === "single" && availabilityStatus === "available" && (
            <div className="space-y-5">
              <Alert className="border-success/30 bg-success/10 text-foreground [&>svg]:text-success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Disponibilidade confirmada</AlertTitle>
                <AlertDescription>
                  Perfeito! Seu horário está livre e pronto para envio no WhatsApp.
                </AlertDescription>
              </Alert>

              <Card className="space-y-3 border border-border bg-secondary/40 p-4">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Resumo da solicitação
                </h2>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Espaço:</span> {space.name}
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Data:</span> {formatDate(form.date)}
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Horário:</span> {form.time}
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Pessoas:</span> {form.people}
                </p>
                {form.notes.trim() && (
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Observações:</span> {form.notes.trim()}
                  </p>
                )}
              </Card>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="secondary" size="lg" onClick={handleEditReservation}>
                  Editar dados
                </Button>
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => ensureLoginBeforeCheckout(whatsappLink)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Confirmar e continuar no WhatsApp
                </Button>
              </div>
              {!isLoggedIn && (
                <p className="text-sm text-muted-foreground">
                  Antes de ir para o WhatsApp, faça login para confirmar a solicitação.
                </p>
              )}
            </div>
          )}

          {reservationType === "package" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="package-recurrence">Tipo de recorrência</Label>
                  <Select
                    value={packageForm.recurrence}
                    onValueChange={(value) =>
                      setPackageForm((current) => ({
                        ...current,
                        recurrence: value as PackageRecurrence,
                      }))
                    }
                  >
                    <SelectTrigger id="package-recurrence">
                      <SelectValue placeholder="Selecione a recorrência" />
                    </SelectTrigger>
                    <SelectContent>
                      {PACKAGE_RECURRENCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="package-occurrences">
                    Duração do pacote / ocorrências
                  </Label>
                  <Input
                    id="package-occurrences"
                    type="number"
                    min={1}
                    value={packageForm.occurrences}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      const nextValue = Number.isNaN(parsed) ? 1 : parsed;
                      setPackageForm((current) => ({
                        ...current,
                        occurrences: Math.max(1, nextValue),
                      }));
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="package-notes">Observações (opcional)</Label>
                <Textarea
                  id="package-notes"
                  placeholder="Ex: pacote para treinos da equipe às terças e quintas."
                  value={packageForm.notes}
                  onChange={(event) =>
                    setPackageForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  className="min-h-[96px]"
                />
              </div>

              <Card className="space-y-3 border border-border bg-secondary/40 p-4">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Resumo do pacote
                </h2>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Espaço:</span> {space.name}
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Recorrência:</span>{" "}
                  {packageRecurrenceLabel[packageForm.recurrence]}
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Ocorrências:</span> {packageForm.occurrences}
                </p>
                {packageForm.notes.trim() && (
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Observações:</span>{" "}
                    {packageForm.notes.trim()}
                  </p>
                )}
              </Card>

              <Alert className="border-primary/20 bg-primary-soft/70 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertTitle>Pacote sujeito a análise</AlertTitle>
                <AlertDescription>
                  Sua solicitação de pacote será analisada e confirmada pela equipe no
                  WhatsApp.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  disabled={!isPackageReady}
                  className="gap-2"
                  onClick={() => {
                    ensureLoginBeforeCheckout(packageWhatsappLink);
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Solicitar pacote via WhatsApp
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href={`/espacos/${space.id}`}>Voltar aos detalhes</Link>
                </Button>
              </div>
              {!isLoggedIn && (
                <p className="text-sm text-muted-foreground">
                  Antes de solicitar o pacote no WhatsApp, faça login no protótipo.
                </p>
              )}
            </div>
          )}
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Como funciona
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1. Escolha entre reserva avulsa ou reserva em pacote.</li>
              <li>2. Preencha os campos do tipo escolhido.</li>
              <li>3. Confirme e finalize a solicitação no WhatsApp.</li>
            </ul>
          </Card>

          <Card className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Canal de confirmação
            </p>
            <p className="text-sm text-foreground">WhatsApp comercial do espaço</p>
            <p className="text-sm text-muted-foreground">+55 11 99999-9999</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
