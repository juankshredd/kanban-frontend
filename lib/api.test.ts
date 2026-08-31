import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError } from "./api";

const originalLocation = window.location;

function setLocation(pathname: string) {
  // jsdom doesn't implement real navigation (setting window.location.href
  // throws "Not implemented"), so replace it with a plain settable object
  // we can both drive (pathname) and assert on (href) in tests.
  Object.defineProperty(window, "location", {
    value: { pathname, href: "" },
    writable: true,
    configurable: true,
  });
}

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  localStorage.clear();
  setLocation("/projects/some-id/board");
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("api", () => {
  it("returns the parsed JSON body and attaches the stored token as a bearer header (happy path)", async () => {
    localStorage.setItem("token", "abc123");
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, { id: "task-1" }));

    const result = await api("/tasks", "GET");

    expect(result).toEqual({ id: "task-1" });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer abc123");
  });

  it("throws ApiError with the status/body for a non-401 error and does not redirect", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(404, { message: "Not found" }));

    await expect(api("/tasks/missing", "GET")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Not found",
    });
    expect(window.location.href).toBe("");
  });

  // Negative/main behavior: a 401 (only ever returned by the backend's
  // authMiddleware for a missing/invalid/expired token) must clear the
  // stale token and redirect to /login, in addition to still throwing.
  it("clears the token and redirects to /login on a 401, while still throwing ApiError", async () => {
    localStorage.setItem("token", "stale-token");
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(401, { message: "Invalid token" }));

    await expect(api("/tasks", "GET")).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem("token")).toBeNull();
    expect(window.location.href).toBe("/login");
  });

  // Negative: don't re-trigger the redirect (or loop) if a 401 somehow
  // happens while already on the login page.
  it("does not redirect again on a 401 if already on /login", async () => {
    setLocation("/login");
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(401, { message: "Invalid token" }));

    await expect(api("/auth/me", "GET")).rejects.toBeInstanceOf(ApiError);

    expect(window.location.href).toBe("");
  });
});
