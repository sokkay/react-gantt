import { format } from "date-fns";
import type { GanttViewMode, NormalizedGanttProject } from "../types";
import { addViewUnits, diffViewUnits, snapDate } from "./dates";

const CELL_WIDTH: Record<GanttViewMode, number> = {
  day: 48,
  week: 72,
  month: 96,
  quarter: 120,
  year: 148,
};

const LABEL_FORMAT: Record<GanttViewMode, string> = {
  day: "dd MMM",
  week: "'W'II yyyy",
  month: "MMM yyyy",
  quarter: "QQQ yyyy",
  year: "yyyy",
};

export interface TimelineCell {
  id: string;
  start: Date;
  end: Date;
  label: string;
}

export interface TimelineModel {
  start: Date;
  end: Date;
  cells: TimelineCell[];
  cellWidth: number;
  width: number;
}

export function buildTimeline(
  projects: Array<NormalizedGanttProject>,
  viewMode: GanttViewMode
): TimelineModel {
  const tasks = projects.flatMap((project) => project.tasks);
  const minStart = tasks.reduce<Date | null>(
    (acc, task) => (!acc || task.start < acc ? task.start : acc),
    null
  );
  const maxEnd = tasks.reduce<Date | null>(
    (acc, task) => (!acc || task.end > acc ? task.end : acc),
    null
  );
  const start = addViewUnits(
    snapDate(minStart ?? new Date(), viewMode),
    -1,
    viewMode
  );
  const end = addViewUnits(
    snapDate(maxEnd ?? new Date(), viewMode),
    2,
    viewMode
  );
  const cellCount = Math.max(diffViewUnits(start, end, viewMode), 1);
  const cells = Array.from({ length: cellCount }, (_, index) => {
    const cellStart = addViewUnits(start, index, viewMode);
    const cellEnd = addViewUnits(cellStart, 1, viewMode);

    return {
      id: `${viewMode}-${cellStart.toISOString()}`,
      start: cellStart,
      end: cellEnd,
      label: format(cellStart, LABEL_FORMAT[viewMode]),
    };
  });

  return {
    start,
    end,
    cells,
    cellWidth: CELL_WIDTH[viewMode],
    width: cells.length * CELL_WIDTH[viewMode],
  };
}

export function dateToPixels(
  date: Date,
  timeline: TimelineModel,
  viewMode: GanttViewMode
) {
  return (
    diffViewUnits(timeline.start, snapDate(date, viewMode), viewMode) *
    timeline.cellWidth
  );
}

export function dateRangeToPixels(
  start: Date,
  end: Date,
  timeline: TimelineModel,
  viewMode: GanttViewMode
) {
  const left = dateToPixels(start, timeline, viewMode);
  const snappedStart = snapDate(start, viewMode);
  const snappedEnd = snapDate(end, viewMode);
  const displayEnd =
    end.getTime() === snappedEnd.getTime()
      ? snappedEnd
      : addViewUnits(snappedEnd, 1, viewMode);
  const units = Math.max(diffViewUnits(snappedStart, displayEnd, viewMode), 1);

  return {
    left,
    width: units * timeline.cellWidth,
  };
}

export function pixelsToUnits(deltaPixels: number, timeline: TimelineModel) {
  return Math.round(deltaPixels / timeline.cellWidth);
}
