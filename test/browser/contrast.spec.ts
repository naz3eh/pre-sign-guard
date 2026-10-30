// WCAG AA contrast check for the light-themed playground: computes the
// effective foreground/background colors of every text-bearing element the
// page shows — compositing translucent badge/pill surfaces over the page
// background — and asserts ≥ 4.5:1 (normal text) or ≥ 3:1 (large/bold ≥ 18pt).
/// <reference lib="dom" />
import { test, expect, type Page } from '@playwright/test';

const MIN_RATIO = 4.5;

// All contrast math runs in the page against computed styles.
const RESULTS = `
(() => {
  const parse = (c) => {
    // rgb()/rgba() and color(srgb r g b [/ a]) — Chrome emits both.
    let m = c.match(/rgba?\\(([^)]+)\\)/);
    if (m) {
      const p = m[1].split(',').map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    m = c.match(/color\\(srgb ([^)]+)\\)/);
    if (m) {
      const p = m[1].split('/').flatMap((s) => s.trim().split(/ +/)).map(Number);
      return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p.length > 3 ? p[3] : 1 };
    }
    // oklab()/oklch() — Tailwind 4 colors; convert via OKLab → LMS → sRGB.
    m = c.match(/ok(lab|lch)\\(([^)]+)\\)/);
    if (m) {
      const parts = m[2].split('/').flatMap((s) => s.trim().split(/ +/)).map(Number);
      let L, A, B;
      if (m[1] === 'lch') {
        const rad = (parts[2] * Math.PI) / 180;
        L = parts[0]; A = parts[1] * Math.cos(rad); B = parts[1] * Math.sin(rad);
      } else {
        L = parts[0]; A = parts[1]; B = parts[2];
      }
      const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
      const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
      const s_ = L - 0.0894841775 * A - 1.291485548 * B;
      const l = l_ ** 3, mm = m_ ** 3, s = s_ ** 3;
      const lin = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
      const r = lin(+4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s);
      const g = lin(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s);
      const bl = lin(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s);
      const cl = (v) => Math.min(1, Math.max(0, v)) * 255;
      return { r: cl(r), g: cl(g), b: cl(bl), a: parts.length > 3 ? parts[3] : 1 };
    }
    return null;
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
  });
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  const effectiveBg = (el) => {
    // composite the element's own bg + every ancestor's bg over the page bg
    let bg = parse(getComputedStyle(document.body).backgroundColor) || { r:255,g:255,b:255,a:1 };
    const chain = [];
    for (let n = el; n && n !== document.body.parentElement; n = n.parentElement) chain.unshift(n);
    for (const n of chain) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c) bg = over(c, bg);
    }
    return bg;
  };

  const out = [];
  const sel = [
    '#output .title', '#output .kind', '#output .reason', '#output dt', '#output dd',
    '#output .warnings li', '#output .digest', '#output .sources a',
    '.verdict-badge', '.verdict-badge span', '.risk-flag',
    '.ex-label', '.ex-blurb', '.ex-verdict',
    'label', 'header a', 'footer a', 'footer', 'p',
  ];
  for (const s of sel) {
    for (const el of document.querySelectorAll(s)) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || el.offsetParent === null) continue;
      const text = (el.textContent || '').trim();
      if (!text) continue;
      const fg = parse(cs.color);
      const bg = effectiveBg(el);
      out.push({
        sel: s,
        text: text.slice(0, 40),
        color: cs.color,
        bg: 'rgb(' + [bg.r, bg.g, bg.b].map(Math.round).join(',') + ')',
        ratio: +ratio(lum(fg), lum(bg)).toFixed(2),
      });
    }
  }
  return out;
})()`;

async function checkContrast(page: Page): Promise<void> {
  const results: { sel: string; text: string; ratio: number }[] = await page.evaluate(RESULTS);
  const failures = results.filter((r) => r.ratio < MIN_RATIO);
  expect(
    failures,
    `elements below WCAG AA ${MIN_RATIO}:1:\n` +
      failures.map((f) => `  ${f.sel} "${f.text}" → ${f.ratio}:1`).join('\n'),
  ).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/playground/');
});

test('page chrome (header, copy, footer, examples) hits AA', async ({ page }) => {
  await checkContrast(page);
});

test('Binance 14 BLOCK result hits AA', async ({ page }) => {
  await page.locator('.example[data-example="binance14-authorization"]').click();
  await expect(page.locator('#output .verdict-badge')).toHaveText('BLOCK');
  await checkContrast(page);
});

test('Permit HIGH RISK result hits AA', async ({ page }) => {
  await page.locator('.example[data-example="eip712-permit"]').click();
  await expect(page.locator('#output .verdict-badge')).toHaveText('ALLOW_WITH_CONFIRMATION');
  await expect(page.locator('#output .risk-flag')).toBeVisible();
  await checkContrast(page);
});

test('REFUSE verdict hits AA', async ({ page }) => {
  await page.locator('.example[data-example="bare-hash"]').click();
  await expect(page.locator('#output .verdict-badge')).toHaveText('REFUSE');
  await checkContrast(page);
});
