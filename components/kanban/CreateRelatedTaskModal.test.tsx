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

  it("shows the fixed required parent type for the source task (happy path)", () => {
    const story = makeTask({ type: "STORY", parent_id: null });
    renderModal(story);

    expect(screen.getByText("Feature")).toBeInTheDocument();
  });

  it("creates a parent task then links the source task to it via PATCH, then refreshes and closes", async () => {
    mockedApi.mockResolvedValueOnce({ id: "new-parent-id" });
    mockedApi.mockResolvedValueOnce({});
    const story = makeTask({ type: "STORY", parent_id: null });
    const { refresh, close } = renderModal(story);

    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Bigger feature" } });
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => expect(close).toHaveBeenCalled());

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
    // Exactly one refresh for the whole successful attempt, not one per
    // network call — see the regression test below for why that matters.
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("retries only the link PATCH (no duplicate POST) after a failed link attempt", async () => {
    mockedApi.mockResolvedValueOnce({ id: "new-parent-id" }); // POST succeeds
    mockedApi.mockRejectedValueOnce(new Error("network blip")); // PATCH fails
    const story = makeTask({ type: "STORY", parent_id: null });
    const { refresh, close } = renderModal(story);

    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Bigger feature" } });
    fireEvent.click(screen.getByText("Create"));

    await screen.findByText(/no se pudo crear/i);
    expect(mockedApi).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1); // surfaces the new, still-unlinked task
    expect(close).not.toHaveBeenCalled();

    mockedApi.mockResolvedValueOnce({}); // PATCH retry succeeds
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => expect(close).toHaveBeenCalled());

    // Only 3 total api() calls: original POST, failed PATCH, retried PATCH —
    // never a second POST.
    expect(mockedApi).toHaveBeenCalledTimes(3);
    expect(mockedApi).toHaveBeenNthCalledWith(
      3,
      `/projects/project-1/tasks/${story.id}`,
      "PATCH",
      { parent_id: "new-parent-id" }
    );
  });

  // Negative: an unexpected/malformed API response (missing id) must not be
  // silently used in the follow-up PATCH — it should surface as an error
  // instead of PATCHing a body with parent_id: undefined.
  it("surfaces an error and does not PATCH when the create response has no id", async () => {
    mockedApi.mockResolvedValueOnce({});
    const story = makeTask({ type: "STORY", parent_id: null });
    renderModal(story);

    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Bigger feature" } });
    fireEvent.click(screen.getByText("Create"));

    await screen.findByText(/no se pudo crear/i);
    expect(mockedApi).toHaveBeenCalledTimes(1);
  });
});
