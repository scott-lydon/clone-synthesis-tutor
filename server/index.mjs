/**
 * Trade Mogging — Render Node Web Service entry point.
 *
 * Two jobs:
 *   1. Serve the Vite-built SPA from /dist (with long-cache headers on /assets/*).
 *   2. Expose POST /api/validate, which silently scores the kid's typed explanation of why
 *      they failed a trade. Returns ONLY a {score: 1-5} integer. The kid never sees the
 *      LLM's prose — the frontend maps the score to one of 5 pre-written scripted lines.
 *
 * If ANTHROPIC_API_KEY is missing, the endpoint returns 500 and the frontend transparently
 * falls back to keyword-based local scoring (see src/components/LessonPanel.tsx). The game
 * stays playable; the lesson calibration is coarser.
 *
 * Env vars expected on Render:
 *   ANTHROPIC_API_KEY — required for live LLM rubric scoring (set in dashboard, sync: false)
 *   PORT              — Render injects this automatically
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8kb' }));

/* ──────────────────────────  Rate limiting  ────────────────────────── */
/**
 * Trivial in-memory counter keyed on remote IP. 60 validations / minute / IP.
 * Adequate for any single classroom. Real production would use Redis so it survives
 * Render's blue/green deploy swap. Acceptable here because failure mode is "kid sees
 * the keyword-fallback message instead of the LLM-scored one" — no data loss.
 */
const ipBucket = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

const isRateLimited = (ip) => {
  const now = Date.now();
  const cur = ipBucket.get(ip);
  if (!cur || cur.resetAt < now) {
    ipBucket.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  cur.count += 1;
  return cur.count > RATE_LIMIT_MAX;
};

/* ──────────────────────────  Prompt + parser  ────────────────────────── */

const SYSTEM_PROMPT = `You are a silent rubric scorer for a 9-year-old learning fraction equivalence.

The kid just failed a math trade in a game. They have typed an explanation of what they think went wrong. Score their explanation on a 1-5 rubric, ONLY returning a JSON object {"score": N}.

Rubric:
5 — Names the exact concept (equivalent fractions, common denominators, or the specific mistake clearly). Example: "I forgot 2/4 is the same as 1/2 so I added too much."
4 — Identifies the right idea but vaguely. Example: "I used wrong sized pieces."
3 — Partial recognition. Names a fraction or denominator but not the relationship. Example: "I had quarters and halves mixed up."
2 — Acknowledges a mistake but with no math content. Example: "I messed up the numbers."
1 — Off-topic, blank, or random text. Example: "i dunno" or "asdfgh".

Return ONLY the JSON object. No prose. No explanation. {"score": N} where N is an integer 1-5.`;

/**
 * Defense-in-depth parser. Claude usually returns clean JSON, but a stray model glitch must
 * never crash the endpoint — the kid's experience downgrades gracefully to keyword fallback.
 * Three attempts: strict JSON, regex on the JSON key, single-digit anywhere.
 */
const parseScore = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    const s = parsed.score;
    if (typeof s === 'number' && Number.isInteger(s) && s >= 1 && s <= 5) return s;
  } catch {
    /* fall through to regex */
  }
  const m = raw.match(/"score"\s*:\s*([1-5])/);
  if (m) return Number(m[1]);
  const loose = raw.match(/\b([1-5])\b/);
  if (loose) return Number(loose[1]);
  return null;
};

/* ──────────────────────────  POST /api/validate  ────────────────────────── */

app.post('/api/validate', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'missing_api_key',
      detail:
        'ANTHROPIC_API_KEY is not set on this Render service. Add it in Render dashboard → Environment. ' +
        'Until set, the client falls back to local keyword scoring (lower accuracy).',
    });
  }

  const ipHeader = req.headers['x-forwarded-for'];
  const ip = (typeof ipHeader === 'string' ? ipHeader.split(',')[0] : req.ip || 'unknown').trim();
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: 'rate_limited',
      detail: `IP ${ip} exceeded ${RATE_LIMIT_MAX} validations per ${RATE_LIMIT_WINDOW_MS / 1000}s window.`,
    });
  }

  const body = req.body ?? {};
  const { explanation, target, submitted, food } = body;

  if (typeof explanation !== 'string' || explanation.trim().length === 0) {
    return res.status(400).json({
      error: 'missing_explanation',
      detail: 'Field "explanation" must be a non-empty string.',
    });
  }
  if (explanation.length > 500) {
    return res.status(400).json({
      error: 'explanation_too_long',
      detail: `Got ${explanation.length} chars, max 500. The kid wrote a novel — cap them in the UI textarea first.`,
    });
  }

  const userMessage = `Customer wanted: ${typeof target === 'string' ? target : '?'} of ${typeof food === 'string' ? food : '?'}.
Kid served: ${typeof submitted === 'string' ? submitted : '?'}.
Kid's explanation: "${explanation}"`;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 32,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(502).json({
        error: 'anthropic_upstream_error',
        detail:
          `Anthropic API returned HTTP ${upstream.status}. Body (truncated): ${text.slice(0, 300)}. ` +
          `Common causes: invalid/revoked API key, model name typo (we use claude-haiku-4-5-20251001), ` +
          `or temporary Anthropic outage.`,
      });
    }

    const json = await upstream.json();
    const rawText = json.content?.[0]?.text ?? '';
    const score = parseScore(rawText);
    if (score === null) {
      return res.status(500).json({
        error: 'unparseable_score',
        detail:
          `Claude returned "${rawText}" which contains no valid 1-5 integer. ` +
          `Falling back is the right call — the frontend will use keyword scoring for this attempt.`,
      });
    }

    return res.json({ score });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({
      error: 'network_or_parse_failure',
      detail:
        `Could not call Anthropic API. Underlying: ${msg}. ` +
        `Common causes: outbound network blocked, DNS issue, or process killed mid-request.`,
    });
  }
});

/* ──────────────────────────  Health check  ────────────────────────── */
/**
 * Render uses healthCheckPath to know the service is up before routing live traffic.
 * Keep this lightweight — no DB, no upstream call. Just signal "the Node process is alive".
 */
app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    ts: Date.now(),
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

/* ──────────────────────────  Static SPA serving  ────────────────────────── */

app.use(
  express.static(distDir, {
    setHeaders: (res, filePath) => {
      // Vite fingerprints assets under /assets/, so they're safe to cache for a year.
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }),
);

// SPA fallback: every non-api, non-asset route resolves to index.html so React Router
// (none today, but future-proof) and refresh-mid-game don't 404.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

/* ──────────────────────────  Start  ────────────────────────── */

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  // Loud structured boot log so Render's log explorer can confirm config is sane.
  console.log(`[trade-mogging] listening on :${port}`);
  console.log(
    `[trade-mogging] ANTHROPIC_API_KEY ${
      process.env.ANTHROPIC_API_KEY ? 'is set ✓' : 'is MISSING — /api/validate will 500, client uses keyword fallback'
    }`,
  );
  console.log(`[trade-mogging] serving static SPA from ${distDir}`);
});
