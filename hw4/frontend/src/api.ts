// Types and fetch helpers for the FastAPI backend (backend/main.py).

export type SizeStock = { size: string; quantity: number }

export type Product = {
  product_id: string
  name: string
  garment_type: string
  category: string
  description: string
  colors: string[]
  search_tags: string[]
  price: number
  image_url: string
  total_stock: number
  sizes_in_stock: string[]
}

export type ProductDetail = Product & { inventory: SizeStock[] }

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const fetchProducts = () => getJson<Product[]>('/api/products')

export const fetchProduct = (id: string) =>
  getJson<ProductDetail>(`/api/products/${encodeURIComponent(id)}`)

export type ChatTurn = { role: 'user' | 'assistant'; text: string }

export type ProductCard = {
  product_id: string
  name: string
  price: number
  image_url: string
  short_description: string
}

export type ChatReply = { reply: string; products: ProductCard[]; tools_used: string[] }

export type PageContext = { path: string; product_id: string | null }

export type SavedMessage = {
  id: number
  role: 'user' | 'assistant'
  text: string
  created_at: string
  products: ProductCard[]
}

const authHeader = (token: string | null): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {}

// Sends the new message, the page the shopper is on, and (for guests) earlier
// turns. Logged-in shoppers send their token; the server loads their saved history.
export const sendChat = (message: string, history: ChatTurn[], page: PageContext, token: string | null) =>
  getJson<ChatReply>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ message, history: token ? [] : history, page }),
  })

export const fetchChatHistory = (token: string) =>
  getJson<SavedMessage[]>('/api/chat/history', { headers: authHeader(token) })

export type WelcomeBack = { text: string; topic: string; products: ProductCard[] }

// Problem 9: "Welcome back, <name>! Last time you were looking at..."
export const fetchWelcome = (token: string) =>
  getJson<WelcomeBack>('/api/chat/welcome', { headers: authHeader(token) })

export const clearChatHistory = (token: string) =>
  getJson<{ deleted: number }>('/api/chat/history', { method: 'DELETE', headers: authHeader(token) })

export const formatPrice = (price: number) => `$${price.toFixed(2)}`

// --- Accounts (Problem 4) ---

export type User = {
  id: number
  first_name: string
  last_name: string
  name: string
  email: string
  password_expired: boolean // Problem 12: passwords must be refreshed yearly
  password_days_left: number
}

export type AuthResponse = { token: string; user: User }

export type SignupInput = {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
}

// Like getJson, but surfaces the backend's error message ("Passwords do not match.").
async function postAuth<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : 'Please check the form and try again.'
    throw new Error(detail)
  }
  return data as T
}

export const signup = (input: SignupInput) => postAuth<AuthResponse>('/api/auth/signup', input)

export const login = (email: string, password: string) =>
  postAuth<AuthResponse>('/api/auth/login', { email, password })

export type ChangePasswordInput = { current_password: string; new_password: string; confirm_password: string }

export async function changePassword(token: string, input: ChangePasswordInput): Promise<AuthResponse> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Could not update your password.')
  return data as AuthResponse
}

export const fetchMe = (token: string) =>
  getJson<User>('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })

// --- Bag (abandoned-bag nudges) ---

export type BagItem = {
  id: number
  product_id: string
  name: string
  size: string
  quantity: number
  price: number
  image_url: string
  in_stock: number
  available: boolean
}

export type BagView = { items: BagItem[]; count: number; subtotal: number; reminders_on: boolean }

async function bagCall(token: string, url: string, init: RequestInit = {}): Promise<BagView> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Could not update your bag.')
  return data as BagView
}

export const fetchBag = (token: string) => bagCall(token, '/api/bag')
export const addToBag = (token: string, product_id: string, size: string) =>
  bagCall(token, '/api/bag', { method: 'POST', body: JSON.stringify({ product_id, size }) })
export const removeFromBag = (token: string, id: number) => bagCall(token, `/api/bag/${id}`, { method: 'DELETE' })
export const setBagReminders = (token: string, on: boolean) =>
  bagCall(token, `/api/bag/reminders?on=${on}`, { method: 'POST' })
