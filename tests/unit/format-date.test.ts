import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { formatPubDate, formatShortDate } from "../../src/lib/format-date";

describe("formatPubDate", () => {
  let previousTz: string | undefined;

  beforeAll(() => {
    previousTz = process.env.TZ;
    process.env.TZ = "America/Sao_Paulo";
  });

  afterAll(() => {
    if (previousTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = previousTz;
    }
  });

  it("formata 2026-10-20 no calendário UTC", () => {
    expect(formatPubDate(new Date("2026-10-20"))).toEqual({
      text: "20.out.2026",
      datetime: "2026-10-20",
    });
  });

  it("formata 2026-01-05 no calendário UTC", () => {
    expect(formatPubDate(new Date("2026-01-05"))).toEqual({
      text: "05.jan.2026",
      datetime: "2026-01-05",
    });
  });
});

describe("formatShortDate", () => {
  it("dia com dois dígitos e mês, sem o ano, em UTC", () => {
    expect(formatShortDate(new Date("2026-11-05T00:00:00.000Z"))).toBe(
      "05 nov",
    );
    expect(formatShortDate(new Date("2026-10-20T02:00:00.000Z"))).toBe(
      "20 out",
    );
    expect(formatShortDate(new Date("2000-01-02T23:59:59.000Z"))).toBe(
      "02 jan",
    );
  });
});
