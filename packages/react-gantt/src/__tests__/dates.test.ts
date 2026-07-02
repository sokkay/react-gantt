import { describe, expect, it } from "vitest";
import { addViewUnits, diffViewUnits, ensureMinimumRange, normalizeDate, shiftRangeByUnits, snapDate } from "../utils/dates";

describe("date utilities", () => {
  it("normalizes Date, string and number inputs to day boundaries", () => {
    expect(normalizeDate("2026-07-02T15:30:00.000Z")).toBeInstanceOf(Date);
    expect(normalizeDate(new Date("2026-07-02T15:30:00")).getHours()).toBe(0);
    expect(normalizeDate(Date.UTC(2026, 6, 2, 15, 30)).getHours()).toBe(0);
  });

  it("snaps dates by view mode", () => {
    const value = new Date("2026-07-16T10:00:00");

    expect(snapDate(value, "day").getDate()).toBe(16);
    expect(snapDate(value, "week").getDay()).toBe(1);
    expect(snapDate(value, "month").getDate()).toBe(1);
    expect(snapDate(value, "quarter").getMonth()).toBe(6);
    expect(snapDate(value, "year").getMonth()).toBe(0);
  });

  it("preserves duration when shifting a range", () => {
    const start = new Date("2026-07-01");
    const end = new Date("2026-07-05");
    const shifted = shiftRangeByUnits(start, end, 2, "day");

    expect(diffViewUnits(shifted.start, shifted.end, "day")).toBe(4);
    expect(shifted.start).toEqual(addViewUnits(start, 2, "day"));
  });

  it("keeps resize ranges at least one unit long", () => {
    const start = new Date("2026-07-01");
    const end = new Date("2026-07-01");
    const range = ensureMinimumRange(start, end, "day");

    expect(diffViewUnits(range.start, range.end, "day")).toBe(1);
  });
});
