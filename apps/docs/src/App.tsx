import {
  GanttChart,
  type GanttProject,
  type GanttTask,
  type GanttViewMode,
  type NormalizedGanttTask,
  type TaskMovePayload,
  type TaskReorderPayload,
  type TaskResizePayload,
  type TaskTransferPayload,
  useGanttChart,
} from "@sokkay/react-gantt";
import "@sokkay/react-gantt/styles.css";
import { addDays, format } from "date-fns";
import { useMemo, useRef, useState } from "react";
import {
  demoCopy,
  demoLanguages,
  type DemoCopy,
  type DemoLanguage,
} from "./demo-i18n";
import "./App.css";

const viewModes: GanttViewMode[] = ["day", "week", "month", "quarter", "year"];

const initialProjects: Array<
  GanttProject<{ owner: string }, { status: string }>
> = [
  {
    id: "platform",
    name: "Platform",
    meta: { owner: "Core" },
    tasks: [
      {
        id: "api",
        projectId: "platform",
        name: "Public API",
        start: "2026-07-01",
        end: "2026-07-12",
        progress: 45,
        color: "#2563eb",
        meta: { status: "In progress" },
      },
      {
        id: "styles",
        projectId: "platform",
        name: "CSS distribution",
        start: "2026-07-09",
        end: "2026-07-18",
        progress: 72,
        color: "#0891b2",
        meta: { status: "Review" },
      },
      {
        id: "lanes",
        projectId: "platform",
        name: "Lane layout",
        start: "2026-07-08",
        end: "2026-07-16",
        progress: 30,
        color: "#7c3aed",
        meta: { status: "Planned" },
      },
    ],
  },
  {
    id: "interactions",
    name: "Interactions",
    meta: { owner: "Product" },
    tasks: [
      {
        id: "drag",
        projectId: "interactions",
        name: "Horizontal drag",
        start: "2026-07-05",
        end: "2026-07-14",
        progress: 60,
        color: "#16a34a",
        meta: { status: "In progress" },
      },
      {
        id: "resize",
        projectId: "interactions",
        name: "Resize edges",
        start: "2026-07-16",
        end: "2026-07-24",
        progress: 20,
        color: "#9333ea",
        meta: { status: "Planned" },
      },
    ],
  },
  {
    id: "docs",
    name: "Docs app",
    meta: { owner: "DX" },
    tasks: [
      {
        id: "demo",
        projectId: "docs",
        name: "Controlled demo",
        start: "2026-07-10",
        end: "2026-07-22",
        progress: 35,
        color: "#ea580c",
        meta: { status: "In progress" },
      },
    ],
  },
];

const segmentedProjects: Array<
  GanttProject<{ owner: string }, { status: string }>
> = [
  {
    id: "segments",
    name: "Segmented work",
    meta: { owner: "Ops" },
    tasks: [
      {
        id: "weekday-block",
        projectId: "segments",
        name: "Weekday delivery",
        start: "2026-07-06",
        end: "2026-07-17",
        progress: 55,
        color: "#0d9488",
        meta: { status: "Weekdays" },
        segments: [
          { id: "wd-w1", start: "2026-07-06", end: "2026-07-10" },
          { id: "wd-w2", start: "2026-07-13", end: "2026-07-17" },
        ],
      },
      {
        id: "biweekly-review",
        projectId: "segments",
        name: "Bi-weekly review",
        start: "2026-07-03",
        end: "2026-07-24",
        progress: 40,
        color: "#db2777",
        meta: { status: "Bi-weekly" },
        segments: [
          { id: "rev-1", start: "2026-07-03", end: "2026-07-03" },
          { id: "rev-2", start: "2026-07-17", end: "2026-07-17" },
          { id: "rev-3", start: "2026-07-24", end: "2026-07-24" },
        ],
      },
      {
        id: "support-windows",
        projectId: "segments",
        name: "Support windows",
        start: "2026-07-01",
        end: "2026-07-29",
        progress: 25,
        color: "#2563eb",
        meta: { status: "Periodic" },
        segments: [
          { id: "sup-1", start: "2026-07-01", end: "2026-07-02" },
          { id: "sup-2", start: "2026-07-08", end: "2026-07-09" },
          { id: "sup-3", start: "2026-07-15", end: "2026-07-16" },
          { id: "sup-4", start: "2026-07-22", end: "2026-07-23" },
          { id: "sup-5", start: "2026-07-29", end: "2026-07-29" },
        ],
      },
    ],
  },
];

type DemoScenario = "default" | "segmented";
type InspectorTab = "state" | "controls" | "events";

const codeExamples = [
  {
    title: "Basic usage",
    code: `import { GanttChart } from "@sokkay/react-gantt";
import "@sokkay/react-gantt/styles.css";

<GanttChart projects={projects} viewMode="month" />;`,
  },
  {
    title: "Controlled editing",
    code: `<GanttChart
  projects={projects}
  viewMode={viewMode}
  selectedTaskId={selectedTaskId}
  onTaskMove={({ taskId, start, end }) => updateTask(taskId, { start, end })}
  onTaskResize={({ taskId, start, end }) => updateTask(taskId, { start, end })}
  onTaskReorder={({ projectId, tasks }) => updateProjectTasks(projectId, tasks)}
  onTaskSelect={(task) => setSelectedTaskId(task?.id ?? null)}
/>`,
  },
  {
    title: "Segmented tasks",
    code: `const task = {
  id: "weekday-block",
  projectId: "segments",
  name: "Weekday delivery",
  start: "2026-07-06",
  end: "2026-07-17",
  segments: [
    { id: "wd-w1", start: "2026-07-06", end: "2026-07-10" },
    { id: "wd-w2", start: "2026-07-13", end: "2026-07-17" },
  ],
};

<GanttChart
  projects={projects}
  showSegmentConnectors
  onTaskMove={({ taskId, start, end, segmentId }) => {
    // Live updates while dragging (optional segmentId)
  }}
  onTaskMoveEnd={({ taskId, start, end, segmentId }) => {
    // Confirmed range when the pointer is released
  }}
/>;`,
  },
  {
    title: "Imperative operations",
    code: `const ganttRef = useGanttChart();

<GanttChart ref={ganttRef} projects={projects} viewMode="day" />;

ganttRef.current?.scrollToTask("api");
ganttRef.current?.collapseProject("platform");`,
  },
  {
    title: "Translated labels",
    code: `import { es } from "date-fns/locale";

<GanttChart
  projects={projects}
  viewMode="month"
  locale={es}
  labels={{
    projectHeader: "Proyecto",
    noTaskSelected: "Ninguna tarea seleccionada",
    clearSelection: "Limpiar",
    taskCount: (count) => \`\${count} tareas\`,
  }}
/>`,
  },
];

function envelopeFromSegments(
  segments: NonNullable<GanttTask<{ status: string }>["segments"]>
) {
  const starts = segments.map((segment) => new Date(segment.start).getTime());
  const ends = segments.map((segment) => new Date(segment.end).getTime());
  return {
    start: new Date(Math.min(...starts)),
    end: new Date(Math.max(...ends)),
  };
}

function applyTaskRangeUpdate(
  task: GanttTask<{ status: string }>,
  payload: Pick<TaskMovePayload, "start" | "end" | "segmentId">
): GanttTask<{ status: string }> {
  if (!payload.segmentId || !task.segments?.length) {
    return {
      ...task,
      start: payload.start,
      end: payload.end,
    };
  }

  const segments = task.segments.map((segment) =>
    segment.id === payload.segmentId
      ? { ...segment, start: payload.start, end: payload.end }
      : segment
  );
  const envelope = envelopeFromSegments(segments);

  return {
    ...task,
    segments,
    start: envelope.start,
    end: envelope.end,
  };
}

function updateTask(
  projects: Array<GanttProject<{ owner: string }, { status: string }>>,
  taskId: string,
  updater: (
    task: GanttTask<{ status: string }>
  ) => GanttTask<{ status: string }>
) {
  return projects.map((project) => ({
    ...project,
    tasks: project.tasks.map((task) =>
      task.id === taskId ? updater(task) : task
    ),
  }));
}

function formatRange(
  task: NormalizedGanttTask<{ status: string }>,
  locale: DemoCopy["locale"]
) {
  return `${format(task.start, "MMM d", { locale })} - ${format(task.end, "MMM d, yyyy", { locale })}`;
}

export default function App() {
  const ganttRef = useGanttChart();
  const [language, setLanguage] = useState<DemoLanguage>("en");
  const [scenario, setScenario] = useState<DemoScenario>("default");
  const [showSegmentConnectors, setShowSegmentConnectors] = useState(false);
  const [logEvents, setLogEvents] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("controls");
  const [projects, setProjects] = useState(initialProjects);
  const [viewMode, setViewMode] = useState<GanttViewMode>("day");
  const [layoutMode, setLayoutMode] = useState<"compact" | "tree">("tree");
  const [snapTo, setSnapTo] = useState<GanttViewMode | "none" | "viewMode">(
    "viewMode"
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>("api");
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<string[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [minDate, setMinDate] = useState<string>("2026-07-01");
  const [maxDate, setMaxDate] = useState<string>("2026-07-31");
  const logEventsRef = useRef(logEvents);
  logEventsRef.current = logEvents;

  const isValidDateString = (str: string) => {
    const d = new Date(str);
    return d instanceof Date && !isNaN(d.getTime()) && str.length >= 10;
  };

  const resolvedMinDate =
    minDate && isValidDateString(minDate) ? minDate : undefined;
  const resolvedMaxDate =
    maxDate && isValidDateString(maxDate) ? maxDate : undefined;

  const copy = demoCopy[language];

  const selectedTask = useMemo(
    () =>
      projects
        .flatMap((project) => project.tasks)
        .find((task) => task.id === selectedTaskId),
    [projects, selectedTaskId]
  );

  const pushLog = (message: string) => {
    if (!logEventsRef.current) {
      return;
    }
    setEventLog((items) => [message, ...items].slice(0, 12));
  };

  const formatRangePayload = (
    payload: Pick<TaskMovePayload, "start" | "end" | "taskId" | "segmentId">
  ) => {
    const target = payload.segmentId
      ? `${payload.taskId}/${payload.segmentId}`
      : payload.taskId;
    return `${target} -> ${format(payload.start, "yyyy-MM-dd")}..${format(payload.end, "yyyy-MM-dd")}`;
  };

  const switchScenario = (next: DemoScenario) => {
    setScenario(next);
    if (next === "segmented") {
      setProjects(segmentedProjects);
      setSelectedTaskId("weekday-block");
      setShowSegmentConnectors(true);
    } else {
      setProjects(initialProjects);
      setSelectedTaskId("api");
      setShowSegmentConnectors(false);
    }
    setCollapsedProjectIds([]);
    setEventLog([]);
  };

  const handleMove = (payload: TaskMovePayload) => {
    pushLog(`move ${formatRangePayload(payload)}`);
    setProjects((items) =>
      updateTask(items, payload.taskId, (task) =>
        applyTaskRangeUpdate(task, payload)
      )
    );
  };

  const handleResize = (payload: TaskResizePayload) => {
    pushLog(`resize ${payload.edge} ${formatRangePayload(payload)}`);
    setProjects((items) =>
      updateTask(items, payload.taskId, (task) =>
        applyTaskRangeUpdate(task, payload)
      )
    );
  };

  const handleMoveEnd = (payload: TaskMovePayload) => {
    pushLog(`move-end ${formatRangePayload(payload)}`);
  };

  const handleResizeEnd = (payload: TaskResizePayload) => {
    pushLog(`resize-end ${payload.edge} ${formatRangePayload(payload)}`);
  };

  const handleTransfer = (payload: TaskTransferPayload) => {
    setProjects((items) => {
      const movingTask = items
        .flatMap((project) => project.tasks)
        .find((task) => task.id === payload.taskId);

      if (!movingTask) {
        return items;
      }

      return items.map((project) => {
        if (project.id === payload.fromProjectId) {
          return {
            ...project,
            tasks: project.tasks.filter((task) => task.id !== payload.taskId),
          };
        }

        if (project.id === payload.toProjectId) {
          const nextTask = { ...movingTask, projectId: payload.toProjectId };
          const tasks = [...project.tasks];
          tasks.splice(payload.index, 0, nextTask);
          return { ...project, tasks };
        }

        return project;
      });
    });
    pushLog(`transfer ${payload.taskId} -> ${payload.toProjectId}`);
  };

  const handleTaskReorder = (
    payload: TaskReorderPayload<{ status: string }>
  ) => {
    setProjects((items) =>
      items.map((project) =>
        project.id === payload.projectId
          ? {
              ...project,
              tasks: payload.tasks.map((task) => ({
                ...task,
                start: task.start,
                end: task.end,
              })),
            }
          : project
      )
    );
    pushLog(`reorder task ${payload.taskId} -> ${payload.toIndex}`);
  };

  return (
    <main className="docs-shell">
      <section className="docs-header">
        <div>
          <h1>@sokkay/react-gantt</h1>
          <p>
            Controlled React Gantt chart with view modes, drag, resize,
            selection, tooltips and custom menus.
          </p>
        </div>
        <div className="docs-actions">
          <button
            type="button"
            onClick={() => ganttRef.current?.scrollToTask("lanes")}
          >
            {copy.strings.scrollToLaneTask}
          </button>
          <button
            type="button"
            onClick={() => ganttRef.current?.toggleProject("platform")}
          >
            {copy.strings.togglePlatform}
          </button>
        </div>
      </section>

      <section className="inspector inspector--top">
        <div className="inspector-header">
          <h2>{copy.strings.controlledState}</h2>
          <div className="view-switcher" role="tablist" aria-label="Inspector">
            {(
              [
                ["controls", copy.strings.tabControls],
                ["state", copy.strings.tabState],
                ["events", copy.strings.tabEvents],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={inspectorTab === tab}
                className={inspectorTab === tab ? "is-active" : undefined}
                onClick={() => setInspectorTab(tab)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {inspectorTab === "controls" ? (
          <div className="inspector-controls">
            <div className="control-row">
              <label className="control-label" htmlFor="demo-view-mode">
                {copy.strings.view}
              </label>
              <select
                id="demo-view-mode"
                className="control-select"
                aria-label="View mode"
                value={viewMode}
                onChange={(event) =>
                  setViewMode(event.target.value as GanttViewMode)
                }
              >
                {viewModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
            <div className="control-row">
              <span className="control-label">{copy.strings.language}</span>
              <div className="view-switcher" aria-label="Language">
                {demoLanguages.map((value) => (
                  <button
                    className={value === language ? "is-active" : undefined}
                    type="button"
                    key={value}
                    onClick={() => setLanguage(value)}
                  >
                    {value.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="control-row">
              <label className="control-label" htmlFor="demo-snap-to">
                {copy.strings.snap}
              </label>
              <select
                id="demo-snap-to"
                className="control-select"
                aria-label="Snap to"
                value={snapTo}
                onChange={(event) =>
                  setSnapTo(
                    event.target.value as GanttViewMode | "none" | "viewMode"
                  )
                }
              >
                {(["viewMode", "none", "day", "week", "month"] as const).map(
                  (mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="control-row">
              <span className="control-label">{copy.strings.layout}</span>
              <div className="view-switcher" aria-label="Layout Mode">
                {(["compact", "tree"] as const).map((mode) => (
                  <button
                    className={mode === layoutMode ? "is-active" : undefined}
                    type="button"
                    key={mode}
                    onClick={() => setLayoutMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div className="control-row">
              <span className="control-label">{copy.strings.scenario}</span>
              <div className="view-switcher" aria-label="Scenario">
                <button
                  className={scenario === "default" ? "is-active" : undefined}
                  type="button"
                  onClick={() => switchScenario("default")}
                >
                  {copy.strings.scenarioDefault}
                </button>
                <button
                  className={scenario === "segmented" ? "is-active" : undefined}
                  type="button"
                  onClick={() => switchScenario("segmented")}
                >
                  {copy.strings.scenarioSegmented}
                </button>
              </div>
            </div>
            {scenario === "segmented" ? (
              <div className="control-row">
                <span className="control-label">{copy.strings.connectors}</span>
                <div className="view-switcher" aria-label="Segment connectors">
                  <button
                    className={showSegmentConnectors ? "is-active" : undefined}
                    type="button"
                    onClick={() => setShowSegmentConnectors(true)}
                  >
                    on
                  </button>
                  <button
                    className={!showSegmentConnectors ? "is-active" : undefined}
                    type="button"
                    onClick={() => setShowSegmentConnectors(false)}
                  >
                    off
                  </button>
                </div>
              </div>
            ) : null}
            <div className="control-row">
              <span className="control-label">{copy.strings.eventLog}</span>
              <div className="view-switcher" aria-label="Event log">
                <button
                  className={logEvents ? "is-active" : undefined}
                  type="button"
                  onClick={() => setLogEvents(true)}
                >
                  {copy.strings.eventLogOn}
                </button>
                <button
                  className={!logEvents ? "is-active" : undefined}
                  type="button"
                  onClick={() => {
                    setLogEvents(false);
                    setEventLog([]);
                  }}
                >
                  {copy.strings.eventLogOff}
                </button>
              </div>
            </div>
            <div className="control-row control-row--dates">
              <label className="date-field">
                <span className="control-label">{copy.strings.minDate}</span>
                <input
                  type="date"
                  value={minDate}
                  onChange={(e) => setMinDate(e.target.value)}
                />
              </label>
              <label className="date-field">
                <span className="control-label">{copy.strings.maxDate}</span>
                <input
                  type="date"
                  value={maxDate}
                  onChange={(e) => setMaxDate(e.target.value)}
                />
              </label>
            </div>
          </div>
        ) : null}

        {inspectorTab === "state" ? (
          <dl>
            <dt>{copy.strings.view}</dt>
            <dd>{viewMode}</dd>
            <dt>{copy.strings.selected}</dt>
            <dd>{selectedTask?.name ?? copy.strings.none}</dd>
            <dt>{copy.strings.segments}</dt>
            <dd>{selectedTask?.segments?.length ?? 0}</dd>
            <dt>{copy.strings.projects}</dt>
            <dd>{projects.length}</dd>
            <dt>{copy.strings.sidebar}</dt>
            <dd>{Math.round(sidebarWidth)}px</dd>
          </dl>
        ) : null}

        {inspectorTab === "events" ? (
          logEvents ? (
            <ol>
              {eventLog.length === 0 ? (
                <li className="event-log-empty">—</li>
              ) : (
                eventLog.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))
              )}
            </ol>
          ) : (
            <p className="event-log-empty">{copy.strings.eventLogOff}</p>
          )
        ) : null}
      </section>

      <section className="gantt-panel">
        <GanttChart
          ref={ganttRef}
          projects={projects}
          viewMode={viewMode}
          layoutMode={layoutMode}
          minDate={resolvedMinDate}
          maxDate={resolvedMaxDate}
          snapTo={snapTo === "viewMode" ? undefined : snapTo}
          showSegmentConnectors={showSegmentConnectors}
          selectedTaskId={selectedTaskId}
          selectionToolbarMode="static"
          collapsedProjectIds={collapsedProjectIds}
          virtualized
          sidebarWidth={sidebarWidth}
          minSidebarWidth={240}
          onSidebarWidthChange={setSidebarWidth}
          locale={copy.locale}
          labels={copy.labels}
          onTaskMove={handleMove}
          onTaskMoveEnd={handleMoveEnd}
          onTaskResize={handleResize}
          onTaskResizeEnd={handleResizeEnd}
          onTaskTransfer={handleTransfer}
          onTaskReorder={handleTaskReorder}
          onProjectReorder={({
            projects: nextProjects,
            activeProjectId,
            overProjectId,
          }) => {
            setProjects(nextProjects);
            pushLog(`reorder ${activeProjectId} over ${overProjectId}`);
          }}
          onProjectCollapseChange={(projectId, collapsed, nextIds) => {
            setCollapsedProjectIds(nextIds);
            pushLog(
              `collapse ${projectId} -> ${collapsed ? "collapsed" : "expanded"}`
            );
          }}
          onTaskSelect={(task) => {
            setSelectedTaskId(task?.id ?? null);
            pushLog(`select ${task?.id ?? "null"}`);
          }}
          onTaskContextMenu={({ task, segment }) =>
            pushLog(
              `context ${task.id}${segment ? `:${segment.id}` : ""}`
            )
          }
          renderProjectCell={(project, state) => (
            <span>
              {project.name}
              <small>
                {copy.strings.projectCellMeta(
                  state.taskCount,
                  project.meta?.owner ?? ""
                )}
              </small>
            </span>
          )}
          renderTask={(task) => (
            <span>
              {task.name}
              <small>{task.progress ?? 0}%</small>
            </span>
          )}
          renderTaskTooltip={(task, { segment }) => {
            const start = segment?.start ?? task.start;
            const end = segment?.end ?? task.end;
            return (
              <div className="custom-tooltip">
                <strong>{task.name}</strong>
                <span>
                  {format(start, "MMM d", { locale: copy.locale })} -{" "}
                  {format(end, "MMM d, yyyy", { locale: copy.locale })}
                </span>
                <span>{task.meta?.status}</span>
              </div>
            );
          }}
          renderContextMenu={({ task, actions }) => (
            <>
              <button type="button" onClick={actions.select}>
                {copy.strings.selectTask(task.name)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProjects((items) =>
                    updateTask(items, task.id, (currentTask) => {
                      if (!currentTask.segments?.length) {
                        return {
                          ...currentTask,
                          start: addDays(new Date(currentTask.start), 1),
                          end: addDays(new Date(currentTask.end), 1),
                        };
                      }

                      const segments = currentTask.segments.map((segment) => ({
                        ...segment,
                        start: addDays(new Date(segment.start), 1),
                        end: addDays(new Date(segment.end), 1),
                      }));
                      const envelope = envelopeFromSegments(segments);

                      return {
                        ...currentTask,
                        segments,
                        start: envelope.start,
                        end: envelope.end,
                      };
                    })
                  );
                  actions.close();
                }}
              >
                {copy.strings.shiftOneDay}
              </button>
            </>
          )}
          renderSelectionToolbar={(task) => (
            <>
              <strong>{task.name}</strong>
              <span>{formatRange(task, copy.locale)}</span>
              <button type="button" onClick={() => setSelectedTaskId(null)}>
                {copy.strings.clear}
              </button>
            </>
          )}
          renderEmptySelectionToolbar={() => (
            <>
              <strong>{copy.strings.noTaskSelectedTitle}</strong>
              <span>{copy.strings.noTaskSelectedHint}</span>
            </>
          )}
          renderCollapsedProjectSummary={(summary) => (
            <>
              <strong className="sokkay-gantt__collapsed-summary-name">
                {summary.project.name}
              </strong>
              <span className="sokkay-gantt__collapsed-summary-meta">
                {copy.strings.collapsedSummaryMeta(
                  summary.taskCount,
                  format(summary.start, "MMM d", { locale: copy.locale }),
                  format(summary.end, "MMM d", { locale: copy.locale })
                )}
              </span>
            </>
          )}
        />
      </section>

      <section className="code-examples">
        <h2>{copy.strings.codeExamples}</h2>
        <div className="code-grid">
          {codeExamples.map((example) => (
            <article key={example.title}>
              <h3>{example.title}</h3>
              <pre>
                <code>{example.code}</code>
              </pre>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
