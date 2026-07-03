import { format } from "date-fns";
import type {
  GanttCellWidths,
  GanttViewMode,
  NormalizedGanttProject,
} from "../types";
import { addViewUnits, diffViewUnits, snapDate } from "./dates";

const CELL_WIDTH: Record<GanttViewMode, number> = {
  day: 48,
  week: 120,
  month: 144,
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
  viewMode: GanttViewMode,
  customCellWidths?: GanttCellWidths,
  minDate?: Date,
  maxDate?: Date
): TimelineModel {
  const cellWidth = customCellWidths?.[viewMode] ?? CELL_WIDTH[viewMode];
  const tasks = projects.flatMap((project) => project.tasks);
  const minStart = tasks.reduce<Date | null>(
    (acc, task) => (!acc || task.start < acc ? task.start : acc),
    null
  );
  const maxEnd = tasks.reduce<Date | null>(
    (acc, task) => (!acc || task.end > acc ? task.end : acc),
    null
  );
  const start = minDate
    ? snapDate(minDate, viewMode)
    : addViewUnits(
        snapDate(minStart ?? new Date(), viewMode),
        -1,
        viewMode
      );
  let end = maxDate
    ? addViewUnits(snapDate(maxDate, viewMode), 1, viewMode)
    : addViewUnits(
        snapDate(maxEnd ?? new Date(), viewMode),
        2,
        viewMode
      );

  if (start >= end) {
    end = addViewUnits(start, 1, viewMode);
  }

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
    cellWidth,
    width: cells.length * cellWidth,
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
  const left = dateToPrecisePixels(start, timeline, viewMode);
  const right = dateToPrecisePixels(end, timeline, viewMode);

  return {
    left,
    width: Math.max(right - left, timeline.cellWidth / 12),
  };
}

function dateToPrecisePixels(
  date: Date,
  timeline: TimelineModel,
  viewMode: GanttViewMode
) {
  const cellIndex = timeline.cells.findIndex(
    (cell) => date >= cell.start && date < cell.end
  );

  if (cellIndex >= 0) {
    const cell = timeline.cells[cellIndex];
    const elapsed = date.getTime() - cell.start.getTime();
    const duration = cell.end.getTime() - cell.start.getTime();

    return (
      cellIndex * timeline.cellWidth + (elapsed / duration) * timeline.cellWidth
    );
  }

  return dateToPixels(date, timeline, viewMode);
}

export function pixelsToUnits(deltaPixels: number, timeline: TimelineModel) {
  return Math.round(deltaPixels / timeline.cellWidth);
}
