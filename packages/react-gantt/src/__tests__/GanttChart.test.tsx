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

const selectionProjects: GanttProject[] = [
  {
    id: "p1",
    name: "One",
    tasks: [
      {
        id: "t1",
        projectId: "p1",
        name: "Task one",
        start: "2026-07-01",
        end: "2026-07-02",
      },
    ],
  },
  {
    id: "p2",
    name: "Two",
    tasks: [
      {
        id: "t2",
        projectId: "p2",
        name: "Task two",
        start: "2026-07-02",
        end: "2026-07-03",
      },
    ],
  },
  {
    id: "p3",
    name: "Three",
    tasks: [
      {
        id: "t3",
        projectId: "p3",
        name: "Task three",
        start: "2026-07-03",
        end: "2026-07-04",
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

  it("selects project and task rows with Excel-style modifiers", () => {
    const onRowSelectionChange = vi.fn();
    const view = render(
      <GanttChart
        projects={selectionProjects}
        viewMode="day"
        layoutMode="tree"
        selectedRows={[]}
        onRowSelectionChange={onRowSelectionChange}
      />
    );

    fireEvent.click(screen.getByTestId("project-p1"));
    expect(onRowSelectionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedRows: [{ type: "project", projectId: "p1" }],
      })
    );

    view.rerender(
      <GanttChart
        projects={selectionProjects}
        viewMode="day"
        layoutMode="tree"
        selectedRows={[{ type: "project", projectId: "p1" }]}
        onRowSelectionChange={onRowSelectionChange}
      />
    );
    fireEvent.click(screen.getByTestId("sidebar-task-t2"), { shiftKey: true });
    const selectedRange = [
      { type: "project" as const, projectId: "p1" },
      { type: "task" as const, projectId: "p1", taskId: "t1" },
      { type: "project" as const, projectId: "p2" },
      { type: "task" as const, projectId: "p2", taskId: "t2" },
    ];
    expect(onRowSelectionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ selectedRows: selectedRange })
    );

    view.rerender(
      <GanttChart
        projects={selectionProjects}
        viewMode="day"
        layoutMode="tree"
        selectedRows={selectedRange}
        onRowSelectionChange={onRowSelectionChange}
      />
    );
    expect(screen.getByTestId("project-p1")).toHaveClass("is-selected");
    expect(screen.getByTestId("sidebar-task-t1")).toHaveClass("is-selected");
    fireEvent.click(screen.getByTestId("sidebar-task-t1"), { ctrlKey: true });
    expect(onRowSelectionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedRows: [
          { type: "project", projectId: "p1" },
          { type: "project", projectId: "p2" },
          { type: "task", projectId: "p2", taskId: "t2" },
        ],
      })
    );

    view.rerender(
      <GanttChart
        projects={selectionProjects}
        viewMode="day"
        layoutMode="tree"
        selectedRows={[
          { type: "project", projectId: "p1" },
          { type: "project", projectId: "p2" },
          { type: "task", projectId: "p2", taskId: "t2" },
        ]}
        onRowSelectionChange={onRowSelectionChange}
      />
    );
    fireEvent.click(screen.getByTestId("project-p3"), { metaKey: true });
    expect(onRowSelectionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedRows: [
          { type: "project", projectId: "p1" },
          { type: "project", projectId: "p2" },
          { type: "task", projectId: "p2", taskId: "t2" },
          { type: "project", projectId: "p3" },
        ],
      })
    );
  });

  it("preserves multiple selected rows on right-click without reordering", () => {
    const onRowSelectionChange = vi.fn();
    const onRowContextMenu = vi.fn();
    const onTaskReorder = vi.fn();
    const selectedRows = [
      { type: "project" as const, projectId: "p1" },
      { type: "task" as const, projectId: "p1", taskId: "t1" },
    ];
    const view = render(
      <GanttChart
        projects={selectionProjects}
        viewMode="day"
        layoutMode="tree"
        selectedRows={selectedRows}
        onRowSelectionChange={onRowSelectionChange}
        onRowContextMenu={onRowContextMenu}
        onTaskReorder={onTaskReorder}
      />
    );

    const selectedTaskRow = screen.getByTestId("sidebar-task-t1");
    const taskGrip = selectedTaskRow.querySelector(
      ".sokkay-gantt__task-grip"
    ) as Element;
    fireEvent.pointerDown(taskGrip, { button: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { clientX: 108, clientY: 108 });
    fireEvent.pointerUp(window, { button: 2, clientX: 108, clientY: 108 });
    fireEvent.contextMenu(taskGrip, { clientX: 108, clientY: 108 });

    expect(onRowSelectionChange).not.toHaveBeenCalled();
    expect(onTaskReorder).not.toHaveBeenCalled();
    expect(onRowContextMenu).toHaveBeenLastCalledWith(
      expect.objectContaining({
        row: expect.objectContaining({
          type: "task",
          task: expect.objectContaining({ id: "t1" }),
        }),
        selectedRows,
        rows: [
          expect.objectContaining({ type: "project" }),
          expect.objectContaining({ type: "task" }),
        ],
        event: expect.any(Object),
      })
    );

    view.rerender(
      <GanttChart
        projects={selectionProjects}
        viewMode="day"
        layoutMode="tree"
        selectedRows={selectedRows}
        onRowSelectionChange={onRowSelectionChange}
        onRowContextMenu={onRowContextMenu}
      />
    );
    fireEvent.contextMenu(screen.getByTestId("project-p3"));
    expect(onRowSelectionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedRows: [{ type: "project", projectId: "p3" }],
      })
    );
    expect(onRowContextMenu).toHaveBeenLastCalledWith(
      expect.objectContaining({
        row: expect.objectContaining({
          type: "project",
          project: expect.objectContaining({ id: "p3" }),
        }),
        selectedRows: [{ type: "project", projectId: "p3" }],
      })
    );
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

  it("only starts task pointer interactions with the left button", () => {
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
        renderContextMenu={({ task }) => (
          <button type="button">Copy {task.name}</button>
        )}
      />
    );

    const task = screen.getByTestId("task-t1");
    fireEvent.pointerDown(task, { button: 2, clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 148 });
    fireEvent.pointerUp(window, { button: 2 });

    fireEvent.pointerDown(
      task.querySelector(".sokkay-gantt__resize--end") as Element,
      { button: 2, clientX: 100 }
    );
    fireEvent.pointerMove(window, { clientX: 148 });
    fireEvent.pointerUp(window, { button: 2 });

    expect(onTaskMove).not.toHaveBeenCalled();
    expect(onTaskMoveEnd).not.toHaveBeenCalled();
    expect(onTaskResize).not.toHaveBeenCalled();
    expect(onTaskResizeEnd).not.toHaveBeenCalled();

    fireEvent.contextMenu(task);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Copy API")).toBeInTheDocument();
  });

  it("passes the right-clicked segment to context menu callbacks", () => {
    const segmentedProjects: GanttProject[] = [
      {
        id: "p1",
        name: "Alpha",
        tasks: [
          {
            id: "t1",
            projectId: "p1",
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

  it("opens the context menu upward when there is not enough viewport space below", () => {
    const originalClientHeight = Object.getOwnPropertyDescriptor(
      document.documentElement,
      "clientHeight"
    );
    Object.defineProperty(document.documentElement, "clientHeight", {
      configurable: true,
      value: 800,
    });
    const getBoundingClientRect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({
        bottom: 0,
        height: 100,
        left: 0,
        right: 160,
        toJSON: () => ({}),
        top: 0,
        width: 160,
        x: 0,
        y: 0,
      });

    try {
      render(
        <GanttChart
          projects={projects}
          viewMode="day"
          renderContextMenu={() => <button type="button">Copy</button>}
        />
      );

      fireEvent.contextMenu(screen.getByTestId("task-t1"), {
        clientX: 100,
        clientY: 750,
      });

      expect(screen.getByRole("menu")).toHaveStyle({ top: "650px" });
    } finally {
      getBoundingClientRect.mockRestore();
      if (originalClientHeight) {
        Object.defineProperty(
          document.documentElement,
          "clientHeight",
          originalClientHeight
        );
      }
    }
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

  it("renders aligned sidebar columns for project and task rows", () => {
    const projectsWithMeta: Array<
      GanttProject<{ owner: string }, { status: string }>
    > = [
      {
        ...projects[0],
        meta: { owner: "Core" },
        tasks: projects[0].tasks.map((task) => ({
          ...task,
          meta: { status: "In progress" },
        })),
      },
    ];
    const renderProject = vi.fn(
      (project, state) => `${project.meta?.owner}:${state.taskCount}`
    );
    const renderTask = vi.fn(
      (task, state) => `${task.meta?.status}:${state.project.id}:${state.index}`
    );
    const { container } = render(
      <GanttChart
        projects={projectsWithMeta}
        viewMode="day"
        layoutMode="tree"
        sidebarColumns={[
          {
            id: "details",
            header: "Details",
            width: 120,
            headerClassName: "details-header",
            cellClassName: "details-cell",
            renderProject,
            renderTask,
          },
          {
            id: "optional",
            header: "Optional",
            width: "minmax(80px, 1fr)",
          },
        ]}
      />
    );

    expect(screen.getByText("Details").parentElement).toHaveClass(
      "details-header"
    );
    expect(screen.getByText("Core:1")).toHaveClass("details-cell");
    expect(screen.getByText("In progress:p1:0")).toHaveClass("details-cell");
    expect(screen.getByText("Optional")).toBeInTheDocument();
    expect(renderProject).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1" }),
      { collapsed: false, selected: false, taskCount: 1 }
    );
    expect(renderTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" }),
      {
        project: expect.objectContaining({ id: "p1" }),
        index: 0,
        selected: false,
      }
    );

    const headerGrid = container.querySelector(
      ".sokkay-gantt__sidebar-grid"
    ) as HTMLElement;
    expect(headerGrid.style.gridTemplateColumns).toBe(
      "minmax(0, 1fr) 120px minmax(80px, 1fr)"
    );
    expect(
      (container.querySelector(".sokkay-gantt__task-cell") as HTMLElement).style
        .gridTemplateColumns
    ).toBe(headerGrid.style.gridTemplateColumns);
  });

  it("emits controlled sidebar column resize changes", () => {
    const onSidebarColumnWidthChange = vi.fn();
    const onSidebarColumnResizeEnd = vi.fn();
    const { container } = render(
      <GanttChart
        projects={projects}
        viewMode="day"
        sidebarColumns={[
          {
            id: "details",
            header: "Details",
            width: 120,
            minWidth: 100,
            maxWidth: 140,
            resizable: true,
            resizeAriaLabel: "Resize details",
          },
        ]}
        onSidebarColumnWidthChange={onSidebarColumnWidthChange}
        onSidebarColumnResizeEnd={onSidebarColumnResizeEnd}
      />
    );

    const handle = screen.getByRole("separator", {
      name: "Resize details",
    });
    expect(
      (container.querySelector(".sokkay-gantt__sidebar-grid") as HTMLElement)
        .style.gridTemplateColumns
    ).toBe("minmax(0, 1fr) 120px 12px");
    expect(
      container.querySelectorAll(".sokkay-gantt__sidebar-resize-gutter")
    ).toHaveLength(2);
    fireEvent(
      handle,
      new MouseEvent("pointerdown", { bubbles: true, clientX: 120 })
    );
    fireEvent(
      window,
      new MouseEvent("pointermove", { bubbles: true, clientX: 180 })
    );
    fireEvent(window, new MouseEvent("pointerup", { bubbles: true }));

    expect(onSidebarColumnWidthChange).toHaveBeenLastCalledWith({
      columnId: "details",
      width: 140,
    });
    expect(onSidebarColumnResizeEnd).toHaveBeenLastCalledWith({
      columnId: "details",
      width: 140,
    });

    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(onSidebarColumnWidthChange).toHaveBeenLastCalledWith({
      columnId: "details",
      width: 110,
    });
    expect(onSidebarColumnResizeEnd).toHaveBeenLastCalledWith({
      columnId: "details",
      width: 110,
    });
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

  it("renders a centered grip on the main sidebar resize handle", () => {
    const { container } = render(
      <GanttChart projects={projects} viewMode="day" />
    );

    const bodyHandle = container.querySelector(
      ".sokkay-gantt__sidebar-resize--body"
    );
    expect(
      bodyHandle?.querySelector(".sokkay-gantt__sidebar-resize-icon")
    ).toBeInTheDocument();
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
