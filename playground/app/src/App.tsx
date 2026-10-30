import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ShieldCheck, Copy, ExternalLink } from 'lucide-react';
import { check, type CheckResult, type SignRequest } from '../../../src/index';
import EXAMPLES from '../../examples.json';
import { Button } from '@/components/motion/button';
import { Input } from '@/components/motion/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleIndicator,
  CollapsibleTrigger,
} from '@/components/motion/collapsible';
import { AnimatedBadge, type AnimatedBadgeStatus } from '@/components/motion/animated-badge';
import {
  AnimatedToastStack,
  useAnimatedToastStack,
} from '@/components/motion/animated-toast-stack';

type Example = (typeof EXAMPLES)[number];

// Shareable URL: inputs live in the fragment, never sent to a server.
function requestToHash(req: SignRequest): string {
  return `#r=${encodeURIComponent(JSON.stringify(req))}`;
}
function hashToRequest(hash: string): SignRequest | null {
  const m = hash.match(/^#r=(.*)$/s);
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1] ?? '')) as SignRequest;
  } catch {
    return null;
  }
}

const VERDICT_STATUS: Record<string, AnimatedBadgeStatus> = {
  ALLOW_WITH_CONFIRMATION: 'success',
  BLOCK: 'danger',
  REFUSE: 'warning',
};
const VERDICT_TEXT: Record<string, string> = {
  ALLOW_WITH_CONFIRMATION: 'text-ok',
  BLOCK: 'text-destructive',
  REFUSE: 'text-refuse',
};

export function App() {
  const [hash, setHash] = useState('');
  const [preimage, setPreimage] = useState('');
  const [typedDataRaw, setTypedDataRaw] = useState('');
  const [typedOpen, setTypedOpen] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [example, setExample] = useState<Example | null>(null);
  const [error, setError] = useState<{ label: string; msg: string } | null>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const outputRef = useRef<HTMLElement>(null);
  const toast = useAnimatedToastStack();
  const reduce = useReducedMotion();

  const focusVerdict = useCallback(() => {
    badgeRef.current?.focus({ preventScroll: true });
    outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const readRequest = useCallback((): { req?: SignRequest; error?: { label: string; msg: string } } => {
    let typedData: SignRequest['typedData'];
    const td = typedDataRaw.trim();
    if (td) {
      try {
        typedData = JSON.parse(td);
      } catch (e) {
        return { error: { label: 'input error', msg: `typed data is not valid JSON: ${(e as Error).message}` } };
      }
    }
    const req: SignRequest = {
      ...(hash.trim() ? { hash: hash.trim() as `0x${string}` } : {}),
      ...(preimage.trim() ? { preimage: preimage.trim() as `0x${string}` } : {}),
      ...(typedData ? { typedData } : {}),
    };
    return { req };
  }, [hash, preimage, typedDataRaw]);

  const runCheck = useCallback(
    (ex?: Example) => {
      const { req, error: err } = readRequest();
      if (err) {
        setResult(null);
        setExample(null);
        setError(err);
        setTimeout(focusVerdict, 0);
        return;
      }
      if (!req?.hash && !req?.preimage && !req?.typedData) {
        setResult(null);
        setExample(null);
        setError({ label: 'input error', msg: 'paste a digest, a payload, or typed data — or click an example' });
        setTimeout(focusVerdict, 0);
        return;
      }
      const res = check(req);
      setError(null);
      setExample(ex ?? null);
      setResult(res);
      history.replaceState(null, '', requestToHash(req));
      setTimeout(focusVerdict, 0);
    },
    [readRequest, focusVerdict],
  );

  const loadExample = useCallback(
    (ex: Example) => {
      const r = ex.request as { hash?: string; preimage?: string; typedData?: unknown };
      setHash(r.hash ?? '');
      setPreimage(r.preimage ?? '');
      setTypedDataRaw(r.typedData ? JSON.stringify(r.typedData, null, 2) : '');
      setTypedOpen(!!r.typedData);
      setError(null);
      const res = check(ex.request as SignRequest);
      setExample(ex);
      setResult(res);
      history.replaceState(null, '', requestToHash(ex.request as SignRequest));
      setTimeout(focusVerdict, 0);
    },
    [focusVerdict],
  );

  const clearAll = useCallback(() => {
    setHash('');
    setPreimage('');
    setTypedDataRaw('');
    setResult(null);
    setExample(null);
    setError(null);
    history.replaceState(null, '', location.pathname + location.search);
  }, []);

  // Restore a shared #r= link on load and on later hash changes.
  useEffect(() => {
    const restore = () => {
      const req = hashToRequest(location.hash);
      if (!req) return;
      setHash(req.hash ?? '');
      setPreimage(req.preimage ?? '');
      if (req.typedData) {
        setTypedDataRaw(JSON.stringify(req.typedData, null, 2));
        setTypedOpen(true);
      }
      setError(null);
      setExample(null);
      setResult(check(req));
    };
    restore();
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyDigest = useCallback(async () => {
    const digest = result?.hash;
    if (!digest) return;
    try {
      await navigator.clipboard.writeText(digest);
      toast.showToast({ status: 'success', title: 'Digest copied' });
    } catch {
      // clipboard needs a secure context — fall back to a prompt-free path
      toast.showToast({ status: 'error', title: 'Copy failed', description: 'Select and copy the digest manually.' });
    }
  }, [result, toast]);

  const showPanel = result !== null || error !== null;

  return (
    <div className="mx-auto max-w-[980px] px-5 pt-7 pb-20">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
        <h1 className="m-0 text-lg font-extrabold tracking-tight">
          pre-sign-guard<span className="text-primary">/</span>playground
        </h1>
        <nav className="text-[13px]">
          <a className="ml-4 text-muted-foreground hover:text-foreground" href="../">site</a>
          <a className="ml-4 text-muted-foreground hover:text-foreground" href="https://github.com/naz3eh/pre-sign-guard">github</a>
          <a className="ml-4 text-muted-foreground hover:text-foreground" href="../SKILL.md">raw SKILL.md</a>
          <a className="ml-4 text-muted-foreground hover:text-foreground" href="../skills/pre-sign-guard/SKILL.md">raw skill file</a>
        </nav>
      </header>

      <p className="mt-4 mb-2 text-[13.5px] text-muted-foreground">
        <b className="text-foreground">A guard for agents that sign what they&rsquo;re handed.</b>{' '}
        Paste what a key was asked to sign — a digest, a payload, or EIP-712 typed data —
        and see exactly what the signature would grant before it exists.
      </p>

      <div className="mt-3 mb-6 rounded-lg border border-border border-l-[3px] border-l-ok bg-card px-4 py-3 text-[13px] text-muted-foreground">
        Runs <b className="text-foreground">entirely in your browser</b>: no backend, no wallet
        connection, no RPC calls, no analytics. Nothing you paste leaves this page — the checker is
        the same library the CLI ships, bundled into one file.{' '}
        <b className="text-foreground">Never paste a private key or seed phrase</b> — the guard only
        needs public payload bytes.
      </div>

      <form
        id="form"
        onSubmit={(e) => {
          e.preventDefault();
          runCheck();
        }}
      >
        <div className="grid gap-4">
          <Input
            id="in-hash"
            label="digest being signed (optional — 0x + 64 hex)"
            placeholder="0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1"
            value={hash}
            onChange={setHash}
            spellCheck={false}
            autoComplete="off"
          />
          <div>
            <label htmlFor="in-preimage" className="mb-1.5 block text-[13px] text-muted-foreground">
              payload / preimage <span className="text-muted-foreground/60">(optional — hex, first byte classifies it)</span>
            </label>
            <textarea
              id="in-preimage"
              rows={3}
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 font-mono text-[13px]/relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-2 focus:outline-ring resize-y"
              placeholder="0x05db019463e842b054bd624a465454d533c33f573e9c6fae8401209df9"
              value={preimage}
              onChange={(e) => setPreimage(e.target.value)}
            />
          </div>

          <Collapsible open={typedOpen} onOpenChange={setTypedOpen} id="typeddata-wrap">
            <CollapsibleTrigger className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground">
              EIP-712 typed data{' '}
              <span className="text-muted-foreground/60">(optional JSON — shown automatically for 0x19 0x01 payloads)</span>
              <CollapsibleIndicator />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <label htmlFor="in-typeddata" className="mb-1.5 mt-2 block text-[13px] text-muted-foreground">
                typed data JSON
              </label>
              <textarea
                id="in-typeddata"
                rows={5}
                spellCheck={false}
                autoComplete="off"
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 font-mono text-[13px]/relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-2 focus:outline-ring resize-y"
                placeholder='{"domain": …, "types": …, "primaryType": …, "message": …}'
                value={typedDataRaw}
                onChange={(e) => setTypedDataRaw(e.target.value)}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button id="check-btn" type="submit" variant="primary" size="md">
            check payload
          </Button>
          <Button id="clear-btn" type="button" variant="ghost" size="md" onClick={clearAll}>
            clear
          </Button>
        </div>
      </form>

      {/* Result panel */}
      <AnimatePresence mode="wait">
        {showPanel && (
          <motion.section
            id="output"
            ref={outputRef}
            key={result ? `${result.verdict}-${result.kind}-${result.hash ?? ''}` : 'error'}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-6 rounded-xl border border-border bg-card p-5"
          >
            {error && (
              <div>
                <span
                  ref={badgeRef}
                  tabIndex={-1}
                  className="verdict-badge inline-block focus:outline-2 focus:outline-offset-4 focus:outline-ring"
                >
                  <AnimatedBadge status="danger" size="md">
                    {error.label}
                  </AnimatedBadge>
                </span>
                <div className="reason mt-3">
                  <p className="wrap-anywhere m-0 text-[14px] text-muted-foreground">{error.msg}</p>
                </div>
              </div>
            )}

            {result && (
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    ref={badgeRef}
                    tabIndex={-1}
                    role="status"
                    aria-live="polite"
                    className="verdict-badge inline-block focus:outline-2 focus:outline-offset-4 focus:outline-ring"
                  >
                    <AnimatedBadge status={VERDICT_STATUS[result.verdict]} size="md">
                      {result.verdict}
                    </AnimatedBadge>
                  </span>
                  {result.warnings.some((w) => w.startsWith('HIGH RISK')) && (
                    <span className="risk-flag inline-block rounded-md border border-risk bg-risk/10 px-2.5 py-0.5 text-[12px] font-extrabold tracking-wide text-risk">
                      {result.warnings.find((w) => w.startsWith('HIGH RISK'))}
                    </span>
                  )}
                </div>
                <div className="kind wrap-anywhere mt-3 text-[13px] text-muted-foreground">
                  detected type: <code className="wrap-anywhere">{result.kind}</code>
                  {example && (
                    <>
                      {' '}
                      · expected: {example.expect.verdict} ({example.expect.kind})
                    </>
                  )}
                </div>
                <p className="title wrap-anywhere my-3 text-[15.5px] font-semibold">{result.title}</p>
                {result.warnings.length > 0 && (
                  <ul className="warnings m-0 list-none p-0">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="wrap-anywhere mt-1 text-[13px] text-risk">
                        ⚠ {w}
                      </li>
                    ))}
                  </ul>
                )}
                {result.fields.length > 0 && (
                  <dl className="fields mt-3">
                    {result.fields.map((f, i) => (
                      <div
                        key={i}
                        className="row grid grid-cols-1 gap-1 border-t border-border/60 py-1.5 sm:grid-cols-[170px_1fr] sm:gap-3"
                      >
                        <dt className="text-[13px] text-muted-foreground">{f.label}</dt>
                        <dd className="wrap-anywhere m-0 text-[13.5px]">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {result.hash && (
                  <div className="digest mt-3 flex items-center gap-2 text-[13px]">
                    <span className="text-muted-foreground">digest</span>
                    <code className="wrap-anywhere">{result.hash}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="copy digest"
                      onClick={copyDigest}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                )}
                <div className="reason mt-3 text-[13.5px]">
                  <span className="text-muted-foreground">why</span>
                  <p className="wrap-anywhere m-0 mt-1">{result.reason}</p>
                </div>
                {example?.sources && example.sources.length > 0 && (
                  <div className="sources mt-3 text-[13px]">
                    {example.sources.map((s, i) => (
                      <span key={i}>
                        {i > 0 && ' · '}
                        <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-primary">
                          {s.label} <ExternalLink className="inline size-3 align-[-1px]" />
                        </a>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Example picker */}
      <h2 className="mb-2.5 mt-8 text-[15px] font-extrabold">
        Examples — from the repo&rsquo;s own fixtures, nothing invented
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" id="examples">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            type="button"
            data-example={ex.id}
            onClick={() => loadExample(ex)}
            className="example rounded-lg border border-border bg-card p-3.5 text-left font-mono text-[12.5px]/normal text-foreground transition-colors hover:border-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span
              className={`ex-verdict mb-1.5 inline-block rounded-[5px] border border-current px-[7px] py-px text-[11px] font-extrabold tracking-wide ${VERDICT_TEXT[ex.expect.verdict]}`}
            >
              {ex.expect.verdict}
            </span>
            <span className="ex-label mb-1 block text-[13px] font-semibold">{ex.label}</span>
            <span className="ex-blurb wrap-anywhere block text-[11.5px] text-muted-foreground">
              {ex.blurb}
            </span>
          </button>
        ))}
      </div>

      <footer className="mt-11 border-t border-border pt-4 text-[12.5px] text-muted-foreground">
        The Binance 14 bytes are real chain data — carrier tx{' '}
        <a className="text-primary" href="https://etherscan.io/tx/0xad99264d5532ae0dd04b2004eebda05f25657e70dacb764f7ac8d4ccd051298b">
          0xad99264d…
        </a>
        , block 26300753, decoded byte-by-byte by{' '}
        <a className="text-primary" href="https://808bits.com/articles/binance-hot-wallet-eip-7702-delegations/">
          808bits
        </a>
        . This project does not claim it would have stopped that incident — the signer was
        compromised upstream. Same guard code as the CLI — they cannot disagree. MIT licensed.
        <br />
        Related:{' '}
        <a className="text-primary" href="https://github.com/ef0100dev/ef0100">
          ef0100 (signer-side guard)
        </a>{' '}
        ·{' '}
        <a className="text-primary" href="https://808bits.com/tools/raw-transaction-decoder/">
          808bits raw tx decoder
        </a>{' '}
        ·{' '}
        <a className="text-primary" href="https://ecdsa.com/tools/eip7702-decoder">
          ecdsa.com 7702 decoder
        </a>
        <br />
        UI built with <a className="text-primary" href="https://beui.dev">beUI</a> (MIT) —{' '}
        <a className="text-primary" href="https://github.com/starc007/ui-components">
          starc007/ui-components
        </a>
      </footer>

      <AnimatedToastStack toasts={toast.toasts} onDismiss={toast.dismissToast} position="bottom-right" />
      <ShieldCheck className="hidden" aria-hidden />
    </div>
  );
}
