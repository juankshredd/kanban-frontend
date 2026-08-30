import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateRelatedTaskModal from "./CreateRelatedTaskModal";
import { makeTask } from "@/lib/testFixtures";
import { api } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, api: vi.fn() };
});

const mockedApi = vi.mocked(api);

function renderModal(sourceTask: ReturnType<typeof makeTask>, refresh = vi.fn(), close = vi.fn()) {
  return { refresh, close, ...render(
    <CreateRelatedTaskModal
      sourceTask={sourceTask}
      projectId="project-1"
      close={close}
      refresh={refresh}
    />
  ) };
}

describe("CreateRelatedTaskModal", () => {
  beforeEach(() => {
    mockedApi.mockReset();
  });

  it("enables both relation options for an unparented STORY (happy path)", () => {
    const story = makeTask({ type: "STORY", parent_id: null });
    renderModal(story);

    expect(screen.getByText("Child of this card")).toBeEnabled();
    expect(screen.getByText("Parent of this card")).toBeEnabled();
  });

  it("disables 'Parent of this card' when the source task already has a parent", () => {
    const story = makeTask({ type: "STORY", parent_id: "existing-parent" });
    renderModal(story);

    expect(screen.getByText("Parent of this card")).toBeDisabled();
    expect(screen.getByText(/already has a parent/i)).toBeInTheDocument();
  });

  it("disables 'Child of this card' for a leaf type (TASK) that can't have children", () => {
    const task = makeTask({ type: "TASK", parent_id: null });
    renderModal(task);

    expect(screen.getByText("Child of this card")).toBeDisabled();
    expect(screen.getByText(/can.t have children/i)).toBeInTheDocument();
  });

  it("creates a child task with parent_id set to the source task, then refreshes and closes", async () => {
    mockedApi.mockResolvedValueOnce({ id: "new-child-id" });
    const story = makeTask({ type: "STORY", parent_id: null });
    const { refresh, close } = renderModal(story);

    fireEvent.click(screen.getByText("Child of this card"));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Do the thing" } });
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => expect(refresh).toHaveBeenCalled());

    expect(mockedApi).toHaveBeenCalledTimes(1);
    expect(mockedApi).toHaveBeenCalledWith(
      "/projects/project-1/tasks",
      "POST",
      expect.objectContaining({ title: "Do the thing", parent_id: story.id })
    );
    expect(close).toHaveBeenCalled();
  });

  it("creates a parent task then links the source task to it via PATCH, then refreshes and closes", async () => {
    mockedApi.mockResolvedValueOnce({ id: "new-parent-id" });
    mockedApi.mockResolvedValueOnce({});
    const story = makeTask({ type: "STORY", parent_id: null });
    const { refresh, close } = renderModal(story);

    fireEvent.click(screen.getByText("Parent of this card"));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Bigger feature" } });
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => expect(refresh).toHaveBeenCalled());

    expect(mockedApi).toHaveBeenCalledTimes(2);
    expect(mockedApi).toHaveBeenNthCalledWith(
      1,
      "/projects/project-1/tasks",
      "POST",
      expect.objectContaining({ title: "Bigger feature", type: "FEATURE" })
    );
    expect(mockedApi).toHaveBeenNthCalledWith(
      2,
      `/projects/project-1/tasks/${story.id}`,
      "PATCH",
      { parent_id: "new-parent-id" }
    );
    expect(refresh).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
