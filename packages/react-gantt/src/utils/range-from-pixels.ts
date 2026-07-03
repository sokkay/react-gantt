import type { PointerInteraction } from "../internal-types";
import type { GanttViewMode } from "../types";
import { addViewUnits, ensureMinimumRange, shiftRangeByUnits } from "./dates";
import type { TimelineModel } from "./timeline";

const MS_PER_UNIT: Record<GanttViewMode, number> = {
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,     // 30 días
  quarter: 7_776_000_000,   // 90 días
  year: 31_536_000_000,     // 365 días
};

export function rangeFromPixels<TTaskMeta>(
  interaction: PointerInteraction<TTaskMeta>,
  deltaPixels: number,
  timeline: TimelineModel,
  viewMode: GanttViewMode,
  snapTo: GanttViewMode | "none"
) {
  const firstCell = timeline.cells[0];
  const millisecondsPerCell = firstCell
    ? firstCell.end.getTime() - firstCell.start.getTime()
    : MS_PER_UNIT[viewMode];
  const deltaMilliseconds =
    (deltaPixels / timeline.cellWidth) * millisecondsPerCell;

  if (snapTo === "none") {
    if (interaction.kind === "move") {
      return {
        start: new Date(interaction.start.getTime() + deltaMilliseconds),
        end: new Date(interaction.end.getTime() + deltaMilliseconds),
      };
    }

    if (interaction.kind === "resize-start") {
      return ensureMinimumRange(
        new Date(interaction.start.getTime() + deltaMilliseconds),
        interaction.end,
        viewMode
      );
    }

    return ensureMinimumRange(
      interaction.start,
      new Date(interaction.end.getTime() + deltaMilliseconds),
      viewMode
    );
  }

  const units = Math.round(deltaMilliseconds / MS_PER_UNIT[snapTo]);

  if (interaction.kind === "move") {
    return shiftRangeByUnits(interaction.start, interaction.end, units, snapTo);
  }

  if (interaction.kind === "resize-start") {
    return ensureMinimumRange(
      addViewUnits(interaction.start, units, snapTo),
      interaction.end,
      snapTo
    );
  }

  return ensureMinimumRange(
    interaction.start,
    addViewUnits(interaction.end, units, snapTo),
    snapTo
  );
}
