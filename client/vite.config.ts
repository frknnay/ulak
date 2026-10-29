/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vitest runs the unit tests in src. Playwright runs the ones in e2e.
  test: { include: ['src/**/*.test.ts'] },
})
