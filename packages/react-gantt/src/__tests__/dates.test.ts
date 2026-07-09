import { describe, expect, it } from "vitest";
import {
  addViewUnits,
  diffViewUnits,
  ensureMinimumRange,
  normalizeDate,
  normalizeProjects,
  shiftRangeByUnits,
  snapDate,
} from "../utils/dates";

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

  it("normalizes task segments and derives the envelope from them", () => {
    const [project] = normalizeProjects([
      {
        id: "p1",
        name: "Platform",
        tasks: [
          {
            id: "t1",
            projectId: "p1",
            name: "Weekdays",
            start: "2026-01-01",
            end: "2026-01-01",
            segments: [
              { id: "s2", start: "2026-07-13", end: "2026-07-17" },
              { id: "s1", start: "2026-07-06", end: "2026-07-10" },
            ],
          },
        ],
      },
    ]);

    const task = project.tasks[0];
    expect(task.segments).toHaveLength(2);
    expect(task.segments?.[0].id).toBe("s1");
    expect(task.segments?.[1].id).toBe("s2");
    expect(task.start).toEqual(normalizeDate("2026-07-06"));
    expect(task.end).toEqual(normalizeDate("2026-07-17"));
  });
});
