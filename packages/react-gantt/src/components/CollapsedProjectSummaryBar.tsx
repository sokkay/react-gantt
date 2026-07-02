import type {
  CollapsedProjectSummary,
  GanttChartProps,
  GanttLabels,
  GanttViewMode,
} from "../types";
import { cx } from "../utils/cx";
import { dateRangeToPixels, type TimelineModel } from "../utils/timeline";

export function CollapsedProjectSummaryBar<TProjectMeta, TTaskMeta>({
  summary,
  timeline,
  viewMode,
  className,
  labels,
  renderCollapsedProjectSummary,
}: {
  summary: CollapsedProjectSummary<TProjectMeta, TTaskMeta>;
  timeline: TimelineModel;
  viewMode: GanttViewMode;
  className?: string;
  labels: Pick<GanttLabels<TProjectMeta, TTaskMeta>, "taskCount">;
  renderCollapsedProjectSummary?: GanttChartProps<
    TProjectMeta,
    TTaskMeta
  >["renderCollapsedProjectSummary"];
}) {
  const range = dateRangeToPixels(
    summary.start,
    summary.end,
    timeline,
    viewMode
  );
  const width = Math.max(range.width, 36);

  return (
    <div
      className={cx("sokkay-gantt__collapsed-summary", className)}
      data-testid={`project-summary-${summary.project.id}`}
      style={{ left: range.left, width }}
    >
      {renderCollapsedProjectSummary ? (
        renderCollapsedProjectSummary(summary)
      ) : (
        <>
          <strong className="sokkay-gantt__collapsed-summary-name">
            {summary.project.name}
          </strong>
          <span className="sokkay-gantt__collapsed-summary-meta">
            {labels.taskCount(summary.taskCount)}
          </span>
        </>
      )}
    </div>
  );
}
