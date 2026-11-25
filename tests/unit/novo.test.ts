import { describe, expect, it } from "vitest";

import { isNew } from "../../src/lib/novo";

const now = new Date("2000-01-08T15:30:00.000Z");

describe("isNew", () => {
  it("marca o post de hoje, pela data UTC", () => {
    expect(isNew("2000-01-08", now)).toBe(true);
    expect(isNew("2000-01-08", new Date("2000-01-08T00:00:00.000Z"))).toBe(
      true,
    );
  });

  it("marca até 6 dias atrás", () => {
    expect(isNew("2000-01-07", now)).toBe(true);
    expect(isNew("2000-01-02", now)).toBe(true);
  });

  it("não marca 7 dias atrás nem antes", () => {
    expect(isNew("2000-01-01", now)).toBe(false);
    expect(isNew("1999-12-25", now)).toBe(false);
  });

  it("não marca data futura", () => {
    expect(isNew("2000-01-09", now)).toBe(false);
    expect(isNew("2099-01-01", now)).toBe(false);
  });

  it("não marca data inválida", () => {
    expect(isNew("", now)).toBe(false);
    expect(isNew("2000-13-45", now)).toBe(false);
    expect(isNew("ontem", now)).toBe(false);
  });
});
