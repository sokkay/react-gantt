import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GanttChart } from "../GanttChart";
import type { PointerInteraction } from "../internal-types";
import type { GanttProject, NormalizedGanttProject } from "../types";
import { normalizeDate } from "../utils/dates";
import { rangeFromPixels } from "../utils/range-from-pixels";
import { buildTimeline } from "../utils/timeline";

const mockProjects: NormalizedGanttProject[] = [
  {
    id: "p1",
    name: "Project",
    tasks: [
      {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: normalizeDate("2026-07-02T00:00:00"),
        end: normalizeDate("2026-07-06T00:00:00"),
      },
    ],
  },
];

describe("Timeline bounds with minDate and maxDate", () => {
  it("builds timeline bounded exactly by snapped minDate and maxDate", () => {
    const minDate = normalizeDate("2026-07-01T00:00:00");
    const maxDate = normalizeDate("2026-07-10T00:00:00");
    const timeline = buildTimeline(mockProjects, "day", undefined, minDate, maxDate);

    // timeline.start should be snapDate(minDate, "day") = 2026-07-01
    expect(timeline.start).toEqual(minDate);
    // timeline.end should be addViewUnits(snapDate(maxDate, "day"), 1, "day") = 2026-07-11
    expect(timeline.end).toEqual(normalizeDate("2026-07-11T00:00:00"));
    
    // There should be exactly 10 day cells (July 1st to July 10th inclusive)
    expect(timeline.cells.length).toBe(10);
    expect(timeline.cells[0].start).toEqual(minDate);
    expect(timeline.cells[9].end).toEqual(normalizeDate("2026-07-11T00:00:00"));
  });

  it("clamps start and end during rangeFromPixels resize-start", () => {
    const minDate = normalizeDate("2026-07-01T00:00:00");
    const maxDate = normalizeDate("2026-07-10T00:00:00");
    const timeline = buildTimeline(mockProjects, "day", undefined, minDate, maxDate);

    const interaction: PointerInteraction<unknown> = {
      kind: "resize-start",
      task: {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: normalizeDate("2026-07-02T00:00:00"),
        end: normalizeDate("2026-07-06T00:00:00"),
      },
      originX: 100,
      start: normalizeDate("2026-07-02T00:00:00"),
      end: normalizeDate("2026-07-06T00:00:00"),
    };

    // Resizing start to the left by 3 days (-144px).
    // The clamp should restrict start to minDate (2026-07-01).
    const range = rangeFromPixels(interaction, -144, timeline, "day", "day", minDate, maxDate);
    expect(range.start).toEqual(minDate);
    expect(range.end).toEqual(normalizeDate("2026-07-06T00:00:00"));
  });

  it("clamps start and end during rangeFromPixels resize-end", () => {
    const minDate = normalizeDate("2026-07-01T00:00:00");
    const maxDate = normalizeDate("2026-07-10T00:00:00");
    const timeline = buildTimeline(mockProjects, "day", undefined, minDate, maxDate);

    const interaction: PointerInteraction<unknown> = {
      kind: "resize-end",
      task: {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: normalizeDate("2026-07-02T00:00:00"),
        end: normalizeDate("2026-07-06T00:00:00"),
      },
      originX: 100,
      start: normalizeDate("2026-07-02T00:00:00"),
      end: normalizeDate("2026-07-06T00:00:00"),
    };

    // Resizing end to the right by 6 days (+288px).
    // The clamp should restrict end to maxDate (2026-07-10).
    const range = rangeFromPixels(interaction, 288, timeline, "day", "day", minDate, maxDate);
    expect(range.start).toEqual(normalizeDate("2026-07-02T00:00:00"));
    expect(range.end).toEqual(maxDate);
  });

  it("clamps move action during rangeFromPixels to stay within minDate and maxDate bounds", () => {
    const minDate = normalizeDate("2026-07-01T00:00:00");
    const maxDate = normalizeDate("2026-07-10T00:00:00");
    const timeline = buildTimeline(mockProjects, "day", undefined, minDate, maxDate);

    const interaction: PointerInteraction<unknown> = {
      kind: "move",
      task: {
        id: "t1",
        projectId: "p1",
        name: "Task",
        start: normalizeDate("2026-07-02T00:00:00"),
        end: normalizeDate("2026-07-06T00:00:00"), // duration: 4 days
      },
      originX: 100,
      start: normalizeDate("2026-07-02T00:00:00"),
      end: normalizeDate("2026-07-06T00:00:00"),
    };

    // Moving left by 3 days (-144px).
    // Clamp start to 2026-07-01, end becomes 2026-07-05 to preserve duration.
    const rangeLeft = rangeFromPixels(interaction, -144, timeline, "day", "day", minDate, maxDate);
    expect(rangeLeft.start).toEqual(normalizeDate("2026-07-01T00:00:00"));
    expect(rangeLeft.end).toEqual(normalizeDate("2026-07-05T00:00:00"));

    // Moving right by 6 days (+288px).
    // Clamp end to 2026-07-10, start becomes 2026-07-06 to preserve duration.
    const rangeRight = rangeFromPixels(interaction, 288, timeline, "day", "day", minDate, maxDate);
    expect(rangeRight.start).toEqual(normalizeDate("2026-07-06T00:00:00"));
    expect(rangeRight.end).toEqual(normalizeDate("2026-07-10T00:00:00"));
  });

  it("integrates minDate and maxDate in GanttChart component and restricts rendering and callbacks", () => {
    const onTaskMove = vi.fn();
    const onTaskResize = vi.fn();
    const propsProjects: GanttProject[] = [
      {
        id: "p1",
        name: "Platform",
        tasks: [
          {
            id: "t1",
            projectId: "p1",
            name: "API",
            start: "2026-07-02T00:00:00",
            end: "2026-07-06T00:00:00",
          },
        ],
      },
    ];

    render(
      <GanttChart
        projects={propsProjects}
        viewMode="day"
        minDate="2026-07-01T00:00:00"
        maxDate="2026-07-10T00:00:00"
        onTaskMove={onTaskMove}
        onTaskResize={onTaskResize}
      />
    );

    // Expect timeline cells for July 1st to July 10th to be present
    expect(screen.getByText("01 Jul")).toBeInTheDocument();
    expect(screen.getByText("10 Jul")).toBeInTheDocument();
    expect(screen.queryByText("30 Jun")).not.toBeInTheDocument();
    expect(screen.queryByText("11 Jul")).not.toBeInTheDocument();

    const task = screen.getByTestId("task-t1");

    // Test dragging left (beyond minDate = 2026-07-01)
    fireEvent(task, new MouseEvent("pointerdown", { bubbles: true, clientX: 100 }));
    // Drags left by 3 days (-144px)
    fireEvent(window, new MouseEvent("pointermove", { bubbles: true, clientX: -44 }));
    fireEvent(window, new MouseEvent("pointerup", { bubbles: true }));

    expect(onTaskMove).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        projectId: "p1",
        start: normalizeDate("2026-07-01T00:00:00"),
        end: normalizeDate("2026-07-05T00:00:00"),
      })
    );
  });
});
