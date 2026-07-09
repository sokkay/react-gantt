import type { NormalizedGanttProject, NormalizedGanttTask } from "../types";

export interface TaskLane<TTaskMeta = unknown> {
  index: number;
  tasks: Array<NormalizedGanttTask<TTaskMeta>>;
}

export interface ProjectLayout<TProjectMeta = unknown, TTaskMeta = unknown> {
  project: NormalizedGanttProject<TProjectMeta, TTaskMeta>;
  lanes: Array<TaskLane<TTaskMeta>>;
  height: number;
  collapsed: boolean;
}

export interface LayoutOptions {
  collapsedProjectIds?: string[];
  rowHeight: number;
  taskHeight: number;
  laneGap: number;
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
) {
  return aStart < bEnd && aEnd > bStart;
}

function taskRanges(task: NormalizedGanttTask) {
  if (task.segments?.length) {
    return task.segments.map((segment) => ({
      start: segment.start,
      end: segment.end,
    }));
  }

  return [{ start: task.start, end: task.end }];
}

function overlaps(a: NormalizedGanttTask, b: NormalizedGanttTask) {
  // Segmented tasks only collide when at least one concrete segment overlaps.
  // Using the envelope would force separate lanes across weekend/periodic gaps.
  const aRanges = taskRanges(a);
  const bRanges = taskRanges(b);

  return aRanges.some((aRange) =>
    bRanges.some((bRange) =>
      rangesOverlap(aRange.start, aRange.end, bRange.start, bRange.end)
    )
  );
}

export function buildTaskLanes<TTaskMeta>(
  tasks: Array<NormalizedGanttTask<TTaskMeta>>
): Array<TaskLane<TTaskMeta>> {
  const lanes: Array<TaskLane<TTaskMeta>> = [];

  tasks.forEach((task) => {
    const lane = lanes.find((candidate) =>
      candidate.tasks.every((currentTask) => !overlaps(currentTask, task))
    );

    if (lane) {
      lane.tasks.push(task);
      return;
    }

    lanes.push({ index: lanes.length, tasks: [task] });
  });

  return lanes;
}

export function buildProjectLayouts<TProjectMeta, TTaskMeta>(
  projects: Array<NormalizedGanttProject<TProjectMeta, TTaskMeta>>,
  options: LayoutOptions
): Array<ProjectLayout<TProjectMeta, TTaskMeta>> {
  const collapsedIds = new Set(options.collapsedProjectIds ?? []);

  return projects.map((project) => {
    const collapsed = collapsedIds.has(project.id);
    const lanes = collapsed ? [] : buildTaskLanes(project.tasks);
    const visibleLaneCount = Math.max(lanes.length, 1);
    const height = collapsed
      ? options.rowHeight
      : Math.max(
          options.rowHeight,
          visibleLaneCount * options.taskHeight +
            (visibleLaneCount + 1) * options.laneGap
        );

    return {
      project,
      lanes,
      height,
      collapsed,
    };
  });
}
