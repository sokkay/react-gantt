import { useDroppable } from "@dnd-kit/core";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import type * as React from "react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InteractionKind } from "../internal-types";
import type {
  GanttChartProps,
  GanttViewMode,
  NormalizedGanttTask,
  NormalizedGanttTaskSegment,
} from "../types";
import { cx } from "../utils/cx";
import { dateRangeToPixels, type TimelineModel } from "../utils/timeline";

function DefaultTooltip({
  task,
  segment,
}: {
  task: NormalizedGanttTask;
  segment?: NormalizedGanttTaskSegment;
}) {
  const start = segment?.start ?? task.start;
  const end = segment?.end ?? task.end;

  return (
    <div>
      <strong>{task.name}</strong>
      <span>
        {start.toLocaleDateString()} - {end.toLocaleDateString()}
      </span>
    </div>
  );
}

function TaskBarSegment<TTaskMeta>({
  task,
  segment,
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
  isSegment,
}: {
  task: NormalizedGanttTask<TTaskMeta>;
  segment?: NormalizedGanttTaskSegment;
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
    task: NormalizedGanttTask<TTaskMeta>,
    segmentId?: string
  ) => void;
  onSelect: (task: NormalizedGanttTask<TTaskMeta>) => void;
  onContextMenu: (
    event: React.MouseEvent,
    task: NormalizedGanttTask<TTaskMeta>
  ) => void;
  className?: string;
  isInteracting?: boolean;
  isSegment: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pointerCoords, setPointerCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: segment
      ? `task-drop:${task.id}:${segment.id}`
      : `task-drop:${task.id}`,
    data: { type: "task", taskId: task.id, projectId: task.projectId, index },
  });
  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    placement: "top",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });

  const elementRef = useRef<HTMLDivElement | null>(null);

  const virtualElement = useMemo(() => {
    if (!pointerCoords) return null;
    return {
      getBoundingClientRect() {
        const rect = elementRef.current?.getBoundingClientRect();
        const y = rect ? rect.top : pointerCoords.y;
        return {
          width: 0,
          height: 0,
          x: pointerCoords.x,
          y,
          top: y,
          left: pointerCoords.x,
          right: pointerCoords.x,
          bottom: y,
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
  const start = segment?.start ?? task.start;
  const end = segment?.end ?? task.end;
  const range = dateRangeToPixels(start, end, timeline, viewMode);
  const width = Math.max(range.width, 36);
  const progress = Math.max(0, Math.min(task.progress ?? 0, 100));
  const setReference = useCallback(
    (node: HTMLDivElement | null) => {
      elementRef.current = node;
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
          isSegment && "sokkay-gantt__task--segment",
          selected && "is-selected",
          isOver && "is-over",
          isInteracting && "is-interacting",
          className
        )}
        data-testid={
          segment ? `task-${task.id}-segment-${segment.id}` : `task-${task.id}`
        }
        data-segment-id={segment?.id}
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
        onPointerDown={(event) =>
          onPointerStart(event, "move", task, segment?.id)
        }
        onClick={(event) => {
          event.stopPropagation();
          onSelect(task);
        }}
        onContextMenu={(event) => onContextMenu(event, task)}
      >
        <span
          className="sokkay-gantt__resize sokkay-gantt__resize--start"
          onPointerDown={(event) =>
            onPointerStart(event, "resize-start", task, segment?.id)
          }
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
          onPointerDown={(event) =>
            onPointerStart(event, "resize-end", task, segment?.id)
          }
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
            renderTaskTooltip(task, { segment })
          ) : (
            <DefaultTooltip task={task} segment={segment} />
          )}
        </div>
      )}
    </>
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
  interactingSegmentId,
  showSegmentConnectors = false,
  connectorClassName,
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
    task: NormalizedGanttTask<TTaskMeta>,
    segmentId?: string
  ) => void;
  onSelect: (task: NormalizedGanttTask<TTaskMeta>) => void;
  onContextMenu: (
    event: React.MouseEvent,
    task: NormalizedGanttTask<TTaskMeta>
  ) => void;
  className?: string;
  isInteracting?: boolean;
  interactingSegmentId?: string;
  showSegmentConnectors?: boolean;
  connectorClassName?: string;
}) {
  const segments = task.segments;

  if (!segments?.length) {
    return (
      <TaskBarSegment
        task={task}
        index={index}
        top={top}
        selected={selected}
        timeline={timeline}
        viewMode={viewMode}
        renderTask={renderTask}
        renderTaskTooltip={renderTaskTooltip}
        onPointerStart={onPointerStart}
        onSelect={onSelect}
        onContextMenu={onContextMenu}
        className={className}
        isInteracting={isInteracting}
        isSegment={false}
      />
    );
  }

  return (
    <>
      {segments.map((segment, segmentIndex) => {
        const next = segments[segmentIndex + 1];
        const currentRange = dateRangeToPixels(
          segment.start,
          segment.end,
          timeline,
          viewMode
        );
        const currentWidth = Math.max(currentRange.width, 36);
        const nextRange = next
          ? dateRangeToPixels(next.start, next.end, timeline, viewMode)
          : null;
        const gapLeft = currentRange.left + currentWidth;
        const gapWidth = nextRange ? Math.max(nextRange.left - gapLeft, 0) : 0;
        const showConnector =
          showSegmentConnectors && next && gapWidth > 1;

        return (
          <Fragment key={segment.id}>
            <TaskBarSegment
              task={task}
              segment={segment}
              index={index}
              top={top}
              selected={selected}
              timeline={timeline}
              viewMode={viewMode}
              renderTask={renderTask}
              renderTaskTooltip={renderTaskTooltip}
              onPointerStart={onPointerStart}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              className={className}
              isInteracting={
                isInteracting &&
                (!interactingSegmentId || interactingSegmentId === segment.id)
              }
              isSegment
            />
            {showConnector ? (
              <div
                className={cx(
                  "sokkay-gantt__segment-connector",
                  selected && "is-selected",
                  connectorClassName
                )}
                data-testid={`task-${task.id}-connector-${segment.id}-${next.id}`}
                aria-hidden="true"
                style={
                  {
                    left: gapLeft,
                    top,
                    width: gapWidth,
                    "--sg-task-color": task.color,
                  } as React.CSSProperties
                }
              />
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
}
