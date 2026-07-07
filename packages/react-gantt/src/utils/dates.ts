import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarQuarters,
  differenceInCalendarWeeks,
  differenceInCalendarYears,
  isValid,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type {
  GanttDateInput,
  GanttProject,
  GanttViewMode,
  NormalizedGanttProject,
} from "../types";

export function normalizeDate(input: GanttDateInput): Date {
  let value: Date;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split("-").map(Number);
    value = new Date(year, month - 1, day);
  } else {
    value = input instanceof Date ? input : new Date(input);
  }

  if (!isValid(value)) {
    throw new Error(`Invalid Gantt date: ${String(input)}`);
  }

  return startOfDay(value);
}

export function normalizeProjects<TProjectMeta, TTaskMeta>(
  projects: Array<GanttProject<TProjectMeta, TTaskMeta>>
): Array<NormalizedGanttProject<TProjectMeta, TTaskMeta>> {
  return projects.map((project) => ({
    ...project,
    tasks: project.tasks.map((task) => ({
      ...task,
      projectId: task.projectId || project.id,
      start: normalizeDate(task.start),
      end: normalizeDate(task.end),
    })),
  }));
}

export function snapDate(date: Date, viewMode: GanttViewMode): Date {
  switch (viewMode) {
    case "day":
      return startOfDay(date);
    case "week":
      return startOfWeek(date, { weekStartsOn: 1 });
    case "month":
      return startOfMonth(date);
    case "quarter":
      return startOfQuarter(date);
    case "year":
      return startOfYear(date);
  }
}

export function snapDateCeil(date: Date, viewMode: GanttViewMode): Date {
  const floor = snapDate(date, viewMode);

  if (date.getTime() > floor.getTime()) {
    return addViewUnits(floor, 1, viewMode);
  }

  return floor;
}

export function snapEndDate(date: Date, viewMode: GanttViewMode): Date {
  const periodStart = snapDate(date, viewMode);

  return addDays(addViewUnits(periodStart, 1, viewMode), -1);
}

export function addViewUnits(
  date: Date,
  amount: number,
  viewMode: GanttViewMode
): Date {
  switch (viewMode) {
    case "day":
      return addDays(date, amount);
    case "week":
      return addWeeks(date, amount);
    case "month":
      return addMonths(date, amount);
    case "quarter":
      return addQuarters(date, amount);
    case "year":
      return addYears(date, amount);
  }
}

export function diffViewUnits(
  start: Date,
  end: Date,
  viewMode: GanttViewMode
): number {
  switch (viewMode) {
    case "day":
      return differenceInCalendarDays(end, start);
    case "week":
      return differenceInCalendarWeeks(end, start, { weekStartsOn: 1 });
    case "month":
      return differenceInCalendarMonths(end, start);
    case "quarter":
      return differenceInCalendarQuarters(end, start);
    case "year":
      return differenceInCalendarYears(end, start);
  }
}

export function shiftRangeByUnits(
  start: Date,
  end: Date,
  units: number,
  viewMode: GanttViewMode
) {
  return {
    start: addViewUnits(start, units, viewMode),
    end: addViewUnits(end, units, viewMode),
  };
}

export function ensureMinimumRange(
  start: Date,
  end: Date,
  viewMode: GanttViewMode
) {
  if (end < start) {
    return {
      start,
      end: addViewUnits(start, 1, viewMode),
    };
  }

  if (diffViewUnits(start, end, viewMode) >= 1) {
    return { start, end };
  }

  return {
    start,
    end: addViewUnits(start, 1, viewMode),
  };
}
