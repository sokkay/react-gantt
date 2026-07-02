import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type * as React from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ProjectDropRow, SortableProjectCell } from "./components/ProjectRows";
import { TaskBar } from "./components/TaskBar";
import {
  AUTO_SCROLL_EDGE,
  AUTO_SCROLL_STEP,
  DEFAULT_LANE_GAP,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_TASK_HEIGHT,
} from "./constants";
import type { InteractionKind, PointerInteraction } from "./internal-types";
import { defaultGanttLabels } from "./labels";
import type {
  CollapsedProjectSummary,
  ContextMenuActions,
  GanttChartHandle,
  GanttChartProps,
  GanttLabels,
  GanttTheme,
  GanttViewMode,
  NormalizedGanttProject,
  NormalizedGanttTask,
} from "./types";
import { cx } from "./utils/cx";
import {
  addViewUnits,
  ensureMinimumRange,
  normalizeDate,
  normalizeProjects,
  shiftRangeByUnits,
} from "./utils/dates";
import { buildProjectLayouts } from "./utils/layout";
import {
  buildTimeline,
  dateRangeToPixels,
  dateToPixels,
  pixelsToUnits,
  type TimelineModel,
} from "./utils/timeline";

interface ContextMenuState<TTaskMeta> {
  task: NormalizedGanttTask<TTaskMeta>;
  x: number;
  y: number;
}

function toCssSize(value?: string | number) {
  return typeof value === "number" ? `${value}px` : value;
}

function createThemeStyle({
  theme,
  sidebarWidth,
  minSidebarWidth,
}: {
  theme?: GanttTheme;
  sidebarWidth?: string | number;
  minSidebarWidth?: string | number;
}) {
  return {
    "--sg-background": theme?.background,
    "--sg-surface": theme?.surface,
    "--sg-border": theme?.border,
    "--sg-text": theme?.text,
    "--sg-muted-text": theme?.mutedText,
    "--sg-grid": theme?.grid,
    "--sg-task": theme?.task,
    "--sg-task-text": theme?.taskText,
    "--sg-selected": theme?.selected,
    "--sg-row-height": theme?.rowHeight,
    "--sg-sidebar-width": toCssSize(sidebarWidth ?? theme?.sidebarWidth),
    "--sg-sidebar-min-width": toCssSize(
      minSidebarWidth ?? theme?.minSidebarWidth
    ),
    "--sg-header-height": theme?.headerHeight,
    "--sg-task-height": theme?.taskHeight,
    "--sg-lane-gap": theme?.laneGap,
  } as React.CSSProperties;
}

function moveTaskWithinProject<TTaskMeta>(
  tasks: Array<NormalizedGanttTask<TTaskMeta>>,
  taskId: string,
  overTaskId: string
) {
  const fromIndex = tasks.findIndex((task) => task.id === taskId);
  const overIndex = tasks.findIndex((task) => task.id === overTaskId);

  if (fromIndex < 0 || overIndex < 0) {
    return { fromIndex, toIndex: fromIndex, tasks };
  }

  return {
    fromIndex,
    toIndex: overIndex,
    tasks: arrayMove(tasks, fromIndex, overIndex),
  };
}

function findTaskProject<TProjectMeta, TTaskMeta>(
  projects: Array<NormalizedGanttProject<TProjectMeta, TTaskMeta>>,
  taskId: string
) {
  return (
    projects.find((project) =>
      project.tasks.some((task) => task.id === taskId)
    ) ?? null
  );
}

function rangeFromPixels<TTaskMeta>(
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

function getProjectOrder<TProjectMeta, TTaskMeta>(
  projects: Array<NormalizedGanttProject<TProjectMeta, TTaskMeta>>,
  activeProjectId: string,
  overProjectId: string
) {
  const oldIndex = projects.findIndex(
    (project) => project.id === activeProjectId
  );
  const newIndex = projects.findIndex(
    (project) => project.id === overProjectId
  );

  if (oldIndex < 0 || newIndex < 0) {
    return projects;
  }

  return arrayMove(projects, oldIndex, newIndex);
}

function getCollapsedProjectSummary<TProjectMeta, TTaskMeta>(
  project: NormalizedGanttProject<TProjectMeta, TTaskMeta>
): CollapsedProjectSummary<TProjectMeta, TTaskMeta> | null {
  if (project.tasks.length === 0) {
    return null;
  }

  const start = project.tasks.reduce(
    (earliest, task) => (task.start < earliest ? task.start : earliest),
    project.tasks[0].start
  );
  const end = project.tasks.reduce(
    (latest, task) => (task.end > latest ? task.end : latest),
    project.tasks[0].end
  );

  return {
    project,
    start,
    end,
    taskCount: project.tasks.length,
  };
}

function CollapsedProjectSummaryBar<TProjectMeta, TTaskMeta>({
  summary,
  timeline,
  viewMode,
  className,
  labels,
  renderCollapsedProjectSummary,
}: {
  summary: CollapsedProjectSummary<TProjectMeta, TTaskMeta>;
  timeline: TimelineModel;
  viewMode: GanttViewMode;
  className?: string;
  labels: Pick<GanttLabels<TProjectMeta, TTaskMeta>, "taskCount">;
  renderCollapsedProjectSummary?: GanttChartProps<
    TProjectMeta,
    TTaskMeta
  >["renderCollapsedProjectSummary"];
}) {
  const range = dateRangeToPixels(
    summary.start,
    summary.end,
    timeline,
    viewMode
  );
  const width = Math.max(range.width, 36);

  return (
    <div
      className={cx("sokkay-gantt__collapsed-summary", className)}
      data-testid={`project-summary-${summary.project.id}`}
      style={{ left: range.left, width }}
    >
      {renderCollapsedProjectSummary ? (
        renderCollapsedProjectSummary(summary)
      ) : (
        <>
          <strong className="sokkay-gantt__collapsed-summary-name">
            {summary.project.name}
          </strong>
          <span className="sokkay-gantt__collapsed-summary-meta">
            {labels.taskCount(summary.taskCount)}
          </span>
        </>
      )}
    </div>
  );
}

function GanttChartComponent<TProjectMeta = unknown, TTaskMeta = unknown>(
  {
    projects,
    viewMode,
    selectedTaskId = null,
    selectionToolbarMode = "auto",
    collapsedProjectIds,
    defaultCollapsedProjectIds,
    snapTo = viewMode,
    virtualized = false,
    overscan = 2,
    sidebarWidth,
    minSidebarWidth,
    className,
    classNames,
    theme,
    labels,
    onTaskMove,
    onTaskResize,
    onTaskTransfer,
    onTaskReorder,
    onProjectReorder,
    onProjectCollapseChange,
    onTaskSelect,
    onTaskContextMenu,
    renderTask,
    renderTaskTooltip,
    renderContextMenu,
    renderSelectionToolbar,
    renderEmptySelectionToolbar,
    renderProjectCell,
    renderSidebarHeader,
    renderHeaderCell,
    renderTimelineCell,
    renderCollapsedProjectSummary,
  }: GanttChartProps<TProjectMeta, TTaskMeta>,
  ref: React.ForwardedRef<GanttChartHandle>
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const resolvedLabels = useMemo(
    () =>
      ({
        ...defaultGanttLabels,
        ...labels,
      }) as GanttLabels<TProjectMeta, TTaskMeta>,
    [labels]
  );
  const normalizedProjects = useMemo(
    () => normalizeProjects(projects),
    [projects]
  );
  const timeline = useMemo(
    () => buildTimeline(normalizedProjects, viewMode),
    [normalizedProjects, viewMode]
  );
  const [internalCollapsedIds, setInternalCollapsedIds] = useState<string[]>(
    defaultCollapsedProjectIds ?? []
  );
  const effectiveCollapsedIds = collapsedProjectIds ?? internalCollapsedIds;
  const layouts = useMemo(
    () =>
      buildProjectLayouts(normalizedProjects, {
        collapsedProjectIds: effectiveCollapsedIds,
        rowHeight: DEFAULT_ROW_HEIGHT,
        taskHeight: DEFAULT_TASK_HEIGHT,
        laneGap: DEFAULT_LANE_GAP,
      }),
    [effectiveCollapsedIds, normalizedProjects]
  );
  const rowOffsets = useMemo(() => {
    let top = 0;
    return layouts.map((layout) => {
      const offset = top;
      top += layout.height;
      return offset;
    });
  }, [layouts]);
  const totalRowsHeight = layouts.reduce(
    (height, layout) => height + layout.height,
    0
  );
  const selectedTask = useMemo(
    () =>
      normalizedProjects
        .flatMap((project) => project.tasks)
        .find((task) => task.id === selectedTaskId) ?? null,
    [normalizedProjects, selectedTaskId]
  );
  const showSelectionToolbar =
    selectionToolbarMode === "static" ||
    (selectionToolbarMode === "auto" && selectedTask);
  const [interaction, setInteraction] =
    useState<PointerInteraction<TTaskMeta> | null>(null);
  const [contextMenu, setContextMenu] =
    useState<ContextMenuState<TTaskMeta> | null>(null);
  const [scrollState, setScrollState] = useState({ top: 0, height: 0 });

  const closeContextMenu = () => setContextMenu(null);
  const setProjectCollapsed = useCallback(
    (projectId: string, collapsed: boolean) => {
      const nextIds = collapsed
        ? Array.from(new Set([...effectiveCollapsedIds, projectId]))
        : effectiveCollapsedIds.filter((id) => id !== projectId);

      if (!collapsedProjectIds) {
        setInternalCollapsedIds(nextIds);
      }

      onProjectCollapseChange?.(projectId, collapsed, nextIds);
    },
    [collapsedProjectIds, effectiveCollapsedIds, onProjectCollapseChange]
  );
  const toggleProject = useCallback(
    (projectId: string) =>
      setProjectCollapsed(
        projectId,
        !effectiveCollapsedIds.includes(projectId)
      ),
    [effectiveCollapsedIds, setProjectCollapsed]
  );
  const contextActions: ContextMenuActions = {
    close: closeContextMenu,
    select: () => {
      if (contextMenu) {
        onTaskSelect?.(contextMenu.task);
      }
    },
  };

  const visibleRange = useMemo(() => {
    if (!virtualized) {
      return { start: 0, end: layouts.length };
    }

    const viewportStart = Math.max(
      scrollState.top - DEFAULT_ROW_HEIGHT * overscan,
      0
    );
    const viewportEnd =
      scrollState.top + scrollState.height + DEFAULT_ROW_HEIGHT * overscan;
    const start = rowOffsets.findIndex(
      (offset, index) => offset + layouts[index].height >= viewportStart
    );
    const end = layouts.findIndex(
      (_, index) => rowOffsets[index] > viewportEnd
    );

    return {
      start: start < 0 ? 0 : start,
      end: end < 0 ? layouts.length : Math.max(end, start + 1),
    };
  }, [
    layouts,
    overscan,
    rowOffsets,
    scrollState.height,
    scrollState.top,
    virtualized,
  ]);
  const visibleLayouts = layouts.slice(visibleRange.start, visibleRange.end);
  const topSpacer = rowOffsets[visibleRange.start] ?? 0;
  const bottomSpacer = Math.max(
    totalRowsHeight -
      topSpacer -
      visibleLayouts.reduce((height, layout) => height + layout.height, 0),
    0
  );

  const handleScroll = useCallback(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    setScrollState({ top: root.scrollTop, height: root.clientHeight });
  }, []);

  const autoScroll = useCallback((event: PointerEvent) => {
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
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToDate: (date) => {
        const root = rootRef.current;

        if (!root) {
          return;
        }

        root.scrollLeft = Math.max(
          dateToPixels(normalizeDate(date), timeline, viewMode),
          0
        );
      },
      scrollToTask: (taskId) => {
        const projectIndex = layouts.findIndex((layout) =>
          layout.project.tasks.some((task) => task.id === taskId)
        );
        const root = rootRef.current;

        if (!root || projectIndex < 0) {
          return;
        }

        root.scrollTop = rowOffsets[projectIndex] ?? 0;
      },
      selectTask: (taskId) => {
        const task = taskId
          ? (normalizedProjects
              .flatMap((project) => project.tasks)
              .find((item) => item.id === taskId) ?? null)
          : null;
        onTaskSelect?.(task);
      },
      collapseProject: (projectId) => setProjectCollapsed(projectId, true),
      expandProject: (projectId) => setProjectCollapsed(projectId, false),
      toggleProject,
    }),
    [
      layouts,
      normalizedProjects,
      onTaskSelect,
      ref,
      rowOffsets,
      setProjectCollapsed,
      timeline,
      toggleProject,
      viewMode,
    ]
  );

  useEffect(() => {
    handleScroll();
  }, [handleScroll]);

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
        snapTo
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

  const handleContextMenu = (
    event: React.MouseEvent,
    task: NormalizedGanttTask<TTaskMeta>
  ) => {
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
          projects: getProjectOrder(
            normalizedProjects,
            activeProjectId,
            overProjectId
          ),
        });
      }
    }

    if (active.type === "task" && over.type === "task") {
      const taskId = String(active.taskId);
      const overTaskId = String(over.taskId);
      const fromProjectId = String(active.projectId);
      const toProjectId = String(over.projectId);
      const targetProject = findTaskProject(normalizedProjects, overTaskId);

      if (!targetProject || taskId === overTaskId) {
        return;
      }

      if (fromProjectId === toProjectId) {
        const result = moveTaskWithinProject(
          targetProject.tasks,
          taskId,
          overTaskId
        );

        if (result.fromIndex !== result.toIndex) {
          onTaskReorder?.({
            taskId,
            projectId: fromProjectId,
            fromIndex: result.fromIndex,
            toIndex: result.toIndex,
            tasks: result.tasks,
          });
        }
        return;
      }

      onTaskTransfer?.({
        taskId,
        fromProjectId,
        toProjectId,
        index: targetProject.tasks.findIndex((task) => task.id === overTaskId),
      });
      return;
    }

    if (active.type === "task" && over.type === "project-row") {
      const fromProjectId = String(active.projectId);
      const toProjectId = String(over.projectId);

      if (fromProjectId !== toProjectId) {
        onTaskTransfer?.({
          taskId: String(active.taskId),
          fromProjectId,
          toProjectId,
          index:
            normalizedProjects.find((project) => project.id === toProjectId)
              ?.tasks.length ?? 0,
        });
      }
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div
        ref={rootRef}
        className={cx("sokkay-gantt", className, classNames?.root)}
        style={createThemeStyle({ theme, sidebarWidth, minSidebarWidth })}
        onScroll={handleScroll}
        onClick={() => onTaskSelect?.(null)}
      >
        {showSelectionToolbar && (
          <div
            className={cx(
              "sokkay-gantt__selection-toolbar",
              !selectedTask && "is-empty"
            )}
          >
            {selectedTask ? (
              renderSelectionToolbar ? (
                renderSelectionToolbar(selectedTask, {
                  close: closeContextMenu,
                  select: () => onTaskSelect?.(selectedTask),
                })
              ) : (
                <>
                  <strong>{selectedTask.name}</strong>
                  <button type="button" onClick={() => onTaskSelect?.(null)}>
                    {resolvedLabels.clearSelection}
                  </button>
                </>
              )
            ) : renderEmptySelectionToolbar ? (
              renderEmptySelectionToolbar({
                close: closeContextMenu,
                select: () => undefined,
              })
            ) : (
              <span className="sokkay-gantt__selection-placeholder">
                {resolvedLabels.noTaskSelected}
              </span>
            )}
          </div>
        )}

        <div className={cx("sokkay-gantt__header", classNames?.header)}>
          <div
            className={cx("sokkay-gantt__sidebar-header", classNames?.sidebar)}
          >
            {renderSidebarHeader
              ? renderSidebarHeader()
              : resolvedLabels.projectHeader}
          </div>
          <div
            className={cx(
              "sokkay-gantt__timeline-header",
              classNames?.timeline
            )}
            style={{ width: timeline.width }}
          >
            {timeline.cells.map((cell) => (
              <div
                className="sokkay-gantt__header-cell"
                style={{ width: timeline.cellWidth }}
                key={cell.id}
              >
                {renderHeaderCell ? renderHeaderCell(cell) : cell.label}
              </div>
            ))}
          </div>
        </div>

        <SortableContext
          items={normalizedProjects.map((project) => `project:${project.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="sokkay-gantt__body">
            <div className="sokkay-gantt__sidebar">
              {topSpacer > 0 && (
                <div
                  className="sokkay-gantt__virtual-spacer"
                  style={{ height: topSpacer }}
                />
              )}
              {visibleLayouts.map((layout) => (
                <SortableProjectCell
                  className={classNames?.projectCell}
                  project={layout.project}
                  collapsed={layout.collapsed}
                  height={layout.height}
                  labels={resolvedLabels}
                  key={layout.project.id}
                  onToggle={() => toggleProject(layout.project.id)}
                >
                  {renderProjectCell
                    ? renderProjectCell(layout.project, {
                        collapsed: layout.collapsed,
                        taskCount: layout.project.tasks.length,
                      })
                    : layout.project.name}
                </SortableProjectCell>
              ))}
              {bottomSpacer > 0 && (
                <div
                  className="sokkay-gantt__virtual-spacer"
                  style={{ height: bottomSpacer }}
                />
              )}
            </div>

            <div
              className="sokkay-gantt__timeline"
              style={{ width: timeline.width }}
            >
              {topSpacer > 0 && (
                <div
                  className="sokkay-gantt__virtual-spacer"
                  style={{ height: topSpacer }}
                />
              )}
              {visibleLayouts.map((layout) => (
                <ProjectDropRow
                  projectId={layout.project.id}
                  className={cx("sokkay-gantt__row", classNames?.projectRow)}
                  height={layout.height}
                  key={layout.project.id}
                >
                  {timeline.cells.map((cell) => (
                    <div
                      className="sokkay-gantt__grid-cell"
                      style={{ width: timeline.cellWidth }}
                      key={cell.id}
                    >
                      {renderTimelineCell ? renderTimelineCell(cell) : null}
                    </div>
                  ))}
                  {(() => {
                    const summary = layout.collapsed
                      ? getCollapsedProjectSummary(layout.project)
                      : null;

                    return summary ? (
                      <CollapsedProjectSummaryBar
                        className={classNames?.collapsedSummary}
                        summary={summary}
                        timeline={timeline}
                        viewMode={viewMode}
                        labels={resolvedLabels}
                        renderCollapsedProjectSummary={
                          renderCollapsedProjectSummary
                        }
                      />
                    ) : null;
                  })()}
                  {!layout.collapsed &&
                    layout.lanes.flatMap((lane) =>
                      lane.tasks.map((task) => (
                        <TaskBar
                          className={cx(
                            classNames?.task,
                            selectedTaskId === task.id &&
                              classNames?.selectedTask
                          )}
                          index={layout.project.tasks.findIndex(
                            (item) => item.id === task.id
                          )}
                          key={task.id}
                          task={task}
                          top={
                            DEFAULT_LANE_GAP +
                            lane.index *
                              (DEFAULT_TASK_HEIGHT + DEFAULT_LANE_GAP)
                          }
                          selected={selectedTaskId === task.id}
                          timeline={timeline}
                          viewMode={viewMode}
                          renderTask={renderTask}
                          renderTaskTooltip={renderTaskTooltip}
                          labels={resolvedLabels}
                          onPointerStart={handlePointerStart}
                          onSelect={(nextTask) => onTaskSelect?.(nextTask)}
                          onContextMenu={handleContextMenu}
                        />
                      ))
                    )}
                </ProjectDropRow>
              ))}
              {bottomSpacer > 0 && (
                <div
                  className="sokkay-gantt__virtual-spacer"
                  style={{ height: bottomSpacer }}
                />
              )}
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
              renderContextMenu({
                task: contextMenu.task,
                actions: contextActions,
              })
            ) : (
              <>
                <button type="button" onClick={() => contextActions.select()}>
                  {resolvedLabels.selectAction}
                </button>
                <button type="button" onClick={contextActions.close}>
                  {resolvedLabels.closeAction}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </DndContext>
  );
}

export const GanttChart = forwardRef(GanttChartComponent) as <
  TProjectMeta = unknown,
  TTaskMeta = unknown,
>(
  props: GanttChartProps<TProjectMeta, TTaskMeta> &
    React.RefAttributes<GanttChartHandle>
) => React.ReactElement;
