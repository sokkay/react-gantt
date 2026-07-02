import { arrayMove } from "@dnd-kit/sortable";
import type { NormalizedGanttProject, NormalizedGanttTask } from "../types";

export function moveTaskWithinProject<TTaskMeta>(
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

export function findTaskProject<TProjectMeta, TTaskMeta>(
  projects: Array<NormalizedGanttProject<TProjectMeta, TTaskMeta>>,
  taskId: string
) {
  return (
    projects.find((project) =>
      project.tasks.some((task) => task.id === taskId)
    ) ?? null
  );
}

export function getProjectOrder<TProjectMeta, TTaskMeta>(
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
