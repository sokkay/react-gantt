import { describe, expect, it } from "vitest";
import type { NormalizedGanttProject } from "../types";
import {
  buildTimeline,
  dateRangeToPixels,
  dateToPixels,
  pixelsToUnits,
} from "../utils/timeline";

const projects: NormalizedGanttProject[] = [
  {
    id: "p1",
    name: "Project",
    tasks: [
      {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: new Date("2026-07-02"),
        end: new Date("2026-07-06"),
      },
    ],
  },
];

describe("timeline utilities", () => {
  it("maps dates to pixels by view mode", () => {
    const timeline = buildTimeline(projects, "day");

    expect(timeline.cellWidth).toBe(48);
    expect(dateToPixels(new Date("2026-07-02"), timeline, "day")).toBe(48);
  });

  it("snaps pixel deltas to timeline units", () => {
    const timeline = buildTimeline(projects, "week");

    expect(pixelsToUnits(timeline.cellWidth * 2.2, timeline)).toBe(2);
    expect(pixelsToUnits(timeline.cellWidth * 2.6, timeline)).toBe(3);
  });

  it("uses wider cells for month view", () => {
    const timeline = buildTimeline(projects, "month");

    expect(timeline.cellWidth).toBe(144);
  });

  it("spills into the next month without filling the whole month", () => {
    const timeline = buildTimeline(
      [
        {
          ...projects[0],
          tasks: [
            {
              ...projects[0].tasks[0],
              start: new Date("2026-07-15"),
              end: new Date("2026-08-02"),
            },
          ],
        },
      ],
      "month"
    );
    const range = dateRangeToPixels(
      new Date("2026-07-15"),
      new Date("2026-08-02"),
      timeline,
      "month"
    );
    const augustStart = dateToPixels(new Date("2026-08-01"), timeline, "month");

    expect(range.left + range.width).toBeGreaterThan(augustStart);
    expect(range.width).toBeLessThan(timeline.cellWidth);
  });

  it("does not fill the full month for a partial monthly range", () => {
    const timeline = buildTimeline(
      [
        {
          ...projects[0],
          tasks: [
            {
              ...projects[0].tasks[0],
              start: new Date("2026-07-15"),
              end: new Date("2026-08-01"),
            },
          ],
        },
      ],
      "month"
    );

    expect(
      dateRangeToPixels(
        new Date("2026-07-15"),
        new Date("2026-08-01"),
        timeline,
        "month"
      ).width
    ).toBeLessThan(timeline.cellWidth);
  });
});
