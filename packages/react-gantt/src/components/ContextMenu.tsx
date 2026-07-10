import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  ContextMenuActions,
  GanttChartProps,
  GanttLabels,
  NormalizedGanttTask,
  NormalizedGanttTaskSegment,
} from "../types";

export interface ContextMenuState<TTaskMeta> {
  task: NormalizedGanttTask<TTaskMeta>;
  segment?: NormalizedGanttTaskSegment;
  x: number;
  y: number;
}

export function ContextMenu<TTaskMeta>({
  contextMenu,
  actions,
  labels,
  renderContextMenu,
}: {
  contextMenu: ContextMenuState<TTaskMeta>;
  actions: ContextMenuActions;
  labels: Pick<GanttLabels<unknown, TTaskMeta>, "selectAction" | "closeAction">;
  renderContextMenu?: GanttChartProps<unknown, TTaskMeta>["renderContextMenu"];
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({
    left: contextMenu.x,
    top: contextMenu.y,
  });

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const { width, height } = menu.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight =
      document.documentElement.clientHeight || window.innerHeight;
    const padding = 8;
    const left = Math.max(
      padding,
      Math.min(contextMenu.x, viewportWidth - width - padding)
    );
    const top =
      contextMenu.y + height + padding > viewportHeight
        ? Math.max(padding, contextMenu.y - height)
        : contextMenu.y;

    setPosition({ left, top });
  }, [contextMenu.x, contextMenu.y]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        actions.close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actions]);

  return (
    <div
      ref={menuRef}
      className="sokkay-gantt__context-menu"
      style={{ left: position.left, top: position.top }}
      role="menu"
      onClick={(event) => event.stopPropagation()}
    >
      {renderContextMenu ? (
        renderContextMenu({
          task: contextMenu.task,
          segment: contextMenu.segment,
          actions,
        })
      ) : (
        <>
          <button type="button" onClick={() => actions.select()}>
            {labels.selectAction}
          </button>
          <button type="button" onClick={actions.close}>
            {labels.closeAction}
          </button>
        </>
      )}
    </div>
  );
}
