import { Buffer } from 'buffer'

declare global {
  interface Window {
    global?: typeof globalThis
    process?: { env: Record<string, string | undefined> }
    Buffer?: typeof Buffer
  }
}

if (typeof window !== 'undefined') {
  if (!window.global) {
    window.global = window
  }

  if (!window.process) {
    window.process = { env: { NODE_ENV: import.meta.env.MODE } }
  }

  if (!window.Buffer) {
    window.Buffer = Buffer
  }
}
