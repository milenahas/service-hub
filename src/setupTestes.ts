import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

if (!globalThis.crypto?.randomUUID) {
  vi.stubGlobal('crypto', {
    randomUUID: () =>
      `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14)}`,
  })
}

afterEach(() => {
  cleanup()
})
