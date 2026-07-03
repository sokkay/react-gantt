import type * as React from "react";
import type { GanttTheme } from "../types";

export function toCssSize(value?: string | number) {
  return typeof value === "number" ? `${value}px` : value;
}

export function toPixelNumber(
  value: string | number | undefined,
  fallback: number
) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.endsWith("px")) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function createThemeStyle({
  theme,
  sidebarWidth,
  minSidebarWidth,
}: {
  theme?: GanttTheme;
  sidebarWidth?: string | number;
  minSidebarWidth?: string | number;
}) {
  return {
    "--sg-background": theme?.background,
    "--sg-surface": theme?.surface,
    "--sg-border": theme?.border,
    "--sg-text": theme?.text,
    "--sg-muted-text": theme?.mutedText,
    "--sg-grid": theme?.grid,
    "--sg-task": theme?.task,
    "--sg-task-text": theme?.taskText,
    "--sg-selected": theme?.selected,
    "--sg-row-height": theme?.rowHeight,
    "--sg-sidebar-width": toCssSize(sidebarWidth ?? theme?.sidebarWidth),
    "--sg-sidebar-min-width": toCssSize(
      minSidebarWidth ?? theme?.minSidebarWidth
    ),
    "--sg-header-height": theme?.headerHeight,
    "--sg-task-height": theme?.taskHeight,
    "--sg-lane-gap": theme?.laneGap,
    "--sg-project-bar": theme?.projectBar,
    "--sg-project-bar-text": theme?.projectBarText,
    "--sg-project-bar-border": theme?.projectBarBorder,
    "--sg-project-bar-progress": theme?.projectBarProgress,
    "--sg-row-hover-bg": theme?.rowHoverBg,
    "--sg-row-selected-bg": theme?.rowSelectedBg,
  } as React.CSSProperties;
}
