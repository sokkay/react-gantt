import type { GanttLabels } from "./types";

export const defaultGanttLabels: GanttLabels = {
  projectHeader: "Project",
  noTaskSelected: "No task selected",
  clearSelection: "Clear",
  selectAction: "Select",
  closeAction: "Close",
  taskCount: (count) => `${count} ${count === 1 ? "task" : "tasks"}`,
  reorderProject: (project) => `Reorder ${project.name}`,
  collapseProject: (project) => `Collapse ${project.name}`,
  expandProject: (project) => `Expand ${project.name}`,
  transferTask: (task) => `Move ${task.name} to another project`,
};
