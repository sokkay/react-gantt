# @sokkay/react-gantt

## 0.4.3

_2026-07-09_

- feat(gantt): pass right-clicked segment to context menu callbacks
- docs: document the manual release flow in AGENTS.md

## 0.4.2

_2026-07-09_

- chore(release): bump @sokkay/react-gantt to 0.4.1
- feat(docs): move controlled state above the gantt with tabs
- fix(gantt): only fire move/resize end after a real drag
- chore: replace Changesets with a local release script
- Merge pull request #4 from sokkay/changeset-release/main
- Merge pull request #3 from sokkay/feature/task-segments
- fix(gantt): detect lane overlaps from segments, not envelopes
- fix(gantt): pass hovered segment into renderTaskTooltip
- fix(gantt): skip move/resize end callbacks on plain click
- feat(gantt): add optional task segments with independent editing
- fix(ci): pin npm 11 and use Node 24 for OIDC publish
- fix(ci): unblock npm OIDC publish by removing registry-url
- feat(docs): add language selector and wire locale to Gantt demo
- feat(gantt): add locale prop and release 0.3.0
- feat(gantt): expose theme.fontFamily for host typography integration
- test(gantt): cover timeline snap grid and week/month resize behavior
- fix(gantt): snap move and resize to timeline divisions or calendar units
- feat(gantt): add timeline snap grid based on chart cell divisions
- feat(gantt): add inclusive period snap helpers for task edges
- fix(tooltip): align Y coordinate to top of task bar to prevent hover loops
- feat(tooltip): position task tooltip at hover entry coordinates for long tasks
- fix(gantt): extend task visual bar to cover the last day inclusively
- docs: update roadmap to v2 functional backlog
- fix: add publishConfig to react-gantt and registry-url to release workflow
- fix: force latest npm version to resolve OIDC publish E404
- Merge pull request #2 from sokkay/changeset-release/main
- fix: bump node-version to 22 in release.yml to support pnpm v11
- chore: add changeset for context menu fix and accumulated improvements
- chore: configure OIDC permissions for npm trusted publishers
- chore: setup changesets and release workflow
- fix: close context menu on click outside
- chore: bump version to 0.2.1
- fix: resolve sidebar cell transparency by blending highlights with surface background
- fix: make row hover highlight transition instant
- feat: add hover and selection highlights for project/task rows with theme overrides
- fix: disable transitions on project summary bar during task interaction and clean styles
- feat: implement tree layout mode in sidebar, task reordering/transfer and project bar progress
- fix(react-gantt): parse simple YYYY-MM-DD strings in local timezone
- feat(docs): add interactive controls for minDate and maxDate timeline boundaries
- feat(react-gantt): implement minDate and maxDate bounds on timeline and task interactions
- Merge pull request #1 from sokkay/feature/animate-view-transitions
- fix: sync internal sidebar width with controlled prop to prevent jumps
- feat: animate view transitions and bump version to 0.1.2
- docs: add README.md to packages/react-gantt and bump version to 0.1.1
- docs: document Gantt chart props and types in English inside types.ts
- feat: implementa snapping (snapTo) independiente y selector en demo
- feat: aumenta ancho de semanas y permite configurar cellWidths personalizados
- fix: corrige redimensionamiento de tareas absolutas y touch-action
- mejora hover de tareas
- docs: agrega instrucciones para agentes
- chore: add eslint configuration
- refactor: slim gantt chart component
- refactor: extract gantt modules
- docs: mark completed roadmap items
- feat: resize project sidebar
- feat: configure fixed project sidebar width
- fix: render partial month ranges proportionally
- fix: span touched months in timeline ranges
- feat: add configurable gantt labels
- fix: emphasize collapsed project names
- feat: show collapsed project summaries
- feat: make selection toolbar configurable
- feat: add task lanes and gantt controls
- docs: add project readme
- chore: scaffold react gantt monorepo

## 0.4.1

### Patch Changes

- fix: only fire `onTaskMoveEnd` / `onTaskResizeEnd` after a real drag or resize (ignore plain clicks and sub-threshold pointer jitter)
- fix: pass `{ segment }` to `renderTaskTooltip` for segmented tasks (`segment` is `undefined` for single-bar tasks)

## 0.4.0

### Minor Changes

- 48c47b0: feat: add optional task `segments` for non-contiguous ranges, with independent move/resize (`segmentId`), `onTaskMoveEnd` / `onTaskResizeEnd`, and optional `showSegmentConnectors`

  Not a breaking change: additive API; tasks without `segments` keep the previous single-bar behavior

## 0.3.0

### Minor Changes

- b054277: fix: extend task visual bar to cover the last day inclusively
- 4c2d3ef: feat: position task tooltip at hover entry coordinates for long tasks
- a7b6259: feat: add inclusive period snap helpers for task edges (`snapDateCeil`, `snapEndDate`)
- fab3967: feat: add timeline snap grid based on chart cell divisions
- a6bfbd2: feat: expose `theme.fontFamily` for host typography integration
- feat: add `locale` prop to format timeline header dates with `date-fns` locales

### Patch Changes

- 25829e8: fix: align tooltip Y coordinate to top of task bar to prevent hover loops
- d2ef808: fix: snap move and resize to timeline divisions or calendar units when `snapTo` follows `viewMode`

## 0.2.2

### Patch Changes

- e3624a9: fix: close context menu on click outside and accumulated improvements
