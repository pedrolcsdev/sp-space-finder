import { describe, expect, it } from "vitest";
import {
  getDayAvailabilityStatus,
  getUnavailableTimes,
  sanitizeReservationPreselection,
} from "@/lib/availability/spaceAvailability";

describe("spaceAvailability utils", () => {
  it("calcula os horários indisponíveis por espaço e data", () => {
    expect(getUnavailableTimes("1", "2026-04-01")).toEqual([
      "11:00",
      "15:00",
      "18:00",
    ]);
  });

  it("calcula status de dia disponível, parcial e indisponível", () => {
    expect(getDayAvailabilityStatus("1", "2026-04-01")).toBe("partial");
    expect(getDayAvailabilityStatus("1", "2026-04-01", ["07:00"])).toBe(
      "available",
    );
    expect(getDayAvailabilityStatus("1", "2026-04-04", ["09:00", "13:00"])).toBe(
      "unavailable",
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
      time: "",
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
});
