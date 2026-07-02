import { fireEvent, render, screen } from "@testing-library/react";
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
    const { container } = render(<GanttChart projects={projects} viewMode="day" onTaskSelect={onTaskSelect} />);

    fireEvent.click(screen.getByTestId("task-t1"));
    expect(onTaskSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: "t1" }));

    fireEvent.click(container.querySelector(".sokkay-gantt") as Element);
    expect(onTaskSelect).toHaveBeenLastCalledWith(null);
  });

  it("renders a custom tooltip on hover", async () => {
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        renderTaskTooltip={(task) => <span>Tooltip for {task.name}</span>}
      />,
    );

    fireEvent.mouseEnter(screen.getByTestId("task-t1"));
    expect(await screen.findByText("Tooltip for API")).toBeInTheDocument();
  });

  it("renders a custom context menu and invokes callback payload", () => {
    const onTaskContextMenu = vi.fn();
    render(
      <GanttChart
        projects={projects}
        viewMode="day"
        onTaskContextMenu={onTaskContextMenu}
        renderContextMenu={({ task }) => <button type="button">Copy {task.name}</button>}
      />,
    );

    fireEvent.contextMenu(screen.getByTestId("task-t1"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Copy API")).toBeInTheDocument();
    expect(onTaskContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        task: expect.objectContaining({ id: "t1" }),
        actions: expect.any(Object),
      }),
    );
  });

  it("emits move and resize payloads with dates", () => {
    const onTaskMove = vi.fn();
    const onTaskResize = vi.fn();
    render(<GanttChart projects={projects} viewMode="day" onTaskMove={onTaskMove} onTaskResize={onTaskResize} />);

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
      }),
    );

    fireEvent.pointerDown(task.querySelector(".sokkay-gantt__resize--end") as Element, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 148 });
    fireEvent.pointerUp(window);

    expect(onTaskResize).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        edge: "end",
        end: expect.any(Date),
      }),
    );
  });
});
