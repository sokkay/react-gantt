import { describe, expect, it } from "vitest";
import {
  DEFAULT_TREE_COLUMN_ID,
  getDefaultSidebarColumns,
  getSidebarGridTemplateColumns,
  resolveSidebarColumns,
} from "../utils/columns";

describe("sidebar columns helpers", () => {
  it("creates a default tree column from the project header label", () => {
    expect(getDefaultSidebarColumns("Proyecto")).toEqual([
      {
        id: DEFAULT_TREE_COLUMN_ID,
        kind: "tree",
        header: "Proyecto",
      },
    ]);
  });

  it("falls back to defaults only when columns is undefined", () => {
    expect(resolveSidebarColumns(undefined, "Project")).toHaveLength(1);
    expect(resolveSidebarColumns([], "Project")).toEqual([]);
  });

  it("builds grid tracks for tree and data columns", () => {
    expect(
      getSidebarGridTemplateColumns([
        { kind: "tree" },
        { kind: "data", width: 120 },
        { kind: "data", width: "minmax(80px, 1fr)" },
      ])
    ).toBe("minmax(0, 1fr) 120px minmax(80px, 1fr)");

    expect(
      getSidebarGridTemplateColumns([
        { kind: "data", width: 80 },
        { kind: "tree", width: 160, resizable: true },
      ])
    ).toBe("80px 160px 12px");
  });
});
