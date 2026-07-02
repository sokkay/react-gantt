import type * as React from "react";
import { useCallback, useState } from "react";
import type { GanttChartProps } from "../types";
import { toPixelNumber } from "../utils/theme";

export function useSidebarResize<TProjectMeta, TTaskMeta>({
  sidebarWidth,
  minSidebarWidth,
  theme,
  onSidebarWidthChange,
}: Pick<
  GanttChartProps<TProjectMeta, TTaskMeta>,
  "sidebarWidth" | "minSidebarWidth" | "theme" | "onSidebarWidthChange"
>) {
  const sidebarWidthFallback = toPixelNumber(
    sidebarWidth ?? theme?.sidebarWidth,
    240
  );
  const sidebarMinWidth = toPixelNumber(
    minSidebarWidth ?? theme?.minSidebarWidth,
    220
  );
  const [internalSidebarWidth, setInternalSidebarWidth] =
    useState(sidebarWidthFallback);
  const effectiveSidebarWidth = Math.max(
    toPixelNumber(sidebarWidth, internalSidebarWidth),
    sidebarMinWidth
  );

  const handleSidebarResizeStart = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = effectiveSidebarWidth;

      const handleMove = (moveEvent: PointerEvent) => {
        const nextWidth = Math.max(
          sidebarMinWidth,
          startWidth + moveEvent.clientX - startX
        );

        if (sidebarWidth === undefined) {
          setInternalSidebarWidth(nextWidth);
        }

        onSidebarWidthChange?.(nextWidth);
      };

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp, { once: true });
    },
    [effectiveSidebarWidth, onSidebarWidthChange, sidebarMinWidth, sidebarWidth]
  );

  return {
    effectiveSidebarWidth,
    sidebarMinWidth,
    handleSidebarResizeStart,
  };
}
