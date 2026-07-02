import { useRef } from "react";
import type { GanttChartHandle } from "./types";

export function useGanttChart() {
  return useRef<GanttChartHandle>(null);
}
