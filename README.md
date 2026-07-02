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
- Custom task rendering, tooltip, context menu, selection toolbar and project cell
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
import { GanttChart, type GanttProject, type GanttViewMode } from "@sokkay/react-gantt";
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
            tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, start, end } : task)),
          })),
        );
      }}
      onTaskResize={({ taskId, start, end }) => {
        setProjects((items) =>
          items.map((project) => ({
            ...project,
            tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, start, end } : task)),
          })),
        );
      }}
    />
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

interface GanttTask<TMeta = unknown> {
  id: string;
  projectId: string;
  name: string;
  start: Date | string | number;
  end: Date | string | number;
  progress?: number;
  color?: string;
  meta?: TMeta;
}
```

Main callbacks:

- `onTaskMove({ taskId, projectId, start, end })`
- `onTaskResize({ taskId, projectId, edge, start, end })`
- `onTaskTransfer({ taskId, fromProjectId, toProjectId, index })`
- `onProjectReorder({ activeProjectId, overProjectId, projects })`
- `onTaskSelect(task | null)`
- `onTaskContextMenu({ task, event, actions })`

Customization:

- `renderTask`
- `renderTaskTooltip`
- `renderContextMenu`
- `renderSelectionToolbar`
- `renderProjectCell`
- `classNames`
- `theme`

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

## Package Build

The package is built with `tsup` and Tailwind:

- JS/CJS output in `packages/react-gantt/dist`
- Type declarations in `packages/react-gantt/dist`
- CSS bundle in `packages/react-gantt/dist/styles.css`

Consumers do not need to configure Tailwind to use the default styles.

## License

MIT
