import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ProjectSidebar from "./ProjectSidebar";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/projects/project-1/board",
}));

vi.mock("@/context/ProjectProvider", () => ({
  useProject: () => ({
    project: {
      id: "project-1",
      key: "KAN",
      name: "Kanban Dashboard",
      company_id: "company-1",
      company_name: "Acme",
    },
    loading: false,
  }),
}));

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("ProjectSidebar", () => {
  beforeEach(() => {
    push.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("auto-collapses to the icon rail on narrow viewports (phone/iPad mini), below the desktop breakpoint", () => {
    mockMatchMedia(false);

    render(<ProjectSidebar projectId="project-1" />);

    // Collapsed state renders a `title` attribute instead of visible label text.
    expect(screen.getByTitle("Board")).toBeInTheDocument();
    expect(screen.queryByText("Board")).not.toBeInTheDocument();
  });

  it("stays expanded on desktop-width viewports and still lets the user manually collapse it", () => {
    mockMatchMedia(true);

    render(<ProjectSidebar projectId="project-1" />);

    expect(screen.getByText("Board")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Collapse"));

    expect(screen.queryByText("Board")).not.toBeInTheDocument();
    expect(screen.getByTitle("Board")).toBeInTheDocument();
  });
});
