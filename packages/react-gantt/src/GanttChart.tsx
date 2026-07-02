import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";
import { GripVertical, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type * as React from "react";
import type {
  ContextMenuActions,
  GanttChartProps,
  GanttTheme,
  GanttViewMode,
  NormalizedGanttProject,
  NormalizedGanttTask,
} from "./types";
import { addViewUnits, diffViewUnits, ensureMinimumRange, normalizeProjects, shiftRangeByUnits } from "./utils/dates";
import { buildTimeline, dateToPixels, pixelsToUnits, type TimelineModel } from "./utils/timeline";

type InteractionKind = "move" | "resize-start" | "resize-end";

interface PointerInteraction<TTaskMeta> {
  kind: InteractionKind;
  task: NormalizedGanttTask<TTaskMeta>;
  originX: number;
  start: Date;
  end: Date;
}

interface ContextMenuState<TTaskMeta> {
  task: NormalizedGanttTask<TTaskMeta>;
  x: number;
  y: number;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function createThemeStyle(theme?: GanttTheme) {
  if (!theme) {
    return undefined;
  }

  return {
    "--sg-background": theme.background,
    "--sg-surface": theme.surface,
    "--sg-border": theme.border,
    "--sg-text": theme.text,
    "--sg-muted-text": theme.mutedText,
    "--sg-grid": theme.grid,
    "--sg-task": theme.task,
    "--sg-task-text": theme.taskText,
    "--sg-selected": theme.selected,
    "--sg-row-height": theme.rowHeight,
    "--sg-sidebar-width": theme.sidebarWidth,
    "--sg-header-height": theme.headerHeight,
  } as React.CSSProperties;
}

function getProjectOrder<TProjectMeta, TTaskMeta>(
  projects: Array<NormalizedGanttProject<TProjectMeta, TTaskMeta>>,
  activeProjectId: string,
  overProjectId: string,
) {
  const oldIndex = projects.findIndex((project) => project.id === activeProjectId);
  const newIndex = projects.findIndex((project) => project.id === overProjectId);

  if (oldIndex < 0 || newIndex < 0) {
    return projects;
  }

  return arrayMove(projects, oldIndex, newIndex);
}

function SortableProjectCell<TProjectMeta, TTaskMeta>({
  project,
  children,
  className,
}: {
  project: NormalizedGanttProject<TProjectMeta, TTaskMeta>;
  children: React.ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `project:${project.id}`,
    data: { type: "project", projectId: project.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cx("sokkay-gantt__project-cell", className, isDragging && "is-dragging")}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button className="sokkay-gantt__project-grip" type="button" aria-label={`Reorder ${project.name}`} {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <div className="sokkay-gantt__project-label">{children}</div>
    </div>
  );
}

function ProjectDropRow({
  projectId,
  children,
  className,
}: {
  projectId: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `project-row:${projectId}`,
    data: { type: "project-row", projectId },
  });

  return (
    <div ref={setNodeRef} className={cx(className, isOver && "is-over")}>
      {children}
    </div>
  );
}

function TransferHandle({ task }: { task: NormalizedGanttTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task:${task.id}`,
    data: { type: "task", taskId: task.id, projectId: task.projectId },
  });

  return (
    <button
      ref={setNodeRef}
      className={cx("sokkay-gantt__task-transfer", isDragging && "is-dragging")}
      style={{ transform: CSS.Transform.toString(transform) }}
      type="button"
      aria-label={`Move ${task.name} to another project`}
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

function TaskBar<TTaskMeta>({
  task,
  selected,
  timeline,
  viewMode,
  renderTask,
  renderTaskTooltip,
  onPointerStart,
  onSelect,
  onContextMenu,
  className,
}: {
  task: NormalizedGanttTask<TTaskMeta>;
  selected: boolean;
  timeline: TimelineModel;
  viewMode: GanttViewMode;
  renderTask?: GanttChartProps<unknown, TTaskMeta>["renderTask"];
  renderTaskTooltip?: GanttChartProps<unknown, TTaskMeta>["renderTaskTooltip"];
  onPointerStart: (event: React.PointerEvent, kind: InteractionKind, task: NormalizedGanttTask<TTaskMeta>) => void;
  onSelect: (task: NormalizedGanttTask<TTaskMeta>) => void;
  onContextMenu: (event: React.MouseEvent, task: NormalizedGanttTask<TTaskMeta>) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    placement: "top",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });
  const left = dateToPixels(task.start, timeline, viewMode);
  const units = Math.max(diffViewUnits(task.start, task.end, viewMode), 1);
  const width = Math.max(units * timeline.cellWidth, 36);
  const progress = Math.max(0, Math.min(task.progress ?? 0, 100));

  return (
    <>
      <div
        ref={refs.setReference}
        className={cx("sokkay-gantt__task", selected && "is-selected", className)}
        data-testid={`task-${task.id}`}
        style={{
          left,
          width,
          "--sg-task-color": task.color,
        } as React.CSSProperties}
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
        <div className="sokkay-gantt__task-progress" style={{ width: `${progress}%` }} />
        <div className="sokkay-gantt__task-content">
          {renderTask ? renderTask(task, { selected }) : <span>{task.name}</span>}
        </div>
        <TransferHandle task={task} />
        <span
          className="sokkay-gantt__resize sokkay-gantt__resize--end"
          onPointerDown={(event) => onPointerStart(event, "resize-end", task)}
        />
      </div>
      {open && (
        <div ref={refs.setFloating} className="sokkay-gantt__tooltip" style={floatingStyles} role="tooltip">
          {renderTaskTooltip ? renderTaskTooltip(task) : <DefaultTooltip task={task} />}
        </div>
      )}
    </>
  );
}

export function GanttChart<TProjectMeta = unknown, TTaskMeta = unknown>({
  projects,
  viewMode,
  selectedTaskId = null,
  className,
  classNames,
  theme,
  onTaskMove,
  onTaskResize,
  onTaskTransfer,
  onProjectReorder,
  onTaskSelect,
  onTaskContextMenu,
  renderTask,
  renderTaskTooltip,
  renderContextMenu,
  renderSelectionToolbar,
  renderProjectCell,
}: GanttChartProps<TProjectMeta, TTaskMeta>) {
  const normalizedProjects = useMemo(() => normalizeProjects(projects), [projects]);
  const timeline = useMemo(() => buildTimeline(normalizedProjects, viewMode), [normalizedProjects, viewMode]);
  const selectedTask = useMemo(
    () => normalizedProjects.flatMap((project) => project.tasks).find((task) => task.id === selectedTaskId) ?? null,
    [normalizedProjects, selectedTaskId],
  );
  const [interaction, setInteraction] = useState<PointerInteraction<TTaskMeta> | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState<TTaskMeta> | null>(null);

  const closeContextMenu = () => setContextMenu(null);
  const contextActions: ContextMenuActions = {
    close: closeContextMenu,
    select: () => {
      if (contextMenu) {
        onTaskSelect?.(contextMenu.task);
      }
    },
  };

  useEffect(() => {
    if (!interaction) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      const units = pixelsToUnits(event.clientX - interaction.originX, timeline);

      if (units === 0) {
        return;
      }

      if (interaction.kind === "move") {
        const range = shiftRangeByUnits(interaction.start, interaction.end, units, viewMode);
        onTaskMove?.({
          taskId: interaction.task.id,
          projectId: interaction.task.projectId,
          ...range,
        });
        return;
      }

      if (interaction.kind === "resize-start") {
        const range = ensureMinimumRange(addViewUnits(interaction.start, units, viewMode), interaction.end, viewMode);
        onTaskResize?.({
          taskId: interaction.task.id,
          projectId: interaction.task.projectId,
          edge: "start",
          ...range,
        });
        return;
      }

      const range = ensureMinimumRange(interaction.start, addViewUnits(interaction.end, units, viewMode), viewMode);
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
  }, [interaction, onTaskMove, onTaskResize, timeline, viewMode]);

  const handlePointerStart = (
    event: React.PointerEvent,
    kind: InteractionKind,
    task: NormalizedGanttTask<TTaskMeta>,
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

  const handleContextMenu = (event: React.MouseEvent, task: NormalizedGanttTask<TTaskMeta>) => {
    event.preventDefault();
    event.stopPropagation();
    const nextActions: ContextMenuActions = {
      close: closeContextMenu,
      select: () => onTaskSelect?.(task),
    };
    setContextMenu({ task, x: event.clientX, y: event.clientY });
    onTaskContextMenu?.({ task, event, actions: nextActions });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const active = event.active.data.current;
    const over = event.over?.data.current;

    if (!active || !over) {
      return;
    }

    if (active.type === "project" && over.type === "project") {
      const activeProjectId = String(active.projectId);
      const overProjectId = String(over.projectId);

      if (activeProjectId !== overProjectId) {
        onProjectReorder?.({
          activeProjectId,
          overProjectId,
          projects: getProjectOrder(normalizedProjects, activeProjectId, overProjectId),
        });
      }
    }

    if (active.type === "task" && over.type === "project-row") {
      const fromProjectId = String(active.projectId);
      const toProjectId = String(over.projectId);

      if (fromProjectId !== toProjectId) {
        onTaskTransfer?.({
          taskId: String(active.taskId),
          fromProjectId,
          toProjectId,
          index: normalizedProjects.find((project) => project.id === toProjectId)?.tasks.length ?? 0,
        });
      }
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div
        className={cx("sokkay-gantt", className, classNames?.root)}
        style={createThemeStyle(theme)}
        onClick={() => onTaskSelect?.(null)}
      >
        {selectedTask && (
          <div className="sokkay-gantt__selection-toolbar">
            {renderSelectionToolbar ? (
              renderSelectionToolbar(selectedTask, { close: closeContextMenu, select: () => onTaskSelect?.(selectedTask) })
            ) : (
              <>
                <strong>{selectedTask.name}</strong>
                <button type="button" onClick={() => onTaskSelect?.(null)}>
                  Clear
                </button>
              </>
            )}
          </div>
        )}

        <div className={cx("sokkay-gantt__header", classNames?.header)}>
          <div className={cx("sokkay-gantt__sidebar-header", classNames?.sidebar)}>Project</div>
          <div className={cx("sokkay-gantt__timeline-header", classNames?.timeline)} style={{ width: timeline.width }}>
            {timeline.cells.map((cell) => (
              <div className="sokkay-gantt__header-cell" style={{ width: timeline.cellWidth }} key={cell.id}>
                {cell.label}
              </div>
            ))}
          </div>
        </div>

        <SortableContext items={normalizedProjects.map((project) => `project:${project.id}`)} strategy={verticalListSortingStrategy}>
          <div className="sokkay-gantt__body">
            <div className="sokkay-gantt__sidebar">
              {normalizedProjects.map((project) => (
                <SortableProjectCell
                  className={classNames?.projectCell}
                  project={project}
                  key={project.id}
                >
                  {renderProjectCell ? renderProjectCell(project) : project.name}
                </SortableProjectCell>
              ))}
            </div>

            <div className="sokkay-gantt__timeline" style={{ width: timeline.width }}>
              {normalizedProjects.map((project) => (
                <ProjectDropRow
                  projectId={project.id}
                  className={cx("sokkay-gantt__row", classNames?.projectRow)}
                  key={project.id}
                >
                  {timeline.cells.map((cell) => (
                    <div className="sokkay-gantt__grid-cell" style={{ width: timeline.cellWidth }} key={cell.id} />
                  ))}
                  {project.tasks.map((task) => (
                    <TaskBar
                      className={cx(classNames?.task, selectedTaskId === task.id && classNames?.selectedTask)}
                      key={task.id}
                      task={task}
                      selected={selectedTaskId === task.id}
                      timeline={timeline}
                      viewMode={viewMode}
                      renderTask={renderTask}
                      renderTaskTooltip={renderTaskTooltip}
                      onPointerStart={handlePointerStart}
                      onSelect={(nextTask) => onTaskSelect?.(nextTask)}
                      onContextMenu={handleContextMenu}
                    />
                  ))}
                </ProjectDropRow>
              ))}
            </div>
          </div>
        </SortableContext>

        {contextMenu && (
          <div
            className="sokkay-gantt__context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            role="menu"
            onClick={(event) => event.stopPropagation()}
          >
            {renderContextMenu ? (
              renderContextMenu({ task: contextMenu.task, actions: contextActions })
            ) : (
              <>
                <button type="button" onClick={() => contextActions.select()}>
                  Select
                </button>
                <button type="button" onClick={contextActions.close}>
                  Close
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </DndContext>
  );
}
