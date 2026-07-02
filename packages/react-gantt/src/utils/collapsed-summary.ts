import type { CollapsedProjectSummary, NormalizedGanttProject } from "../types";

export function getCollapsedProjectSummary<TProjectMeta, TTaskMeta>(
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
