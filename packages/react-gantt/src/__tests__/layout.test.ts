import { describe, expect, it } from "vitest";
import type { GanttProject } from "../types";
import { normalizeProjects } from "../utils/dates";
import { buildTaskLanes } from "../utils/layout";

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
        end: "2026-07-10",
      },
      {
        id: "t2",
        projectId: "p1",
        name: "Styles",
        start: "2026-07-06",
        end: "2026-07-12",
      },
      {
        id: "t3",
        projectId: "p1",
        name: "Docs",
        start: "2026-07-12",
        end: "2026-07-14",
      },
    ],
  },
];

describe("layout utilities", () => {
  it("creates a new lane when task ranges overlap", () => {
    const [project] = normalizeProjects(projects);
    const lanes = buildTaskLanes(project.tasks);

    expect(lanes).toHaveLength(2);
    expect(lanes[0].tasks.map((task) => task.id)).toEqual(["t1", "t3"]);
    expect(lanes[1].tasks.map((task) => task.id)).toEqual(["t2"]);
  });

  it("ignores envelope gaps when comparing segmented tasks", () => {
    const [project] = normalizeProjects([
      {
        id: "p1",
        name: "Platform",
        tasks: [
          {
            id: "weekdays",
            projectId: "p1",
            name: "Weekdays",
            start: "2026-07-06",
            end: "2026-07-17",
            segments: [
              { id: "w1", start: "2026-07-06", end: "2026-07-10" },
              { id: "w2", start: "2026-07-13", end: "2026-07-17" },
            ],
          },
          {
            id: "weekend",
            projectId: "p1",
            name: "Weekend",
            start: "2026-07-11",
            end: "2026-07-12",
          },
        ],
      },
    ]);

    const lanes = buildTaskLanes(project.tasks);

    expect(lanes).toHaveLength(1);
    expect(lanes[0].tasks.map((task) => task.id)).toEqual([
      "weekdays",
      "weekend",
    ]);
  });

  it("still separates lanes when segmented tasks actually overlap", () => {
    const [project] = normalizeProjects([
      {
        id: "p1",
        name: "Platform",
        tasks: [
          {
            id: "weekdays",
            projectId: "p1",
            name: "Weekdays",
            start: "2026-07-06",
            end: "2026-07-17",
            segments: [
              { id: "w1", start: "2026-07-06", end: "2026-07-10" },
              { id: "w2", start: "2026-07-13", end: "2026-07-17" },
            ],
          },
          {
            id: "overlap",
            projectId: "p1",
            name: "Overlap",
            start: "2026-07-09",
            end: "2026-07-14",
          },
        ],
      },
    ]);

    const lanes = buildTaskLanes(project.tasks);

    expect(lanes).toHaveLength(2);
    expect(lanes[0].tasks.map((task) => task.id)).toEqual(["weekdays"]);
    expect(lanes[1].tasks.map((task) => task.id)).toEqual(["overlap"]);
  });
});
