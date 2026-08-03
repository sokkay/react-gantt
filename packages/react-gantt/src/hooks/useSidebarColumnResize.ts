import type * as React from "react";
import { useCallback } from "react";
import type { GanttSidebarColumn, SidebarColumnResizePayload } from "../types";
import { toPixelNumber } from "../utils/theme";

interface SidebarColumnResizeOptions {
  onWidthChange?: (payload: SidebarColumnResizePayload) => void;
  onResizeEnd?: (payload: SidebarColumnResizePayload) => void;
}

type ResizableSidebarColumn = Pick<
  GanttSidebarColumn,
  "id" | "width" | "minWidth" | "maxWidth"
>;

function getColumnWidth(
  element: HTMLElement | null,
  column: ResizableSidebarColumn
) {
  const renderedWidth = element?.getBoundingClientRect().width ?? 0;
  return renderedWidth > 0 ? renderedWidth : toPixelNumber(column.width, 96);
}

function clampColumnWidth(width: number, column: ResizableSidebarColumn) {
  return Math.min(
    column.maxWidth ?? Number.POSITIVE_INFINITY,
    Math.max(column.minWidth ?? 48, width)
  );
}

export function useSidebarColumnResize({
  onWidthChange,
  onResizeEnd,
}: SidebarColumnResizeOptions) {
  const handlePointerDown = useCallback(
    (event: React.PointerEvent, column: ResizableSidebarColumn) => {
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startWidth = getColumnWidth(
        event.currentTarget.parentElement,
        column
      );
      let lastWidth = startWidth;

      const handleMove = (moveEvent: PointerEvent) => {
        lastWidth = clampColumnWidth(
          startWidth + moveEvent.clientX - startX,
          column
        );
        onWidthChange?.({ columnId: column.id, width: lastWidth });
      };

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        onResizeEnd?.({ columnId: column.id, width: lastWidth });
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp, { once: true });
    },
    [onResizeEnd, onWidthChange]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, column: ResizableSidebarColumn) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const currentWidth = getColumnWidth(
        event.currentTarget.parentElement,
        column
      );
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const width = clampColumnWidth(currentWidth + direction * 10, column);
      const payload = { columnId: column.id, width };
      onWidthChange?.(payload);
      onResizeEnd?.(payload);
    },
    [onResizeEnd, onWidthChange]
  );

  return { handlePointerDown, handleKeyDown };
}
