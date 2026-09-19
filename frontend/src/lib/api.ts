import axios from 'axios'

const TOKEN_KEY = 'warsha_token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' },
})

export function getToken(): string | null {
  // A "remember me" token lives in localStorage; a session token in sessionStorage
  // (cleared when the browser/tab closes) — important on shared workshop PCs.
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null, remember = false): void {
  try {
    // Always clear both first so a token never lingers in the other store.
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    if (token) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  } catch {
    // storage unavailable (private mode / blocked) — nothing to persist
  }
}

// Attach the bearer token to every request.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, drop the token and bounce to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null)
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)
