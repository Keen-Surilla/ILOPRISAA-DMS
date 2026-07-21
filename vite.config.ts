import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseTarget = (env.VITE_SUPABASE_URL ?? '').trim()

  return {
    plugins: [react(),  tailwindcss(),],
    server: {
      // Dev-only: proxy Supabase so the browser talks to same-origin (avoids CORS / network blocks).
      proxy: supabaseTarget
        ? {
            '/supabase-api': {
              target: supabaseTarget,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/supabase-api/, ''),
            },
          }
        : undefined,
    },
  }
})
