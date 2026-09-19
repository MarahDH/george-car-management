import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider, keepPreviousData } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider } from './components/Toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Treat data as fresh for 30s so revisiting a page doesn't refetch and flash.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // Keep the previous results on screen while a new query (search term, filter,
      // page, id) is loading — the list smoothly swaps instead of collapsing to skeletons.
      placeholderData: keepPreviousData,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)

// The app no longer uses a service worker (offline caching caused stale builds
// to stick). Proactively unregister any SW a previous build installed and clear
// its caches, so nobody is left on an old cached app shell. The kill-switch
// public/sw.js also does this for clients that never load this bundle.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {})
  if (typeof caches !== 'undefined') {
    caches
      .keys()
      .then((keys) => keys.forEach((k) => caches.delete(k)))
      .catch(() => {})
  }
}
