"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
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
import { Calendar } from "@/components/ui/calendar";
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
import {
  DEFAULT_TIME_SLOTS,
  getDayAvailabilityStatus,
  getTimeRangeSlots,
  getTimeSlotIndex,
  getTodayISODate,
  isTimeAvailableForDate,
  isTimeRangeAvailableForDate,
  parseISODate,
  sanitizeReservationPreselection,
  toISODate,
} from "@/lib/availability/spaceAvailability";
import { useAuth } from "@/hooks/use-auth";
import { useResolvedSpace } from "@/hooks/use-mock-store";
import {
  createMockReservation,
  type MockReservation,
} from "@/lib/mock/mockStore";
import { ReservationStatusBadge } from "@/components/ReservationStatusBadge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AvailabilityStatus = "idle" | "available" | "unavailable";
type BookingMode =
  | "single-time"
  | "single-range"
  | "date-range-shared-time"
  | "custom-days";

type TimeRange = {
  startTime: string;
  endTime: string;
};

type ReservationEntry = {
  date: string;
  startTime: string;
  endTime: string;
};

type ReservationDraft = {
  entries: ReservationEntry[];
  scheduleLabel: string;
  detailLines: string[];
};

type ReservationForm = {
  people: number;
  notes: string;
};

const WHATSAPP_PHONE = "5511999999999";
const MODE_OPTIONS: Array<{
  value: BookingMode;
  label: string;
  description: string;
}> = [
  {
    value: "single-time",
    label: "1 dia e 1 horário",
    description: "Escolha uma data e um único horário.",
  },
  {
    value: "single-range",
    label: "1 dia e faixa",
    description: "Escolha uma data com início e fim no mesmo dia.",
  },
  {
    value: "date-range-shared-time",
    label: "Vários dias iguais",
    description: "Aplique o mesmo horário para todo o período.",
  },
  {
    value: "custom-days",
    label: "Dias personalizados",
    description: "Selecione dias soltos e ajuste a faixa de cada um.",
  },
];

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

const formatEntryLabel = (entry: ReservationEntry) => {
  if (entry.startTime === entry.endTime) {
    return `${formatDate(entry.date)} às ${entry.startTime}`;
  }

  return `${formatDate(entry.date)} das ${entry.startTime} às ${entry.endTime}`;
};

const sortDates = (dates: string[]) =>
  [...dates].sort((left, right) => left.localeCompare(right));

const getDatesInRange = (fromDate: string, toDate: string) => {
  const start = parseISODate(fromDate);
  const end = parseISODate(toDate);

  if (!start || !end || fromDate > toDate) {
    return [];
  }

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const getInitialPerDateRanges = (dates: string[], initialTime: string) =>
  Object.fromEntries(
    dates.map((date) => [
      date,
      {
        startTime: initialTime,
        endTime: initialTime,
      },
    ]),
  ) as Record<string, TimeRange>;

const buildScheduleLabel = (entries: ReservationEntry[]) => {
  if (entries.length === 0) {
    return "";
  }

  if (entries.length === 1) {
    return formatEntryLabel(entries[0]);
  }

  const [firstEntry] = entries;
  const lastEntry = entries[entries.length - 1];
  const identicalRange = entries.every(
    (entry) =>
      entry.startTime === firstEntry.startTime && entry.endTime === firstEntry.endTime,
  );

  if (identicalRange) {
    if (firstEntry.startTime === firstEntry.endTime) {
      return `${formatDate(firstEntry.date)} até ${formatDate(lastEntry.date)}, sempre às ${firstEntry.startTime}`;
    }

    return `${formatDate(firstEntry.date)} até ${formatDate(lastEntry.date)}, sempre das ${firstEntry.startTime} às ${firstEntry.endTime}`;
  }

  const preview = entries.slice(0, 3).map(formatEntryLabel).join(" | ");
  const remaining = entries.length - 3;

  if (remaining > 0) {
    return `${preview} | +${remaining} ${remaining === 1 ? "data" : "datas"}`;
  }

  return preview;
};

const getReservationDraft = (
  bookingMode: BookingMode,
  singleDate: string,
  singleTime: string,
  singleRange: TimeRange,
  periodRange: DateRange | undefined,
  sharedRange: TimeRange,
  customDates: string[],
  perDateRanges: Record<string, TimeRange>,
) => {
  let entries: ReservationEntry[] = [];

  if (bookingMode === "single-time") {
    if (!singleDate || !singleTime) {
      return { error: "Selecione a data e o horário para continuar." };
    }

    entries = [
      {
        date: singleDate,
        startTime: singleTime,
        endTime: singleTime,
      },
    ];
  }

  if (bookingMode === "single-range") {
    if (!singleDate || !singleRange.startTime || !singleRange.endTime) {
      return { error: "Selecione a data, o horário inicial e o horário final." };
    }

    if (getTimeRangeSlots(singleRange.startTime, singleRange.endTime).length === 0) {
      return { error: "O horário final precisa ser igual ou depois do horário inicial." };
    }

    entries = [
      {
        date: singleDate,
        startTime: singleRange.startTime,
        endTime: singleRange.endTime,
      },
    ];
  }

  if (bookingMode === "date-range-shared-time") {
    if (!periodRange?.from || !periodRange?.to) {
      return { error: "Selecione a data inicial e a data final do período." };
    }

    if (!sharedRange.startTime || !sharedRange.endTime) {
      return { error: "Defina o horário que será repetido em todo o período." };
    }

    if (getTimeRangeSlots(sharedRange.startTime, sharedRange.endTime).length === 0) {
      return { error: "O horário final precisa ser igual ou depois do horário inicial." };
    }

    entries = getDatesInRange(toISODate(periodRange.from), toISODate(periodRange.to)).map(
      (date) => ({
        date,
        startTime: sharedRange.startTime,
        endTime: sharedRange.endTime,
      }),
    );
  }

  if (bookingMode === "custom-days") {
    if (customDates.length === 0) {
      return { error: "Selecione pelo menos um dia no calendário." };
    }

    entries = sortDates(customDates).map((date) => ({
      date,
      startTime: perDateRanges[date]?.startTime ?? "",
      endTime: perDateRanges[date]?.endTime ?? "",
    }));

    if (entries.some((entry) => !entry.startTime || !entry.endTime)) {
      return { error: "Defina a faixa de horário de cada dia selecionado." };
    }

    if (
      entries.some(
        (entry) => getTimeRangeSlots(entry.startTime, entry.endTime).length === 0,
      )
    ) {
      return { error: "Revise as faixas de horário. O fim não pode ser antes do início." };
    }
  }

  const sortedEntries = [...entries].sort((left, right) => left.date.localeCompare(right.date));

  return {
    draft: {
      entries: sortedEntries,
      detailLines: sortedEntries.map(formatEntryLabel),
      scheduleLabel: buildScheduleLabel(sortedEntries),
    },
  };
};

const buildWhatsAppMessage = (
  space: Space,
  form: ReservationForm,
  reservationDraft: ReservationDraft,
  reservation?: MockReservation | null,
) => {
  const lines = [
    "Olá! Gostaria de reservar este espaço:",
    "",
    reservation ? `Código da reserva: ${reservation.code}` : null,
    `Espaço: ${space.name}`,
    `Local: ${space.location}`,
    `Agenda: ${reservationDraft.scheduleLabel}`,
    `Pessoas: ${form.people}`,
    `Referência de valor: R$ ${space.pricePerHour}/hora`,
    "",
    "Datas e horários:",
    ...reservationDraft.detailLines.map((line) => `- ${line}`),
  ].filter(Boolean) as string[];

  if (form.notes.trim()) {
    lines.push("", `Observações: ${form.notes.trim()}`);
  }

  lines.push("", "Aguardo a confirmação da disponibilidade. Obrigado!");

  return lines.join("\n");
};

interface ReserveSpaceScreenProps {
  space: Space;
}

export default function ReserveSpaceScreen({ space }: ReserveSpaceScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedSpace = useResolvedSpace(space);
  const { session } = useAuth();
  const todayISODate = useMemo(() => getTodayISODate(), []);
  const preselectedDate = searchParams.get("date");
  const preselectedTime = searchParams.get("time");
  const [bookingMode, setBookingMode] = useState<BookingMode>("single-time");
  const [singleDate, setSingleDate] = useState(todayISODate);
  const [singleTime, setSingleTime] = useState("");
  const [singleRange, setSingleRange] = useState<TimeRange>({
    startTime: "",
    endTime: "",
  });
  const [periodRange, setPeriodRange] = useState<DateRange | undefined>(undefined);
  const [sharedRange, setSharedRange] = useState<TimeRange>({
    startTime: "",
    endTime: "",
  });
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [perDateRanges, setPerDateRanges] = useState<Record<string, TimeRange>>({});
  const [form, setForm] = useState<ReservationForm>({
    people: Math.min(2, resolvedSpace.capacity),
    notes: "",
  });
  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus>("idle");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [checkedDraft, setCheckedDraft] = useState<ReservationDraft | null>(null);
  const [createdReservation, setCreatedReservation] = useState<MockReservation | null>(null);

  useEffect(() => {
    const normalizedSelection = sanitizeReservationPreselection(
      resolvedSpace.id,
      {
        date: preselectedDate,
        time: preselectedTime,
      },
      { todayISODate },
    );

    setSingleDate(normalizedSelection.date);
    setSingleTime(normalizedSelection.time);
    setSingleRange({
      startTime: normalizedSelection.time,
      endTime: normalizedSelection.time,
    });
    setPeriodRange({
      from: parseISODate(normalizedSelection.date) ?? undefined,
      to: parseISODate(normalizedSelection.date) ?? undefined,
    });
    setSharedRange({
      startTime: normalizedSelection.time,
      endTime: normalizedSelection.time,
    });
    setCustomDates(normalizedSelection.date ? [normalizedSelection.date] : []);
    setPerDateRanges(getInitialPerDateRanges([normalizedSelection.date], normalizedSelection.time));
    setAvailabilityStatus("idle");
    setAvailabilityMessage("");
    setCheckedDraft(null);
    setCreatedReservation(null);
  }, [preselectedDate, preselectedTime, resolvedSpace.id, todayISODate]);

  const handleDraftChange = () => {
    setAvailabilityStatus("idle");
    setAvailabilityMessage("");
    setCheckedDraft(null);
    setCreatedReservation(null);
  };

  const ensureClientSession = () => {
    if (!session || session.user.role !== "user") {
      router.push(`/login?redirect=${encodeURIComponent(`/reservar/${resolvedSpace.id}`)}`);
      return null;
    }

    return session.user;
  };

  const openWhatsApp = (targetUrl: string) => {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const currentDraftResult = useMemo(
    () =>
      getReservationDraft(
        bookingMode,
        singleDate,
        singleTime,
        singleRange,
        periodRange,
        sharedRange,
        customDates,
        perDateRanges,
      ),
    [
      bookingMode,
      singleDate,
      singleTime,
      singleRange,
      periodRange,
      sharedRange,
      customDates,
      perDateRanges,
    ],
  );

  const selectedCustomDateObjects = useMemo(
    () =>
      sortDates(customDates)
        .map((date) => parseISODate(date))
        .filter(Boolean) as Date[],
    [customDates],
  );

  const whatsappLink = useMemo(() => {
    if (!checkedDraft) {
      return "";
    }

    const message = buildWhatsAppMessage(
      resolvedSpace,
      form,
      checkedDraft,
      createdReservation,
    );

    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  }, [checkedDraft, createdReservation, resolvedSpace, form]);

  const handleCheckAvailability = () => {
    if (form.people <= 0) {
      setAvailabilityStatus("unavailable");
      setAvailabilityMessage("Informe a quantidade de pessoas para continuar.");
      setCheckedDraft(null);
      return;
    }

    if (currentDraftResult.error) {
      setAvailabilityStatus("unavailable");
      setAvailabilityMessage(currentDraftResult.error);
      setCheckedDraft(null);
      return;
    }

    const reservationDraft = currentDraftResult.draft;

    if (!reservationDraft) {
      setAvailabilityStatus("unavailable");
      setAvailabilityMessage("Não foi possível montar a solicitação.");
      setCheckedDraft(null);
      return;
    }

    const unavailableEntries = reservationDraft.entries.filter((entry) => {
      if (entry.startTime === entry.endTime) {
        return !isTimeAvailableForDate(
          resolvedSpace.id,
          entry.date,
          entry.startTime,
        );
      }

      return !isTimeRangeAvailableForDate(
        resolvedSpace.id,
        entry.date,
        entry.startTime,
        entry.endTime,
      );
    });

    if (unavailableEntries.length > 0) {
      setAvailabilityStatus("unavailable");
      setAvailabilityMessage(
        `Encontramos conflito em ${unavailableEntries
          .slice(0, 3)
          .map(formatEntryLabel)
          .join(", ")}.`,
      );
      setCheckedDraft(null);
      return;
    }

    setAvailabilityStatus("available");
    setAvailabilityMessage("");
    setCheckedDraft(reservationDraft);
  };

  const handleCreateReservation = () => {
    const user = ensureClientSession();

    if (!user || !checkedDraft) {
      return;
    }

    const reservation = createMockReservation({
      user,
      space: resolvedSpace,
      kind: "single",
      scheduleLabel: checkedDraft.scheduleLabel,
      notes: form.notes,
    });

    setCreatedReservation(reservation);
    toast({
      title: "Reserva pendente criada",
      description: `${reservation.code} já está visível em Minhas reservas e na área administrativa.`,
    });
  };

  const customAvailabilitySummary = useMemo(() => {
    if (customDates.length === 0) {
      return "Selecione os dias e ajuste os horários de cada um.";
    }

    const unavailableDays = sortDates(customDates).filter(
      (date) => getDayAvailabilityStatus(resolvedSpace.id, date) === "unavailable",
    );

    if (unavailableDays.length === 0) {
      return "Todos os dias selecionados têm pelo menos algum horário disponível.";
    }

    return `Dias totalmente bloqueados: ${unavailableDays
      .map(formatDate)
      .join(", ")}.`;
  }, [customDates, resolvedSpace.id]);

  const renderEndTimeOptions = (startTime: string) => {
    if (!startTime) {
      return [...DEFAULT_TIME_SLOTS];
    }

    const slots = [...DEFAULT_TIME_SLOTS] as string[];
    const startIndex = slots.indexOf(startTime);
    return slots.slice(startIndex);
  };

  return (
    <div className="page-container section-space">
      <Link
        href={`/espacos/${resolvedSpace.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar aos detalhes
      </Link>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0 space-y-6 p-5 sm:p-7">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fluxo de reserva
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-normal text-foreground">
              Reservar espaço
            </h1>
            <p className="text-sm text-muted-foreground">
              Monte uma única solicitação com um dia, um período ou várias datas,
              tudo no mesmo contrato.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Espaço selecionado
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">{resolvedSpace.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{resolvedSpace.location}</p>
            <p className="mt-2 text-sm text-foreground">
              Capacidade até <span className="font-semibold">{resolvedSpace.capacity} pessoas</span>
              {" "}
              · R$ {resolvedSpace.pricePerHour}/hora
            </p>
          </div>

          <div className="space-y-3">
            <Label>Como você quer montar a reserva</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {MODE_OPTIONS.map((option) => {
                const selected = bookingMode === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setBookingMode(option.value);
                      handleDraftChange();
                    }}
                    className={cn(
                      "rounded-lg border p-4 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">{option.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            {(bookingMode === "single-time" || bookingMode === "single-range") && (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                <div className="overflow-x-auto rounded-lg border border-border bg-secondary/50 p-2 sm:p-3">
                  <Calendar
                    mode="single"
                    selected={parseISODate(singleDate) ?? undefined}
                    onSelect={(day) => {
                      if (!day) {
                        return;
                      }

                      setSingleDate(toISODate(day));
                      handleDraftChange();
                    }}
                    disabled={(day) => toISODate(day) < todayISODate}
                    modifiers={{
                      available: (day) =>
                        toISODate(day) >= todayISODate &&
                        getDayAvailabilityStatus(resolvedSpace.id, toISODate(day)) ===
                          "available",
                      unavailable: (day) =>
                        toISODate(day) >= todayISODate &&
                        getDayAvailabilityStatus(resolvedSpace.id, toISODate(day)) ===
                          "unavailable",
                    }}
                    modifiersClassNames={{
                      available:
                        "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-emerald-500",
                      unavailable:
                        "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-rose-500",
                    }}
                    className="mx-auto w-fit p-0"
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Data selecionada: <span className="font-medium text-foreground">{formatDate(singleDate)}</span>
                  </p>

                  {bookingMode === "single-time" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="single-time">Horário</Label>
                      <Select
                        value={singleTime}
                        onValueChange={(value) => {
                          setSingleTime(value);
                          if (!singleRange.startTime) {
                            setSingleRange({ startTime: value, endTime: value });
                          }
                          handleDraftChange();
                        }}
                      >
                        <SelectTrigger id="single-time">
                          <SelectValue placeholder="Selecione um horário" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFAULT_TIME_SLOTS.map((timeOption) => {
                            const blocked = !isTimeAvailableForDate(
                              resolvedSpace.id,
                              singleDate,
                              timeOption,
                            );

                            return (
                              <SelectItem
                                key={timeOption}
                                value={timeOption}
                                disabled={blocked}
                              >
                                {blocked ? `${timeOption} · indisponível` : timeOption}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {bookingMode === "single-range" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="single-range-start">Início</Label>
                        <Select
                          value={singleRange.startTime}
                          onValueChange={(value) => {
                            setSingleRange((current) => ({
                              startTime: value,
                              endTime:
                                current.endTime &&
                                getTimeSlotIndex(current.endTime) >=
                                  getTimeSlotIndex(value)
                                  ? current.endTime
                                  : value,
                            }));
                            handleDraftChange();
                          }}
                        >
                          <SelectTrigger id="single-range-start">
                            <SelectValue placeholder="Horário inicial" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_TIME_SLOTS.map((timeOption) => (
                              <SelectItem key={timeOption} value={timeOption}>
                                {timeOption}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="single-range-end">Fim</Label>
                        <Select
                          value={singleRange.endTime}
                          onValueChange={(value) => {
                            setSingleRange((current) => ({
                              ...current,
                              endTime: value,
                            }));
                            handleDraftChange();
                          }}
                        >
                          <SelectTrigger id="single-range-end">
                            <SelectValue placeholder="Horário final" />
                          </SelectTrigger>
                          <SelectContent>
                            {renderEndTimeOptions(singleRange.startTime).map((timeOption) => (
                              <SelectItem key={timeOption} value={timeOption}>
                                {timeOption}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {bookingMode === "date-range-shared-time" && (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                <div className="overflow-x-auto rounded-lg border border-border bg-secondary/50 p-2 sm:p-3">
                  <Calendar
                    mode="range"
                    selected={periodRange}
                    onSelect={(range) => {
                      setPeriodRange(range);
                      handleDraftChange();
                    }}
                    disabled={(day) => toISODate(day) < todayISODate}
                    modifiers={{
                      available: (day) =>
                        toISODate(day) >= todayISODate &&
                        getDayAvailabilityStatus(resolvedSpace.id, toISODate(day)) ===
                          "available",
                      unavailable: (day) =>
                        toISODate(day) >= todayISODate &&
                        getDayAvailabilityStatus(resolvedSpace.id, toISODate(day)) ===
                          "unavailable",
                    }}
                    modifiersClassNames={{
                      available:
                        "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-emerald-500",
                      unavailable:
                        "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-rose-500",
                    }}
                    className="mx-auto w-fit p-0"
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {periodRange?.from && periodRange?.to
                      ? `Período: ${formatDate(toISODate(periodRange.from))} até ${formatDate(toISODate(periodRange.to))}`
                      : "Selecione a data inicial e final no calendário."}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="shared-range-start">Início</Label>
                      <Select
                        value={sharedRange.startTime}
                        onValueChange={(value) => {
                          setSharedRange((current) => ({
                            startTime: value,
                            endTime:
                              current.endTime &&
                              getTimeSlotIndex(current.endTime) >=
                                getTimeSlotIndex(value)
                                ? current.endTime
                                : value,
                          }));
                          handleDraftChange();
                        }}
                      >
                        <SelectTrigger id="shared-range-start">
                          <SelectValue placeholder="Horário inicial" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFAULT_TIME_SLOTS.map((timeOption) => (
                            <SelectItem key={timeOption} value={timeOption}>
                              {timeOption}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="shared-range-end">Fim</Label>
                      <Select
                        value={sharedRange.endTime}
                        onValueChange={(value) => {
                          setSharedRange((current) => ({
                            ...current,
                            endTime: value,
                          }));
                          handleDraftChange();
                        }}
                      >
                        <SelectTrigger id="shared-range-end">
                          <SelectValue placeholder="Horário final" />
                        </SelectTrigger>
                        <SelectContent>
                          {renderEndTimeOptions(sharedRange.startTime).map((timeOption) => (
                            <SelectItem key={timeOption} value={timeOption}>
                              {timeOption}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {bookingMode === "custom-days" && (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                <div className="overflow-x-auto rounded-lg border border-border bg-secondary/50 p-2 sm:p-3">
                  <Calendar
                    mode="multiple"
                    selected={selectedCustomDateObjects}
                    onSelect={(days) => {
                      const nextDates = sortDates(
                        (days ?? []).map((day) => toISODate(day)).filter((date) => date >= todayISODate),
                      );

                      setCustomDates(nextDates);
                      setPerDateRanges((current) => {
                        const nextEntries = nextDates.map((date) => [
                          date,
                          current[date] ?? {
                            startTime: "",
                            endTime: "",
                          },
                        ]);

                        return Object.fromEntries(nextEntries);
                      });
                      handleDraftChange();
                    }}
                    disabled={(day) => toISODate(day) < todayISODate}
                    modifiers={{
                      available: (day) =>
                        toISODate(day) >= todayISODate &&
                        getDayAvailabilityStatus(resolvedSpace.id, toISODate(day)) ===
                          "available",
                      unavailable: (day) =>
                        toISODate(day) >= todayISODate &&
                        getDayAvailabilityStatus(resolvedSpace.id, toISODate(day)) ===
                          "unavailable",
                    }}
                    modifiersClassNames={{
                      available:
                        "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-emerald-500",
                      unavailable:
                        "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-rose-500",
                    }}
                    className="mx-auto w-fit p-0"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
                    <p className="text-sm font-medium text-foreground">
                      Horário rápido para todos os dias
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="bulk-range-start">Início</Label>
                        <Select
                          value={sharedRange.startTime}
                          onValueChange={(value) => {
                            setSharedRange((current) => ({
                              startTime: value,
                              endTime:
                                current.endTime &&
                                    getTimeSlotIndex(current.endTime) >=
                                      getTimeSlotIndex(value)
                                  ? current.endTime
                                  : value,
                            }));
                          }}
                        >
                          <SelectTrigger id="bulk-range-start">
                            <SelectValue placeholder="Horário inicial" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_TIME_SLOTS.map((timeOption) => (
                              <SelectItem key={timeOption} value={timeOption}>
                                {timeOption}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bulk-range-end">Fim</Label>
                        <Select
                          value={sharedRange.endTime}
                          onValueChange={(value) => {
                            setSharedRange((current) => ({
                              ...current,
                              endTime: value,
                            }));
                          }}
                        >
                          <SelectTrigger id="bulk-range-end">
                            <SelectValue placeholder="Horário final" />
                          </SelectTrigger>
                          <SelectContent>
                            {renderEndTimeOptions(sharedRange.startTime).map((timeOption) => (
                              <SelectItem key={timeOption} value={timeOption}>
                                {timeOption}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (
                          !sharedRange.startTime ||
                          !sharedRange.endTime ||
                          customDates.length === 0
                        ) {
                          return;
                        }

                        setPerDateRanges((current) =>
                          Object.fromEntries(
                            customDates.map((date) => [
                              date,
                              {
                                startTime: sharedRange.startTime,
                                endTime: sharedRange.endTime,
                              },
                            ]),
                          ),
                        );
                        handleDraftChange();
                      }}
                      disabled={
                        customDates.length === 0 ||
                        !sharedRange.startTime ||
                        !sharedRange.endTime
                      }
                    >
                      Aplicar essa faixa em todos os dias
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground">{customAvailabilitySummary}</p>

                  <div className="space-y-3">
                    {sortDates(customDates).map((date) => (
                      <div
                        key={date}
                        className="rounded-lg border border-border bg-background p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(date)}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCustomDates((current) =>
                                current.filter((currentDate) => currentDate !== date),
                              );
                              setPerDateRanges((current) => {
                                const next = { ...current };
                                delete next[date];
                                return next;
                              });
                              handleDraftChange();
                            }}
                          >
                            Remover
                          </Button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>Início</Label>
                            <Select
                              value={perDateRanges[date]?.startTime ?? ""}
                              onValueChange={(value) => {
                                setPerDateRanges((current) => {
                                  const currentRange = current[date] ?? {
                                    startTime: "",
                                    endTime: "",
                                  };
                                  const nextEndTime =
                                    currentRange.endTime &&
                                    getTimeSlotIndex(currentRange.endTime) >=
                                      getTimeSlotIndex(value)
                                      ? currentRange.endTime
                                      : value;

                                  return {
                                    ...current,
                                    [date]: {
                                      startTime: value,
                                      endTime: nextEndTime,
                                    },
                                  };
                                });
                                handleDraftChange();
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Horário inicial" />
                              </SelectTrigger>
                              <SelectContent>
                                {DEFAULT_TIME_SLOTS.map((timeOption) => (
                                  <SelectItem key={timeOption} value={timeOption}>
                                    {timeOption}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label>Fim</Label>
                            <Select
                              value={perDateRanges[date]?.endTime ?? ""}
                              onValueChange={(value) => {
                                setPerDateRanges((current) => ({
                                  ...current,
                                  [date]: {
                                    startTime: current[date]?.startTime ?? "",
                                    endTime: value,
                                  },
                                }));
                                handleDraftChange();
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Horário final" />
                              </SelectTrigger>
                              <SelectContent>
                                {renderEndTimeOptions(perDateRanges[date]?.startTime ?? "").map(
                                  (timeOption) => (
                                    <SelectItem key={timeOption} value={timeOption}>
                                      {timeOption}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}

                    {customDates.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                        Escolha os dias no calendário para montar a sua agenda.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="reservation-people">Quantidade de pessoas</Label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reservation-people"
                    type="number"
                    min={1}
                    max={resolvedSpace.capacity}
                    value={form.people}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      const nextPeople = Number.isNaN(parsed) ? 1 : parsed;
                      const clampedPeople = Math.max(
                        1,
                        Math.min(resolvedSpace.capacity, nextPeople),
                      );
                      setForm((current) => ({ ...current, people: clampedPeople }));
                      handleDraftChange();
                    }}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Máximo permitido para este espaço: {resolvedSpace.capacity} pessoas.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reservation-notes">Observações (opcional)</Label>
                <Textarea
                  id="reservation-notes"
                  placeholder="Ex: preciso de mesa de apoio e extensão elétrica."
                  value={form.notes}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, notes: event.target.value }));
                    handleDraftChange();
                  }}
                  className="min-h-[96px]"
                />
              </div>
            </div>

            {availabilityStatus === "unavailable" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Não foi possível confirmar a agenda</AlertTitle>
                <AlertDescription>{availabilityMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleCheckAvailability}
              >
                Verificar disponibilidade
              </Button>
              <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                <Link href={`/espacos/${resolvedSpace.id}`}>Voltar aos detalhes</Link>
              </Button>
            </div>
          </div>

          {availabilityStatus === "available" && checkedDraft && !createdReservation && (
            <div className="space-y-5">
              <Alert className="border-success/30 bg-success/10 text-foreground [&>svg]:text-success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Disponibilidade confirmada</AlertTitle>
                <AlertDescription>
                  Sua agenda está livre e pronta para gerar uma única reserva pendente.
                </AlertDescription>
              </Alert>

              <Card className="space-y-3 border border-border bg-secondary/40 p-4">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Resumo da solicitação
                </h2>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Espaço:</span> {resolvedSpace.name}
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Agenda:</span> {checkedDraft.scheduleLabel}
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Pessoas:</span> {form.people}
                </p>
                {form.notes.trim() && (
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Observações:</span> {form.notes.trim()}
                  </p>
                )}

                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-foreground">Datas incluídas</p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {checkedDraft.detailLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </Card>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={handleDraftChange}
                >
                  Editar dados
                </Button>
                <Button
                  size="lg"
                  className="w-full gap-2 sm:w-auto"
                  onClick={handleCreateReservation}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Gerar reserva pendente
                </Button>
              </div>
              {(!session || session.user.role !== "user") && (
                <p className="text-sm text-muted-foreground">
                  Antes de gerar a reserva, faça login com o perfil cliente.
                </p>
              )}
            </div>
          )}

          {availabilityStatus === "available" && checkedDraft && createdReservation && (
            <div className="space-y-5">
              <Alert className="border-success/30 bg-success/10 text-foreground [&>svg]:text-success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Reserva criada com status pendente</AlertTitle>
                <AlertDescription>
                  Sua solicitação foi registrada e agora segue para confirmação final.
                </AlertDescription>
              </Alert>

              <Card className="space-y-3 border border-border bg-secondary/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      {createdReservation.code}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Reserva gerada para {createdReservation.fullName}
                    </p>
                  </div>
                  <ReservationStatusBadge status={createdReservation.status} />
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Espaço:</span> {createdReservation.spaceName}
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Agenda:</span> {createdReservation.scheduleLabel}
                </p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Contato:</span> {createdReservation.email}
                </p>
              </Card>

              <Alert className="border-primary/20 bg-primary-soft/70 text-foreground">
                <MessageCircle className="h-4 w-4 text-primary" />
                <AlertTitle>Próximo passo: finalizar no WhatsApp</AlertTitle>
                <AlertDescription>
                  O pagamento e a validação final seguem no WhatsApp. Depois disso, a equipe pode atualizar o status para reservado.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="w-full gap-2 sm:w-auto"
                  onClick={() => openWhatsApp(whatsappLink)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Continuar no WhatsApp
                </Button>
                <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                  <Link href="/minhas-reservas">Ver minhas reservas</Link>
                </Button>
              </div>
            </div>
          )}
        </Card>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Como funciona
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1. Escolha o formato de agenda que mais combina com a sua locação.</li>
              <li>2. Monte todas as datas e horários dentro de uma única solicitação.</li>
              <li>3. Confirme a disponibilidade e siga para o WhatsApp.</li>
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
