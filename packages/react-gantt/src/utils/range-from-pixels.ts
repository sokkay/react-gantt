import type { PointerInteraction } from "../internal-types";
import type { GanttViewMode } from "../types";
import {
  addViewUnits,
  diffViewUnits,
  ensureMinimumRange,
  snapDate,
  snapDateCeil,
  snapEndDate,
} from "./dates";
import {
  cellInclusiveEndDate,
  countTimelineCellsBetween,
  ensureMinimumTimelineRange,
  snapEdgeOnTimelineGrid,
  snapEndOnTimelineGrid,
  snapStartIndexOnTimelineGrid,
  usesTimelineSnapGrid,
} from "./timeline-snap";
import type { TimelineModel } from "./timeline";

const MS_PER_UNIT: Record<GanttViewMode, number> = {
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
  quarter: 7_776_000_000,
  year: 31_536_000_000,
};

export function rangeFromPixels<TTaskMeta>(
  interaction: PointerInteraction<TTaskMeta>,
  deltaPixels: number,
  timeline: TimelineModel,
  viewMode: GanttViewMode,
  snapTo: GanttViewMode | "none",
  minDate?: Date,
  maxDate?: Date
) {
  const firstCell = timeline.cells[0];
  const millisecondsPerCell = firstCell
    ? firstCell.end.getTime() - firstCell.start.getTime()
    : MS_PER_UNIT[viewMode];
  const deltaMilliseconds =
    (deltaPixels / timeline.cellWidth) * millisecondsPerCell;

  let start: Date;
  let end: Date;

  if (snapTo === "none") {
    if (interaction.kind === "move") {
      start = new Date(interaction.start.getTime() + deltaMilliseconds);
      end = new Date(interaction.end.getTime() + deltaMilliseconds);
    } else if (interaction.kind === "resize-start") {
      const res = ensureMinimumRange(
        new Date(interaction.start.getTime() + deltaMilliseconds),
        interaction.end,
        viewMode
      );
      start = res.start;
      end = res.end;
    } else {
      const res = ensureMinimumRange(
        interaction.start,
        new Date(interaction.end.getTime() + deltaMilliseconds),
        viewMode
      );
      start = res.start;
      end = res.end;
    }
  } else if (usesTimelineSnapGrid(snapTo, viewMode, timeline)) {
    if (interaction.kind === "move") {
      const durationCells = countTimelineCellsBetween(
        interaction.start,
        interaction.end,
        timeline
      );
      let startIdx = snapStartIndexOnTimelineGrid(
        interaction.start,
        deltaPixels,
        timeline,
        viewMode
      );
      let endIdx = startIdx + durationCells - 1;

      if (maxDate) {
        let maxIdx = timeline.cells.length - 1;

        for (let index = timeline.cells.length - 1; index >= 0; index -= 1) {
          if (cellInclusiveEndDate(timeline, index) <= maxDate) {
            maxIdx = index;
            break;
          }
        }

        if (endIdx > maxIdx) {
          endIdx = maxIdx;
          startIdx = Math.max(endIdx - durationCells + 1, 0);
        }
      }

      if (minDate) {
        const minIdx = timeline.cells.findIndex(
          (cell) => cell.start >= minDate
        );
        const boundedMinIdx = minIdx >= 0 ? minIdx : timeline.cells.length - 1;

        if (startIdx < boundedMinIdx) {
          startIdx = boundedMinIdx;
          endIdx = startIdx + durationCells - 1;
        }
      }

      startIdx = Math.max(0, Math.min(startIdx, timeline.cells.length - 1));
      endIdx = Math.max(
        startIdx,
        Math.min(endIdx, timeline.cells.length - 1)
      );

      start = timeline.cells[startIdx].start;
      end = cellInclusiveEndDate(timeline, endIdx);
    } else if (interaction.kind === "resize-start") {
      const snappedStart = snapEdgeOnTimelineGrid(
        interaction.start,
        deltaPixels,
        timeline,
        viewMode,
        deltaPixels >= 0 ? "ceil" : "floor"
      );
      const res = ensureMinimumTimelineRange(
        snappedStart,
        interaction.end,
        timeline
      );
      start = res.start;
      end = res.end;
    } else {
      const snappedEnd = snapEndOnTimelineGrid(
        interaction.end,
        deltaPixels,
        timeline,
        viewMode,
        deltaPixels >= 0 ? "ceil" : "floor"
      );
      const res = ensureMinimumTimelineRange(
        interaction.start,
        snappedEnd,
        timeline
      );
      start = res.start;
      end = res.end;
    }
  } else {
    if (interaction.kind === "move") {
      const rawStart = new Date(
        interaction.start.getTime() + deltaMilliseconds
      );
      const snappedStart = snapDate(rawStart, snapTo);
      const durationUnits = Math.max(
        1,
        diffViewUnits(interaction.start, interaction.end, snapTo)
      );
      const res = ensureMinimumRange(
        snappedStart,
        addViewUnits(snappedStart, durationUnits, snapTo),
        snapTo
      );
      start = res.start;
      end = res.end;
    } else if (interaction.kind === "resize-start") {
      const rawStart = new Date(
        interaction.start.getTime() + deltaMilliseconds
      );
      const snappedStart =
        deltaPixels >= 0
          ? snapDateCeil(rawStart, snapTo)
          : snapDate(rawStart, snapTo);
      const res = ensureMinimumRange(
        snappedStart,
        interaction.end,
        snapTo
      );
      start = res.start;
      end = res.end;
    } else {
      const rawEnd = new Date(interaction.end.getTime() + deltaMilliseconds);
      const res = ensureMinimumRange(
        interaction.start,
        snapEndDate(rawEnd, snapTo),
        snapTo
      );
      start = res.start;
      end = res.end;
    }
  }

  if (
    interaction.kind === "move" &&
    !usesTimelineSnapGrid(snapTo, viewMode, timeline)
  ) {
    const duration = end.getTime() - start.getTime();
    if (minDate && start < minDate) {
      start = new Date(minDate);
      end = new Date(start.getTime() + duration);
    }
    if (maxDate && end > maxDate) {
      end = new Date(maxDate);
      start = new Date(end.getTime() - duration);
      if (minDate && start < minDate) {
        start = new Date(minDate);
      }
    }
  } else if (interaction.kind === "resize-start") {
    if (minDate && start < minDate) {
      start = new Date(minDate);
    }
  } else if (interaction.kind === "resize-end") {
    if (maxDate && end > maxDate) {
      end = new Date(maxDate);
    }
  }

  return { start, end };
}
