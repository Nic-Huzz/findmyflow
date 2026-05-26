import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // base defaults to '/' — required for Vercel SPA deep links
  // Electron builds override via CLI: vite build --base ./
  server: {
    host: true, // Allow access from network (for mobile testing)
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.ngrok-free.dev'],
  },
})

