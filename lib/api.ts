const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function api(
  endpoint: string,
  method: string = "GET",
  body?: any
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
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Something went wrong");
  }

  return res.json();
}