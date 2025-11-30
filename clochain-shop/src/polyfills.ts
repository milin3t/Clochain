import { Buffer } from 'buffer'
import process from 'process'

declare global {
  interface Window {
    global?: typeof globalThis
    process?: typeof process
    Buffer?: typeof Buffer
  }
}

if (typeof window !== 'undefined') {
  if (!window.global) {
    window.global = window
  }

  if (!window.process) {
    window.process = process
  }

  window.process.env ??= {}
  window.process.env.NODE_ENV ??= import.meta.env.MODE

  if (!window.Buffer) {
    window.Buffer = Buffer
  }
}
