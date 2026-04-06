export type DayAvailabilityStatus = "available" | "partial" | "unavailable";

export const DEFAULT_TIME_SLOTS = [
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

const UNAVAILABLE_SLOT_PATTERNS: readonly string[][] = [
  ["10:00", "14:00", "17:00"],
  ["09:00", "13:00"],
  ["11:00", "15:00", "18:00"],
  ["08:00", "16:00"],
];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const padDatePart = (value: number) => String(value).padStart(2, "0");

export const getTodayISODate = (baseDate = new Date()) => {
  const tzOffsetMs = baseDate.getTimezoneOffset() * 60000;

  return new Date(baseDate.getTime() - tzOffsetMs).toISOString().slice(0, 10);
};

export const isISODate = (value: string) => {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(year, month - 1, day);

  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  );
};

export const parseISODate = (value: string) => {
  if (!isISODate(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day, 12);
};

export const toISODate = (value: Date) => {
  const year = value.getFullYear();
  const month = padDatePart(value.getMonth() + 1);
  const day = padDatePart(value.getDate());

  return `${year}-${month}-${day}`;
};

export const isValidTimeSlot = (
  time: string,
  slots: readonly string[] = DEFAULT_TIME_SLOTS,
): boolean => slots.includes(time);

export const getUnavailableTimes = (
  spaceId: string,
  date: string,
  slots: readonly string[] = DEFAULT_TIME_SLOTS,
) => {
  if (!isISODate(date)) {
    return [];
  }

  const day = Number(date.slice(-2));
  const numericSpaceId = Number.parseInt(spaceId, 10) || 1;
  const ruleSeed = (day + numericSpaceId) % UNAVAILABLE_SLOT_PATTERNS.length;
  const unavailablePattern = UNAVAILABLE_SLOT_PATTERNS[ruleSeed] ?? [];

  return unavailablePattern.filter((slot) => slots.includes(slot));
};

export const getDayAvailabilityStatus = (
  spaceId: string,
  date: string,
  slots: readonly string[] = DEFAULT_TIME_SLOTS,
): DayAvailabilityStatus => {
  const unavailableTimes = getUnavailableTimes(spaceId, date, slots);

  if (unavailableTimes.length === 0) {
    return "available";
  }

  if (unavailableTimes.length >= slots.length) {
    return "unavailable";
  }

  return "partial";
};

export const isTimeAvailableForDate = (
  spaceId: string,
  date: string,
  time: string,
  slots: readonly string[] = DEFAULT_TIME_SLOTS,
) => {
  if (!isISODate(date) || !isValidTimeSlot(time, slots)) {
    return false;
  }

  return !getUnavailableTimes(spaceId, date, slots).includes(time);
};

interface ReservationPreselectionInput {
  date?: string | null;
  time?: string | null;
}

interface ReservationPreselectionOptions {
  todayISODate?: string;
  slots?: readonly string[];
}

export const sanitizeReservationPreselection = (
  spaceId: string,
  input: ReservationPreselectionInput,
  options?: ReservationPreselectionOptions,
) => {
  const todayISODate = options?.todayISODate ?? getTodayISODate();
  const slots = options?.slots ?? DEFAULT_TIME_SLOTS;
  const rawDate = input.date?.trim() ?? "";
  const normalizedDate =
    isISODate(rawDate) && rawDate >= todayISODate ? rawDate : todayISODate;
  const rawTime = input.time?.trim() ?? "";
  const normalizedTime = isTimeAvailableForDate(spaceId, normalizedDate, rawTime, slots)
    ? rawTime
    : "";

  return {
    date: normalizedDate,
    time: normalizedTime,
  };
};
