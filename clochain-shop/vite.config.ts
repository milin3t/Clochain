import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const resolveModule = (pkgPath: string) => path.resolve(__dirname, 'node_modules', pkgPath)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: resolveModule('buffer'),
      process: resolveModule('process/browser.js'),
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
})
