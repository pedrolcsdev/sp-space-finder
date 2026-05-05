import { describe, expect, it } from "vitest";
import {
  getDayAvailabilityStatus,
  getTimeRangeSlots,
  getUnavailableTimes,
  isTimeRangeAvailableForDate,
  sanitizeReservationPreselection,
} from "@/lib/availability/spaceAvailability";

describe("spaceAvailability utils", () => {
  it("mantem todos os horarios disponiveis no mock atual", () => {
    expect(getUnavailableTimes("1", "2026-04-01")).toEqual([]);
  });

  it("calcula status de dia como disponivel", () => {
    expect(getDayAvailabilityStatus("1", "2026-04-01")).toBe("available");
    expect(getDayAvailabilityStatus("1", "2026-04-01", ["07:00"])).toBe(
      "available",
    );
    expect(getDayAvailabilityStatus("1", "2026-04-04", ["09:00", "13:00"])).toBe(
      "available",
    );
  });

  it("mantém pré-seleção válida quando data e horário são permitidos", () => {
    expect(
      sanitizeReservationPreselection(
        "1",
        {
          date: "2026-04-04",
          time: "10:00",
        },
        { todayISODate: "2026-04-01" },
      ),
    ).toEqual({
      date: "2026-04-04",
      time: "10:00",
    });
  });

  it("aplica fallback seguro para query params inválidos, passados ou indisponíveis", () => {
    expect(
      sanitizeReservationPreselection(
        "1",
        {
          date: "2026-04-01",
          time: "16:00",
        },
        { todayISODate: "2026-04-06" },
      ),
    ).toEqual({
      date: "2026-04-06",
      time: "16:00",
    });

    expect(
      sanitizeReservationPreselection(
        "1",
        {
          date: "invalida",
          time: "99:99",
        },
        { todayISODate: "2026-04-06" },
      ),
    ).toEqual({
      date: "2026-04-06",
      time: "",
    });
  });

  it("monta a faixa contínua de horários", () => {
    expect(getTimeRangeSlots("09:00", "11:00")).toEqual([
      "09:00",
      "10:00",
      "11:00",
    ]);
    expect(getTimeRangeSlots("11:00", "09:00")).toEqual([]);
  });

  it("valida quando uma faixa inteira está disponível no dia", () => {
    expect(
      isTimeRangeAvailableForDate("1", "2026-04-04", "10:00", "12:00", [
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
      ]),
    ).toBe(true);

    expect(
      isTimeRangeAvailableForDate("1", "2026-04-04", "09:00", "13:00", [
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
      ]),
    ).toBe(true);
  });
});
