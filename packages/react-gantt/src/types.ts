import type { ReactNode } from "react";

export type GanttDateInput = Date | string | number;

export type GanttViewMode = "day" | "week" | "month" | "quarter" | "year";

export type GanttSelectionToolbarMode = "auto" | "static" | "hidden";

export interface GanttTask<TMeta = unknown> {
  id: string;
  projectId: string;
  name: string;
  start: GanttDateInput;
  end: GanttDateInput;
  progress?: number;
  color?: string;
  meta?: TMeta;
}

export interface GanttProject<TMeta = unknown, TTaskMeta = unknown> {
  id: string;
  name: string;
  tasks: Array<GanttTask<TTaskMeta>>;
  meta?: TMeta;
}

export interface NormalizedGanttTask<TMeta = unknown> extends Omit<
  GanttTask<TMeta>,
  "start" | "end"
> {
  start: Date;
  end: Date;
}

export interface NormalizedGanttProject<
  TMeta = unknown,
  TTaskMeta = unknown,
> extends Omit<GanttProject<TMeta, TTaskMeta>, "tasks"> {
  tasks: Array<NormalizedGanttTask<TTaskMeta>>;
}

export interface CollapsedProjectSummary<
  TProjectMeta = unknown,
  TTaskMeta = unknown,
> {
  project: NormalizedGanttProject<TProjectMeta, TTaskMeta>;
  start: Date;
  end: Date;
  taskCount: number;
}

export interface GanttLabels<TProjectMeta = unknown, TTaskMeta = unknown> {
  projectHeader: string;
  noTaskSelected: string;
  clearSelection: string;
  selectAction: string;
  closeAction: string;
  taskCount: (count: number) => string;
  reorderProject: (
    project: NormalizedGanttProject<TProjectMeta, TTaskMeta>
  ) => string;
  collapseProject: (
    project: NormalizedGanttProject<TProjectMeta, TTaskMeta>
  ) => string;
  expandProject: (
    project: NormalizedGanttProject<TProjectMeta, TTaskMeta>
  ) => string;
  transferTask: (task: NormalizedGanttTask<TTaskMeta>) => string;
}

export interface TaskMovePayload {
  taskId: string;
  projectId: string;
  start: Date;
  end: Date;
}

export interface TaskResizePayload extends TaskMovePayload {
  edge: "start" | "end";
}

export interface TaskReorderPayload<TTaskMeta = unknown> {
  taskId: string;
  projectId: string;
  fromIndex: number;
  toIndex: number;
  tasks: Array<NormalizedGanttTask<TTaskMeta>>;
}

export interface TaskTransferPayload {
  taskId: string;
  fromProjectId: string;
  toProjectId: string;
  index: number;
}

export interface ProjectReorderPayload<
  TProjectMeta = unknown,
  TTaskMeta = unknown,
> {
  activeProjectId: string;
  overProjectId: string;
  projects: Array<NormalizedGanttProject<TProjectMeta, TTaskMeta>>;
}

export interface ContextMenuActions {
  close: () => void;
  select: () => void;
}

export interface TaskContextMenuPayload<TTaskMeta = unknown> {
  task: NormalizedGanttTask<TTaskMeta>;
  event: React.MouseEvent;
  actions: ContextMenuActions;
}

export interface GanttClassNames {
  root?: string;
  header?: string;
  sidebar?: string;
  projectRow?: string;
  projectCell?: string;
  timeline?: string;
  task?: string;
  selectedTask?: string;
  collapsedSummary?: string;
}

export interface GanttTheme {
  background?: string;
  surface?: string;
  border?: string;
  text?: string;
  mutedText?: string;
  grid?: string;
  task?: string;
  taskText?: string;
  selected?: string;
  rowHeight?: string;
  sidebarWidth?: string;
  headerHeight?: string;
  taskHeight?: string;
  laneGap?: string;
}

export interface GanttChartProps<TProjectMeta = unknown, TTaskMeta = unknown> {
  projects: Array<GanttProject<TProjectMeta, TTaskMeta>>;
  viewMode: GanttViewMode;
  selectedTaskId?: string | null;
  selectionToolbarMode?: GanttSelectionToolbarMode;
  collapsedProjectIds?: string[];
  defaultCollapsedProjectIds?: string[];
  snapTo?: GanttViewMode | "none";
  virtualized?: boolean;
  overscan?: number;
  className?: string;
  classNames?: GanttClassNames;
  theme?: GanttTheme;
  labels?: Partial<GanttLabels<TProjectMeta, TTaskMeta>>;
  onTaskMove?: (payload: TaskMovePayload) => void;
  onTaskResize?: (payload: TaskResizePayload) => void;
  onTaskTransfer?: (payload: TaskTransferPayload) => void;
  onTaskReorder?: (payload: TaskReorderPayload<TTaskMeta>) => void;
  onProjectReorder?: (
    payload: ProjectReorderPayload<TProjectMeta, TTaskMeta>
  ) => void;
  onProjectCollapseChange?: (
    projectId: string,
    collapsed: boolean,
    collapsedProjectIds: string[]
  ) => void;
  onTaskSelect?: (task: NormalizedGanttTask<TTaskMeta> | null) => void;
  onTaskContextMenu?: (payload: TaskContextMenuPayload<TTaskMeta>) => void;
  renderTask?: (
    task: NormalizedGanttTask<TTaskMeta>,
    state: { selected: boolean }
  ) => ReactNode;
  renderTaskTooltip?: (task: NormalizedGanttTask<TTaskMeta>) => ReactNode;
  renderContextMenu?: (ctx: {
    task: NormalizedGanttTask<TTaskMeta>;
    actions: ContextMenuActions;
  }) => ReactNode;
  renderSelectionToolbar?: (
    task: NormalizedGanttTask<TTaskMeta>,
    actions: ContextMenuActions
  ) => ReactNode;
  renderEmptySelectionToolbar?: (actions: ContextMenuActions) => ReactNode;
  renderProjectCell?: (
    project: NormalizedGanttProject<TProjectMeta, TTaskMeta>,
    state: { collapsed: boolean; taskCount: number }
  ) => ReactNode;
  renderSidebarHeader?: () => ReactNode;
  renderHeaderCell?: (cell: {
    id: string;
    start: Date;
    end: Date;
    label: string;
  }) => ReactNode;
  renderTimelineCell?: (cell: {
    id: string;
    start: Date;
    end: Date;
    label: string;
  }) => ReactNode;
  renderCollapsedProjectSummary?: (
    summary: CollapsedProjectSummary<TProjectMeta, TTaskMeta>
  ) => ReactNode;
}

export interface GanttChartHandle {
  scrollToDate: (date: GanttDateInput) => void;
  scrollToTask: (taskId: string) => void;
  selectTask: (taskId: string | null) => void;
  collapseProject: (projectId: string) => void;
  expandProject: (projectId: string) => void;
  toggleProject: (projectId: string) => void;
}
