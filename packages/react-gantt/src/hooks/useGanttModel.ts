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
  NormalizedGanttTask,
} from "../types";
import { normalizeProjects } from "../utils/dates";
import { buildProjectLayouts } from "../utils/layout";
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
}: Pick<
  GanttChartProps<TProjectMeta, TTaskMeta>,
  "projects" | "viewMode" | "labels" | "selectedTaskId"
> & {
  collapsedProjectIds: string[];
  virtualized: boolean;
  overscan: number;
  scrollTop: number;
  scrollHeight: number;
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
    () => buildTimeline(normalizedProjects, viewMode),
    [normalizedProjects, viewMode]
  );
  const layouts = useMemo(
    () =>
      buildProjectLayouts(normalizedProjects, {
        collapsedProjectIds,
        rowHeight: DEFAULT_ROW_HEIGHT,
        taskHeight: DEFAULT_TASK_HEIGHT,
        laneGap: DEFAULT_LANE_GAP,
      }),
    [collapsedProjectIds, normalizedProjects]
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
  const selectedTask = useMemo<NormalizedGanttTask<TTaskMeta> | null>(
    () =>
      normalizedProjects
        .flatMap((project) => project.tasks)
        .find((task) => task.id === selectedTaskId) ?? null,
    [normalizedProjects, selectedTaskId]
  );
  const visibleRange = useMemo(() => {
    if (!virtualized) {
      return { start: 0, end: layouts.length };
    }

    const viewportStart = Math.max(
      scrollTop - DEFAULT_ROW_HEIGHT * overscan,
      0
    );
    const viewportEnd =
      scrollTop + scrollHeight + DEFAULT_ROW_HEIGHT * overscan;
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
  }, [layouts, overscan, rowOffsets, scrollHeight, scrollTop, virtualized]);
  const visibleLayouts = layouts.slice(visibleRange.start, visibleRange.end);
  const topSpacer = rowOffsets[visibleRange.start] ?? 0;
  const bottomSpacer = Math.max(
    totalRowsHeight -
      topSpacer -
      visibleLayouts.reduce((height, layout) => height + layout.height, 0),
    0
  );

  return {
    resolvedLabels,
    normalizedProjects,
    timeline,
    layouts,
    rowOffsets,
    selectedTask,
    visibleLayouts,
    topSpacer,
    bottomSpacer,
  };
}
