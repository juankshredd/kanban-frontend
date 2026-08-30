import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import TaskCardTree from "./TaskCardTree";
import { buildTaskTree } from "@/lib/taskHierarchy";
import { makeTask } from "@/lib/testFixtures";

function renderTree(node: ReturnType<typeof buildTaskTree>[number]) {
  return render(
    <TaskCardTree
      node={node}
      depth={0}
      projectId="project-1"
      tasks={[]}
      onDelete={vi.fn()}
      onTypeChange={vi.fn()}
      refresh={vi.fn()}
    />
  );
}

describe("TaskCardTree", () => {
  it("renders a root task without compact styling and no nested children (happy path, leaf)", () => {
    const story = makeTask({ type: "STORY" });
    const [node] = buildTaskTree([story]);

    const { container } = renderTree(node);

    const card = container.querySelector(`#${story.id}`);
    expect(card).toHaveClass("bg-slate-800");
    expect(card).not.toHaveClass("border");
  });

  it("renders a nested child card compact and inside the parent's bordered container", () => {
    const story = makeTask({ type: "STORY" });
    const task = makeTask({ type: "TASK", parent_id: story.id });
    const [node] = buildTaskTree([story, task]);

    const { container } = renderTree(node);

    const parentCard = container.querySelector(`#${story.id}`);
    const childCard = container.querySelector(`#${task.id}`);

    expect(parentCard).toHaveClass("border");
    expect(childCard).toHaveClass("bg-slate-700");
    // the child card element must live inside the parent card's DOM subtree
    expect(parentCard?.contains(childCard)).toBe(true);
  });

  it("propagates compact styling at every depth for multi-level nesting", () => {
    const feature = makeTask({ type: "FEATURE" });
    const story = makeTask({ type: "STORY", parent_id: feature.id });
    const task = makeTask({ type: "TASK", parent_id: story.id });
    const [node] = buildTaskTree([feature, story, task]);

    const { container } = renderTree(node);

    expect(container.querySelector(`#${feature.id}`)).toHaveClass("bg-slate-800");
    expect(container.querySelector(`#${story.id}`)).toHaveClass("bg-slate-700");
    expect(container.querySelector(`#${task.id}`)).toHaveClass("bg-slate-700");
  });

  // Negative case: a node whose children array is empty must render like a
  // normal leaf card, with no dangling nested-content wrapper/border.
  it("does not render a nested-content border for a node with no children", () => {
    const bug = makeTask({ type: "BUG" });
    const [node] = buildTaskTree([bug]);

    expect(node.children).toHaveLength(0);

    const { container } = renderTree(node);
    const card = container.querySelector(`#${bug.id}`);
    expect(card).not.toHaveClass("border");
  });
});
