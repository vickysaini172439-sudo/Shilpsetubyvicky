export const BASE_URL = "http://localhost:8000"

// A small wrapper around the browser's built-in "fetch" function for
// JSON requests. It attaches the login token when we have one, and
// throws a readable error message when the backend responds with a
// failure status code.
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

// Same idea, but for requests that carry a file (FormData) instead of
// JSON - used for creating/updating products with a photo. We do NOT
// set a Content-Type header ourselves: the browser sets the correct
// "multipart/form-data; boundary=..." header automatically for FormData.
async function requestForm(path, { method = "POST", formData, token } = {}) {
  const headers = {}
  if (token) headers["Authorization"] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: formData })
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

// Turns a relative image path from the backend (e.g. "/uploads/products/x.jpg")
// into a full URL an <img> tag can load.
export function imageUrl(path) {
  if (!path) return null
  return `${BASE_URL}${path}`
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

export function listProducts(token, status) {
  const query = status ? `?status=${status}` : ""
  return request(`/products${query}`, { token })
}

export function getProduct(id, token) {
  return request(`/products/${id}`, { token })
}

export function createProduct(formData, token) {
  return requestForm("/products", { method: "POST", formData, token })
}

export function updateProduct(id, formData, token) {
  return requestForm(`/products/${id}`, { method: "PUT", formData, token })
}

export function deleteProduct(id, token) {
  return request(`/products/${id}`, { method: "DELETE", token })
}

export function getImageCapabilities(token) {
  return request("/image/capabilities", { token })
}

// Image enhancement is different from requestForm() above because the
// response is an image file (binary), not JSON - so we read it as a
// "blob" instead, and pull our custom header out to know whether real
// AI background removal ran, or Demo Mode.
export async function enhanceImage(file, { removeBg, brightness, contrast }, token) {
  const formData = new FormData()
  formData.append("image", file)
  formData.append("remove_bg", removeBg)
  formData.append("brightness", brightness)
  formData.append("contrast", contrast)

  const headers = {}
  if (token) headers["Authorization"] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}/image/enhance`, { method: "POST", headers, body: formData })
  } catch (networkError) {
    throw new Error("Could not reach the server. Is the backend running?")
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.detail || "Could not enhance image. Please try again.")
  }

  const usedRealAi = res.headers.get("X-Background-Removed-Real-Ai") === "true"
  const blob = await res.blob()
  return { blob, usedRealAi }
}

export function generateCatalogue(payload, token) {
  return request("/ai/catalog", { method: "POST", body: payload, token })
}

export function getPricingSuggestion(payload, token) {
  return request("/ai/pricing", { method: "POST", body: payload, token })
}

export function sendBusinessMessage(payload, token) {
  return request("/ai/business-advice", { method: "POST", body: payload, token })
}

export function getChatHistory(token, productId) {
  const query = productId ? `?product_id=${productId}` : ""
  return request(`/ai/business-advice/history${query}`, { token })
}
