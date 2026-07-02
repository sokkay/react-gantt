import type {
  ContextMenuActions,
  GanttChartProps,
  GanttLabels,
  NormalizedGanttTask,
} from "../types";
import { cx } from "../utils/cx";

export function SelectionToolbar<TTaskMeta>({
  selectedTask,
  labels,
  renderSelectionToolbar,
  renderEmptySelectionToolbar,
  onTaskSelect,
  closeContextMenu,
}: {
  selectedTask: NormalizedGanttTask<TTaskMeta> | null;
  labels: Pick<
    GanttLabels<unknown, TTaskMeta>,
    "clearSelection" | "noTaskSelected"
  >;
  renderSelectionToolbar?: GanttChartProps<
    unknown,
    TTaskMeta
  >["renderSelectionToolbar"];
  renderEmptySelectionToolbar?: GanttChartProps<
    unknown,
    TTaskMeta
  >["renderEmptySelectionToolbar"];
  onTaskSelect?: (task: NormalizedGanttTask<TTaskMeta> | null) => void;
  closeContextMenu: () => void;
}) {
  const selectedActions: ContextMenuActions | null = selectedTask
    ? {
        close: closeContextMenu,
        select: () => onTaskSelect?.(selectedTask),
      }
    : null;
  const emptyActions: ContextMenuActions = {
    close: closeContextMenu,
    select: () => undefined,
  };

  return (
    <div
      className={cx(
        "sokkay-gantt__selection-toolbar",
        !selectedTask && "is-empty"
      )}
    >
      {selectedTask ? (
        renderSelectionToolbar ? (
          renderSelectionToolbar(selectedTask, selectedActions!)
        ) : (
          <>
            <strong>{selectedTask.name}</strong>
            <button type="button" onClick={() => onTaskSelect?.(null)}>
              {labels.clearSelection}
            </button>
          </>
        )
      ) : renderEmptySelectionToolbar ? (
        renderEmptySelectionToolbar(emptyActions)
      ) : (
        <span className="sokkay-gantt__selection-placeholder">
          {labels.noTaskSelected}
        </span>
      )}
    </div>
  );
}
