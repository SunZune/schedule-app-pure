import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 项目站点的子路径，见 https://sunzune.github.io/schedule-app-pure/
const base = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
})
