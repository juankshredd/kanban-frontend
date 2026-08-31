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

describe("TaskDetailsModal", () => {
  beforeEach(() => {
    mockedApi.mockReset();
    mockedApi.mockResolvedValue({});
  });

  it("shows '+ Add related card' for a task that can gain a parent, and 'Create subtask' for a type with legal children (happy path)", () => {
    const story = makeTask({ type: "STORY", parent_id: null });
    renderDetails(story);

    expect(screen.getByText("+ Add related card")).toBeInTheDocument();
    expect(screen.getByText("Create subtask")).toBeInTheDocument();
  });

  // Negative: a leaf-type task (TASK) that already has a parent can neither
  // gain a new parent nor have children — neither action button renders.
  it("hides both action buttons for a leaf-type task that already has a parent", () => {
    const task = makeTask({ type: "TASK", parent_id: "existing-parent" });
    renderDetails(task);

    expect(screen.queryByText("+ Add related card")).not.toBeInTheDocument();
    expect(screen.queryByText("Create subtask")).not.toBeInTheDocument();
  });

  it("hides 'Create subtask' and the Child issues section for a leaf type (TASK)", () => {
    const task = makeTask({ type: "TASK", parent_id: null });
    renderDetails(task);

    expect(screen.queryByText("Create subtask")).not.toBeInTheDocument();
    expect(screen.queryByText("Child issues")).not.toBeInTheDocument();
  });

  it("opens CreateRelatedTaskModal (parent-only) when '+ Add related card' is clicked", () => {
    const story = makeTask({ type: "STORY", parent_id: null });
    renderDetails(story);

    fireEvent.click(screen.getByText("+ Add related card"));

    expect(screen.getByText("New parent card")).toBeInTheDocument();
  });

  it("renders the description when present, and omits the section when empty", () => {
    const withDescription = makeTask({ type: "STORY", description: "Some details here" });
    const { unmount } = renderDetails(withDescription);
    expect(screen.getByText("Some details here")).toBeInTheDocument();
    unmount();

    const withoutDescription = makeTask({ type: "STORY", description: "" });
    renderDetails(withoutDescription);
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });

  it("shows the parent's ticket_id in the breadcrumb when the task has a parent", () => {
    const parent = makeTask({ type: "FEATURE" });
    const story = makeTask({ type: "STORY", parent_id: parent.id });
    renderDetails(story, [parent, story]);

    expect(screen.getByText(parent.ticket_id)).toBeInTheDocument();
  });

  it("changes status via the status select and refreshes", async () => {
    const story = makeTask({ type: "STORY", status: "TODO" });
    renderDetails(story);

    fireEvent.change(screen.getByDisplayValue("TODO"), { target: { value: "IN_PROGRESS" } });

    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith(
        `/projects/project-1/tasks/${story.id}`,
        "PATCH",
        { status: "IN_PROGRESS" }
      )
    );
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
