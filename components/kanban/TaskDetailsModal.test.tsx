import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskDetailsModal from "./TaskDetailsModal";
import { makeTask } from "@/lib/testFixtures";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, api: vi.fn() };
});

function renderDetails(task: ReturnType<typeof makeTask>, tasks: ReturnType<typeof makeTask>[] = []) {
  return render(
    <TaskDetailsModal
      task={task}
      projectId="project-1"
      tasks={tasks.length ? tasks : [task]}
      close={vi.fn()}
      refresh={vi.fn()}
    />
  );
}

describe("TaskDetailsModal — related card trigger", () => {
  it("shows the '+ Add related card' trigger for a task that can have a child or a parent (happy path)", () => {
    const story = makeTask({ type: "STORY", parent_id: null });
    renderDetails(story);

    expect(screen.getByText("+ Add related card")).toBeInTheDocument();
  });

  // Negative: a leaf-type task (TASK) that already has a parent can neither
  // have children nor gain another parent — the trigger has nothing useful
  // to do, so it must not render at all.
  it("hides the trigger for a leaf-type task that already has a parent", () => {
    const task = makeTask({ type: "TASK", parent_id: "existing-parent" });
    renderDetails(task);

    expect(screen.queryByText("+ Add related card")).not.toBeInTheDocument();
  });

  it("opens the relation picker when the trigger is clicked", () => {
    const story = makeTask({ type: "STORY", parent_id: null });
    renderDetails(story);

    fireEvent.click(screen.getByText("+ Add related card"));

    expect(screen.getByText("Child of this card")).toBeInTheDocument();
    expect(screen.getByText("Parent of this card")).toBeInTheDocument();
  });
});
