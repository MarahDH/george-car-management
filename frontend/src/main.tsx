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

// Register the PWA service worker only in production builds (avoids interfering
// with Vite's dev HMR).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
