"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DEFAULT_TIME_SLOTS,
  getDayAvailabilityStatus,
  getTimeRangeSlots,
  getTimeSlotIndex,
  getTodayISODate,
  getUnavailableTimes,
  isTimeRangeAvailableForDate,
  parseISODate,
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
type DateSelectionMode = "specific-days" | "continuous-period";

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
const DEFAULT_RANGE: TimeRange = {
  startTime: "",
  endTime: "",
};
const MODE_OPTIONS: Array<{
  value: DateSelectionMode;
  label: string;
  description: string;
}> = [
  {
    value: "specific-days",
    label: "Dias específicos",
    description: "Selecione datas soltas, sem formar intervalo automático.",
  },
  {
    value: "continuous-period",
    label: "Período contínuo",
    description: "Escolha início e fim para incluir todos os dias do período.",
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

const formatEntryLabel = (entry: ReservationEntry) =>
  `${formatDate(entry.date)} das ${entry.startTime} às ${entry.endTime}`;

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
    return `${formatDate(firstEntry.date)} até ${formatDate(lastEntry.date)}, sempre das ${firstEntry.startTime} às ${firstEntry.endTime}`;
  }

  const preview = entries.slice(0, 3).map(formatEntryLabel).join(" | ");
  const remaining = entries.length - 3;

  if (remaining > 0) {
    return `${preview} | +${remaining} ${remaining === 1 ? "data" : "datas"}`;
  }

  return preview;
};

const buildReservationDraft = (
  selectedDates: string[],
  sharedRange: TimeRange,
  editIndividually: boolean,
  perDateRanges: Record<string, TimeRange>,
) => {
  if (selectedDates.length === 0) {
    return { error: "Selecione pelo menos um dia no calendário." };
  }

  const entries = sortDates(selectedDates).map((date) => {
    const range = editIndividually ? perDateRanges[date] : sharedRange;

    return {
      date,
      startTime: range?.startTime ?? "",
      endTime: range?.endTime ?? "",
    };
  });

  if (entries.some((entry) => !entry.startTime || !entry.endTime)) {
    return { error: "Defina o horário de início e fim para continuar." };
  }

  if (
    entries.some(
      (entry) => getTimeRangeSlots(entry.startTime, entry.endTime).length === 0,
    )
  ) {
    return { error: "Revise os horários. O fim não pode ser antes do início." };
  }

  return {
    draft: {
      entries,
      detailLines: entries.map(formatEntryLabel),
      scheduleLabel: buildScheduleLabel(entries),
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

const getAvailableTimesForDate = (spaceId: string, date: string) => {
  const unavailableTimes = new Set(getUnavailableTimes(spaceId, date));

  return DEFAULT_TIME_SLOTS.filter((time) => !unavailableTimes.has(time));
};

const isRangeSelectableFromTimes = (
  availableTimes: string[],
  startTime: string,
  endTime: string,
) => {
  const timeSet = new Set(availableTimes);
  const rangeSlots = getTimeRangeSlots(startTime, endTime);

  return rangeSlots.length > 0 && rangeSlots.every((slot) => timeSet.has(slot));
};

const isTimeInsideRange = (time: string, range: TimeRange) => {
  if (!range.startTime) {
    return false;
  }

  if (!range.endTime) {
    return time === range.startTime;
  }

  const timeIndex = getTimeSlotIndex(time);
  const startIndex = getTimeSlotIndex(range.startTime);
  const endIndex = getTimeSlotIndex(range.endTime);

  return timeIndex >= startIndex && timeIndex <= endIndex;
};

interface ReserveSpaceScreenProps {
  space: Space;
}

export default function ReserveSpaceScreen({ space }: ReserveSpaceScreenProps) {
  const router = useRouter();
  const resolvedSpace = useResolvedSpace(space);
  const { session } = useAuth();
  const todayISODate = useMemo(() => getTodayISODate(), []);
  const [selectionMode, setSelectionMode] =
    useState<DateSelectionMode>("specific-days");
  const [specificDates, setSpecificDates] = useState<string[]>([]);
  const [periodRange, setPeriodRange] = useState<DateRange | undefined>(undefined);
  const [sharedRange, setSharedRange] = useState<TimeRange>(DEFAULT_RANGE);
  const [editIndividually, setEditIndividually] = useState(false);
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

  const selectedDates = useMemo(() => {
    if (selectionMode === "specific-days") {
      return sortDates(specificDates);
    }

    if (!periodRange?.from || !periodRange?.to) {
      return [];
    }

    return getDatesInRange(toISODate(periodRange.from), toISODate(periodRange.to));
  }, [periodRange, selectionMode, specificDates]);

  const selectedDateObjects = useMemo(
    () =>
      selectedDates
        .map((date) => parseISODate(date))
        .filter(Boolean) as Date[],
    [selectedDates],
  );

  const selectedDatesSummary = useMemo(() => {
    if (selectedDates.length === 0) {
      return "Selecione os dias no calendário.";
    }

    if (selectionMode === "continuous-period" && selectedDates.length > 1) {
      return `${formatDate(selectedDates[0])} até ${formatDate(selectedDates[selectedDates.length - 1])} (${selectedDates.length} dias)`;
    }

    const preview = selectedDates.slice(0, 4).map(formatDate).join(", ");
    const remaining = selectedDates.length - 4;

    return remaining > 0 ? `${preview} e mais ${remaining}` : preview;
  }, [selectedDates, selectionMode]);

  const availableTimesByDate = useMemo(
    () =>
      Object.fromEntries(
        selectedDates.map((date) => [
          date,
          getAvailableTimesForDate(resolvedSpace.id, date),
        ]),
      ) as Record<string, string[]>,
    [resolvedSpace.id, selectedDates],
  );

  const sharedAvailableTimes = useMemo(() => {
    if (selectedDates.length === 0) {
      return [];
    }

    if (selectedDates.length === 1) {
      return availableTimesByDate[selectedDates[0]] ?? [];
    }

    return DEFAULT_TIME_SLOTS.filter((time) =>
      selectedDates.every((date) => (availableTimesByDate[date] ?? []).includes(time)),
    );
  }, [availableTimesByDate, selectedDates]);

  const hasSharedTimeConflict =
    selectedDates.length > 1 && sharedAvailableTimes.length === 0;

  const currentDraftResult = useMemo(
    () =>
      buildReservationDraft(
        selectedDates,
        sharedRange,
        editIndividually,
        perDateRanges,
      ),
    [editIndividually, perDateRanges, selectedDates, sharedRange],
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

  const resetAvailability = () => {
    setAvailabilityStatus("idle");
    setAvailabilityMessage("");
    setCheckedDraft(null);
    setCreatedReservation(null);
  };

  const resetSchedule = () => {
    setSharedRange(DEFAULT_RANGE);
    setEditIndividually(false);
    setPerDateRanges({});
    resetAvailability();
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

  const updateSharedRange = (range: TimeRange) => {
    setSharedRange(range);
    resetAvailability();
  };

  const updatePerDateRange = (date: string, range: TimeRange) => {
    setPerDateRanges((current) => ({
      ...current,
      [date]: range,
    }));
    resetAvailability();
  };

  const handleTimeChipClick = (
    range: TimeRange,
    time: string,
    availableTimes: string[],
    onChange: (nextRange: TimeRange) => void,
  ) => {
    if (!availableTimes.includes(time)) {
      return;
    }

    if (!range.startTime || range.endTime) {
      onChange({
        startTime: time,
        endTime: "",
      });
      return;
    }

    const startIndex = getTimeSlotIndex(range.startTime);
    const clickedIndex = getTimeSlotIndex(time);

    if (clickedIndex < startIndex) {
      onChange({
        startTime: time,
        endTime: "",
      });
      return;
    }

    if (isRangeSelectableFromTimes(availableTimes, range.startTime, time)) {
      onChange({
        startTime: range.startTime,
        endTime: time,
      });
    }
  };

  const renderRangeSummary = (range: TimeRange) => {
    if (!range.startTime) {
      return "Selecione o horário de início.";
    }

    if (!range.endTime) {
      return `Início definido em ${range.startTime}. Agora selecione o horário de fim.`;
    }

    return `Faixa selecionada: ${range.startTime} às ${range.endTime}.`;
  };

  const renderTimeChips = (
    range: TimeRange,
    availableTimes: string[],
    onChange: (nextRange: TimeRange) => void,
    options?: {
      showUnavailable?: boolean;
      feedbackText?: string;
      emptyState?: string;
    },
  ) => {
    const showUnavailable = options?.showUnavailable ?? false;
    const visibleTimes = showUnavailable ? [...DEFAULT_TIME_SLOTS] : [...availableTimes];
    const availableSet = new Set(availableTimes);

    return (
      <div className="space-y-3">
        {options?.feedbackText && (
          <p className="text-sm text-muted-foreground">{options.feedbackText}</p>
        )}

        {visibleTimes.length === 0 && options?.emptyState && (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {options.emptyState}
          </p>
        )}

        {visibleTimes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {visibleTimes.map((time) => {
              const available = availableSet.has(time);
              const disabledAsEnd =
                available &&
                !!range.startTime &&
                !range.endTime &&
                getTimeSlotIndex(time) >= getTimeSlotIndex(range.startTime) &&
                !isRangeSelectableFromTimes(availableTimes, range.startTime, time);
              const disabled = !available || disabledAsEnd;
              const selected = isTimeInsideRange(time, range);

              return (
                <button
                  key={time}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    handleTimeChipClick(range, time, availableTimes, onChange)
                  }
                  className={cn(
                    "inline-flex h-11 min-w-[78px] items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors",
                    disabled &&
                      "cursor-not-allowed border-border bg-muted/50 text-muted-foreground",
                    !disabled &&
                      !selected &&
                      "border-border bg-background text-foreground hover:border-primary/40",
                    selected && "border-primary bg-primary-soft text-foreground",
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-sm text-muted-foreground">{renderRangeSummary(range)}</p>
      </div>
    );
  };

  const handleCheckAvailability = () => {
    if (form.people <= 0) {
      setAvailabilityStatus("unavailable");
      setAvailabilityMessage("Informe a quantidade de pessoas para continuar.");
      setCheckedDraft(null);
      return;
    }

    if (hasSharedTimeConflict && !editIndividually) {
      setAvailabilityStatus("unavailable");
      setAvailabilityMessage(
        "Nao ha horarios em comum entre os dias selecionados. Ative 'Editar horarios individualmente' para escolher horarios diferentes por dia.",
      );
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

    const unavailableEntries = reservationDraft.entries.filter(
      (entry) =>
        !isTimeRangeAvailableForDate(
          resolvedSpace.id,
          entry.date,
          entry.startTime,
          entry.endTime,
        ),
    );

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

  return (
    <div className="page-container section-space">
      <Link
        href={`/espacos/${resolvedSpace.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar aos detalhes
      </Link>

      <div className="mx-auto w-full max-w-5xl">
        <Card className="min-w-0 space-y-6 p-5 sm:p-7">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fluxo de reserva
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-normal text-foreground">
              Reservar espaço
            </h1>
            <p className="text-sm text-muted-foreground">
              Escolha dias soltos ou um período contínuo e veja os horários disponíveis imediatamente.
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
            <Label>Modo de seleção de datas</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {MODE_OPTIONS.map((option) => {
                const selected = selectionMode === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSelectionMode(option.value);
                      resetSchedule();
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

          <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-border bg-secondary/50 p-2 sm:p-3">
                {selectionMode === "specific-days" && (
                  <Calendar
                    mode="multiple"
                    selected={selectedDateObjects}
                    onSelect={(days) => {
                      const nextDates = sortDates(
                        (days ?? [])
                          .map((day) => toISODate(day))
                          .filter((date) => date >= todayISODate),
                      );

                      setSpecificDates(nextDates);
                      resetSchedule();
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
                )}

                {selectionMode === "continuous-period" && (
                  <Calendar
                    mode="range"
                    selected={periodRange}
                    onSelect={(range) => {
                      setPeriodRange(range);
                      resetSchedule();
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
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Disponível
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Indisponível
                </span>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Datas selecionadas
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{selectedDatesSummary}</p>

                {selectedDates.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDates.map((date) => (
                      <span
                        key={date}
                        className="rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {formatDate(date)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {selectedDates.length > 0 && (
                <div className="space-y-5">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Clock3 className="h-4 w-4 text-primary" />
                      Horários
                    </p>

                    {selectedDates.length === 1 &&
                      renderTimeChips(
                        sharedRange,
                        availableTimesByDate[selectedDates[0]] ?? [],
                        updateSharedRange,
                        {
                          showUnavailable: true,
                          feedbackText: "Horários disponíveis para esta data. Os horários em cinza estão indisponíveis.",
                        },
                      )}

                    {selectedDates.length > 1 &&
                      !hasSharedTimeConflict &&
                      renderTimeChips(sharedRange, sharedAvailableTimes, updateSharedRange, {
                        feedbackText:
                          "Horários disponíveis para todos os dias selecionados.",
                        emptyState:
                          "Não encontramos horários em comum para esta combinação de dias.",
                      })}

                    {hasSharedTimeConflict && (
                      <div className="space-y-3">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Conflito de disponibilidade detectado</AlertTitle>
                          <AlertDescription>
                            Não há horários em comum entre os dias selecionados.
                          </AlertDescription>
                        </Alert>
                        <p className="text-sm text-muted-foreground">
                          Ative &quot;Editar horários individualmente&quot; para escolher horários diferentes por dia.
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedDates.length > 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 p-4">
                        <div>
                          <Label htmlFor="edit-individually" className="text-sm font-medium">
                            Editar horários individualmente
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Você pode aplicar o mesmo horário para todos os dias ou editar individualmente.
                          </p>
                        </div>
                        <Switch
                          id="edit-individually"
                          checked={editIndividually}
                          onCheckedChange={(checked) => {
                            setEditIndividually(checked);
                            setPerDateRanges((current) =>
                              Object.fromEntries(
                                selectedDates.map((date) => [
                                  date,
                                  current[date] ?? {
                                    startTime: sharedRange.startTime,
                                    endTime: sharedRange.endTime,
                                  },
                                ]),
                              ),
                            );
                            resetAvailability();
                          }}
                        />
                      </div>

                      {editIndividually && (
                        <div className="space-y-3">
                          {selectedDates.map((date) => (
                            <div
                              key={date}
                              className="rounded-lg border border-border bg-background p-4"
                            >
                              <p className="mb-3 text-sm font-medium text-foreground">
                                {formatDate(date)}
                              </p>
                              {renderTimeChips(
                                perDateRanges[date] ?? DEFAULT_RANGE,
                                availableTimesByDate[date] ?? [],
                                (range) => updatePerDateRange(date, range),
                                {
                                  showUnavailable: true,
                                  feedbackText:
                                    "Horários disponíveis para este dia. Os horários em cinza estão indisponíveis.",
                                },
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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
                    resetAvailability();
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
                  resetAvailability();
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

          {selectedDates.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={handleCheckAvailability}
                >
                  Revisar reserva
                </Button>
                <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                  <Link href={`/espacos/${resolvedSpace.id}`}>Voltar aos detalhes</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                A confirmação final será feita pelo WhatsApp.
              </p>
            </div>
          )}

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
                  Resumo da reserva
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
                  onClick={resetAvailability}
                >
                  Editar dados
                </Button>
                <Button
                  size="lg"
                  className="w-full gap-2 sm:w-auto"
                  onClick={handleCreateReservation}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Reservar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                A confirmação final será feita pelo WhatsApp comercial do espaço.
              </p>
              {(!session || session.user.role !== "user") && (
                <p className="text-sm text-muted-foreground">
                  Antes de reservar, faça login com o perfil cliente.
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
      </div>
    </div>
  );
}
