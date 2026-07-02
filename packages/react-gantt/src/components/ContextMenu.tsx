import type {
  ContextMenuActions,
  GanttChartProps,
  GanttLabels,
  NormalizedGanttTask,
} from "../types";

export interface ContextMenuState<TTaskMeta> {
  task: NormalizedGanttTask<TTaskMeta>;
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
  return (
    <div
      className="sokkay-gantt__context-menu"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      role="menu"
      onClick={(event) => event.stopPropagation()}
    >
      {renderContextMenu ? (
        renderContextMenu({
          task: contextMenu.task,
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
