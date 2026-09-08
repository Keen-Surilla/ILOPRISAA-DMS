import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
//import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, 
      retry: 1, 
      staleTime: 1000 * 60 * 5, 
    },
  },
});


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 3. Wrap the App and inject the client */}
    <QueryClientProvider client={queryClient}>
      <App />
      
      {/* 4. Add the DevTools (Only visible in development mode) 
      <ReactQueryDevtools initialIsOpen={false} position="bottom" /> */}
    </QueryClientProvider>
  </React.StrictMode>,
)