import { describe, expect, it } from "vitest";
import { normalizeDate } from "../utils/dates";
import {
  ensureMinimumTimelineRange,
  findCellIndexForDate,
  getTimelineDivisions,
  snapEndOnTimelineGrid,
} from "../utils/timeline-snap";
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
        start: normalizeDate("2026-07-01"),
        end: normalizeDate("2026-07-20"),
      },
    ],
  },
];

describe("timeline snap grid", () => {
  it("exposes timeline cell starts as snap divisions", () => {
    const timeline = buildTimeline(mockProjects, "week");

    expect(getTimelineDivisions(timeline)).toEqual(
      timeline.cells.map((cell) => cell.start)
    );
  });

  it("snaps resize end to the inclusive last day of a timeline cell", () => {
    const timeline = buildTimeline(mockProjects, "week");
    const start = normalizeDate("2026-07-06");
    const end = normalizeDate("2026-07-19");

    const snappedEnd = snapEndOnTimelineGrid(
      end,
      -timeline.cellWidth,
      timeline,
      "week",
      "floor"
    );

    expect(snappedEnd).toEqual(normalizeDate("2026-07-12"));
    expect(findCellIndexForDate(start, timeline)).toBeLessThanOrEqual(
      findCellIndexForDate(snappedEnd, timeline)
    );
  });

  it("enforces at least one timeline cell between start and end", () => {
    const timeline = buildTimeline(mockProjects, "week");
    const range = ensureMinimumTimelineRange(
      normalizeDate("2026-07-06"),
      normalizeDate("2026-07-10"),
      timeline
    );

    expect(range.start).toEqual(normalizeDate("2026-07-06"));
    expect(range.end).toEqual(normalizeDate("2026-07-12"));
  });
});
