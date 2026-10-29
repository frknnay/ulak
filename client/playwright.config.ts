import { defineConfig, devices } from '@playwright/test'

// The end-to-end tests start their own signaling server and client on
// ports apart from the dev servers, so windows open in development don't
// join the test session.
const serverPort = 8090
const clientPort = 5190

export default defineConfig({
  testDir: 'e2e',
  // Every test shares the one session on the signaling server, so tests
  // run one at a time.
  workers: 1,
  use: { baseURL: `http://localhost:${clientPort}` },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Chromium hides local IPs in ICE candidates behind random .local
        // names, which headless Chromium can't always resolve, so peers
        // never connect. With no ICE servers, they need the real addresses.
        launchOptions: { args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] },
      },
    },
  ],
  webServer: [
    {
      command: `PORT=${serverPort} pnpm --filter @ulak/server start`,
      port: serverPort,
    },
    {
      command: `pnpm vite --port ${clientPort} --strictPort`,
      url: `http://localhost:${clientPort}`,
      env: { VITE_SIGNALING_URL: `ws://localhost:${serverPort}` },
    },
  ],
})
