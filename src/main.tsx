import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 1. Import TanStack Query components
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// 2. Initialize the Query Client with global defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2. STOPS THE TRAFFIC JAM: 
      // Prevents those 4 background queries from firing all at once when you return to the tab.
      refetchOnWindowFocus: false, 
      
      // 3. FAILS FAST: 
      // If a network request hangs because the computer went to sleep, it drops it instead of freezing.
      retry: 1, 
      
      // 4. PREVENTS STALE CACHE CRASHES
      staleTime: 1000 * 60 * 5, 
    },
  },
});


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 3. Wrap the App and inject the client */}
    <QueryClientProvider client={queryClient}>
      <App />
      
      {/* 4. Add the DevTools (Only visible in development mode) */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  </React.StrictMode>,
)