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
import { useMemo, useState } from "react";
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
    title: "Imperative operations",
    code: `const ganttRef = useGanttChart();

<GanttChart ref={ganttRef} projects={projects} viewMode="day" />;

ganttRef.current?.scrollToTask("api");
ganttRef.current?.collapseProject("platform");`,
  },
];

function updateTask(
  projects: typeof initialProjects,
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

function formatRange(task: NormalizedGanttTask<{ status: string }>) {
  return `${format(task.start, "MMM d")} - ${format(task.end, "MMM d, yyyy")}`;
}

export default function App() {
  const ganttRef = useGanttChart();
  const [projects, setProjects] = useState(initialProjects);
  const [viewMode, setViewMode] = useState<GanttViewMode>("day");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>("api");
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<string[]>([]);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const selectedTask = useMemo(
    () =>
      projects
        .flatMap((project) => project.tasks)
        .find((task) => task.id === selectedTaskId),
    [projects, selectedTaskId]
  );

  const pushLog = (message: string) => {
    setEventLog((items) => [message, ...items].slice(0, 6));
  };

  const handleMove = (payload: TaskMovePayload) => {
    setProjects((items) =>
      updateTask(items, payload.taskId, (task) => ({
        ...task,
        start: payload.start,
        end: payload.end,
      }))
    );
    pushLog(`move ${payload.taskId} -> ${format(payload.start, "yyyy-MM-dd")}`);
  };

  const handleResize = (payload: TaskResizePayload) => {
    setProjects((items) =>
      updateTask(items, payload.taskId, (task) => ({
        ...task,
        start: payload.start,
        end: payload.end,
      }))
    );
    pushLog(`resize ${payload.taskId} ${payload.edge}`);
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
        <div className="view-switcher" aria-label="View mode">
          {viewModes.map((mode) => (
            <button
              className={mode === viewMode ? "is-active" : undefined}
              type="button"
              key={mode}
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="docs-actions">
          <button
            type="button"
            onClick={() => ganttRef.current?.scrollToTask("lanes")}
          >
            Scroll to lane task
          </button>
          <button
            type="button"
            onClick={() => ganttRef.current?.toggleProject("platform")}
          >
            Toggle Platform
          </button>
        </div>
      </section>

      <section className="demo-grid">
        <div className="gantt-panel">
          <GanttChart
            ref={ganttRef}
            projects={projects}
            viewMode={viewMode}
            selectedTaskId={selectedTaskId}
            selectionToolbarMode="static"
            collapsedProjectIds={collapsedProjectIds}
            virtualized
            onTaskMove={handleMove}
            onTaskResize={handleResize}
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
            onProjectCollapseChange={(_, __, nextIds) =>
              setCollapsedProjectIds(nextIds)
            }
            onTaskSelect={(task) => setSelectedTaskId(task?.id ?? null)}
            onTaskContextMenu={({ task }) => pushLog(`context ${task.id}`)}
            renderProjectCell={(project, state) => (
              <span>
                {project.name}
                <small>
                  {state.taskCount} tasks - {project.meta?.owner}
                </small>
              </span>
            )}
            renderTask={(task) => (
              <span>
                {task.name}
                <small>{task.progress ?? 0}%</small>
              </span>
            )}
            renderTaskTooltip={(task) => (
              <div className="custom-tooltip">
                <strong>{task.name}</strong>
                <span>{formatRange(task)}</span>
                <span>{task.meta?.status}</span>
              </div>
            )}
            renderContextMenu={({ task, actions }) => (
              <>
                <button type="button" onClick={actions.select}>
                  Select {task.name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProjects((items) =>
                      updateTask(items, task.id, (currentTask) => ({
                        ...currentTask,
                        start: addDays(new Date(currentTask.start), 1),
                        end: addDays(new Date(currentTask.end), 1),
                      }))
                    );
                    actions.close();
                  }}
                >
                  Shift +1 day
                </button>
              </>
            )}
            renderSelectionToolbar={(task) => (
              <>
                <strong>{task.name}</strong>
                <span>{formatRange(task)}</span>
                <button type="button" onClick={() => setSelectedTaskId(null)}>
                  Clear
                </button>
              </>
            )}
            renderEmptySelectionToolbar={() => (
              <>
                <strong>No task selected</strong>
                <span>Pick a task to inspect it here.</span>
              </>
            )}
            renderCollapsedProjectSummary={(summary) => (
              <>
                <strong className="sokkay-gantt__collapsed-summary-name">
                  {summary.project.name}
                </strong>
                <span className="sokkay-gantt__collapsed-summary-meta">
                  {summary.taskCount} tasks - {format(summary.start, "MMM d")} -{" "}
                  {format(summary.end, "MMM d")}
                </span>
              </>
            )}
          />
        </div>

        <aside className="inspector">
          <h2>Controlled state</h2>
          <dl>
            <dt>View</dt>
            <dd>{viewMode}</dd>
            <dt>Selected</dt>
            <dd>{selectedTask?.name ?? "None"}</dd>
            <dt>Projects</dt>
            <dd>{projects.length}</dd>
          </dl>
          <h2>Events</h2>
          <ol>
            {eventLog.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="code-examples">
        <h2>Code examples</h2>
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
