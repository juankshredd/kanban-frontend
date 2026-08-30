import { describe, expect, it } from "vitest";
import { getChildTypes } from "./taskType";

describe("getChildTypes", () => {
  it("returns every type whose required parent is the given type (happy path)", () => {
    expect(getChildTypes("STORY")).toEqual(["TASK", "BUG"]);
    expect(getChildTypes("EPIC")).toEqual(["FEATURE"]);
    expect(getChildTypes("FEATURE")).toEqual(["STORY"]);
  });

  // Negative: leaf types (TASK/BUG) can never be a parent, so nothing can
  // legally be their child.
  it("returns an empty array for leaf types that cannot have children", () => {
    expect(getChildTypes("TASK")).toEqual([]);
    expect(getChildTypes("BUG")).toEqual([]);
  });
});
