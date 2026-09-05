export const BASE_URL = "http://localhost:8010"

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
export async function requestForm(path, { method = "POST", formData, token } = {}) {
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

// --- Forgot password (security question flow) ---

// The list of questions an artisan can choose from while registering.
// It comes from the backend so the two screens can never disagree.
export function getSecurityQuestions() {
  return request("/auth/security-questions")
}

// Step 1: give a phone number, get back that account's chosen question.
export function requestSecurityQuestion(phone) {
  return request("/auth/forgot-password", { method: "POST", body: { phone } })
}

// Step 2: answer the question and set a new password.
export function resetPassword({ phone, answer, new_password }) {
  return request("/auth/reset-password", {
    method: "POST",
    body: { phone, answer, new_password },
  })
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

// Which real AI provider (Gemini / OpenAI / none) is configured for the
// catalogue and the AI Business Manager, so the UI can be honest about it.
export function getTextCapabilities(token) {
  return request("/ai/text-capabilities", { token })
}

// Image enhancement is different from requestForm() above because the
// response is an image file (binary), not JSON - so we read it as a
// "blob" instead, and pull our custom header out to know whether real
// AI background removal ran, or Demo Mode.
export async function enhanceImage(
  file,
  { engine = "auto", removeBg = false, brightness = 1.15, contrast = 1.15, instruction = "" },
  token
) {
  const formData = new FormData()
  formData.append("image", file)
  formData.append("engine", engine)
  formData.append("remove_bg", removeBg)
  formData.append("brightness", brightness)
  formData.append("contrast", contrast)
  formData.append("instruction", instruction)

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

  // The backend tells us honestly which engine actually ran, so the
  // screen never claims "AI" when it quietly fell back to filters.
  const usedRealAi = res.headers.get("X-Background-Removed-Real-Ai") === "true"
  const engineUsed = res.headers.get("X-Enhance-Engine") || "basic"
  const note = res.headers.get("X-Enhance-Note") || ""
  const blob = await res.blob()
  return { blob, usedRealAi, engineUsed, note }
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

export function getMyStorefront(token) {
  return request("/business/storefront", { token })
}

export function updateStorefront(payload, token) {
  return request("/business/storefront", { method: "PUT", body: payload, token })
}

export function uploadLogo(file, token) {
  const formData = new FormData()
  formData.append("logo", file)
  return requestForm("/business/logo", { method: "POST", formData, token })
}

export function getPublicStore(slug) {
  return request(`/store/${slug}`)
}

export function storeQrUrl(slug) {
  return `${BASE_URL}/store/${slug}/qr`
}

export function storePublicUrl(slug) {
  return `${window.location.origin}/store/${slug}`
}

export function getReadiness(token) {
  return request("/dashboard/readiness", { token })
}

// The proactive AI tip on the dashboard - unprompted, based on the
// artisan's real current data (see backend /ai/business-insight).
export function getBusinessInsight(token) {
  return request("/ai/business-insight", { token })
}

export function getMarketOpportunities(token) {
  return request("/market/opportunities", { token })
}
