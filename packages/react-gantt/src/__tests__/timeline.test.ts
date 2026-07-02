import { describe, expect, it } from "vitest";
import type { NormalizedGanttProject } from "../types";
import { buildTimeline, dateToPixels, pixelsToUnits } from "../utils/timeline";

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
});
