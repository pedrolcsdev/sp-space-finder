"use client";

export type StoredTimeRange = {
  startTime: string;
  endTime: string;
};

export type StoredReservationEntry = {
  date: string;
  startTime: string;
  endTime: string;
};

export type StoredReservationSummary = {
  entries: StoredReservationEntry[];
  scheduleLabel: string;
  detailLines: string[];
};

export type StoredReservationDraft = {
  spaceId: string;
  spaceName: string;
  pricePerHour: number;
  selectionMode: "specific-days" | "continuous-period";
  specificDates: string[];
  periodRange: {
    from?: string;
    to?: string;
  } | null;
  sharedRange: StoredTimeRange;
  editIndividually: boolean;
  perDateRanges: Record<string, StoredTimeRange>;
  form: {
    people: number;
    notes: string;
  };
  availabilityStatus: "idle" | "available" | "unavailable";
  availabilityMessage: string;
  checkedDraft: StoredReservationSummary | null;
  savedAt: string;
};

const RESERVATION_DRAFT_STORAGE_KEY = "sp_spaces_pending_reservation";
const RESERVATION_DRAFT_RESTORED_FLAG_KEY = "sp_spaces_pending_reservation_restored";

const isBrowser = () => typeof window !== "undefined";

export const savePendingReservationDraft = (draft: StoredReservationDraft) => {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(RESERVATION_DRAFT_STORAGE_KEY, JSON.stringify(draft));
};

export const readPendingReservationDraft = (): StoredReservationDraft | null => {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(RESERVATION_DRAFT_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredReservationDraft;
  } catch {
    return null;
  }
};

export const clearPendingReservationDraft = () => {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(RESERVATION_DRAFT_STORAGE_KEY);
  window.sessionStorage.removeItem(RESERVATION_DRAFT_RESTORED_FLAG_KEY);
};

export const markPendingReservationAsRestored = (spaceId: string) => {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(RESERVATION_DRAFT_RESTORED_FLAG_KEY, spaceId);
};

export const consumePendingReservationRestoredFlag = (spaceId: string) => {
  if (!isBrowser()) {
    return false;
  }

  const restoredSpaceId = window.sessionStorage.getItem(
    RESERVATION_DRAFT_RESTORED_FLAG_KEY,
  );

  if (restoredSpaceId !== spaceId) {
    return false;
  }

  window.sessionStorage.removeItem(RESERVATION_DRAFT_RESTORED_FLAG_KEY);
  return true;
};
