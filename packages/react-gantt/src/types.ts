import type { Locale } from "date-fns";
import type { ReactNode } from "react";

/**
 * Represents a date input, which can be a Date object, an ISO string, or a timestamp.
 */
export type GanttDateInput = Date | string | number;

/**
 * Zoom level or view mode for the Gantt chart timeline.
 */
export type GanttViewMode = "day" | "week" | "month" | "quarter" | "year";

/**
 * Custom column width overrides (in pixels) for specific view modes.
 */
export type GanttCellWidths = Partial<Record<GanttViewMode, number>>;

/**
 * Display mode for the task selection toolbar.
 * - "auto": The toolbar is automatically positioned above the selected task.
 * - "static": The toolbar stays in a fixed position (e.g. at the bottom of the chart).
 * - "hidden": The toolbar is disabled and not rendered.
 */
export type GanttSelectionToolbarMode = "auto" | "static" | "hidden";

/**
 * A contiguous date range that belongs to a segmented task.
 * When `segments` is present on a task, each entry is rendered and edited independently.
 */
export interface GanttTaskSegment {
  /** Unique identifier for the segment within its task. */
  id: string;
  /** The start date of the segment (Date object, ISO string, or timestamp). */
  start: GanttDateInput;
  /** The end date of the segment (Date object, ISO string, or timestamp). */
  end: GanttDateInput;
}

/**
 * Represents a user task in the Gantt chart.
 */
export interface GanttTask<TMeta = unknown> {
  /** Unique identifier for the task. */
  id: string;
  /** The ID of the project that this task belongs to. */
  projectId: string;
  /** The display name of the task. */
  name: string;
  /**
   * The start date of the task (Date object, ISO string, or timestamp).
   * When `segments` is provided, this is treated as the envelope and may be
   * derived from the earliest segment start during normalization.
   */
  start: GanttDateInput;
  /**
   * The end date of the task (Date object, ISO string, or timestamp).
   * When `segments` is provided, this is treated as the envelope and may be
   * derived from the latest segment end during normalization.
   */
  end: GanttDateInput;
  /**
   * Optional non-contiguous ranges for the same logical task.
   * When present and non-empty, segments are the visual/editable source of truth.
   */
  segments?: GanttTaskSegment[];
  /** Optional progress percentage (0 to 100). */
  progress?: number;
  /** Optional custom color code (e.g. Hex, RGB, HSL) for the task bar. */
  color?: string;
  /** Custom metadata for application-specific payload. */
  meta?: TMeta;
}

/**
 * Internal representation of a task segment with dates pre-normalized to Date objects.
 */
export interface NormalizedGanttTaskSegment {
  /** Unique identifier for the segment within its task. */
  id: string;
  /** The normalized start date. */
  start: Date;
  /** The normalized end date. */
  end: Date;
}

/**
 * Represents a project grouping one or more tasks.
 */
export interface GanttProject<TMeta = unknown, TTaskMeta = unknown> {
  /** Unique identifier for the project. */
  id: string;
  /** The display name of the project. */
  name: string;
  /** The list of tasks associated with this project. */
  tasks: Array<GanttTask<TTaskMeta>>;
  /** Optional progress percentage for the project summary. */
  progress?: number;
  /** Custom metadata for application-specific payload. */
  meta?: TMeta;
}

/**
 * Internal representation of a Gantt task with dates pre-normalized to Date objects.
 */
export interface NormalizedGanttTask<TMeta = unknown> extends Omit<
  GanttTask<TMeta>,
  "start" | "end" | "segments"
> {
  /** The normalized start date (envelope when segments exist). */
  start: Date;
  /** The normalized end date (envelope when segments exist). */
  end: Date;
  /** Normalized non-contiguous ranges, when the task is segmented. */
  segments?: NormalizedGanttTaskSegment[];
}

/**
 * Internal representation of a Gantt project with all tasks normalized.
 */
export interface NormalizedGanttProject<
  TMeta = unknown,
  TTaskMeta = unknown,
> extends Omit<GanttProject<TMeta, TTaskMeta>, "tasks"> {
  /** The normalized list of tasks under this project. */
  tasks: Array<NormalizedGanttTask<TTaskMeta>>;
}

/**
 * Summary information for a project when it is in a collapsed state.
 */
export interface CollapsedProjectSummary<
  TProjectMeta = unknown,
  TTaskMeta = unknown,
> {
  /** The project details. */
  project: NormalizedGanttProject<TProjectMeta, TTaskMeta>;
  /** The earliest start date among all tasks in the project. */
  start: Date;
  /** The latest end date among all tasks in the project. */
  end: Date;
  /** The total number of tasks in this project. */
  taskCount: number;
  /** Calculated or user-provided progress percentage. */
  progress?: number;
}

/**
 * Localized text labels and accessibility aria-labels used throughout the Gantt chart.
 */
export interface GanttLabels<TProjectMeta = unknown, TTaskMeta = unknown> {
  /** Header label for the project/sidebar column. */
  projectHeader: string;
  /** Message shown in the detail panel/toolbar when no task is selected. */
  noTaskSelected: string;
  /** Text for the button to clear the active task selection. */
  clearSelection: string;
  /** Text/label for the select task action. */
  selectAction: string;
  /** Text/label for the close action. */
  closeAction: string;
  /** Returns the string describing the number of tasks in a project. */
  taskCount: (count: number) => string;
  /** Accessible description for reordering a project row. */
  reorderProject: (
    project: NormalizedGanttProject<TProjectMeta, TTaskMeta>
  ) => string;
  /** Accessible description for collapsing a project row. */
  collapseProject: (
    project: NormalizedGanttProject<TProjectMeta, TTaskMeta>
  ) => string;
  /** Accessible description for expanding a project row. */
  expandProject: (
    project: NormalizedGanttProject<TProjectMeta, TTaskMeta>
  ) => string;
  /** Accessible description for transferring a task to another project. */
  transferTask: (task: NormalizedGanttTask<TTaskMeta>) => string;
}

/**
 * Payload emitted when a task is moved to a different timeframe.
 */
export interface TaskMovePayload {
  /** The ID of the moved task. */
  taskId: string;
  /** The project ID where the task belongs. */
  projectId: string;
  /** The new start date. */
  start: Date;
  /** The new end date. */
  end: Date;
  /** Present when a specific segment of a segmented task was moved. */
  segmentId?: string;
}

/**
 * Payload emitted when a task's duration is changed by resizing.
 */
export interface TaskResizePayload extends TaskMovePayload {
  /** Which edge of the task bar was dragged: 'start' or 'end'. */
  edge: "start" | "end";
}

/**
 * Payload emitted when tasks are reordered within a project.
 */
export interface TaskReorderPayload<TTaskMeta = unknown> {
  /** The ID of the task being reordered. */
  taskId: string;
  /** The ID of the project containing the tasks. */
  projectId: string;
  /** The original index of the task. */
  fromIndex: number;
  /** The destination index of the task. */
  toIndex: number;
  /** The complete updated, ordered list of tasks within this project. */
  tasks: Array<NormalizedGanttTask<TTaskMeta>>;
}

/**
 * Payload emitted when a task is moved from one project to another.
 */
export interface TaskTransferPayload {
  /** The ID of the task being transferred. */
  taskId: string;
  /** The source project ID. */
  fromProjectId: string;
  /** The destination project ID. */
  toProjectId: string;
  /** The new index position of the task in the destination project. */
  index: number;
}

/**
 * Payload emitted when projects are reordered.
 */
export interface ProjectReorderPayload<
  TProjectMeta = unknown,
  TTaskMeta = unknown,
> {
  /** The ID of the active project being dragged. */
  activeProjectId: string;
  /** The ID of the project being dragged over. */
  overProjectId: string;
  /** The complete updated, ordered list of projects. */
  projects: Array<NormalizedGanttProject<TProjectMeta, TTaskMeta>>;
}

/**
 * Imperative actions provided to custom context menus or toolbars.
 */
export interface ContextMenuActions {
  /** Closes the active context menu or selection toolbar. */
  close: () => void;
  /** Selects the task corresponding to the context menu/toolbar. */
  select: () => void;
}

/**
 * Payload emitted when the user opens the context menu on a task bar.
 */
export interface TaskContextMenuPayload<TTaskMeta = unknown> {
  /** The task instance that triggered the context menu. */
  task: NormalizedGanttTask<TTaskMeta>;
  /**
   * The specific segment that was right-clicked, when the task is segmented.
   * `undefined` for non-segmented tasks.
   */
  segment?: NormalizedGanttTaskSegment;
  /** The native React mouse event. */
  event: React.MouseEvent;
  /** Context actions that can be imperatively triggered. */
  actions: ContextMenuActions;
}

/**
 * Custom class names for styling key parts of the Gantt chart.
 */
export interface GanttClassNames {
  /** Custom class name for the outer container element. */
  root?: string;
  /** Custom class name for the top timeline header. */
  header?: string;
  /** Custom class name for the project sidebar pane. */
  sidebar?: string;
  /** Custom class name for a project row wrapper. */
  projectRow?: string;
  /** Custom class name for individual cells in the sidebar project rows. */
  projectCell?: string;
  /** Custom class name for a task row wrapper in the sidebar/timeline (only in tree mode). */
  taskRow?: string;
  /** Custom class name for individual cells in the sidebar task rows. */
  taskCell?: string;
  /** Custom class name for the main timeline scrolling grid area. */
  timeline?: string;
  /** Custom class name for individual task bars. */
  task?: string;
  /** Custom class name applied to the active selected task bar. */
  selectedTask?: string;
  /** Custom class name for dashed connectors between task segments. */
  segmentConnector?: string;
  /** Custom class name for the collapsed summary preview bars. */
  collapsedSummary?: string;
}

/**
 * Custom theme tokens mapped to CSS variables for UI styling.
 */
export interface GanttTheme {
  /** Background color for the container. */
  background?: string;
  /** Surface color for panels like the sidebar or headers. */
  surface?: string;
  /** Color for borders and divider lines. */
  border?: string;
  /** Primary text color. */
  text?: string;
  /** Muted or secondary text color. */
  mutedText?: string;
  /** Color for grid lines in the timeline view. */
  grid?: string;
  /** Default fill color for task bars. */
  task?: string;
  /** Default text color inside task bars. */
  taskText?: string;
  /** Accent/highlight color for selected tasks and focus elements. */
  selected?: string;
  /** Height of each project row in the table (e.g. '50px'). */
  rowHeight?: string;
  /** Initial width of the project sidebar. */
  sidebarWidth?: string;
  /** Minimum allowed width of the project sidebar. */
  minSidebarWidth?: string;
  /** Height of the timeline top header. */
  headerHeight?: string;
  /** Height of task bars within lanes. */
  taskHeight?: string;
  /** Vertical gap between multiple task lanes in the same row. */
  laneGap?: string;
  /** Custom background color for the project summary bar. */
  projectBar?: string;
  /** Custom text color inside the project summary bar. */
  projectBarText?: string;
  /** Custom border color for the project summary bar. */
  projectBarBorder?: string;
  /** Custom progress fill color for the project summary bar. */
  projectBarProgress?: string;
  /** Custom background color for a row when hovered. */
  rowHoverBg?: string;
  /** Custom background color for a row when selected. */
  rowSelectedBg?: string;
  /** Font family for the chart UI. Use `inherit` to adopt the parent site typography. */
  fontFamily?: string;
}

/**
 * Props accepted by the GanttChart component.
 */
export interface GanttChartProps<TProjectMeta = unknown, TTaskMeta = unknown> {
  /** The array of projects containing tasks to display. */
  projects: Array<GanttProject<TProjectMeta, TTaskMeta>>;
  /** The active timeline scale (e.g. day-level zoom or year-level zoom). */
  viewMode: GanttViewMode;
  /** The minimum allowed date for the timeline and task actions. */
  minDate?: GanttDateInput;
  /** The maximum allowed date for the timeline and task actions. */
  maxDate?: GanttDateInput;
  /** The ID of the currently selected task. Pass null or undefined for no selection. */
  selectedTaskId?: string | null;
  /** Determines how and when the task selection details toolbar is displayed. */
  selectionToolbarMode?: GanttSelectionToolbarMode;
  /** Controlled list of collapsed project IDs. Must be updated via onProjectCollapseChange. */
  collapsedProjectIds?: string[];
  /** Initial list of collapsed project IDs for uncontrolled mode. */
  defaultCollapsedProjectIds?: string[];
  /** Specifies date alignment or snapping behavior during moves/resizes. Defaults to viewMode. */
  snapTo?: GanttViewMode | "none";
  /**
   * When true, draws a dashed connector between consecutive segments of the
   * same task. Off by default. Only affects tasks that define `segments`.
   */
  showSegmentConnectors?: boolean;
  /** Custom cell widths (in pixels) for columns in different view modes. */
  customCellWidths?: GanttCellWidths;
  /** Enables row virtualization to handle large datasets efficiently. */
  virtualized?: boolean;
  /** Number of extra off-screen rows to render when virtualization is enabled. */
  overscan?: number;
  /** Current width of the project sidebar (controlled or initial). */
  sidebarWidth?: string | number;
  /** The minimum width the project sidebar can be resized to. */
  minSidebarWidth?: string | number;
  /** Callback triggered when the sidebar width changes via dragging the resize handle. */
  onSidebarWidthChange?: (width: number) => void;
  /** CSS class applied to the root element. */
  className?: string;
  /** Custom class name overrides for internal Gantt elements. */
  classNames?: GanttClassNames;
  /** Custom theme token overrides. */
  theme?: GanttTheme;
  /** Custom localized labels and accessibility text overrides. */
  labels?: Partial<GanttLabels<TProjectMeta, TTaskMeta>>;
  /** Locale used to format timeline header dates. Pass a `date-fns` locale object, e.g. `import { es } from "date-fns/locale"`. */
  locale?: Locale;
  /** Layout mode of the Gantt chart: 'compact' renders tasks packed in lanes, 'tree' renders tasks on their own rows under projects. */
  layoutMode?: "compact" | "tree";
  /** Custom render function for rendering task cells in the sidebar (only in tree mode). */
  renderSidebarTaskCell?: (task: NormalizedGanttTask<TTaskMeta>) => ReactNode;
  /** Event callback triggered when a task is moved (dragged horizontally). */
  onTaskMove?: (payload: TaskMovePayload) => void;
  /**
   * Event callback triggered once when a horizontal move interaction ends
   * (pointer up). Includes optional `segmentId` for segmented tasks.
   */
  onTaskMoveEnd?: (payload: TaskMovePayload) => void;
  /** Event callback triggered when a task is resized (start or end edge dragged). */
  onTaskResize?: (payload: TaskResizePayload) => void;
  /**
   * Event callback triggered once when a resize interaction ends (pointer up).
   * Includes optional `segmentId` for segmented tasks.
   */
  onTaskResizeEnd?: (payload: TaskResizePayload) => void;
  /** Event callback triggered when a task is transferred between projects. */
  onTaskTransfer?: (payload: TaskTransferPayload) => void;
  /** Event callback triggered when tasks are reordered inside their project. */
  onTaskReorder?: (payload: TaskReorderPayload<TTaskMeta>) => void;
  /** Event callback triggered when projects are reordered. */
  onProjectReorder?: (
    payload: ProjectReorderPayload<TProjectMeta, TTaskMeta>
  ) => void;
  /** Event callback triggered when a project is collapsed or expanded. */
  onProjectCollapseChange?: (
    projectId: string,
    collapsed: boolean,
    collapsedProjectIds: string[]
  ) => void;
  /** Event callback triggered when a task is selected or deselected. */
  onTaskSelect?: (task: NormalizedGanttTask<TTaskMeta> | null) => void;
  /** Event callback triggered when a right-click / context menu is requested on a task. */
  onTaskContextMenu?: (payload: TaskContextMenuPayload<TTaskMeta>) => void;
  /** Custom render function for rendering task bars. */
  renderTask?: (
    task: NormalizedGanttTask<TTaskMeta>,
    state: { selected: boolean }
  ) => ReactNode;
  /** Custom render function for rendering hover tooltips on tasks. */
  renderTaskTooltip?: (
    task: NormalizedGanttTask<TTaskMeta>,
    state: { segment?: NormalizedGanttTaskSegment }
  ) => ReactNode;
  /** Custom render function for the context menu of a task. */
  renderContextMenu?: (ctx: {
    task: NormalizedGanttTask<TTaskMeta>;
    /** Present when the context menu was opened on a specific segment. */
    segment?: NormalizedGanttTaskSegment;
    actions: ContextMenuActions;
  }) => ReactNode;
  /** Custom render function for the selection toolbar shown when a task is selected. */
  renderSelectionToolbar?: (
    task: NormalizedGanttTask<TTaskMeta>,
    actions: ContextMenuActions
  ) => ReactNode;
  /** Custom render function for the selection toolbar shown when no task is selected. */
  renderEmptySelectionToolbar?: (actions: ContextMenuActions) => ReactNode;
  /** Custom render function for project rows inside the sidebar column. */
  renderProjectCell?: (
    project: NormalizedGanttProject<TProjectMeta, TTaskMeta>,
    state: { collapsed: boolean; taskCount: number }
  ) => ReactNode;
  /** Custom render function for the header cell of the sidebar. */
  renderSidebarHeader?: () => ReactNode;
  /** Custom render function for individual timeline header cells. */
  renderHeaderCell?: (cell: {
    id: string;
    start: Date;
    end: Date;
    label: string;
  }) => ReactNode;
  /** Custom render function for timeline grid cells. */
  renderTimelineCell?: (cell: {
    id: string;
    start: Date;
    end: Date;
    label: string;
  }) => ReactNode;
  /** Custom render function for summary bars displayed on collapsed projects. */
  renderCollapsedProjectSummary?: (
    summary: CollapsedProjectSummary<TProjectMeta, TTaskMeta>
  ) => ReactNode;
}

/**
 * Imperative handle methods exposed by the GanttChart component via React ref.
 */
export interface GanttChartHandle {
  /** Scrolls the timeline grid smoothly to a specific target date. */
  scrollToDate: (date: GanttDateInput) => void;
  /** Scrolls the timeline grid and row view to bring a specific task into viewport. */
  scrollToTask: (taskId: string) => void;
  /** Selects a task imperatively. Pass null to clear selection. */
  selectTask: (taskId: string | null) => void;
  /** Collapses a specific project row. */
  collapseProject: (projectId: string) => void;
  /** Expands a specific project row. */
  expandProject: (projectId: string) => void;
  /** Toggles the collapsed state of a specific project row. */
  toggleProject: (projectId: string) => void;
}

export interface ProjectRowModel<TProjectMeta = unknown, TTaskMeta = unknown> {
  type: "project";
  id: string;
  project: NormalizedGanttProject<TProjectMeta, TTaskMeta>;
  height: number;
  collapsed: boolean;
  lanes: Array<{ index: number; tasks: Array<NormalizedGanttTask<TTaskMeta>> }>;
}

export interface TaskRowModel<TProjectMeta = unknown, TTaskMeta = unknown> {
  type: "task";
  id: string;
  task: NormalizedGanttTask<TTaskMeta>;
  project: NormalizedGanttProject<TProjectMeta, TTaskMeta>;
  height: number;
  index: number;
}

export type GanttRowModel<TProjectMeta = unknown, TTaskMeta = unknown> =
  | ProjectRowModel<TProjectMeta, TTaskMeta>
  | TaskRowModel<TProjectMeta, TTaskMeta>;
