import type { NormalizedGanttTask } from "./types";

export type InteractionKind = "move" | "resize-start" | "resize-end";

export interface PointerInteraction<TTaskMeta> {
  kind: InteractionKind;
  task: NormalizedGanttTask<TTaskMeta>;
  /** Present when interacting with a specific segment of a segmented task. */
  segmentId?: string;
  originX: number;
  start: Date;
  end: Date;
}
