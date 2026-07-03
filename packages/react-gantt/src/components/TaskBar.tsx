import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { MoreHorizontal } from "lucide-react";
import type * as React from "react";
import { useCallback, useState } from "react";
import type { InteractionKind } from "../internal-types";
import type {
  GanttChartProps,
  GanttLabels,
  GanttViewMode,
  NormalizedGanttTask,
} from "../types";
import { cx } from "../utils/cx";
import { dateRangeToPixels, type TimelineModel } from "../utils/timeline";

function TransferHandle<TTaskMeta>({
  task,
  index,
  labels,
}: {
  task: NormalizedGanttTask<TTaskMeta>;
  index: number;
  labels: Pick<GanttLabels<unknown, TTaskMeta>, "transferTask">;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `task:${task.id}`,
      data: { type: "task", taskId: task.id, projectId: task.projectId, index },
    });

  return (
    <button
      ref={setNodeRef}
      className={cx("sokkay-gantt__task-transfer", isDragging && "is-dragging")}
      style={{ transform: CSS.Transform.toString(transform) }}
      type="button"
      aria-label={labels.transferTask(task)}
      {...attributes}
      {...listeners}
    >
      <MoreHorizontal size={14} />
    </button>
  );
}

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
  labels,
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
  labels: Pick<GanttLabels<unknown, TTaskMeta>, "transferTask">;
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
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
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
        <TransferHandle task={task} index={index} labels={labels} />
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
