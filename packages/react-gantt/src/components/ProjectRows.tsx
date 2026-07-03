import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import type * as React from "react";
import type {
  GanttLabels,
  NormalizedGanttProject,
  NormalizedGanttTask,
} from "../types";
import { cx } from "../utils/cx";

export function SortableProjectCell<TProjectMeta, TTaskMeta>({
  project,
  children,
  className,
  collapsed,
  height,
  labels,
  onToggle,
  onMouseEnter,
  onMouseLeave,
}: {
  project: NormalizedGanttProject<TProjectMeta, TTaskMeta>;
  children: React.ReactNode;
  className?: string;
  collapsed: boolean;
  height: number;
  labels: Pick<
    GanttLabels<TProjectMeta, TTaskMeta>,
    "reorderProject" | "collapseProject" | "expandProject"
  >;
  onToggle: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `project:${project.id}`,
    data: { type: "project", projectId: project.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cx(
        "sokkay-gantt__project-cell",
        className,
        isDragging && "is-dragging"
      )}
      style={{
        height,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className="sokkay-gantt__project-grip"
        type="button"
        aria-label={labels.reorderProject(project)}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <button
        className="sokkay-gantt__project-toggle"
        type="button"
        aria-label={
          collapsed
            ? labels.expandProject(project)
            : labels.collapseProject(project)
        }
        onClick={onToggle}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
      </button>
      <div className="sokkay-gantt__project-label">{children}</div>
    </div>
  );
}

export function SortableTaskCell<TTaskMeta>({
  task,
  project,
  children,
  className,
  height,
  index,
  onMouseEnter,
  onMouseLeave,
}: {
  task: NormalizedGanttTask<TTaskMeta>;
  project: NormalizedGanttProject<unknown, TTaskMeta>;
  children: React.ReactNode;
  className?: string;
  height: number;
  index: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task-sort:${task.id}`,
    data: { type: "task", taskId: task.id, projectId: project.id, index },
  });

  return (
    <div
      ref={setNodeRef}
      className={cx(
        "sokkay-gantt__task-cell",
        className,
        isDragging && "is-dragging"
      )}
      style={{
        height,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className="sokkay-gantt__task-grip"
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      <div className="sokkay-gantt__task-label">{children}</div>
    </div>
  );
}

export function ProjectDropRow({
  projectId,
  children,
  className,
  height,
  onMouseEnter,
  onMouseLeave,
}: {
  projectId: string;
  children: React.ReactNode;
  className?: string;
  height: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `project-row:${projectId}`,
    data: { type: "project-row", projectId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cx(className, isOver && "is-over")}
      style={{ height }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

export function TaskDropRow({
  taskId,
  projectId,
  index,
  children,
  className,
  height,
  onMouseEnter,
  onMouseLeave,
}: {
  taskId: string;
  projectId: string;
  index: number;
  children: React.ReactNode;
  className?: string;
  height: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `task-row:${taskId}`,
    data: { type: "task-row", taskId, projectId, index },
  });

  return (
    <div
      ref={setNodeRef}
      className={cx(className, isOver && "is-over")}
      style={{ height }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}
