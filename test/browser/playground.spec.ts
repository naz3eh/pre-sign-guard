// Browser smoke test for the GitHub Pages playground: loads the real page,
// clicks every example, and asserts the verdict badge — plus listeners that
// fail the test if ANY network request leaves the page or ANY console error
// fires (CSP violations, favicon 404s, uncaught exceptions).
/// <reference lib="dom" />
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const EXAMPLES = JSON.parse(
  readFileSync(join(root, 'playground/examples.json'), 'utf8'),
) as { id: string; expect: { verdict: string; kind: string } }[];

const consoleErrors: string[] = [];
const pageErrors: string[] = [];

function watch(page: Page): string[] {
  const leaks: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost')) {
      leaks.push(url);
    }
  });
  return leaks;
}

async function noHorizontalOverflow(page: Page): Promise<void> {
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(over, 'page must not scroll horizontally').toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  pageErrors.length = 0;
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto('/playground/');
});

test.afterEach(() => {
  expect(consoleErrors, 'zero console errors').toEqual([]);
  expect(pageErrors, 'zero page errors').toEqual([]);
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
    const leaks = watch(page);
    await page.locator(`.example[data-example="${ex.id}"]`).click();
    // verdict label is the exact enum string
    await expect(page.locator('#output .verdict-badge')).toHaveText(ex.expect.verdict);
    await expect(page.locator('#output .kind')).toContainText(ex.expect.kind);
    await expect(page.locator('#output .reason')).toBeVisible();
    // focus moved to the verdict badge and it scrolled into view
    await expect(page.locator('#output .verdict-badge')).toBeFocused();
    await expect(page.locator('#output')).toBeInViewport();
    await expect(page).toHaveURL(/#r=/);
    await noHorizontalOverflow(page);
    expect(leaks, 'no network request may leave the page').toEqual([]);
  });
}

test('unlimited Permit shows the HIGH RISK flag on the badge', async ({ page }) => {
  await page.locator('.example[data-example="eip712-permit"]').click();
  await expect(page.locator('#output .verdict-badge')).toHaveText('ALLOW_WITH_CONFIRMATION');
  await expect(page.locator('#output .risk-flag')).toContainText('HIGH RISK: unlimited approval');
});

test('pasted payload produces a verdict; bare hash refuses', async ({ page }) => {
  await page.locator('#in-hash').fill(
    '0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1',
  );
  await page.locator('#check-btn').click();
  await expect(page.locator('#output .verdict-badge')).toHaveText('REFUSE');
});

test('odd-length hex refuses as invalid input, not unknown-prefix', async ({ page }) => {
  await page.locator('#in-preimage').fill('0x05abc');
  await page.locator('#check-btn').click();
  await expect(page.locator('#output .verdict-badge')).toHaveText('REFUSE');
  await expect(page.locator('#output .kind')).toContainText('invalid-input');
  await expect(page.locator('#output .reason')).toContainText('odd-length hex');
});

test('share link: loading a #r= URL restores inputs and verdict', async ({ page }) => {
  const req = { preimage: '0x0a1234' };
  await page.goto(`/playground/#r=${encodeURIComponent(JSON.stringify(req))}`);
  await expect(page.locator('#output .verdict-badge')).toHaveText('REFUSE');
  await expect(page.locator('#in-preimage')).toHaveValue('0x0a1234');
});

test('every example renders without overflow at 125% zoom', async ({ page }) => {
  await page.evaluate(() => ((document.body.style as CSSStyleDeclaration).zoom = '1.25'));
  for (const ex of EXAMPLES) {
    await page.locator(`.example[data-example="${ex.id}"]`).click();
    await expect(page.locator('#output .verdict-badge')).toHaveText(ex.expect.verdict);
    await noHorizontalOverflow(page);
  }
});

test('every example renders without overflow at 200% zoom', async ({ page }) => {
  await page.evaluate(() => ((document.body.style as CSSStyleDeclaration).zoom = '2'));
  for (const ex of EXAMPLES) {
    await page.locator(`.example[data-example="${ex.id}"]`).click();
    await expect(page.locator('#output .verdict-badge')).toHaveText(ex.expect.verdict);
    await noHorizontalOverflow(page);
  }
});

test('mobile viewport 390px: every example fits', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const ex of EXAMPLES) {
    await page.locator(`.example[data-example="${ex.id}"]`).click();
    await expect(page.locator('#output .verdict-badge')).toHaveText(ex.expect.verdict);
    await noHorizontalOverflow(page);
  }
});

test('no outbound network at all during a full click-through', async ({ page }) => {
  const leaks = watch(page);
  for (const ex of EXAMPLES) {
    await page.locator(`.example[data-example="${ex.id}"]`).click();
    await expect(page.locator('#output .verdict-badge')).toBeVisible();
  }
  expect(leaks).toEqual([]);
});
