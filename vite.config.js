import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Relative paths — works for both Vercel and Electron file serving
  server: {
    host: true, // Allow access from network (for mobile testing)
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.ngrok-free.dev'],
  },
})

