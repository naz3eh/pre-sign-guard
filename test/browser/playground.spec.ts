// Browser smoke test for the GitHub Pages playground: loads the real page,
// clicks every example, and asserts the verdict badge — plus a request
// listener that fails the test if ANY network request leaves the page.
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const EXAMPLES = JSON.parse(
  readFileSync(join(root, 'playground/examples.json'), 'utf8'),
) as { id: string; expect: { verdict: string; kind: string } }[];

const VERDICT_TEXT: Record<string, string> = {
  ALLOW_WITH_CONFIRMATION: 'ALLOW with confirmation',
  BLOCK: 'BLOCK',
  REFUSE: 'REFUSE',
};

function watchRequests(page: Page): string[] {
  const leaks: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost')) {
      leaks.push(url);
    }
  });
  return leaks;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/playground/');
});

test('page loads with inputs, examples and privacy note', async ({ page }) => {
  await expect(page).toHaveTitle(/pre-sign-guard/);
  await expect(page.locator('#in-preimage')).toBeVisible();
  await expect(page.locator('#in-hash')).toBeVisible();
  await expect(page.locator('#check-btn')).toBeVisible();
  await expect(page.getByText(/nothing you paste leaves/i)).toBeVisible();
  await expect(page.getByText(/never paste a private key or seed/i)).toBeVisible();
  await expect(page.locator('.example')).toHaveCount(EXAMPLES.length);
});

for (const ex of EXAMPLES) {
  test(`example ${ex.id} → ${ex.expect.verdict}`, async ({ page }) => {
    const leaks = watchRequests(page);
    await page.locator(`.example[data-example="${ex.id}"]`).click();
    const badge = page.locator('#output .verdict-badge');
    await expect(badge).toHaveText(VERDICT_TEXT[ex.expect.verdict]!);
    await expect(page.locator('#output .kind')).toContainText(ex.expect.kind);
    await expect(page.locator('#output .reason')).toBeVisible();
    // shareable URL: inputs encoded in the fragment
    await expect(page).toHaveURL(/#r=/);
    expect(leaks, 'no network request may leave the page').toEqual([]);
  });
}

test('pasted payload produces a verdict; bare hash refuses', async ({ page }) => {
  await page.locator('#in-hash').fill(
    '0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1',
  );
  await page.locator('#check-btn').click();
  await expect(page.locator('#output .verdict-badge')).toHaveText('REFUSE');
});

test('share link: loading a #r= URL restores inputs and verdict', async ({ page }) => {
  const req = { preimage: '0x0a1234' };
  await page.goto(`/playground/#r=${encodeURIComponent(JSON.stringify(req))}`);
  await expect(page.locator('#output .verdict-badge')).toHaveText('REFUSE');
  await expect(page.locator('#in-preimage')).toHaveValue('0x0a1234');
});

test('no outbound network at all during a full click-through', async ({ page }) => {
  const leaks = watchRequests(page);
  for (const ex of EXAMPLES) {
    await page.locator(`.example[data-example="${ex.id}"]`).click();
    await expect(page.locator('#output .verdict-badge')).toBeVisible();
  }
  expect(leaks).toEqual([]);
});
