import { useMemo } from "react";
import {
  DEFAULT_LANE_GAP,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_TASK_HEIGHT,
} from "../constants";
import { defaultGanttLabels } from "../labels";
import type {
  GanttChartProps,
  GanttLabels,
  GanttRowModel,
  NormalizedGanttTask,
} from "../types";
import { normalizeProjects } from "../utils/dates";
import { buildTaskLanes } from "../utils/layout";
import { buildTimeline } from "../utils/timeline";

export function useGanttModel<TProjectMeta, TTaskMeta>({
  projects,
  viewMode,
  labels,
  selectedTaskId,
  collapsedProjectIds,
  virtualized,
  overscan,
  scrollTop,
  scrollHeight,
  customCellWidths,
  minDate,
  maxDate,
  layoutMode = "compact",
}: Pick<
  GanttChartProps<TProjectMeta, TTaskMeta>,
  | "projects"
  | "viewMode"
  | "labels"
  | "selectedTaskId"
  | "customCellWidths"
  | "layoutMode"
> & {
  collapsedProjectIds: string[];
  virtualized: boolean;
  overscan: number;
  scrollTop: number;
  scrollHeight: number;
  minDate?: Date;
  maxDate?: Date;
}) {
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
    () =>
      buildTimeline(
        normalizedProjects,
        viewMode,
        customCellWidths,
        minDate,
        maxDate
      ),
    [normalizedProjects, viewMode, customCellWidths, minDate, maxDate]
  );
  const flatRows = useMemo<
    Array<GanttRowModel<TProjectMeta, TTaskMeta>>
  >(() => {
    const rowHeight = DEFAULT_ROW_HEIGHT;
    const taskHeight = DEFAULT_TASK_HEIGHT;
    const laneGap = DEFAULT_LANE_GAP;
    const collapsedIds = new Set(collapsedProjectIds);

    const rows: Array<GanttRowModel<TProjectMeta, TTaskMeta>> = [];

    normalizedProjects.forEach((project) => {
      const collapsed = collapsedIds.has(project.id);

      if (layoutMode === "tree") {
        rows.push({
          type: "project",
          id: `project:${project.id}`,
          project,
          height: rowHeight,
          collapsed,
          lanes: [],
        });

        if (!collapsed) {
          project.tasks.forEach((task, index) => {
            rows.push({
              type: "task",
              id: `task-sort:${task.id}`,
              task,
              project,
              height: rowHeight,
              index,
            });
          });
        }
      } else {
        // compact mode
        const lanes = collapsed ? [] : buildTaskLanes(project.tasks);
        const visibleLaneCount = Math.max(lanes.length, 1);
        const height = collapsed
          ? rowHeight
          : Math.max(
              rowHeight,
              visibleLaneCount * taskHeight + (visibleLaneCount + 1) * laneGap
            );

        rows.push({
          type: "project",
          id: `project:${project.id}`,
          project,
          height,
          collapsed,
          lanes,
        });
      }
    });

    return rows;
  }, [collapsedProjectIds, normalizedProjects, layoutMode]);

  const rowOffsets = useMemo(() => {
    let top = 0;
    return flatRows.map((row) => {
      const offset = top;
      top += row.height;
      return offset;
    });
  }, [flatRows]);

  const totalRowsHeight = flatRows.reduce(
    (height, row) => height + row.height,
    0
  );

  const selectedTask = useMemo<NormalizedGanttTask<TTaskMeta> | null>(
    () =>
      normalizedProjects
        .flatMap((project) => project.tasks)
        .find((task) => task.id === selectedTaskId) ?? null,
    [normalizedProjects, selectedTaskId]
  );

  const visibleRange = useMemo(() => {
    if (!virtualized) {
      return { start: 0, end: flatRows.length };
    }

    const viewportStart = Math.max(
      scrollTop - DEFAULT_ROW_HEIGHT * overscan,
      0
    );
    const viewportEnd =
      scrollTop + scrollHeight + DEFAULT_ROW_HEIGHT * overscan;
    const start = rowOffsets.findIndex(
      (offset, index) => offset + flatRows[index].height >= viewportStart
    );
    const end = flatRows.findIndex(
      (_, index) => rowOffsets[index] > viewportEnd
    );

    return {
      start: start < 0 ? 0 : start,
      end: end < 0 ? flatRows.length : Math.max(end, start + 1),
    };
  }, [flatRows, overscan, rowOffsets, scrollHeight, scrollTop, virtualized]);

  const visibleRows = flatRows.slice(visibleRange.start, visibleRange.end);
  const topSpacer = rowOffsets[visibleRange.start] ?? 0;
  const bottomSpacer = Math.max(
    totalRowsHeight -
      topSpacer -
      visibleRows.reduce((height, row) => height + row.height, 0),
    0
  );

  return {
    resolvedLabels,
    normalizedProjects,
    timeline,
    flatRows,
    rowOffsets,
    selectedTask,
    visibleRows,
    topSpacer,
    bottomSpacer,
  };
}
