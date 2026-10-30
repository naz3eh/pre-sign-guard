import { defineConfig } from '@playwright/test';

// Static-file smoke test: serves the repo root (playground/ is served as-is,
// exactly like GitHub Pages serves it from / (root)).
export default defineConfig({
  testDir: './test/browser',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:8474',
    headless: true,
  },
  webServer: {
    command: 'python3 -m http.server 8474 --bind 127.0.0.1',
    port: 8474,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
