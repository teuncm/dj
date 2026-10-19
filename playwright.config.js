import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  workers: 1,
  globalSetup: './tests/setup.js',
  use: {
    baseURL: 'http://127.0.0.1:4173/dj/',
    screenshot: 'only-on-failure',
    launchOptions: process.platform === 'win32' ? { channel: 'msedge' } : {},
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
})
