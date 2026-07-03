import type * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { AUTO_SCROLL_EDGE, AUTO_SCROLL_STEP } from "../constants";
import type { InteractionKind, PointerInteraction } from "../internal-types";
import type {
  GanttChartProps,
  GanttViewMode,
  NormalizedGanttTask,
} from "../types";
import { rangeFromPixels } from "../utils/range-from-pixels";
import type { TimelineModel } from "../utils/timeline";

export function useTaskPointerInteraction<TProjectMeta, TTaskMeta>({
  rootRef,
  timeline,
  viewMode,
  snapTo,
  onTaskMove,
  onTaskResize,
  minDate,
  maxDate,
}: Pick<
  GanttChartProps<TProjectMeta, TTaskMeta>,
  "snapTo" | "onTaskMove" | "onTaskResize"
> & {
  rootRef: React.RefObject<HTMLDivElement | null>;
  timeline: TimelineModel;
  viewMode: GanttViewMode;
  minDate?: Date;
  maxDate?: Date;
}) {
  const [interaction, setInteraction] =
    useState<PointerInteraction<TTaskMeta> | null>(null);

  const autoScroll = useCallback(
    (event: PointerEvent) => {
      const root = rootRef.current;

      if (!root) {
        return;
      }

      const rect = root.getBoundingClientRect();

      if (event.clientX > rect.right - AUTO_SCROLL_EDGE) {
        root.scrollLeft += AUTO_SCROLL_STEP;
      } else if (event.clientX < rect.left + AUTO_SCROLL_EDGE) {
        root.scrollLeft -= AUTO_SCROLL_STEP;
      }

      if (event.clientY > rect.bottom - AUTO_SCROLL_EDGE) {
        root.scrollTop += AUTO_SCROLL_STEP;
      } else if (event.clientY < rect.top + AUTO_SCROLL_EDGE) {
        root.scrollTop -= AUTO_SCROLL_STEP;
      }
    },
    [rootRef]
  );

  useEffect(() => {
    if (!interaction) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      autoScroll(event);
      const range = rangeFromPixels(
        interaction,
        event.clientX - interaction.originX,
        timeline,
        viewMode,
        snapTo ?? viewMode,
        minDate,
        maxDate
      );

      if (interaction.kind === "move") {
        onTaskMove?.({
          taskId: interaction.task.id,
          projectId: interaction.task.projectId,
          ...range,
        });
        return;
      }

      if (interaction.kind === "resize-start") {
        onTaskResize?.({
          taskId: interaction.task.id,
          projectId: interaction.task.projectId,
          edge: "start",
          ...range,
        });
        return;
      }

      onTaskResize?.({
        taskId: interaction.task.id,
        projectId: interaction.task.projectId,
        edge: "end",
        ...range,
      });
    };

    const handleUp = () => setInteraction(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [
    autoScroll,
    interaction,
    onTaskMove,
    onTaskResize,
    snapTo,
    timeline,
    viewMode,
    minDate,
    maxDate,
  ]);

  const handlePointerStart = (
    event: React.PointerEvent,
    kind: InteractionKind,
    task: NormalizedGanttTask<TTaskMeta>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setInteraction({
      kind,
      task,
      originX: event.clientX,
      start: task.start,
      end: task.end,
    });
  };

  return {
    handlePointerStart,
    activeInteraction: interaction,
  };
}
