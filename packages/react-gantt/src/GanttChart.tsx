import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type * as React from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CollapsedProjectSummaryBar } from "./components/CollapsedProjectSummaryBar";
import { ContextMenu, type ContextMenuState } from "./components/ContextMenu";
import { ProjectDropRow, SortableProjectCell } from "./components/ProjectRows";
import { SelectionToolbar } from "./components/SelectionToolbar";
import { TaskBar } from "./components/TaskBar";
import { DEFAULT_LANE_GAP, DEFAULT_TASK_HEIGHT } from "./constants";
import { useGanttDragEnd } from "./hooks/useGanttDragEnd";
import { useGanttModel } from "./hooks/useGanttModel";
import { useProjectCollapse } from "./hooks/useProjectCollapse";
import { useSidebarResize } from "./hooks/useSidebarResize";
import { useTaskPointerInteraction } from "./hooks/useTaskPointerInteraction";
import type {
  ContextMenuActions,
  GanttChartHandle,
  GanttChartProps,
  NormalizedGanttTask,
} from "./types";
import { getCollapsedProjectSummary } from "./utils/collapsed-summary";
import { cx } from "./utils/cx";
import { normalizeDate } from "./utils/dates";
import { createThemeStyle } from "./utils/theme";
import { dateToPixels } from "./utils/timeline";

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
    onSidebarWidthChange,
    className,
    classNames,
    theme,
    labels,
    customCellWidths,
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
  const [contextMenu, setContextMenu] =
    useState<ContextMenuState<TTaskMeta> | null>(null);
  const [scrollState, setScrollState] = useState({ top: 0, height: 0 });
  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  const { effectiveCollapsedIds, setProjectCollapsed, toggleProject } =
    useProjectCollapse({
      collapsedProjectIds,
      defaultCollapsedProjectIds,
      onProjectCollapseChange,
    });
  const { effectiveSidebarWidth, sidebarMinWidth, handleSidebarResizeStart } =
    useSidebarResize({
      sidebarWidth,
      minSidebarWidth,
      theme,
      onSidebarWidthChange,
    });
  const {
    resolvedLabels,
    normalizedProjects,
    timeline,
    layouts,
    rowOffsets,
    selectedTask,
    visibleLayouts,
    topSpacer,
    bottomSpacer,
  } = useGanttModel({
    projects,
    viewMode,
    labels,
    selectedTaskId,
    collapsedProjectIds: effectiveCollapsedIds,
    virtualized,
    overscan,
    scrollTop: scrollState.top,
    scrollHeight: scrollState.height,
    customCellWidths,
  });
  const showSelectionToolbar =
    selectionToolbarMode === "static" ||
    (selectionToolbarMode === "auto" && selectedTask);
  const contextActions: ContextMenuActions = {
    close: closeContextMenu,
    select: () => {
      if (contextMenu) {
        onTaskSelect?.(contextMenu.task);
      }
    },
  };

  const handleScroll = useCallback(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    setScrollState({ top: root.scrollTop, height: root.clientHeight });
  }, []);

  const { handlePointerStart } = useTaskPointerInteraction({
    rootRef,
    timeline,
    viewMode,
    snapTo,
    onTaskMove,
    onTaskResize,
  });
  const handleDragEnd = useGanttDragEnd({
    normalizedProjects,
    onProjectReorder,
    onTaskReorder,
    onTaskTransfer,
  });

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

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div
        ref={rootRef}
        className={cx("sokkay-gantt", className, classNames?.root)}
        style={createThemeStyle({
          theme,
          sidebarWidth: effectiveSidebarWidth,
          minSidebarWidth: sidebarMinWidth,
        })}
        onScroll={handleScroll}
        onClick={() => onTaskSelect?.(null)}
      >
        {showSelectionToolbar && (
          <SelectionToolbar
            selectedTask={selectedTask}
            labels={resolvedLabels}
            renderSelectionToolbar={renderSelectionToolbar}
            renderEmptySelectionToolbar={renderEmptySelectionToolbar}
            onTaskSelect={onTaskSelect}
            closeContextMenu={closeContextMenu}
          />
        )}

        <div className={cx("sokkay-gantt__header", classNames?.header)}>
          <div
            className={cx("sokkay-gantt__sidebar-header", classNames?.sidebar)}
          >
            {renderSidebarHeader
              ? renderSidebarHeader()
              : resolvedLabels.projectHeader}
            <span
              className="sokkay-gantt__sidebar-resize"
              role="separator"
              aria-orientation="vertical"
              onPointerDown={handleSidebarResizeStart}
            />
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
              <span
                className="sokkay-gantt__sidebar-resize sokkay-gantt__sidebar-resize--body"
                role="separator"
                aria-orientation="vertical"
                onPointerDown={handleSidebarResizeStart}
              />
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
          <ContextMenu
            contextMenu={contextMenu}
            actions={contextActions}
            labels={resolvedLabels}
            renderContextMenu={renderContextMenu}
          />
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
