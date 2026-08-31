import { describe, expect, it } from "vitest";
import { buildTaskTree, getDirectChildren } from "./taskHierarchy";
import { makeTask } from "./testFixtures";

describe("buildTaskTree", () => {
  it("returns an empty tree for an empty task list", () => {
    expect(buildTaskTree([])).toEqual([]);
  });

  it("returns every task as a root when none of them have a parent", () => {
    const a = makeTask({ type: "STORY" });
    const b = makeTask({ type: "STORY" });

    const tree = buildTaskTree([a, b]);

    expect(tree).toHaveLength(2);
    expect(tree.map((n) => n.task.id)).toEqual([a.id, b.id]);
    expect(tree.every((n) => n.children.length === 0)).toBe(true);
  });

  it("nests a child under its parent when both are in the same list", () => {
    const story = makeTask({ type: "STORY" });
    const task = makeTask({ type: "TASK", parent_id: story.id });

    const tree = buildTaskTree([story, task]);

    expect(tree).toHaveLength(1);
    expect(tree[0].task.id).toBe(story.id);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].task.id).toBe(task.id);
  });

  it("nests multiple children under the same parent, preserving list order", () => {
    const story = makeTask({ type: "STORY" });
    const task1 = makeTask({ type: "TASK", parent_id: story.id });
    const bug1 = makeTask({ type: "BUG", parent_id: story.id });

    const tree = buildTaskTree([story, task1, bug1]);

    expect(tree).toHaveLength(1);
    expect(tree[0].children.map((n) => n.task.id)).toEqual([task1.id, bug1.id]);
  });

  it("supports multi-level nesting (e.g. FEATURE -> STORY -> TASK)", () => {
    const feature = makeTask({ type: "FEATURE" });
    const story = makeTask({ type: "STORY", parent_id: feature.id });
    const task = makeTask({ type: "TASK", parent_id: story.id });

    const tree = buildTaskTree([feature, story, task]);

    expect(tree).toHaveLength(1);
    expect(tree[0].task.id).toBe(feature.id);
    expect(tree[0].children[0].task.id).toBe(story.id);
    expect(tree[0].children[0].children[0].task.id).toBe(task.id);
  });

  // Negative / edge cases

  it("falls back to a root node when the parent is not present in this column's list", () => {
    const story = makeTask({ type: "STORY", status: "IN_PROGRESS" });
    const task = makeTask({ type: "TASK", status: "TODO", parent_id: story.id });

    // Simulates Column only passing its own status-filtered tasks — the
    // STORY parent lives in a different column and is not in this list.
    const tree = buildTaskTree([task]);

    expect(tree).toHaveLength(1);
    expect(tree[0].task.id).toBe(task.id);
    expect(tree[0].children).toHaveLength(0);
  });

  it("falls back to a root node when parent_id references a non-existent task", () => {
    const task = makeTask({ type: "TASK", parent_id: "does-not-exist" });

    const tree = buildTaskTree([task]);

    expect(tree).toHaveLength(1);
    expect(tree[0].task.id).toBe(task.id);
  });

  it("does not infinite-loop or crash on a self-referencing parent_id", () => {
    const task = makeTask({ type: "TASK" });
    task.parent_id = task.id;

    expect(() => buildTaskTree([task])).not.toThrow();
    const tree = buildTaskTree([task]);
    expect(tree).toHaveLength(1);
    expect(tree[0].task.id).toBe(task.id);
  });

  it("does not infinite-loop or crash on a cyclic parent_id chain", () => {
    const a = makeTask({ type: "STORY" });
    const b = makeTask({ type: "STORY" });
    a.parent_id = b.id;
    b.parent_id = a.id;

    expect(() => buildTaskTree([a, b])).not.toThrow();
    // A genuine cycle produces no valid root — both nodes only exist as
    // each other's child, so neither surfaces at the top level. This is
    // an acceptable silent fallback since the backend never allows a real
    // parent_id cycle to be created in the first place.
    const tree = buildTaskTree([a, b]);
    expect(tree).toEqual([]);
  });
});

describe("getDirectChildren", () => {
  it("returns every task whose parent_id matches, regardless of status (happy path)", () => {
    const story = makeTask({ type: "STORY" });
    const task = makeTask({ type: "TASK", status: "TODO", parent_id: story.id });
    const bug = makeTask({ type: "BUG", status: "DONE", parent_id: story.id });
    const unrelated = makeTask({ type: "TASK", parent_id: null });

    const children = getDirectChildren([story, task, bug, unrelated], story.id);

    expect(children.map((t) => t.id)).toEqual([task.id, bug.id]);
  });

  // Negative: a task with no children of its own returns an empty array,
  // not undefined/null or a thrown error.
  it("returns an empty array when the task has no children", () => {
    const story = makeTask({ type: "STORY" });
    const other = makeTask({ type: "STORY" });

    expect(getDirectChildren([story, other], story.id)).toEqual([]);
  });
});
