import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TaskDetailsModal from "./TaskDetailsModal";
import { makeTask } from "@/lib/testFixtures";
import { api } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, api: vi.fn() };
});

const mockedApi = vi.mocked(api);

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

describe("TaskDetailsModal — parentId resync (regression)", () => {
  beforeEach(() => {
    mockedApi.mockReset();
    mockedApi.mockResolvedValue({});
  });

  // Regression test for a bug found in code review: parentId state was only
  // seeded once at mount, so if CreateRelatedTaskModal (opened from this
  // same modal) linked a new parent and called refresh() while this modal
  // stayed open, a subsequent Save would send the modal's own stale
  // (pre-link) parentId and silently erase the link that was just created.
  it("picks up a parent_id change on the task prop and sends it on Save, instead of the stale initial value", async () => {
    const story = makeTask({ type: "STORY", parent_id: null });
    const { rerender } = renderDetails(story);

    // Simulate refresh() propagating an externally-created parent link
    // while the modal stays mounted (no unmount/remount in between).
    const relinkedStory = { ...story, parent_id: "new-parent-id" };
    rerender(
      <TaskDetailsModal
        task={relinkedStory}
        projectId="project-1"
        tasks={[relinkedStory]}
        close={vi.fn()}
        refresh={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => expect(mockedApi).toHaveBeenCalled());
    expect(mockedApi).toHaveBeenCalledWith(
      `/projects/project-1/tasks/${story.id}`,
      "PATCH",
      expect.objectContaining({ parent_id: "new-parent-id" })
    );
  });
});
