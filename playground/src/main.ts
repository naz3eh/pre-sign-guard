// playground entry — wires the real guard library (src/) to the page.
// Bundled by esbuild into playground/bundle.js (npm run build:playground);
// the browser and the CLI run the same code, so verdicts can never disagree.
import { check, type CheckResult, type SignRequest } from '../../src/index.js';
import EXAMPLES from '../examples.json' with { type: 'json' };

type Example = {
  id: string;
  label: string;
  blurb: string;
  request: SignRequest;
  expect: { verdict: string; kind: string };
  sources?: { label: string; href: string }[];
};

function esc(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function verdictClass(v: string): string {
  return v === 'BLOCK' ? 'v-block' : v === 'REFUSE' ? 'v-refuse' : 'v-ok';
}

function verdictLabel(v: string): string {
  return v === 'ALLOW_WITH_CONFIRMATION' ? 'ALLOW with confirmation' : v;
}

// Shareable URL: inputs live in the fragment, never sent to a server.
function requestToHash(req: SignRequest): string {
  return `#r=${encodeURIComponent(JSON.stringify(req))}`;
}

function hashToRequest(hash: string): SignRequest | null {
  const m = hash.match(/^#r=(.*)$/s);
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1])) as SignRequest;
  } catch {
    return null;
  }
}

function wantsTypedData(req: SignRequest): boolean {
  return !!req.typedData || (req.preimage ?? '').toLowerCase().startsWith('0x1901');
}

function initDom(): void {
  const $ = <T extends HTMLElement>(sel: string): T => {
    const el = document.querySelector<T>(sel);
    if (!el) throw new Error(`missing element ${sel}`);
    return el;
  };

  const hashInput = $<HTMLTextAreaElement>('#in-hash');
  const preimageInput = $<HTMLTextAreaElement>('#in-preimage');
  const typedInput = $<HTMLTextAreaElement>('#in-typeddata');
  const typedWrap = $<HTMLDetailsElement>('#typeddata-wrap');
  const out = $('#output');
  const examplesEl = $('#examples');

  function clean(v: string): string | undefined {
    const t = v.trim();
    return t ? t : undefined;
  }

  function readRequest(): { req?: SignRequest; error?: string } {
    let typedData: SignRequest['typedData'];
    const td = clean(typedInput.value);
    if (td) {
      try {
        typedData = JSON.parse(td);
      } catch (e) {
        return { error: `typed data is not valid JSON: ${(e as Error).message}` };
      }
    }
    return {
      req: {
        ...(clean(hashInput.value) ? { hash: hashInput.value.trim() as `0x${string}` } : {}),
        ...(clean(preimageInput.value)
          ? { preimage: preimageInput.value.trim() as `0x${string}` }
          : {}),
        ...(typedData ? { typedData } : {}),
      },
    };
  }

  function render(res: CheckResult, example?: Example): void {
    const fields = res.fields
      .map((f) => `<div class="row"><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`)
      .join('');
    const warnings = res.warnings.map((w) => `<li>⚠ ${esc(w)}</li>`).join('');
    const sources = (example?.sources ?? [])
      .map(
        (s) =>
          `<a href="${esc(s.href)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`,
      )
      .join(' · ');

    out.innerHTML = `
      <div class="verdict-badge ${verdictClass(res.verdict)}" role="status" aria-live="polite">
        ${verdictLabel(res.verdict)}
      </div>
      <div class="kind">detected type: <code>${esc(res.kind)}</code>${
        example ? ` · expected: ${esc(example.expect.verdict)} (${esc(example.expect.kind)})` : ''
      }</div>
      <p class="title">${esc(res.title)}</p>
      ${warnings ? `<ul class="warnings">${warnings}</ul>` : ''}
      ${fields ? `<dl class="fields">${fields}</dl>` : ''}
      ${res.hash ? `<div class="digest"><span>digest</span><code>${esc(res.hash)}</code></div>` : ''}
      <div class="reason"><span>why</span><p>${esc(res.reason)}</p></div>
      ${sources ? `<div class="sources">${sources}</div>` : ''}
    `;
    out.hidden = false;
  }

  function showMessage(cls: string, label: string, msg: string): void {
    out.innerHTML =
      `<div class="verdict-badge ${cls}" role="alert">${esc(label)}</div>` +
      `<div class="reason"><p>${esc(msg)}</p></div>`;
    out.hidden = false;
  }

  function runCheck(example?: Example): void {
    const { req, error } = readRequest();
    if (error) return showMessage('v-refuse', 'input error', error);
    if (!req?.hash && !req?.preimage && !req?.typedData) {
      return showMessage(
        'v-refuse',
        'nothing to check',
        'Paste a digest, a payload, or typed data — or click an example.',
      );
    }
    let res: CheckResult;
    try {
      res = check(req);
    } catch (e) {
      return showMessage('v-refuse', 'error', (e as Error).message);
    }
    render(res, example);
    history.replaceState(null, '', requestToHash(req));
  }

  function fillInputs(req: SignRequest): void {
    hashInput.value = req.hash ?? '';
    preimageInput.value = req.preimage ?? '';
    typedInput.value = req.typedData ? JSON.stringify(req.typedData, null, 2) : '';
    typedWrap.open = wantsTypedData(req);
  }

  function loadExample(ex: Example): void {
    fillInputs(ex.request);
    runCheck(ex);
  }

  for (const ex of EXAMPLES as Example[]) {
    const card = document.createElement('button');
    card.className = 'example';
    card.type = 'button';
    card.dataset.example = ex.id;
    card.innerHTML =
      `<span class="ex-verdict ${verdictClass(ex.expect.verdict)}">${verdictLabel(ex.expect.verdict)}</span>` +
      `<span class="ex-label">${esc(ex.label)}</span>` +
      `<span class="ex-blurb">${esc(ex.blurb)}</span>`;
    card.addEventListener('click', () => loadExample(ex));
    examplesEl.appendChild(card);
  }

  $('#check-btn').addEventListener('click', () => runCheck());
  $('#copy-link').addEventListener('click', async () => {
    const btn = $('#copy-link');
    try {
      await navigator.clipboard.writeText(location.href);
      btn.textContent = 'link copied';
    } catch {
      btn.textContent = location.href;
    }
    setTimeout(() => (btn.textContent = 'copy link'), 1500);
  });
  window.addEventListener('hashchange', () => {
    const req = hashToRequest(location.hash);
    if (req) {
      fillInputs(req);
      runCheck();
    }
  });

  const initial = hashToRequest(location.hash);
  if (initial) {
    fillInputs(initial);
    runCheck();
  }
}

if (typeof document !== 'undefined') {
  initDom();
}

export { check, EXAMPLES, requestToHash, hashToRequest };
export type { SignRequest, CheckResult };
