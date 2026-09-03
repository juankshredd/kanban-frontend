import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
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

// A fake MediaQueryList whose `matches` can be flipped after mount and that
// notifies whichever "change" listener the component under test registered
// — lets tests simulate a real viewport/orientation change, not just the
// value read once at initial render.
function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  let changeListener: (() => void) | null = null;

  const mql = {
    get matches() {
      return matches;
    },
    addEventListener: vi.fn((_event: string, cb: () => void) => {
      changeListener = cb;
    }),
    removeEventListener: vi.fn(() => {
      changeListener = null;
    }),
  };

  window.matchMedia = vi.fn().mockImplementation(() => mql) as unknown as typeof window.matchMedia;

  return {
    setMatches(next: boolean) {
      matches = next;
      changeListener?.();
    },
  };
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

  it("reacts live to a viewport change after mount, e.g. an iPad mini rotating from portrait to landscape", () => {
    const mql = mockMatchMedia(false); // starts narrower than desktop (portrait) -> collapsed

    render(<ProjectSidebar projectId="project-1" />);

    expect(screen.getByTitle("Board")).toBeInTheDocument();
    expect(screen.queryByText("Board")).not.toBeInTheDocument();

    act(() => {
      mql.setMatches(true); // rotate to landscape, now past the desktop breakpoint
    });

    expect(screen.getByText("Board")).toBeInTheDocument();
  });

  it("does not let a live viewport change override a manual collapse/expand choice", () => {
    const mql = mockMatchMedia(true); // starts at desktop width -> expanded by default

    render(<ProjectSidebar projectId="project-1" />);
    fireEvent.click(screen.getByTitle("Collapse"));
    expect(screen.getByTitle("Board")).toBeInTheDocument();

    act(() => {
      mql.setMatches(false); // shrink below desktop width
    });

    // Manual collapse should stick regardless of the viewport change.
    expect(screen.getByTitle("Board")).toBeInTheDocument();
    expect(screen.queryByText("Board")).not.toBeInTheDocument();
  });
});
