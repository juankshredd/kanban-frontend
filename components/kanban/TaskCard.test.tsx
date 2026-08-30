import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import TaskCard from "./TaskCard";
import { makeTask } from "@/lib/testFixtures";

function renderCard(props: Partial<React.ComponentProps<typeof TaskCard>> = {}) {
  const task = props.task ?? makeTask({ type: "STORY" });

  return render(
    <TaskCard
      task={task}
      projectId="project-1"
      tasks={[task]}
      onDelete={vi.fn()}
      onTypeChange={vi.fn()}
      refresh={vi.fn()}
      {...props}
    />
  );
}

describe("TaskCard", () => {
  it("renders at full size with no nested-content border by default (happy path)", () => {
    const task = makeTask({ type: "STORY" });
    const { container } = renderCard({ task });

    const card = container.querySelector(`#${task.id}`);
    expect(card).not.toBeNull();
    expect(card).toHaveClass("bg-slate-800");
    expect(card).not.toHaveClass("bg-slate-700");
    expect(card).not.toHaveClass("border");
  });

  it("renders in compact mode with a smaller background when compact is true", () => {
    const task = makeTask({ type: "TASK" });
    const { container } = renderCard({ task, compact: true });

    const card = container.querySelector(`#${task.id}`);
    expect(card).toHaveClass("bg-slate-700");
    expect(card).not.toHaveClass("bg-slate-800");
  });

  it("shows a bordered nested-content container when given children", () => {
    const task = makeTask({ type: "STORY" });
    const { container, getByText } = renderCard({
      task,
      children: <div>child card</div>,
    });

    const card = container.querySelector(`#${task.id}`);
    expect(card).toHaveClass("border");
    expect(getByText("child card")).toBeInTheDocument();
  });

  // Negative case: an empty array (what a "no children" tree node produces)
  // must NOT be treated as nested content — this guards against a real bug
  // where `Boolean([])` is `true` in JS, which previously made every card
  // render as if it had nested content.
  it("does not show a nested-content border when children is an empty array", () => {
    const task = makeTask({ type: "TASK" });
    const { container } = renderCard({ task, children: [] });

    const card = container.querySelector(`#${task.id}`);
    expect(card).not.toHaveClass("border");
  });

  it("does not show a nested-content border when children is false", () => {
    const task = makeTask({ type: "TASK" });
    const { container } = renderCard({ task, children: false });

    const card = container.querySelector(`#${task.id}`);
    expect(card).not.toHaveClass("border");
  });
});
