const BASE_URL = "http://localhost:8000"

// A small wrapper around the browser's built-in "fetch" function.
// It automatically sends/receives JSON, attaches the login token when
// we have one, and throws a readable error message when the backend
// responds with a failure status code.
async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (networkError) {
    throw new Error("Could not reach the server. Is the backend running?")
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = data?.detail || "Something went wrong. Please try again."
    throw new Error(typeof message === "string" ? message : "Something went wrong. Please try again.")
  }

  return data
}

export function registerUser(payload) {
  return request("/auth/register", { method: "POST", body: payload })
}

export function loginUser(payload) {
  return request("/auth/login", { method: "POST", body: payload })
}

export function getMe(token) {
  return request("/users/me", { token })
}

export function updateMe(payload, token) {
  return request("/users/me", { method: "PUT", body: payload, token })
}
