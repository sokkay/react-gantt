# @sokkay/react-gantt

Controlled React Gantt chart library for React 18+, built with TypeScript and distributed with ready-to-import CSS.

This repository is a pnpm monorepo with:

- `packages/react-gantt`: publishable package `@sokkay/react-gantt`
- `apps/docs`: Vite demo app for validating props, callbacks and interactions

## Status

Initial interactive base:

- Projects and tasks rendering
- View modes: `day`, `week`, `month`, `quarter`, `year`
- Controlled task selection
- Horizontal task drag with `onTaskMove`
- Start/end resize with `onTaskResize`
- Optional task `segments` for non-contiguous ranges (weekends skipped, periodic blocks)
- Optional dashed connectors between segments via `showSegmentConnectors`
- Automatic task lanes when ranges overlap inside a project
- Task reorder within a project with `onTaskReorder`
- Custom task rendering, tooltip, context menu, selection toolbar and project cell
- Collapsible projects, controlled or uncontrolled
- Collapsed project summary bars from first task start to last task end
- Imperative handle via `useGanttChart`
- Basic row virtualization and edge auto-scroll during drag
- Theme and class name overrides
- Basic project reorder and task transfer callbacks with `@dnd-kit`
- Unit and component tests with Vitest and Testing Library

## Install

```bash
pnpm add @sokkay/react-gantt
```

```tsx
import { GanttChart } from "@sokkay/react-gantt";
import "@sokkay/react-gantt/styles.css";
```

Peer dependencies:

- `react >=18 <20`
- `react-dom >=18 <20`

## Basic Usage

```tsx
import { useState } from "react";
import {
  GanttChart,
  type GanttProject,
  type GanttViewMode,
} from "@sokkay/react-gantt";
import "@sokkay/react-gantt/styles.css";

const initialProjects: GanttProject[] = [
  {
    id: "platform",
    name: "Platform",
    tasks: [
      {
        id: "api",
        projectId: "platform",
        name: "Public API",
        start: "2026-07-01",
        end: "2026-07-12",
        progress: 45,
      },
    ],
  },
];

export function Example() {
  const [projects, setProjects] = useState(initialProjects);
  const [viewMode, setViewMode] = useState<GanttViewMode>("day");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <GanttChart
      projects={projects}
      viewMode={viewMode}
      selectedTaskId={selectedTaskId}
      onTaskSelect={(task) => setSelectedTaskId(task?.id ?? null)}
      onTaskMove={({ taskId, start, end }) => {
        setProjects((items) =>
          items.map((project) => ({
            ...project,
            tasks: project.tasks.map((task) =>
              task.id === taskId ? { ...task, start, end } : task
            ),
          }))
        );
      }}
      onTaskResize={({ taskId, start, end }) => {
        setProjects((items) =>
          items.map((project) => ({
            ...project,
            tasks: project.tasks.map((task) =>
              task.id === taskId ? { ...task, start, end } : task
            ),
          }))
        );
      }}
    />
  );
}
```

## Operations Ref

Use `useGanttChart` when a parent needs to drive chart operations.

```tsx
import { GanttChart, useGanttChart } from "@sokkay/react-gantt";

export function Planner({ projects }) {
  const ganttRef = useGanttChart();

  return (
    <>
      <button
        type="button"
        onClick={() => ganttRef.current?.scrollToTask("api")}
      >
        Focus API
      </button>
      <button
        type="button"
        onClick={() => ganttRef.current?.toggleProject("platform")}
      >
        Toggle Platform
      </button>
      <GanttChart ref={ganttRef} projects={projects} viewMode="day" />
    </>
  );
}
```

## Public API

Main types:

```ts
type GanttViewMode = "day" | "week" | "month" | "quarter" | "year";

interface GanttProject<TMeta = unknown> {
  id: string;
  name: string;
  tasks: GanttTask[];
  meta?: TMeta;
}

interface GanttTaskSegment {
  id: string;
  start: Date | string | number;
  end: Date | string | number;
}

interface GanttTask<TMeta = unknown> {
  id: string;
  projectId: string;
  name: string;
  start: Date | string | number;
  end: Date | string | number;
  /** Optional non-contiguous ranges; when present, each segment is rendered and edited independently. */
  segments?: GanttTaskSegment[];
  progress?: number;
  color?: string;
  meta?: TMeta;
}
```

Main callbacks:

- `onTaskMove({ taskId, projectId, start, end, segmentId? })`
- `onTaskMoveEnd({ taskId, projectId, start, end, segmentId? })`
- `onTaskResize({ taskId, projectId, edge, start, end, segmentId? })`
- `onTaskResizeEnd({ taskId, projectId, edge, start, end, segmentId? })`
- `onTaskTransfer({ taskId, fromProjectId, toProjectId, index })`
- `onTaskReorder({ taskId, projectId, fromIndex, toIndex, tasks })`
- `onProjectReorder({ activeProjectId, overProjectId, projects })`
- `onProjectCollapseChange(projectId, collapsed, collapsedProjectIds)`
- `onTaskSelect(task | null)`
- `onTaskContextMenu({ task, event, actions })`

Behavior props:

- `collapsedProjectIds` / `defaultCollapsedProjectIds`
- `selectionToolbarMode`: `auto`, `static` or `hidden`
- `labels`: translated UI strings and aria labels
- `sidebarWidth` / `minSidebarWidth`: fixed project sidebar sizing
- `onSidebarWidthChange`: receives sidebar resize changes from the drag handle
- `snapTo`: `day`, `week`, `month`, `quarter`, `year` or `none`
- `showSegmentConnectors`: draw dashed lines between consecutive task segments
- `virtualized`
- `overscan`

Labels:

```tsx
<GanttChart
  projects={projects}
  viewMode="day"
  labels={{
    projectHeader: "Proyecto",
    noTaskSelected: "Ninguna tarea seleccionada",
    clearSelection: "Limpiar",
    selectAction: "Seleccionar",
    closeAction: "Cerrar",
    taskCount: (count) => `${count} ${count === 1 ? "tarea" : "tareas"}`,
    reorderProject: (project) => `Reordenar ${project.name}`,
    collapseProject: (project) => `Colapsar ${project.name}`,
    expandProject: (project) => `Expandir ${project.name}`,
    transferTask: (task) => `Mover ${task.name} a otro proyecto`,
  }}
/>
```

Customization:

- `renderTask`
- `renderTaskTooltip`
- `renderContextMenu`
- `renderSelectionToolbar`
- `renderEmptySelectionToolbar`
- `renderProjectCell`
- `renderCollapsedProjectSummary`
- `renderSidebarHeader`
- `renderHeaderCell`
- `renderTimelineCell`
- `classNames`
- `theme`

Theme example:

```tsx
<GanttChart
  projects={projects}
  viewMode="day"
  theme={{
    fontFamily: "inherit",
    background: "#f8fafc",
    task: "#2563eb",
  }}
/>
```

Pass `fontFamily: "inherit"` to adopt the typography from the host page. Any valid CSS `font-family` value is supported.

## Development

Install dependencies:

```bash
pnpm install
```

Run the demo:

```bash
pnpm dev
```

Build everything:

```bash
pnpm build
```

Run tests:

```bash
pnpm test
```

Type-check:

```bash
pnpm typecheck
```

Format:

```bash
pnpm format
pnpm format:check
```

## Package Build

The package is built with `tsup` and Tailwind:

- JS/CJS output in `packages/react-gantt/dist`
- Type declarations in `packages/react-gantt/dist`
- CSS bundle in `packages/react-gantt/dist/styles.css`

Consumers do not need to configure Tailwind to use the default styles.

## License

MIT
