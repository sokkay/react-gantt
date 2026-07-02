import type { NormalizedGanttTask } from "./types";

export type InteractionKind = "move" | "resize-start" | "resize-end";

export interface PointerInteraction<TTaskMeta> {
  kind: InteractionKind;
  task: NormalizedGanttTask<TTaskMeta>;
  originX: number;
  start: Date;
  end: Date;
}
