import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChildIssuesList from "./ChildIssuesList";
import { makeTask } from "@/lib/testFixtures";
import { api } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, api: vi.fn() };
});

const mockedApi = vi.mocked(api);

function renderList(childTasks: ReturnType<typeof makeTask>[], refresh = vi.fn()) {
  const parentTask = makeTask({ type: "STORY" });
  return { parentTask, refresh, ...render(
    <ChildIssuesList
      parentTask={parentTask}
      childTasks={childTasks}
      projectId="project-1"
      refresh={refresh}
    />
  ) };
}

describe("ChildIssuesList", () => {
  beforeEach(() => {
    mockedApi.mockReset();
    mockedApi.mockResolvedValue({});
  });

  it("renders a row per child with progress reflecting DONE count (happy path)", () => {
    const a = makeTask({ type: "TASK", title: "First", status: "DONE" });
    const b = makeTask({ type: "TASK", title: "Second", status: "TODO" });
    renderList([a, b]);

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 done")).toBeInTheDocument();
  });

  it("shows 0 of 0 done with no rows when there are no children (negative/empty state)", () => {
    renderList([]);

    expect(screen.getByText("0 of 0 done")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/what needs to be done/i)).toBeInTheDocument();
  });

  it("creates a child task on Enter with the parent's default child type, then refreshes and clears the input", async () => {
    const { parentTask, refresh } = renderList([]);
    const input = screen.getByPlaceholderText(/what needs to be done/i);

    fireEvent.change(input, { target: { value: "New subtask" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(refresh).toHaveBeenCalled());

    expect(mockedApi).toHaveBeenCalledWith(
      "/projects/project-1/tasks",
      "POST",
      expect.objectContaining({ title: "New subtask", type: "TASK", parent_id: parentTask.id })
    );
    expect(input).toHaveValue("");
  });

  // Negative: blank input must not fire a request.
  it("does not create a task when Enter is pressed with a blank/whitespace title", () => {
    renderList([]);
    const input = screen.getByPlaceholderText(/what needs to be done/i);

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockedApi).not.toHaveBeenCalled();
  });

  it("changes a child's status via its select and refreshes", async () => {
    const a = makeTask({ type: "TASK", title: "First", status: "TODO" });
    const { refresh } = renderList([a]);

    fireEvent.change(screen.getByDisplayValue("TODO"), { target: { value: "DONE" } });

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(mockedApi).toHaveBeenCalledWith(
      `/projects/project-1/tasks/${a.id}`,
      "PATCH",
      { status: "DONE" }
    );
  });

  it("unlinks a child (sets parent_id to null) when its remove button is clicked", async () => {
    const a = makeTask({ type: "TASK", title: "First" });
    const { refresh } = renderList([a]);

    fireEvent.click(screen.getByLabelText("Remove subtask"));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(mockedApi).toHaveBeenCalledWith(
      `/projects/project-1/tasks/${a.id}`,
      "PATCH",
      { parent_id: null }
    );
  });

  // Negative: a failed mutation must surface an inline error instead of
  // failing silently.
  it("shows an inline error when the status update fails", async () => {
    mockedApi.mockReset();
    mockedApi.mockRejectedValueOnce(new Error("network down"));
    const a = makeTask({ type: "TASK", title: "First", status: "TODO" });
    renderList([a]);

    fireEvent.change(screen.getByDisplayValue("TODO"), { target: { value: "DONE" } });

    expect(await screen.findByText(/no se pudo actualizar/i)).toBeInTheDocument();
  });

  it("persists a drag-reorder via after_task_id only once the drag ends, using the moved task's new predecessor", async () => {
    const a = makeTask({ type: "TASK", title: "First" });
    const b = makeTask({ type: "TASK", title: "Second" });
    const { refresh, container } = renderList([a, b]);

    const rows = container.querySelectorAll("[draggable=true]");
    expect(rows).toHaveLength(2);

    fireEvent.dragStart(rows[0]);
    fireEvent.dragOver(rows[1]);
    fireEvent.dragEnd(rows[1]);

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(mockedApi).toHaveBeenCalledWith(
      `/projects/project-1/tasks/${a.id}`,
      "PATCH",
      { after_task_id: b.id }
    );
  });

  // Negative: dropping a row back on its own starting position must not
  // fire a no-op reorder request.
  it("does not PATCH when a row is dragged and released without moving", async () => {
    const a = makeTask({ type: "TASK", title: "First" });
    const b = makeTask({ type: "TASK", title: "Second" });
    const { container } = renderList([a, b]);

    const rows = container.querySelectorAll("[draggable=true]");
    fireEvent.dragStart(rows[0]);
    fireEvent.dragEnd(rows[0]);

    expect(mockedApi).not.toHaveBeenCalled();
  });
});
