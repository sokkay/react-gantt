import { fireEvent, render, screen } from "@testing-library/react";
import { es } from "date-fns/locale";
import { describe, expect, it, vi } from "vitest";
import { GanttChart } from "../GanttChart";
import type { GanttProject } from "../types";

const projects: GanttProject[] = [
  {
    id: "p1",
    name: "Platform",
    tasks: [
      {
        id: "t1",
        projectId: "p1",
        name: "API",
        start: "2026-07-02",
        end: "2026-07-06",
      },
    ],
  },
];

describe("GanttChart", () => {
  it("renders projects and tasks", () => {
    render(<GanttChart projects={projects} viewMode="day" />);

    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("API")).toBeInTheDocument();
  });

  it("selects a task and can clear selection from the chart background", () => {
    const onTaskSelect = vi.fn();
    const { container } = render(
      <GanttChart
        projects={projects}
        viewMode="day"
        onTaskSelect={onTaskSelect}
      />
    );

    fireEvent.click(screen.getByTestId("task-t1"));
    expect(onTaskSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "t1" })
    );

    fireEvent.click(container.querySelector(".sokkay-gantt") as Element);
    expect(onTaskSelect).toHaveBeenLastCalledWith(null);
  });

  it("renders a custom tooltip on hover", async () => {
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        renderTaskTooltip={(task) => <span>Tooltip for {task.name}</span>}
      />
    );

    fireEvent.pointerEnter(screen.getByTestId("task-t1"));
    expect(await screen.findByText("Tooltip for API")).toBeInTheDocument();
  });

  it("passes segment: undefined to tooltips on non-segmented tasks", async () => {
    const renderTaskTooltip = vi.fn((task, { segment }) => (
      <span>
        {task.name}:{segment === undefined ? "none" : segment.id}
      </span>
    ));

    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        renderTaskTooltip={renderTaskTooltip}
      />
    );

    fireEvent.pointerEnter(screen.getByTestId("task-t1"));
    expect(await screen.findByText("API:none")).toBeInTheDocument();
    expect(renderTaskTooltip).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" }),
      { segment: undefined }
    );
  });

  it("passes the hovered segment to custom tooltips", async () => {
    const segmentedProjects: GanttProject[] = [
      {
        id: "p1",
        name: "Platform",
        tasks: [
          {
            id: "t1",
            projectId: "p1",
            name: "Weekdays",
            start: "2026-07-06",
            end: "2026-07-17",
            segments: [
              { id: "s1", start: "2026-07-06", end: "2026-07-10" },
              { id: "s2", start: "2026-07-13", end: "2026-07-17" },
            ],
          },
        ],
      },
    ];

    const renderTaskTooltip = vi.fn((task, { segment }) => (
      <span>
        {task.name}:{segment?.id ?? "none"}
      </span>
    ));

    render(
      <GanttChart
        projects={segmentedProjects}
        viewMode="day"
        renderTaskTooltip={renderTaskTooltip}
      />
    );

    fireEvent.pointerEnter(screen.getByTestId("task-t1-segment-s2"));
    expect(await screen.findByText("Weekdays:s2")).toBeInTheDocument();
    expect(renderTaskTooltip).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" }),
      expect.objectContaining({
        segment: expect.objectContaining({ id: "s2" }),
      })
    );
  });

  it("renders a custom context menu and invokes callback payload", () => {
    const onTaskContextMenu = vi.fn();
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        onTaskContextMenu={onTaskContextMenu}
        renderContextMenu={({ task }) => (
          <button type="button">Copy {task.name}</button>
        )}
      />
    );

    fireEvent.contextMenu(screen.getByTestId("task-t1"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Copy API")).toBeInTheDocument();
    expect(onTaskContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        task: expect.objectContaining({ id: "t1" }),
        segment: undefined,
        actions: expect.any(Object),
      })
    );
  });

  it("passes the right-clicked segment to context menu callbacks", () => {
    const segmentedProjects: GanttProject[] = [
      {
        id: "p1",
        name: "Alpha",
        tasks: [
          {
            id: "t1",
            name: "API",
            start: "2026-03-02",
            end: "2026-03-10",
            segments: [
              { id: "s1", start: "2026-03-02", end: "2026-03-04" },
              { id: "s2", start: "2026-03-07", end: "2026-03-10" },
            ],
          },
        ],
      },
    ];
    const onTaskContextMenu = vi.fn();
    const renderContextMenu = vi.fn(({ task, segment }) => (
      <button type="button">
        Copy {task.name}:{segment?.id ?? "none"}
      </button>
    ));

    render(
      <GanttChart
        projects={segmentedProjects}
        viewMode="day"
        onTaskContextMenu={onTaskContextMenu}
        renderContextMenu={renderContextMenu}
      />
    );

    fireEvent.contextMenu(screen.getByTestId("task-t1-segment-s2"));
    expect(screen.getByText("Copy API:s2")).toBeInTheDocument();
    expect(onTaskContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        task: expect.objectContaining({ id: "t1" }),
        segment: expect.objectContaining({ id: "s2" }),
        actions: expect.any(Object),
      })
    );
    expect(renderContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        task: expect.objectContaining({ id: "t1" }),
        segment: expect.objectContaining({ id: "s2" }),
      })
    );
  });

  it("closes the context menu when clicking outside", () => {
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        renderContextMenu={({ task }) => (
          <button type="button">Copy {task.name}</button>
        )}
      />
    );

    fireEvent.contextMenu(screen.getByTestId("task-t1"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("emits move and resize payloads with dates", () => {
    const onTaskMove = vi.fn();
    const onTaskMoveEnd = vi.fn();
    const onTaskResize = vi.fn();
    const onTaskResizeEnd = vi.fn();
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        onTaskMove={onTaskMove}
        onTaskMoveEnd={onTaskMoveEnd}
        onTaskResize={onTaskResize}
        onTaskResizeEnd={onTaskResizeEnd}
      />
    );

    const task = screen.getByTestId("task-t1");
    fireEvent.pointerDown(task, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 148 });
    fireEvent.pointerUp(window);

    expect(onTaskMove).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        projectId: "p1",
        start: expect.any(Date),
        end: expect.any(Date),
      })
    );
    expect(onTaskMoveEnd).toHaveBeenCalledTimes(1);
    expect(onTaskMoveEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        projectId: "p1",
        start: expect.any(Date),
        end: expect.any(Date),
      })
    );

    fireEvent.pointerDown(
      task.querySelector(".sokkay-gantt__resize--end") as Element,
      { clientX: 100 }
    );
    fireEvent.pointerMove(window, { clientX: 148 });
    fireEvent.pointerUp(window);

    expect(onTaskResize).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        edge: "end",
        end: expect.any(Date),
      })
    );
    expect(onTaskResizeEnd).toHaveBeenCalledTimes(1);
    expect(onTaskResizeEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        edge: "end",
        end: expect.any(Date),
      })
    );
  });

  it("does not emit end callbacks on a plain click without drag", () => {
    const onTaskMove = vi.fn();
    const onTaskMoveEnd = vi.fn();
    const onTaskResize = vi.fn();
    const onTaskResizeEnd = vi.fn();
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        onTaskMove={onTaskMove}
        onTaskMoveEnd={onTaskMoveEnd}
        onTaskResize={onTaskResize}
        onTaskResizeEnd={onTaskResizeEnd}
      />
    );

    const task = screen.getByTestId("task-t1");
    fireEvent.pointerDown(task, { clientX: 100 });
    fireEvent.pointerUp(window);

    expect(onTaskMove).not.toHaveBeenCalled();
    expect(onTaskMoveEnd).not.toHaveBeenCalled();

    fireEvent.pointerDown(
      task.querySelector(".sokkay-gantt__resize--end") as Element,
      { clientX: 100 }
    );
    fireEvent.pointerUp(window);

    expect(onTaskResize).not.toHaveBeenCalled();
    expect(onTaskResizeEnd).not.toHaveBeenCalled();
  });

  it("does not emit end callbacks for sub-threshold pointer jitter", () => {
    const onTaskMove = vi.fn();
    const onTaskMoveEnd = vi.fn();
    const onTaskResize = vi.fn();
    const onTaskResizeEnd = vi.fn();
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        onTaskMove={onTaskMove}
        onTaskMoveEnd={onTaskMoveEnd}
        onTaskResize={onTaskResize}
        onTaskResizeEnd={onTaskResizeEnd}
      />
    );

    const task = screen.getByTestId("task-t1");
    fireEvent.pointerDown(task, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 102 });
    fireEvent.pointerUp(window);

    expect(onTaskMove).not.toHaveBeenCalled();
    expect(onTaskMoveEnd).not.toHaveBeenCalled();

    fireEvent.pointerDown(
      task.querySelector(".sokkay-gantt__resize--end") as Element,
      { clientX: 100 }
    );
    fireEvent.pointerMove(window, { clientX: 101 });
    fireEvent.pointerUp(window);

    expect(onTaskResize).not.toHaveBeenCalled();
    expect(onTaskResizeEnd).not.toHaveBeenCalled();
  });

  it("does not duplicate end callbacks when pointercancel follows pointerup", () => {
    const onTaskMoveEnd = vi.fn();
    const onTaskResizeEnd = vi.fn();
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        onTaskMoveEnd={onTaskMoveEnd}
        onTaskResizeEnd={onTaskResizeEnd}
      />
    );

    const task = screen.getByTestId("task-t1");
    fireEvent.pointerDown(task, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 148 });
    fireEvent.pointerUp(window);
    fireEvent.pointerCancel(window);

    expect(onTaskMoveEnd).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(
      task.querySelector(".sokkay-gantt__resize--end") as Element,
      { clientX: 100 }
    );
    fireEvent.pointerMove(window, { clientX: 148 });
    fireEvent.pointerCancel(window);
    fireEvent.pointerUp(window);

    expect(onTaskResizeEnd).toHaveBeenCalledTimes(1);
  });

  it("renders segmented tasks as independent bars", () => {
    const segmentedProjects: GanttProject[] = [
      {
        id: "p1",
        name: "Platform",
        tasks: [
          {
            id: "t1",
            projectId: "p1",
            name: "Weekdays",
            start: "2026-07-06",
            end: "2026-07-17",
            segments: [
              { id: "s1", start: "2026-07-06", end: "2026-07-10" },
              { id: "s2", start: "2026-07-13", end: "2026-07-17" },
            ],
          },
        ],
      },
    ];

    render(<GanttChart projects={segmentedProjects} viewMode="day" />);

    expect(screen.getByTestId("task-t1-segment-s1")).toBeInTheDocument();
    expect(screen.getByTestId("task-t1-segment-s2")).toBeInTheDocument();
    expect(screen.queryByTestId("task-t1")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("task-t1-connector-s1-s2")
    ).not.toBeInTheDocument();
  });

  it("renders dashed connectors between segments when enabled", () => {
    const segmentedProjects: GanttProject[] = [
      {
        id: "p1",
        name: "Platform",
        tasks: [
          {
            id: "t1",
            projectId: "p1",
            name: "Weekdays",
            start: "2026-07-06",
            end: "2026-07-17",
            segments: [
              { id: "s1", start: "2026-07-06", end: "2026-07-10" },
              { id: "s2", start: "2026-07-13", end: "2026-07-17" },
            ],
          },
        ],
      },
    ];

    render(
      <GanttChart
        projects={segmentedProjects}
        viewMode="day"
        showSegmentConnectors
      />
    );

    expect(screen.getByTestId("task-t1-connector-s1-s2")).toBeInTheDocument();
  });

  it("emits segmentId when moving or resizing a segment", () => {
    const onTaskMove = vi.fn();
    const onTaskMoveEnd = vi.fn();
    const onTaskResize = vi.fn();
    const onTaskResizeEnd = vi.fn();
    const segmentedProjects: GanttProject[] = [
      {
        id: "p1",
        name: "Platform",
        tasks: [
          {
            id: "t1",
            projectId: "p1",
            name: "Weekdays",
            start: "2026-07-06",
            end: "2026-07-17",
            segments: [
              { id: "s1", start: "2026-07-06", end: "2026-07-10" },
              { id: "s2", start: "2026-07-13", end: "2026-07-17" },
            ],
          },
        ],
      },
    ];

    render(
      <GanttChart
        projects={segmentedProjects}
        viewMode="day"
        onTaskMove={onTaskMove}
        onTaskMoveEnd={onTaskMoveEnd}
        onTaskResize={onTaskResize}
        onTaskResizeEnd={onTaskResizeEnd}
      />
    );

    const segment = screen.getByTestId("task-t1-segment-s2");
    fireEvent.pointerDown(segment, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 148 });
    fireEvent.pointerUp(window);

    expect(onTaskMove).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        projectId: "p1",
        segmentId: "s2",
        start: expect.any(Date),
        end: expect.any(Date),
      })
    );
    expect(onTaskMoveEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        segmentId: "s2",
        start: expect.any(Date),
        end: expect.any(Date),
      })
    );

    fireEvent.pointerDown(
      segment.querySelector(".sokkay-gantt__resize--end") as Element,
      { clientX: 100 }
    );
    fireEvent.pointerMove(window, { clientX: 148 });
    fireEvent.pointerUp(window);

    expect(onTaskResize).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        segmentId: "s2",
        edge: "end",
        end: expect.any(Date),
      })
    );
    expect(onTaskResizeEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        segmentId: "s2",
        edge: "end",
        end: expect.any(Date),
      })
    );
  });

  it("shows a project summary bar when the project is collapsed", () => {
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        collapsedProjectIds={["p1"]}
      />
    );

    expect(screen.queryByTestId("task-t1")).not.toBeInTheDocument();
    expect(screen.getAllByText("Platform")).toHaveLength(2);
    expect(screen.getByTestId("project-summary-p1")).toHaveTextContent(
      "Platform"
    );
    expect(screen.getByText("1 task")).toBeInTheDocument();
  });

  it("can keep the selection toolbar static without a selected task", () => {
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        selectedTaskId={null}
        selectionToolbarMode="static"
      />
    );

    expect(screen.getByText("No task selected")).toBeInTheDocument();
  });

  it("can hide the selection toolbar", () => {
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        selectedTaskId="t1"
        selectionToolbarMode="hidden"
      />
    );

    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
  });

  it("uses translated labels", () => {
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        selectedTaskId={null}
        selectionToolbarMode="static"
        labels={{
          projectHeader: "Proyecto",
          noTaskSelected: "Sin seleccion",
          taskCount: (count) => `${count} tareas`,
        }}
      />
    );

    expect(screen.getByText("Proyecto")).toBeInTheDocument();
    expect(screen.getByText("Sin seleccion")).toBeInTheDocument();
  });

  it("formats timeline headers with the provided locale", () => {
    const { container } = render(
      <GanttChart projects={projects} viewMode="month" locale={es} />
    );

    const headerCells = container.querySelectorAll(
      ".sokkay-gantt__header-cell"
    );
    const labels = Array.from(headerCells).map((cell) => cell.textContent);

    expect(labels).toContain("jul 2026");
  });

  it("applies configurable sidebar sizing", () => {
    const { container } = render(
      <GanttChart
        projects={projects}
        viewMode="day"
        sidebarWidth={320}
        minSidebarWidth={260}
      />
    );

    const root = container.querySelector(".sokkay-gantt") as HTMLElement;
    expect(root.style.getPropertyValue("--sg-sidebar-width")).toBe("320px");
    expect(root.style.getPropertyValue("--sg-sidebar-min-width")).toBe("260px");
  });

  it("applies theme font family overrides", () => {
    const { container } = render(
      <GanttChart
        projects={projects}
        viewMode="day"
        theme={{ fontFamily: "inherit" }}
      />
    );

    const root = container.querySelector(".sokkay-gantt") as HTMLElement;
    expect(root.style.getPropertyValue("--sg-font-family")).toBe("inherit");
  });

  it("emits sidebar width changes from the resize handle", () => {
    const onSidebarWidthChange = vi.fn();
    const { container } = render(
      <GanttChart
        projects={projects}
        viewMode="day"
        sidebarWidth={300}
        minSidebarWidth={240}
        onSidebarWidthChange={onSidebarWidthChange}
      />
    );

    const handle = container.querySelector(
      ".sokkay-gantt__sidebar-resize"
    ) as Element;
    fireEvent(
      handle,
      new MouseEvent("pointerdown", { bubbles: true, clientX: 300 })
    );
    fireEvent(
      window,
      new MouseEvent("pointermove", { bubbles: true, clientX: 360 })
    );
    fireEvent(window, new MouseEvent("pointerup", { bubbles: true }));

    expect(onSidebarWidthChange).toHaveBeenLastCalledWith(360);
  });

  it("preserves last controlled sidebar width when transitioning to uncontrolled mode", () => {
    const { rerender, container } = render(
      <GanttChart projects={projects} viewMode="day" sidebarWidth={300} />
    );

    let root = container.querySelector(".sokkay-gantt") as HTMLElement;
    expect(root.style.getPropertyValue("--sg-sidebar-width")).toBe("300px");

    // Rerender with a new controlled width
    rerender(
      <GanttChart projects={projects} viewMode="day" sidebarWidth={350} />
    );
    root = container.querySelector(".sokkay-gantt") as HTMLElement;
    expect(root.style.getPropertyValue("--sg-sidebar-width")).toBe("350px");

    // Transition to uncontrolled (sidebarWidth becomes undefined)
    rerender(
      <GanttChart projects={projects} viewMode="day" sidebarWidth={undefined} />
    );
    root = container.querySelector(".sokkay-gantt") as HTMLElement;
    // It should keep 350px (the last controlled value) instead of jumping back to 240px fallback
    expect(root.style.getPropertyValue("--sg-sidebar-width")).toBe("350px");
  });

  it("renders tasks on separate rows in tree mode", () => {
    const { container } = render(
      <GanttChart projects={projects} viewMode="day" layoutMode="tree" />
    );

    // Sidebar should have project cell and task cell
    expect(screen.getAllByText("Platform").length).toBeGreaterThan(0);
    expect(screen.getAllByText("API").length).toBeGreaterThan(0);

    // Timeline should have separate project row and task row
    const projectRows = container.querySelectorAll(
      ".sokkay-gantt__row--project"
    );
    const taskRows = container.querySelectorAll(".sokkay-gantt__row--task");

    expect(projectRows).toHaveLength(1);
    expect(taskRows).toHaveLength(1);
  });

  it("hides task rows when project is collapsed in tree mode", () => {
    const { container } = render(
      <GanttChart
        projects={projects}
        viewMode="day"
        layoutMode="tree"
        collapsedProjectIds={["p1"]}
      />
    );

    expect(screen.getAllByText("Platform").length).toBeGreaterThan(0);
    // Task name in sidebar should NOT be rendered
    expect(screen.queryByText("API")).not.toBeInTheDocument();

    const projectRows = container.querySelectorAll(
      ".sokkay-gantt__row--project"
    );
    const taskRows = container.querySelectorAll(".sokkay-gantt__row--task");

    expect(projectRows).toHaveLength(1);
    expect(taskRows).toHaveLength(0);
  });
});
