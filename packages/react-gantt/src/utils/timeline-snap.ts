import { addDays } from "date-fns";
import type { GanttViewMode } from "../types";
import { dateToPrecisePixels, type TimelineModel } from "./timeline";

export type TimelineSnapPreference = "floor" | "ceil" | "round";

export function usesTimelineSnapGrid(
  snapTo: GanttViewMode | "none",
  viewMode: GanttViewMode,
  timeline: TimelineModel
) {
  return snapTo !== "none" && snapTo === viewMode && timeline.cells.length > 0;
}

export function getTimelineDivisions(timeline: TimelineModel) {
  return timeline.cells.map((cell) => cell.start);
}

export function findCellIndexForDate(date: Date, timeline: TimelineModel) {
  const exactStart = timeline.cells.findIndex(
    (cell) => cell.start.getTime() === date.getTime()
  );

  if (exactStart >= 0) {
    return exactStart;
  }

  const containing = timeline.cells.findIndex(
    (cell) => date >= cell.start && date < cell.end
  );

  if (containing >= 0) {
    return containing;
  }

  if (date < timeline.cells[0].start) {
    return 0;
  }

  return timeline.cells.length - 1;
}

export function cellInclusiveEndDate(
  timeline: TimelineModel,
  cellIndex: number
) {
  const cell = timeline.cells[cellIndex];
  return addDays(cell.end, -1);
}

function snapCellIndexOnTimelineGrid(
  edge: Date,
  deltaPixels: number,
  timeline: TimelineModel,
  viewMode: GanttViewMode,
  preference: TimelineSnapPreference
) {
  if (timeline.cells.length === 0) {
    return findCellIndexForDate(edge, timeline);
  }

  const pixels = dateToPrecisePixels(edge, timeline, viewMode) + deltaPixels;

  if (!Number.isFinite(pixels)) {
    return findCellIndexForDate(edge, timeline);
  }

  const rawIndex = pixels / timeline.cellWidth;
  // Tiny epsilon avoids ceil/floor jumping an extra cell when floating-point
  // noise lands just past/before an exact boundary (e.g. 2.0000000002).
  const EPS = 1e-6;

  let index =
    preference === "floor"
      ? Math.floor(rawIndex + EPS)
      : preference === "ceil"
        ? Math.ceil(rawIndex - EPS)
        : Math.round(rawIndex);

  return Math.max(0, Math.min(index, timeline.cells.length - 1));
}

export function snapEdgeOnTimelineGrid(
  edge: Date,
  deltaPixels: number,
  timeline: TimelineModel,
  viewMode: GanttViewMode,
  preference: TimelineSnapPreference
) {
  const index = snapCellIndexOnTimelineGrid(
    edge,
    deltaPixels,
    timeline,
    viewMode,
    preference
  );

  return timeline.cells[index].start;
}

export function snapEndOnTimelineGrid(
  edge: Date,
  deltaPixels: number,
  timeline: TimelineModel,
  viewMode: GanttViewMode,
  preference: TimelineSnapPreference
) {
  const index = snapCellIndexOnTimelineGrid(
    edge,
    deltaPixels,
    timeline,
    viewMode,
    preference
  );

  return cellInclusiveEndDate(timeline, index);
}

export function snapStartIndexOnTimelineGrid(
  start: Date,
  deltaPixels: number,
  timeline: TimelineModel,
  viewMode: GanttViewMode
) {
  if (timeline.cells.length === 0) {
    return 0;
  }

  const pixels = dateToPrecisePixels(start, timeline, viewMode) + deltaPixels;

  if (!Number.isFinite(pixels)) {
    return findCellIndexForDate(start, timeline);
  }

  const index = Math.round(pixels / timeline.cellWidth);

  return Math.max(0, Math.min(index, timeline.cells.length - 1));
}

export function countTimelineCellsBetween(
  start: Date,
  end: Date,
  timeline: TimelineModel
) {
  const startIdx = findCellIndexForDate(start, timeline);
  const endIdx = findCellIndexForDate(end, timeline);

  return Math.max(1, endIdx - startIdx + 1);
}

export function ensureMinimumTimelineRange(
  start: Date,
  end: Date,
  timeline: TimelineModel
) {
  let startIdx = findCellIndexForDate(start, timeline);
  let endIdx = findCellIndexForDate(end, timeline);

  if (end < start || endIdx < startIdx) {
    endIdx = startIdx;
  }

  return {
    start: timeline.cells[startIdx].start,
    end: cellInclusiveEndDate(timeline, endIdx),
  };
}
