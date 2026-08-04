import type { GanttSidebarColumn } from "../types";

/** Default id used by the built-in tree column when `columns` is omitted. */
export const DEFAULT_TREE_COLUMN_ID = "project";

/**
 * Builds the default sidebar columns: a single tree column whose header comes
 * from `labels.projectHeader`.
 */
export function getDefaultSidebarColumns<TProjectMeta, TTaskMeta>(
  projectHeader: string
): Array<GanttSidebarColumn<TProjectMeta, TTaskMeta>> {
  return [
    {
      id: DEFAULT_TREE_COLUMN_ID,
      kind: "tree",
      header: projectHeader,
    },
  ];
}

/**
 * Resolves consumer columns, falling back to the default tree column when
 * `columns` is `undefined`. An explicit empty array is preserved.
 */
export function resolveSidebarColumns<TProjectMeta, TTaskMeta>(
  columns: Array<GanttSidebarColumn<TProjectMeta, TTaskMeta>> | undefined,
  projectHeader: string
): Array<GanttSidebarColumn<TProjectMeta, TTaskMeta>> {
  return columns ?? getDefaultSidebarColumns(projectHeader);
}

function columnTrackWidth(
  column: Pick<GanttSidebarColumn, "kind" | "width">
): string {
  if (typeof column.width === "number") {
    return `${column.width}px`;
  }

  if (column.width) {
    return column.width;
  }

  return column.kind === "tree" ? "minmax(0, 1fr)" : "minmax(96px, 1fr)";
}

/**
 * Builds the CSS grid `grid-template-columns` value for the sidebar header and
 * row grids, including the trailing 12px gutter when the last column is
 * resizable.
 */
export function getSidebarGridTemplateColumns(
  columns: Array<Pick<GanttSidebarColumn, "kind" | "width" | "resizable">>
): string {
  const tracks = columns.map(columnTrackWidth);
  const hasTrailingGutter = columns.at(-1)?.resizable === true;

  if (hasTrailingGutter) {
    tracks.push("12px");
  }

  return tracks.join(" ");
}
