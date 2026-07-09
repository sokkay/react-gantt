import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTO_SCROLL_EDGE,
  AUTO_SCROLL_STEP,
  POINTER_DRAG_THRESHOLD_PX,
} from "../constants";
import type { InteractionKind, PointerInteraction } from "../internal-types";
import type {
  GanttChartProps,
  GanttViewMode,
  NormalizedGanttTask,
  TaskMovePayload,
  TaskResizePayload,
} from "../types";
import { rangeFromPixels } from "../utils/range-from-pixels";
import type { TimelineModel } from "../utils/timeline";

function rangeChanged(
  range: { start: Date; end: Date },
  interaction: PointerInteraction<unknown>
) {
  return (
    range.start.getTime() !== interaction.start.getTime() ||
    range.end.getTime() !== interaction.end.getTime()
  );
}

export function useTaskPointerInteraction<TProjectMeta, TTaskMeta>({
  rootRef,
  timeline,
  viewMode,
  snapTo,
  onTaskMove,
  onTaskMoveEnd,
  onTaskResize,
  onTaskResizeEnd,
  minDate,
  maxDate,
}: Pick<
  GanttChartProps<TProjectMeta, TTaskMeta>,
  | "snapTo"
  | "onTaskMove"
  | "onTaskMoveEnd"
  | "onTaskResize"
  | "onTaskResizeEnd"
> & {
  rootRef: React.RefObject<HTMLDivElement | null>;
  timeline: TimelineModel;
  viewMode: GanttViewMode;
  minDate?: Date;
  maxDate?: Date;
}) {
  const [interaction, setInteraction] =
    useState<PointerInteraction<TTaskMeta> | null>(null);

  // Keep volatile values in refs so the window listeners stay mounted for the
  // whole drag. Re-binding on every parent render (new callback identities /
  // timeline) can drop the pointerup listener and leave the task stuck.
  const timelineRef = useRef(timeline);
  const viewModeRef = useRef(viewMode);
  const snapToRef = useRef(snapTo);
  const onTaskMoveRef = useRef(onTaskMove);
  const onTaskMoveEndRef = useRef(onTaskMoveEnd);
  const onTaskResizeRef = useRef(onTaskResize);
  const onTaskResizeEndRef = useRef(onTaskResizeEnd);
  const minDateRef = useRef(minDate);
  const maxDateRef = useRef(maxDate);
  const lastMovePayloadRef = useRef<TaskMovePayload | null>(null);
  const lastResizePayloadRef = useRef<TaskResizePayload | null>(null);
  const didInteractRef = useRef(false);
  const endedRef = useRef(false);

  timelineRef.current = timeline;
  viewModeRef.current = viewMode;
  snapToRef.current = snapTo;
  onTaskMoveRef.current = onTaskMove;
  onTaskMoveEndRef.current = onTaskMoveEnd;
  onTaskResizeRef.current = onTaskResize;
  onTaskResizeEndRef.current = onTaskResizeEnd;
  minDateRef.current = minDate;
  maxDateRef.current = maxDate;

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

    lastMovePayloadRef.current = null;
    lastResizePayloadRef.current = null;
    didInteractRef.current = false;
    endedRef.current = false;

    const computeRange = (clientX: number) => {
      const currentViewMode = viewModeRef.current;
      return rangeFromPixels(
        interaction,
        clientX - interaction.originX,
        timelineRef.current,
        currentViewMode,
        snapToRef.current ?? currentViewMode,
        minDateRef.current,
        maxDateRef.current
      );
    };

    const handleMove = (event: PointerEvent) => {
      autoScroll(event);

      const clientX = event.clientX;
      if (typeof clientX !== "number" || Number.isNaN(clientX)) {
        return;
      }

      const deltaX = Math.abs(clientX - interaction.originX);
      const range = computeRange(clientX);
      const isRealInteraction =
        didInteractRef.current ||
        deltaX > POINTER_DRAG_THRESHOLD_PX ||
        rangeChanged(range, interaction);

      if (!isRealInteraction) {
        return;
      }

      didInteractRef.current = true;

      const payload = {
        taskId: interaction.task.id,
        projectId: interaction.task.projectId,
        segmentId: interaction.segmentId,
        ...range,
      };

      if (interaction.kind === "move") {
        lastMovePayloadRef.current = payload;
        onTaskMoveRef.current?.(payload);
        return;
      }

      const resizePayload: TaskResizePayload = {
        ...payload,
        edge: interaction.kind === "resize-start" ? "start" : "end",
      };
      lastResizePayloadRef.current = resizePayload;
      onTaskResizeRef.current?.(resizePayload);
    };

    const handleUp = () => {
      // pointerup and pointercancel can both fire; only commit once.
      if (endedRef.current) {
        return;
      }
      endedRef.current = true;

      // Only commit end callbacks after an actual drag/resize. A plain click
      // (or sub-threshold jitter) still clears the interaction but must not
      // fire *End handlers.
      if (didInteractRef.current) {
        if (interaction.kind === "move") {
          if (lastMovePayloadRef.current) {
            onTaskMoveEndRef.current?.(lastMovePayloadRef.current);
          }
        } else if (lastResizePayloadRef.current) {
          onTaskResizeEndRef.current?.(lastResizePayloadRef.current);
        }
      }

      lastMovePayloadRef.current = null;
      lastResizePayloadRef.current = null;
      didInteractRef.current = false;
      setInteraction(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [autoScroll, interaction]);

  const handlePointerStart = (
    event: React.PointerEvent,
    kind: InteractionKind,
    task: NormalizedGanttTask<TTaskMeta>,
    segmentId?: string
  ) => {
    event.preventDefault();
    event.stopPropagation();

    lastMovePayloadRef.current = null;
    lastResizePayloadRef.current = null;
    didInteractRef.current = false;
    endedRef.current = false;

    const segment = segmentId
      ? task.segments?.find((item) => item.id === segmentId)
      : undefined;

    setInteraction({
      kind,
      task,
      segmentId,
      originX: event.clientX ?? 0,
      start: segment?.start ?? task.start,
      end: segment?.end ?? task.end,
    });
  };

  return {
    handlePointerStart,
    activeInteraction: interaction,
  };
}
