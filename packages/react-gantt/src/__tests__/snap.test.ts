import { describe, expect, it } from "vitest";
import type { PointerInteraction } from "../internal-types";
import { rangeFromPixels } from "../utils/range-from-pixels";
import { buildTimeline } from "../utils/timeline";

const mockProjects = [
  {
    id: "p1",
    name: "Project",
    tasks: [
      {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: new Date("2026-07-01"),
        end: new Date("2026-07-10"),
      },
    ],
  },
];

describe("snapTo utilities", () => {
  it("snaps to day while in month view", () => {
    const timeline = buildTimeline(mockProjects, "month");
    const interaction: PointerInteraction<unknown> = {
      kind: "resize-end",
      task: {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: new Date("2026-07-01"),
        end: new Date("2026-07-10"),
      },
      originX: 100,
      start: new Date("2026-07-01"),
      end: new Date("2026-07-10"),
    };

    // timeline.cellWidth es 144px (1 mes)
    // Un mes tiene aproximadamente 30 días, lo que equivale a ~4.8px por día.
    // Si arrastramos 24px: (24 / 144) * 30 días = 5 días.
    const range = rangeFromPixels(interaction, 24, timeline, "month", "day");

    expect(range.start).toEqual(new Date("2026-07-01"));
    expect(range.end).toEqual(new Date("2026-07-15")); // 10 + 5 = 15
  });

  it("snaps to week while in day view", () => {
    const timeline = buildTimeline(mockProjects, "day");
    const interaction: PointerInteraction<unknown> = {
      kind: "resize-end",
      task: {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: new Date("2026-07-01"),
        end: new Date("2026-07-10"),
      },
      originX: 100,
      start: new Date("2026-07-01"),
      end: new Date("2026-07-10"),
    };

    // timeline.cellWidth es 48px (1 día)
    // 1 semana = 7 celdas = 336px
    // Si arrastramos 336px (1 semana entera)
    const range = rangeFromPixels(interaction, 336, timeline, "day", "week");

    expect(range.start).toEqual(new Date("2026-07-01"));
    expect(range.end).toEqual(new Date("2026-07-17")); // 10 + 7 días (1 semana) = 17
  });

  it("handles snapTo='none' for continuous dragging", () => {
    const timeline = buildTimeline(mockProjects, "day");
    const interaction: PointerInteraction<unknown> = {
      kind: "resize-end",
      task: {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: new Date("2026-07-01"),
        end: new Date("2026-07-10"),
      },
      originX: 100,
      start: new Date("2026-07-01"),
      end: new Date("2026-07-10"),
    };

    // timeline.cellWidth es 48px (1 día = 24 horas)
    // Si arrastramos 12px hacia la derecha (12 / 48 = 0.25 días = 6 horas)
    const range = rangeFromPixels(interaction, 12, timeline, "day", "none");

    const expectedTime = new Date("2026-07-10").getTime() + 6 * 60 * 60 * 1000;
    expect(range.start).toEqual(new Date("2026-07-01"));
    expect(range.end.getTime()).toBe(expectedTime);
  });
});
