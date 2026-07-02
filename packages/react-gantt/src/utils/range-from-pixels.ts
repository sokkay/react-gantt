import type { PointerInteraction } from "../internal-types";
import type { GanttViewMode } from "../types";
import { addViewUnits, ensureMinimumRange, shiftRangeByUnits } from "./dates";
import { pixelsToUnits, type TimelineModel } from "./timeline";

export function rangeFromPixels<TTaskMeta>(
  interaction: PointerInteraction<TTaskMeta>,
  deltaPixels: number,
  timeline: TimelineModel,
  viewMode: GanttViewMode,
  snapTo: GanttViewMode | "none"
) {
  if (snapTo === "none") {
    const firstCell = timeline.cells[0];
    const millisecondsPerCell = firstCell
      ? firstCell.end.getTime() - firstCell.start.getTime()
      : 86_400_000;
    const deltaMilliseconds =
      (deltaPixels / timeline.cellWidth) * millisecondsPerCell;

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

  const units = pixelsToUnits(deltaPixels, timeline);

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
