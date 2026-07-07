import type { GanttLabels } from "@sokkay/react-gantt";
import { enUS, es, type Locale } from "date-fns/locale";

export type DemoLanguage = "en" | "es";

export interface DemoCopy {
  locale: Locale;
  labels: GanttLabels;
  strings: {
    language: string;
    snap: string;
    layout: string;
    scrollToLaneTask: string;
    togglePlatform: string;
    selectTask: (name: string) => string;
    shiftOneDay: string;
    clear: string;
    noTaskSelectedTitle: string;
    noTaskSelectedHint: string;
    projectCellMeta: (taskCount: number, owner: string) => string;
    collapsedSummaryMeta: (
      taskCount: number,
      start: string,
      end: string
    ) => string;
    controlledState: string;
    view: string;
    selected: string;
    none: string;
    projects: string;
    sidebar: string;
    timelineBounds: string;
    minDate: string;
    maxDate: string;
    events: string;
    codeExamples: string;
    tasksLabel: string;
  };
}

const englishLabels: GanttLabels = {
  projectHeader: "Project",
  noTaskSelected: "No task selected",
  clearSelection: "Clear",
  selectAction: "Select",
  closeAction: "Close",
  taskCount: (count) => `${count} ${count === 1 ? "task" : "tasks"}`,
  reorderProject: (project) => `Reorder ${project.name}`,
  collapseProject: (project) => `Collapse ${project.name}`,
  expandProject: (project) => `Expand ${project.name}`,
  transferTask: (task) => `Move ${task.name} to another project`,
};

const spanishLabels: GanttLabels = {
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
};

export const demoCopy: Record<DemoLanguage, DemoCopy> = {
  en: {
    locale: enUS,
    labels: englishLabels,
    strings: {
      language: "Language",
      snap: "Snap",
      layout: "Layout",
      scrollToLaneTask: "Scroll to lane task",
      togglePlatform: "Toggle Platform",
      selectTask: (name) => `Select ${name}`,
      shiftOneDay: "Shift +1 day",
      clear: "Clear",
      noTaskSelectedTitle: "No task selected",
      noTaskSelectedHint: "Select a task to inspect it here.",
      projectCellMeta: (taskCount, owner) =>
        `${taskCount} ${taskCount === 1 ? "task" : "tasks"} - ${owner}`,
      collapsedSummaryMeta: (taskCount, start, end) =>
        `${taskCount} ${taskCount === 1 ? "task" : "tasks"} - ${start} - ${end}`,
      controlledState: "Controlled state",
      view: "View",
      selected: "Selected",
      none: "None",
      projects: "Projects",
      sidebar: "Sidebar",
      timelineBounds: "Timeline bounds",
      minDate: "Min Date",
      maxDate: "Max Date",
      events: "Events",
      codeExamples: "Code examples",
      tasksLabel: "tasks",
    },
  },
  es: {
    locale: es,
    labels: spanishLabels,
    strings: {
      language: "Idioma",
      snap: "Snap",
      layout: "Layout",
      scrollToLaneTask: "Ir a tarea en lane",
      togglePlatform: "Alternar Platform",
      selectTask: (name) => `Seleccionar ${name}`,
      shiftOneDay: "Mover +1 dia",
      clear: "Limpiar",
      noTaskSelectedTitle: "Ninguna tarea seleccionada",
      noTaskSelectedHint: "Selecciona una tarea para verla aqui.",
      projectCellMeta: (taskCount, owner) =>
        `${taskCount} ${taskCount === 1 ? "tarea" : "tareas"} - ${owner}`,
      collapsedSummaryMeta: (taskCount, start, end) =>
        `${taskCount} ${taskCount === 1 ? "tarea" : "tareas"} - ${start} - ${end}`,
      controlledState: "Estado controlado",
      view: "Vista",
      selected: "Seleccionada",
      none: "Ninguna",
      projects: "Proyectos",
      sidebar: "Sidebar",
      timelineBounds: "Limites del timeline",
      minDate: "Fecha minima",
      maxDate: "Fecha maxima",
      events: "Eventos",
      codeExamples: "Ejemplos de codigo",
      tasksLabel: "tareas",
    },
  },
};

export const demoLanguages: DemoLanguage[] = ["en", "es"];
