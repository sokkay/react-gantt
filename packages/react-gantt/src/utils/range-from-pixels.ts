import type { PointerInteraction } from "../internal-types";
import type { GanttViewMode } from "../types";
import { addViewUnits, ensureMinimumRange, shiftRangeByUnits } from "./dates";
import type { TimelineModel } from "./timeline";

const MS_PER_UNIT: Record<GanttViewMode, number> = {
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000, // 30 días
  quarter: 7_776_000_000, // 90 días
  year: 31_536_000_000, // 365 días
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
  } else {
    const units = Math.round(deltaMilliseconds / MS_PER_UNIT[snapTo]);

    if (interaction.kind === "move") {
      const res = shiftRangeByUnits(
        interaction.start,
        interaction.end,
        units,
        snapTo
      );
      start = res.start;
      end = res.end;
    } else if (interaction.kind === "resize-start") {
      const res = ensureMinimumRange(
        addViewUnits(interaction.start, units, snapTo),
        interaction.end,
        snapTo
      );
      start = res.start;
      end = res.end;
    } else {
      const res = ensureMinimumRange(
        interaction.start,
        addViewUnits(interaction.end, units, snapTo),
        snapTo
      );
      start = res.start;
      end = res.end;
    }
  }

  if (interaction.kind === "move") {
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
