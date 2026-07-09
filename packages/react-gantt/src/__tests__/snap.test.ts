import { describe, expect, it } from "vitest";
import type { PointerInteraction } from "../internal-types";
import { normalizeDate } from "../utils/dates";
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
        start: normalizeDate("2026-07-01"),
        end: normalizeDate("2026-07-10"),
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
        start: normalizeDate("2026-07-01"),
        end: normalizeDate("2026-07-10"),
      },
      originX: 100,
      start: normalizeDate("2026-07-01"),
      end: normalizeDate("2026-07-10"),
    };

    const range = rangeFromPixels(interaction, 24, timeline, "month", "day");

    expect(range.start).toEqual(normalizeDate("2026-07-01"));
    expect(range.end).toEqual(normalizeDate("2026-07-15"));
  });

  it("snaps to week while in day view", () => {
    const timeline = buildTimeline(mockProjects, "day");
    const interaction: PointerInteraction<unknown> = {
      kind: "resize-end",
      task: {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: normalizeDate("2026-07-01"),
        end: normalizeDate("2026-07-10"),
      },
      originX: 100,
      start: normalizeDate("2026-07-01"),
      end: normalizeDate("2026-07-10"),
    };

    const range = rangeFromPixels(interaction, 336, timeline, "day", "week");

    expect(range.start).toEqual(normalizeDate("2026-07-01"));
    expect(range.end).toEqual(normalizeDate("2026-07-19"));
  });

  it("snaps resize-end to month boundaries while in month view", () => {
    const timeline = buildTimeline(mockProjects, "month");
    const interaction: PointerInteraction<unknown> = {
      kind: "resize-end",
      task: {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: normalizeDate("2026-07-01"),
        end: normalizeDate("2026-07-10"),
      },
      originX: 100,
      start: normalizeDate("2026-07-01"),
      end: normalizeDate("2026-07-10"),
    };

    const range = rangeFromPixels(
      interaction,
      timeline.cellWidth,
      timeline,
      "month",
      "month"
    );

    expect(range.start).toEqual(normalizeDate("2026-07-01"));
    expect(range.end).toEqual(normalizeDate("2026-08-31"));
  });

  it("keeps a week-snapped task at one timeline cell minimum", () => {
    const timeline = buildTimeline(mockProjects, "week");
    const interaction: PointerInteraction<unknown> = {
      kind: "resize-end",
      task: {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: normalizeDate("2026-07-06"),
        end: normalizeDate("2026-07-12"),
      },
      originX: 100,
      start: normalizeDate("2026-07-06"),
      end: normalizeDate("2026-07-12"),
    };

    const range = rangeFromPixels(
      interaction,
      -timeline.cellWidth / 2,
      timeline,
      "week",
      "week"
    );

    expect(range.start).toEqual(normalizeDate("2026-07-06"));
    expect(range.end).toEqual(normalizeDate("2026-07-12"));
  });

  it("handles snapTo='none' for continuous dragging", () => {
    const timeline = buildTimeline(mockProjects, "day");
    const interaction: PointerInteraction<unknown> = {
      kind: "resize-end",
      task: {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: normalizeDate("2026-07-01"),
        end: normalizeDate("2026-07-10"),
      },
      originX: 100,
      start: normalizeDate("2026-07-01"),
      end: normalizeDate("2026-07-10"),
    };

    const range = rangeFromPixels(interaction, 12, timeline, "day", "none");

    const expectedTime =
      normalizeDate("2026-07-10").getTime() + 6 * 60 * 60 * 1000;
    expect(range.start).toEqual(normalizeDate("2026-07-01"));
    expect(range.end.getTime()).toBe(expectedTime);
  });

  it("advances resize-start by one day at a time near cell boundaries", () => {
    const timeline = buildTimeline(mockProjects, "day");
    const interaction: PointerInteraction<unknown> = {
      kind: "resize-start",
      task: {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: normalizeDate("2026-07-03"),
        end: normalizeDate("2026-07-10"),
      },
      originX: 100,
      start: normalizeDate("2026-07-03"),
      end: normalizeDate("2026-07-10"),
    };

    // Small movements stay on the original day (round, not directional ceil).
    const smallForward = rangeFromPixels(
      interaction,
      timeline.cellWidth * 0.4,
      timeline,
      "day",
      "day"
    );
    expect(smallForward.start).toEqual(normalizeDate("2026-07-03"));

    // Crossing the midpoint of the next cell advances exactly one day.
    const oneDay = rangeFromPixels(
      interaction,
      timeline.cellWidth * 0.6,
      timeline,
      "day",
      "day"
    );
    expect(oneDay.start).toEqual(normalizeDate("2026-07-04"));

    // Near the second cell boundary must not jump three days.
    const almostTwoDays = rangeFromPixels(
      interaction,
      timeline.cellWidth * 1.4,
      timeline,
      "day",
      "day"
    );
    expect(almostTwoDays.start).toEqual(normalizeDate("2026-07-04"));

    const twoDays = rangeFromPixels(
      interaction,
      timeline.cellWidth * 1.6,
      timeline,
      "day",
      "day"
    );
    expect(twoDays.start).toEqual(normalizeDate("2026-07-05"));
  });
});
