import type { DragEndEvent } from "@dnd-kit/core";
import { useCallback } from "react";
import type { GanttChartProps, NormalizedGanttProject } from "../types";
import {
  findTaskProject,
  getProjectOrder,
  moveTaskWithinProject,
} from "../utils/reorder";

export function useGanttDragEnd<TProjectMeta, TTaskMeta>({
  normalizedProjects,
  onProjectReorder,
  onTaskReorder,
  onTaskTransfer,
}: Pick<
  GanttChartProps<TProjectMeta, TTaskMeta>,
  "onProjectReorder" | "onTaskReorder" | "onTaskTransfer"
> & {
  normalizedProjects: Array<NormalizedGanttProject<TProjectMeta, TTaskMeta>>;
}) {
  return useCallback(
    (event: DragEndEvent) => {
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

      if (active.type === "task") {
        const taskId = String(active.taskId);
        const fromProjectId = String(active.projectId);

        if (over.type === "task" || over.type === "task-row") {
          const overTaskId = String(over.taskId);
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
            index: targetProject.tasks.findIndex(
              (task) => task.id === overTaskId
            ),
          });
          return;
        }

        if (over.type === "project-row" || over.type === "project") {
          const toProjectId = String(over.projectId);

          if (fromProjectId !== toProjectId) {
            onTaskTransfer?.({
              taskId,
              fromProjectId,
              toProjectId,
              index:
                normalizedProjects.find((project) => project.id === toProjectId)
                  ?.tasks.length ?? 0,
            });
          }
        }
      }
    },
    [normalizedProjects, onProjectReorder, onTaskReorder, onTaskTransfer]
  );
}
