import { useCallback, useMemo, useRef } from "react";
import type {
  GanttChartProps,
  GanttResolvedRow,
  GanttRowModel,
  GanttRowSelection,
} from "../types";

function selectionKey(selection: GanttRowSelection) {
  return selection.type === "project"
    ? `project:${selection.projectId}`
    : `task:${selection.projectId}:${selection.taskId}`;
}

export function rowSelectionFromModel<TProjectMeta, TTaskMeta>(
  row: GanttRowModel<TProjectMeta, TTaskMeta>
): GanttRowSelection {
  return row.type === "project"
    ? { type: "project", projectId: row.project.id }
    : {
        type: "task",
        projectId: row.project.id,
        taskId: row.task.id,
      };
}

export function resolvedRowFromModel<TProjectMeta, TTaskMeta>(
  row: GanttRowModel<TProjectMeta, TTaskMeta>
): GanttResolvedRow<TProjectMeta, TTaskMeta> {
  return row.type === "project"
    ? { type: "project", project: row.project }
    : { type: "task", project: row.project, task: row.task };
}

export function useRowSelection<TProjectMeta, TTaskMeta>({
  flatRows,
  selectedRows,
  onRowSelectionChange,
}: {
  flatRows: Array<GanttRowModel<TProjectMeta, TTaskMeta>>;
  selectedRows: GanttRowSelection[];
  onRowSelectionChange: GanttChartProps<
    TProjectMeta,
    TTaskMeta
  >["onRowSelectionChange"];
}) {
  const anchorRowKeyRef = useRef<string | null>(null);
  const selectedRowKeys = useMemo(
    () => new Set(selectedRows.map(selectionKey)),
    [selectedRows]
  );

  const resolveSelection = useCallback(
    (selection: Iterable<GanttRowSelection>) => {
      const requestedKeys = new Set(Array.from(selection, selectionKey));
      const selectedModels = flatRows.filter((row) =>
        requestedKeys.has(selectionKey(rowSelectionFromModel(row)))
      );

      return {
        selectedRows: selectedModels.map(rowSelectionFromModel),
        rows: selectedModels.map(resolvedRowFromModel),
      };
    },
    [flatRows]
  );

  const emitSelection = useCallback(
    (selection: Iterable<GanttRowSelection>) => {
      const payload = resolveSelection(selection);
      onRowSelectionChange?.(payload);
      return payload;
    },
    [onRowSelectionChange, resolveSelection]
  );

  const selectRow = useCallback(
    (
      row: GanttRowModel<TProjectMeta, TTaskMeta>,
      modifiers: { shiftKey: boolean; toggleKey: boolean }
    ) => {
      const rowSelection = rowSelectionFromModel(row);
      const rowKey = selectionKey(rowSelection);
      const rowIndex = flatRows.findIndex(
        (item) => selectionKey(rowSelectionFromModel(item)) === rowKey
      );

      if (rowIndex < 0) {
        return;
      }

      if (modifiers.shiftKey) {
        const fallbackAnchor = selectedRows.at(-1);
        const anchorKey =
          anchorRowKeyRef.current ??
          (fallbackAnchor ? selectionKey(fallbackAnchor) : rowKey);
        const anchorIndex = flatRows.findIndex(
          (item) => selectionKey(rowSelectionFromModel(item)) === anchorKey
        );
        const rangeStart = Math.min(
          anchorIndex < 0 ? rowIndex : anchorIndex,
          rowIndex
        );
        const rangeEnd = Math.max(
          anchorIndex < 0 ? rowIndex : anchorIndex,
          rowIndex
        );
        const range = flatRows
          .slice(rangeStart, rangeEnd + 1)
          .map(rowSelectionFromModel);

        emitSelection(
          modifiers.toggleKey ? [...selectedRows, ...range] : range
        );
        return;
      }

      anchorRowKeyRef.current = rowKey;

      if (modifiers.toggleKey) {
        const nextSelection = selectedRowKeys.has(rowKey)
          ? selectedRows.filter((item) => selectionKey(item) !== rowKey)
          : [...selectedRows, rowSelection];
        emitSelection(nextSelection);
        return;
      }

      emitSelection([rowSelection]);
    },
    [emitSelection, flatRows, selectedRowKeys, selectedRows]
  );

  const isRowSelected = useCallback(
    (row: GanttRowModel<TProjectMeta, TTaskMeta>) => {
      return selectedRowKeys.has(selectionKey(rowSelectionFromModel(row)));
    },
    [selectedRowKeys]
  );

  return { emitSelection, isRowSelected, resolveSelection, selectRow };
}
