# @sokkay/react-gantt

Controlled React Gantt chart for React 18+, TypeScript-first, with importable CSS.

## Install

```bash
pnpm add @sokkay/react-gantt
```

```tsx
import { GanttChart } from "@sokkay/react-gantt";
import "@sokkay/react-gantt/styles.css";
```

Peer dependencies: `react` and `react-dom` `>=18 <20`.

## Quick start

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
    <>
      <select
        value={viewMode}
        onChange={(event) =>
          setViewMode(event.target.value as GanttViewMode)
        }
      >
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>
      <GanttChart
        projects={projects}
        viewMode={viewMode}
        selectedTaskId={selectedTaskId}
        onTaskSelect={(task) => setSelectedTaskId(task?.id ?? null)}
        onTaskMove={({ taskId, start, end }) => {
          setProjects((current) =>
            current.map((project) => ({
              ...project,
              tasks: project.tasks.map((task) =>
                task.id === taskId ? { ...task, start, end } : task
              ),
            }))
          );
        }}
      />
    </>
  );
}
```

## Sidebar columns

Pass an ordered `columns` array. Use `kind: "tree"` for the project/task chrome
(grip, collapse, name) and `kind: "data"` for extra values. Omit `columns` to
get a single tree column from `labels.projectHeader`.

```tsx
<GanttChart
  projects={projects}
  viewMode="month"
  layoutMode="tree"
  sidebarWidth={520}
  columns={[
    { id: "project", kind: "tree", header: "Project" },
    {
      id: "start",
      kind: "data",
      header: "Start",
      width: 100,
      resizable: true,
      renderTask: (task) => task.start.toLocaleDateString(),
    },
  ]}
  onSidebarColumnWidthChange={({ columnId, width }) => {
    /* update controlled widths in host state */
  }}
/>
```

**Sorting:** put a button in `column.header` and reorder `projects` in your
state. The library does not sort rows internally.

## Documentation for agents / IDEs

When this package is installed from npm, prefer:

1. [`llms.txt`](./llms.txt) — compact API map and invariants
2. `dist/index.d.ts` — full typed public surface with JSDoc
3. [`CHANGELOG.md`](./CHANGELOG.md) — breaking changes and migrations

## Features

- View modes: `day`, `week`, `month`, `quarter`, `year`
- Controlled selection, collapse, move, resize, reorder, transfer
- Optional task `segments` and segment connectors
- Unified sidebar `columns` (`tree` | `data`) with resize
- Render slots for bars, tooltips, context menu, toolbar, timeline cells
- Theme / className overrides and `labels` / `locale`
- Imperative handle via `useGanttChart`
- Row virtualization

## Development (monorepo)

```bash
pnpm install
pnpm dev
pnpm --filter @sokkay/react-gantt test
pnpm --filter @sokkay/react-gantt build
```

## Release

Publishing is manual. From a clean `main`:

```bash
pnpm release patch   # or minor | major | x.y.z
pnpm --filter @sokkay/react-gantt build
pnpm --filter @sokkay/react-gantt publish --access public
git push
git push origin vX.Y.Z
```

## License

MIT
