---
"@sokkay/react-gantt": minor
---

feat: add optional task `segments` for non-contiguous ranges, with independent move/resize (`segmentId`), `onTaskMoveEnd` / `onTaskResizeEnd`, and optional `showSegmentConnectors`

Not a breaking change: additive API; tasks without `segments` keep the previous single-bar behavior
