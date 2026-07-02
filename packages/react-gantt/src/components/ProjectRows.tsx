import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import type * as React from "react";
import type { GanttLabels, NormalizedGanttProject } from "../types";
import { cx } from "../utils/cx";

export function SortableProjectCell<TProjectMeta, TTaskMeta>({
  project,
  children,
  className,
  collapsed,
  height,
  labels,
  onToggle,
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

export function ProjectDropRow({
  projectId,
  children,
  className,
  height,
}: {
  projectId: string;
  children: React.ReactNode;
  className?: string;
  height: number;
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
    >
      {children}
    </div>
  );
}
