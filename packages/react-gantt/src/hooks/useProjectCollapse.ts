import { useCallback, useState } from "react";
import type { GanttChartProps } from "../types";

export function useProjectCollapse<TProjectMeta, TTaskMeta>({
  collapsedProjectIds,
  defaultCollapsedProjectIds,
  onProjectCollapseChange,
}: Pick<
  GanttChartProps<TProjectMeta, TTaskMeta>,
  | "collapsedProjectIds"
  | "defaultCollapsedProjectIds"
  | "onProjectCollapseChange"
>) {
  const [internalCollapsedIds, setInternalCollapsedIds] = useState<string[]>(
    defaultCollapsedProjectIds ?? []
  );
  const effectiveCollapsedIds = collapsedProjectIds ?? internalCollapsedIds;
  const setProjectCollapsed = useCallback(
    (projectId: string, collapsed: boolean) => {
      const nextIds = collapsed
        ? Array.from(new Set([...effectiveCollapsedIds, projectId]))
        : effectiveCollapsedIds.filter((id) => id !== projectId);

      if (!collapsedProjectIds) {
        setInternalCollapsedIds(nextIds);
      }

      onProjectCollapseChange?.(projectId, collapsed, nextIds);
    },
    [collapsedProjectIds, effectiveCollapsedIds, onProjectCollapseChange]
  );
  const toggleProject = useCallback(
    (projectId: string) =>
      setProjectCollapsed(
        projectId,
        !effectiveCollapsedIds.includes(projectId)
      ),
    [effectiveCollapsedIds, setProjectCollapsed]
  );

  return {
    effectiveCollapsedIds,
    setProjectCollapsed,
    toggleProject,
  };
}
