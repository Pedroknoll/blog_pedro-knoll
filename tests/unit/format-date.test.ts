import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { formatPubDate } from "../../src/lib/format-date";

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
