import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Two real pages, no router. Vite serves and builds each HTML file as its own entry.
export default defineConfig({
  input: {
    landing: fileURLToPath(new URL('./index.html', import.meta.url)),
    portfolio: fileURLToPath(new URL('./portfolio.html', import.meta.url)),
  },
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // Hashed output lives apart from public/assets, which keeps its stable URLs.
    assetsDir: '_app',
  },
})
