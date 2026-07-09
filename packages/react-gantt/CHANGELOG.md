# @sokkay/react-gantt

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
