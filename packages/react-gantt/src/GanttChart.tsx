import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
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
import {
  ProjectDropRow,
  SortableProjectCell,
  SortableTaskCell,
  TaskDropRow,
} from "./components/ProjectRows";
import { SelectionToolbar } from "./components/SelectionToolbar";
import { TaskBar } from "./components/TaskBar";
import { DEFAULT_LANE_GAP, DEFAULT_TASK_HEIGHT } from "./constants";
import { useGanttDragEnd } from "./hooks/useGanttDragEnd";
import { useGanttModel } from "./hooks/useGanttModel";
import { useProjectCollapse } from "./hooks/useProjectCollapse";
import {
  resolvedRowFromModel,
  rowSelectionFromModel,
  useRowSelection,
} from "./hooks/useRowSelection";
import { useSidebarColumnResize } from "./hooks/useSidebarColumnResize";
import { useSidebarResize } from "./hooks/useSidebarResize";
import { useTaskPointerInteraction } from "./hooks/useTaskPointerInteraction";
import type {
  ContextMenuActions,
  GanttChartHandle,
  GanttChartProps,
  GanttRowModel,
  NormalizedGanttTask,
  NormalizedGanttTaskSegment,
} from "./types";
import { getCollapsedProjectSummary } from "./utils/collapsed-summary";
import {
  getSidebarGridTemplateColumns,
  resolveSidebarColumns,
} from "./utils/columns";
import { cx } from "./utils/cx";
import { normalizeDate } from "./utils/dates";
import { createThemeStyle } from "./utils/theme";
import { dateToPixels } from "./utils/timeline";

function GanttChartComponent<TProjectMeta = unknown, TTaskMeta = unknown>(
  {
    projects,
    viewMode,
    selectedTaskId = null,
    selectedRows = [],
    selectionToolbarMode = "auto",
    collapsedProjectIds,
    defaultCollapsedProjectIds,
    showProjectToggle = true,
    snapTo = viewMode,
    virtualized = false,
    overscan = 2,
    sidebarWidth,
    minSidebarWidth,
    onSidebarWidthChange,
    columns: columnsProp,
    onSidebarColumnWidthChange,
    onSidebarColumnResizeEnd,
    className,
    classNames,
    theme,
    labels,
    locale,
    customCellWidths,
    minDate,
    maxDate,
    layoutMode = "compact",
    showSegmentConnectors = false,
    onTaskMove,
    onTaskMoveEnd,
    onTaskResize,
    onTaskResizeEnd,
    onTaskTransfer,
    onTaskReorder,
    onProjectReorder,
    onProjectCollapseChange,
    onRowSelectionChange,
    onRowContextMenu,
    onTaskSelect,
    onTaskContextMenu,
    renderTask,
    renderTaskTooltip,
    renderContextMenu,
    renderSelectionToolbar,
    renderEmptySelectionToolbar,
    renderHeaderCell,
    renderTimelineCell,
    renderCollapsedProjectSummary,
  }: GanttChartProps<TProjectMeta, TTaskMeta>,
  ref: React.ForwardedRef<GanttChartHandle>
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] =
    useState<ContextMenuState<TTaskMeta> | null>(null);
  const normalizedMinDate = minDate ? normalizeDate(minDate) : undefined;
  const normalizedMaxDate = maxDate ? normalizeDate(maxDate) : undefined;
  const [scrollState, setScrollState] = useState({ top: 0, height: 0 });
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
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
    handlePointerDown: handleColumnResizeStart,
    handleKeyDown: handleColumnResizeKeyDown,
  } = useSidebarColumnResize({
    onWidthChange: onSidebarColumnWidthChange,
    onResizeEnd: onSidebarColumnResizeEnd,
  });
  const {
    resolvedLabels,
    normalizedProjects,
    timeline,
    flatRows,
    rowOffsets,
    selectedTask,
    visibleRows,
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
    minDate: normalizedMinDate,
    maxDate: normalizedMaxDate,
    locale,
    layoutMode,
  });
  const showSelectionToolbar =
    selectionToolbarMode === "static" ||
    (selectionToolbarMode === "auto" && selectedTask);
  const { emitSelection, isRowSelected, resolveSelection, selectRow } =
    useRowSelection({ flatRows, selectedRows, onRowSelectionChange });
  const columns = resolveSidebarColumns(
    columnsProp,
    resolvedLabels.projectHeader
  );
  const hasTrailingColumnResizeGutter = columns.at(-1)?.resizable === true;
  const sidebarGridTemplateColumns = getSidebarGridTemplateColumns(columns);
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

  const { handlePointerStart, activeInteraction } = useTaskPointerInteraction({
    rootRef,
    timeline,
    viewMode,
    snapTo,
    onTaskMove,
    onTaskMoveEnd,
    onTaskResize,
    onTaskResizeEnd,
    minDate: normalizedMinDate,
    maxDate: normalizedMaxDate,
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
        const root = rootRef.current;

        if (!root) {
          return;
        }

        const rowIndex = flatRows.findIndex((row) =>
          row.type === "task"
            ? row.task.id === taskId
            : row.project.tasks.some((t) => t.id === taskId)
        );

        if (rowIndex < 0) {
          return;
        }

        root.scrollTop = rowOffsets[rowIndex] ?? 0;
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
      flatRows,
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
    task: NormalizedGanttTask<TTaskMeta>,
    segment?: NormalizedGanttTaskSegment
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const nextActions: ContextMenuActions = {
      close: closeContextMenu,
      select: () => onTaskSelect?.(task),
    };
    setContextMenu({ task, segment, x: event.clientX, y: event.clientY });
    onTaskContextMenu?.({ task, segment, event, actions: nextActions });
  };

  const handleRowContextMenu = (
    event: React.MouseEvent,
    row: GanttRowModel<TProjectMeta, TTaskMeta>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const payload = isRowSelected(row)
      ? resolveSelection(selectedRows)
      : emitSelection([rowSelectionFromModel(row)]);

    onRowContextMenu?.({
      row: resolvedRowFromModel(row),
      ...payload,
      event,
    });
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
            <div
              className="sokkay-gantt__sidebar-grid"
              style={{ gridTemplateColumns: sidebarGridTemplateColumns }}
            >
              {columns.map((column) => (
                <div
                  className={cx(
                    column.kind === "tree"
                      ? "sokkay-gantt__sidebar-primary-header"
                      : "sokkay-gantt__project-column-header",
                    column.headerClassName
                  )}
                  key={column.id}
                >
                  <span className="sokkay-gantt__project-column-header-content">
                    {column.header}
                  </span>
                  {column.resizable && (
                    <span
                      className="sokkay-gantt__column-resize"
                      role="separator"
                      aria-label={
                        column.resizeAriaLabel ?? `Resize ${column.id}`
                      }
                      aria-orientation="vertical"
                      tabIndex={0}
                      onPointerDown={(event) =>
                        handleColumnResizeStart(event, column)
                      }
                      onKeyDown={(event) =>
                        handleColumnResizeKeyDown(event, column)
                      }
                    />
                  )}
                </div>
              ))}
              {hasTrailingColumnResizeGutter && (
                <div
                  className="sokkay-gantt__sidebar-resize-gutter"
                  aria-hidden="true"
                />
              )}
            </div>
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
          items={visibleRows.map((row) =>
            row.type === "project"
              ? `project:${row.project.id}`
              : `task-sort:${row.task.id}`
          )}
          strategy={verticalListSortingStrategy}
        >
          <div className="sokkay-gantt__body">
            <div className="sokkay-gantt__sidebar">
              <span
                className="sokkay-gantt__sidebar-resize sokkay-gantt__sidebar-resize--body"
                role="separator"
                aria-orientation="vertical"
                onPointerDown={handleSidebarResizeStart}
              >
                <GripVertical
                  className="sokkay-gantt__sidebar-resize-icon"
                  size={16}
                  aria-hidden="true"
                />
              </span>
              {topSpacer > 0 && (
                <div
                  className="sokkay-gantt__virtual-spacer"
                  style={{ height: topSpacer }}
                />
              )}
              {visibleRows.map((row) => {
                if (row.type === "project") {
                  return (
                    <SortableProjectCell
                      className={cx(
                        classNames?.projectCell,
                        hoveredRowId === row.id && "is-hovered",
                        isRowSelected(row) && "is-selected"
                      )}
                      project={row.project}
                      collapsed={row.collapsed}
                      height={row.height}
                      labels={resolvedLabels}
                      key={row.id}
                      onToggle={() => toggleProject(row.project.id)}
                      showProjectToggle={showProjectToggle}
                      onMouseEnter={() => setHoveredRowId(row.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      onClick={
                        onRowSelectionChange
                          ? (event) => {
                              event.stopPropagation();
                              selectRow(row, {
                                shiftKey: event.shiftKey,
                                toggleKey: event.ctrlKey || event.metaKey,
                              });
                            }
                          : undefined
                      }
                      onContextMenu={
                        onRowContextMenu
                          ? (event) => handleRowContextMenu(event, row)
                          : undefined
                      }
                      gridTemplateColumns={sidebarGridTemplateColumns}
                      trailingResizeGutter={hasTrailingColumnResizeGutter}
                      columns={columns.map((column) => {
                        const state = {
                          collapsed: row.collapsed,
                          taskCount: row.project.tasks.length,
                          selected: isRowSelected(row),
                        };

                        return {
                          id: column.id,
                          kind: column.kind,
                          className: column.cellClassName,
                          content:
                            column.kind === "tree"
                              ? (column.renderProject?.(row.project, state) ??
                                row.project.name)
                              : column.renderProject?.(row.project, state),
                        };
                      })}
                    />
                  );
                } else {
                  return (
                    <SortableTaskCell
                      className={cx(
                        classNames?.taskCell,
                        hoveredRowId === row.id && "is-hovered",
                        isRowSelected(row) && "is-selected"
                      )}
                      task={row.task}
                      project={row.project}
                      height={row.height}
                      key={row.id}
                      index={row.index}
                      onMouseEnter={() => setHoveredRowId(row.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      onClick={
                        onRowSelectionChange
                          ? (event) => {
                              event.stopPropagation();
                              selectRow(row, {
                                shiftKey: event.shiftKey,
                                toggleKey: event.ctrlKey || event.metaKey,
                              });
                            }
                          : undefined
                      }
                      onContextMenu={
                        onRowContextMenu
                          ? (event) => handleRowContextMenu(event, row)
                          : undefined
                      }
                      gridTemplateColumns={sidebarGridTemplateColumns}
                      trailingResizeGutter={hasTrailingColumnResizeGutter}
                      columns={columns.map((column) => {
                        const state = {
                          project: row.project,
                          index: row.index,
                          selected: isRowSelected(row),
                        };

                        return {
                          id: column.id,
                          kind: column.kind,
                          className: column.cellClassName,
                          content:
                            column.kind === "tree"
                              ? (column.renderTask?.(row.task, state) ??
                                row.task.name)
                              : column.renderTask?.(row.task, state),
                        };
                      })}
                    />
                  );
                }
              })}
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
              {visibleRows.map((row) => {
                if (row.type === "project") {
                  return (
                    <ProjectDropRow
                      projectId={row.project.id}
                      className={cx(
                        "sokkay-gantt__row sokkay-gantt__row--project",
                        hoveredRowId === row.id && "is-hovered",
                        classNames?.projectRow
                      )}
                      height={row.height}
                      key={row.id}
                      onMouseEnter={() => setHoveredRowId(row.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
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
                        const summary =
                          row.collapsed || layoutMode === "tree"
                            ? getCollapsedProjectSummary(row.project)
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
                            isInteracting={activeInteraction !== null}
                          />
                        ) : null;
                      })()}
                      {layoutMode === "compact" &&
                        !row.collapsed &&
                        row.lanes.flatMap((lane) =>
                          lane.tasks.map((task) => (
                            <TaskBar
                              className={cx(
                                classNames?.task,
                                selectedTaskId === task.id &&
                                  classNames?.selectedTask
                              )}
                              index={row.project.tasks.findIndex(
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
                              isInteracting={
                                activeInteraction?.task.id === task.id
                              }
                              interactingSegmentId={
                                activeInteraction?.task.id === task.id
                                  ? activeInteraction.segmentId
                                  : undefined
                              }
                              showSegmentConnectors={showSegmentConnectors}
                              connectorClassName={classNames?.segmentConnector}
                              timeline={timeline}
                              viewMode={viewMode}
                              renderTask={renderTask}
                              renderTaskTooltip={renderTaskTooltip}
                              onPointerStart={handlePointerStart}
                              onSelect={(nextTask) => onTaskSelect?.(nextTask)}
                              onContextMenu={handleContextMenu}
                            />
                          ))
                        )}
                    </ProjectDropRow>
                  );
                } else {
                  return (
                    <TaskDropRow
                      taskId={row.task.id}
                      projectId={row.project.id}
                      index={row.index}
                      className={cx(
                        "sokkay-gantt__row sokkay-gantt__row--task",
                        hoveredRowId === row.id && "is-hovered",
                        selectedTaskId === row.task.id && "is-selected",
                        classNames?.taskRow
                      )}
                      height={row.height}
                      key={row.id}
                      onMouseEnter={() => setHoveredRowId(row.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
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
                      <TaskBar
                        className={cx(
                          classNames?.task,
                          selectedTaskId === row.task.id &&
                            classNames?.selectedTask
                        )}
                        index={row.index}
                        key={row.task.id}
                        task={row.task}
                        top={DEFAULT_LANE_GAP}
                        selected={selectedTaskId === row.task.id}
                        isInteracting={
                          activeInteraction?.task.id === row.task.id
                        }
                        interactingSegmentId={
                          activeInteraction?.task.id === row.task.id
                            ? activeInteraction.segmentId
                            : undefined
                        }
                        showSegmentConnectors={showSegmentConnectors}
                        connectorClassName={classNames?.segmentConnector}
                        timeline={timeline}
                        viewMode={viewMode}
                        renderTask={renderTask}
                        renderTaskTooltip={renderTaskTooltip}
                        onPointerStart={handlePointerStart}
                        onSelect={(nextTask) => onTaskSelect?.(nextTask)}
                        onContextMenu={handleContextMenu}
                      />
                    </TaskDropRow>
                  );
                }
              })}
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
