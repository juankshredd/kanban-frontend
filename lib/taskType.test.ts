import { describe, expect, it } from "vitest";
import { getChildTypes, canGainParent } from "./taskType";
import { makeTask } from "./testFixtures";

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

describe("canGainParent", () => {
  it("is true for an unparented task whose type allows a parent (happy path)", () => {
    const story = makeTask({ type: "STORY", parent_id: null });
    expect(canGainParent(story)).toBe(true);
  });

  it("is false once the task already has a parent", () => {
    const story = makeTask({ type: "STORY", parent_id: "existing-parent" });
    expect(canGainParent(story)).toBe(false);
  });

  it("is false for a type that can never have a parent (EPIC)", () => {
    const epic = makeTask({ type: "EPIC", parent_id: null });
    expect(canGainParent(epic)).toBe(false);
  });
});
