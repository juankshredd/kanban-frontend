const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Carries the HTTP status and parsed response body so callers can branch on
// specific error shapes (e.g. 409 { project_count } on company delete, 404
// on company not-found/no-access) instead of only having the message text.
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function api(
  endpoint: string,
  method: string = "GET",
  body?: unknown
) {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

  const res = await fetch(`${BASE_URL}/api${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));

    // 401 is only ever returned by the backend's authMiddleware (missing,
    // invalid, or expired JWT on a protected route) — login/register return
    // 400 for bad credentials, never 401 — so any 401 here means the stored
    // token is no longer valid and the user needs to sign in again.
    if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    throw new ApiError(error.message || "Something went wrong", res.status, error);
  }

  return res.json();
}