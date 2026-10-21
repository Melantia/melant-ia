import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // index.html y el árbol de la app viven en frontend/.
  root: 'frontend',
  plugins: [react(), tailwindcss()],
})
