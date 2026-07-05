import { useDroppable } from "@dnd-kit/core";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import type * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { InteractionKind } from "../internal-types";
import type {
  GanttChartProps,
  GanttViewMode,
  NormalizedGanttTask,
} from "../types";
import { cx } from "../utils/cx";
import { dateRangeToPixels, type TimelineModel } from "../utils/timeline";

function DefaultTooltip({ task }: { task: NormalizedGanttTask }) {
  return (
    <div>
      <strong>{task.name}</strong>
      <span>
        {task.start.toLocaleDateString()} - {task.end.toLocaleDateString()}
      </span>
    </div>
  );
}

export function TaskBar<TTaskMeta>({
  task,
  index,
  top,
  selected,
  timeline,
  viewMode,
  renderTask,
  renderTaskTooltip,
  onPointerStart,
  onSelect,
  onContextMenu,
  className,
  isInteracting,
}: {
  task: NormalizedGanttTask<TTaskMeta>;
  index: number;
  top: number;
  selected: boolean;
  timeline: TimelineModel;
  viewMode: GanttViewMode;
  renderTask?: GanttChartProps<unknown, TTaskMeta>["renderTask"];
  renderTaskTooltip?: GanttChartProps<unknown, TTaskMeta>["renderTaskTooltip"];
  onPointerStart: (
    event: React.PointerEvent,
    kind: InteractionKind,
    task: NormalizedGanttTask<TTaskMeta>
  ) => void;
  onSelect: (task: NormalizedGanttTask<TTaskMeta>) => void;
  onContextMenu: (
    event: React.MouseEvent,
    task: NormalizedGanttTask<TTaskMeta>
  ) => void;
  className?: string;
  isInteracting?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pointerCoords, setPointerCoords] = useState<{ x: number; y: number } | null>(null);
  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: `task-drop:${task.id}`,
    data: { type: "task", taskId: task.id, projectId: task.projectId, index },
  });
  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    placement: "top",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });

  const virtualElement = useMemo(() => {
    if (!pointerCoords) return null;
    return {
      getBoundingClientRect() {
        return {
          width: 0,
          height: 0,
          x: pointerCoords.x,
          y: pointerCoords.y,
          top: pointerCoords.y,
          left: pointerCoords.x,
          right: pointerCoords.x,
          bottom: pointerCoords.y,
        };
      },
    };
  }, [pointerCoords]);

  useEffect(() => {
    if (virtualElement) {
      refs.setPositionReference(virtualElement);
    } else {
      refs.setPositionReference(null);
    }
  }, [virtualElement, refs]);

  const { setReference: setFloatingReference, setFloating } = refs;
  const range = dateRangeToPixels(task.start, task.end, timeline, viewMode);
  const width = Math.max(range.width, 36);
  const progress = Math.max(0, Math.min(task.progress ?? 0, 100));
  const setReference = useCallback(
    (node: HTMLDivElement | null) => {
      setFloatingReference(node);
      setDropNodeRef(node);
    },
    [setDropNodeRef, setFloatingReference]
  );

  return (
    <>
      <div
        ref={setReference}
        className={cx(
          "sokkay-gantt__task",
          selected && "is-selected",
          isOver && "is-over",
          isInteracting && "is-interacting",
          className
        )}
        data-testid={`task-${task.id}`}
        style={
          {
            left: range.left,
            top,
            width,
            "--sg-task-color": task.color,
          } as React.CSSProperties
        }
        onPointerEnter={(event) => {
          setPointerCoords({ x: event.clientX, y: event.clientY });
          setOpen(true);
        }}
        onPointerLeave={() => {
          setOpen(false);
          setPointerCoords(null);
        }}
        onPointerDown={(event) => onPointerStart(event, "move", task)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(task);
        }}
        onContextMenu={(event) => onContextMenu(event, task)}
      >
        <span
          className="sokkay-gantt__resize sokkay-gantt__resize--start"
          onPointerDown={(event) => onPointerStart(event, "resize-start", task)}
        />
        <div
          className="sokkay-gantt__task-progress"
          style={{ width: `${progress}%` }}
        />
        <div className="sokkay-gantt__task-content">
          {renderTask ? (
            renderTask(task, { selected })
          ) : (
            <span>{task.name}</span>
          )}
        </div>
        <span
          className="sokkay-gantt__resize sokkay-gantt__resize--end"
          onPointerDown={(event) => onPointerStart(event, "resize-end", task)}
        />
      </div>
      {open && (
        <div
          ref={setFloating}
          className="sokkay-gantt__tooltip"
          style={floatingStyles}
          role="tooltip"
        >
          {renderTaskTooltip ? (
            renderTaskTooltip(task)
          ) : (
            <DefaultTooltip task={task} />
          )}
        </div>
      )}
    </>
  );
}
