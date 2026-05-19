/**
 * Vercel serverless API route: silently scores a kid's typed explanation of why they failed a trade.
 *
 * Contract:
 *   POST /api/validate
 *   body: { explanation: string, target: string, submitted: string, food: string }
 *   reply: { score: 1 | 2 | 3 | 4 | 5 }
 *
 * The kid never sees this response directly. The frontend maps the integer score to one of 5
 * pre-written scripted lines. This satisfies the Synthesis brief's rule that LLM text is never
 * exposed to the kid — we use the LLM's pedagogical judgment, not its prose.
 *
 * If ANTHROPIC_API_KEY is not set, this route returns 500 and the client falls back to a
 * client-side keyword scorer. The game stays playable, the lesson stays approximate.
 *
 * Rate limiting: trivial in-memory counter keyed on remote IP. Vercel serverless instances are
 * ephemeral so this is per-instance, which is fine for a demo. Real production would use Upstash
 * Redis or Vercel KV.
 */

interface ValidateRequest {
  explanation?: unknown;
  target?: unknown;
  submitted?: unknown;
  food?: unknown;
}

interface ValidateResponse {
  score: 1 | 2 | 3 | 4 | 5;
}

interface ErrorResponse {
  error: string;
  detail?: string;
}

// Per-instance counter. Caps each Vercel instance at ~60 validations / minute to keep costs sane
// during a demo session. A single classroom of 20 kids generates ~3/min on average.
const ipBucket = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const cur = ipBucket.get(ip);
  if (!cur || cur.resetAt < now) {
    ipBucket.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  cur.count += 1;
  if (cur.count > RATE_LIMIT_MAX) return true;
  return false;
};

const SYSTEM_PROMPT = `You are a silent rubric scorer for a 9-year-old learning fraction equivalence.

The kid just failed a math trade in a game. They have typed an explanation of what they think went wrong. Score their explanation on a 1-5 rubric, ONLY returning a JSON object {"score": N}.

Rubric:
5 — Names the exact concept (equivalent fractions, common denominators, or the specific mistake clearly). Example: "I forgot 2/4 is the same as 1/2 so I added too much."
4 — Identifies the right idea but vaguely. Example: "I used wrong sized pieces."
3 — Partial recognition. Names a fraction or denominator but not the relationship. Example: "I had quarters and halves mixed up."
2 — Acknowledges a mistake but with no math content. Example: "I messed up the numbers."
1 — Off-topic, blank, or random text. Example: "i dunno" or "asdfgh".

Return ONLY the JSON object. No prose. No explanation. {"score": N} where N is an integer 1-5.`;

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
};

const parseScore = (raw: string): 1 | 2 | 3 | 4 | 5 | null => {
  // Try strict JSON first, then a regex sweep — Claude usually obeys but we should never crash on bad output.
  try {
    const parsed = JSON.parse(raw) as { score?: unknown };
    const s = parsed.score;
    if (typeof s === 'number' && Number.isInteger(s) && s >= 1 && s <= 5) {
      return s as 1 | 2 | 3 | 4 | 5;
    }
  } catch {
    // fall through
  }
  const m = raw.match(/"score"\s*:\s*([1-5])/);
  if (m) return Number(m[1]) as 1 | 2 | 3 | 4 | 5;
  const looseN = raw.match(/\b([1-5])\b/);
  if (looseN) return Number(looseN[1]) as 1 | 2 | 3 | 4 | 5;
  return null;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    const err: ErrorResponse = { error: 'method_not_allowed', detail: `Got ${req.method}, expected POST` };
    return new Response(JSON.stringify(err), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Loud explicit failure so the frontend's fallback logger surfaces a clear cause.
    const err: ErrorResponse = {
      error: 'missing_api_key',
      detail:
        'ANTHROPIC_API_KEY env var is not set on this Vercel deployment. ' +
        'Add it via: vercel env add ANTHROPIC_API_KEY production. ' +
        'Until set, the client will fall back to local keyword scoring (lower accuracy).',
    };
    return new Response(JSON.stringify(err), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (isRateLimited(ip)) {
    const err: ErrorResponse = {
      error: 'rate_limited',
      detail: `IP ${ip} exceeded ${RATE_LIMIT_MAX} validations per ${RATE_LIMIT_WINDOW_MS / 1000}s window.`,
    };
    return new Response(JSON.stringify(err), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  let body: ValidateRequest;
  try {
    body = (await req.json()) as ValidateRequest;
  } catch (e) {
    const err: ErrorResponse = {
      error: 'bad_json',
      detail: `Request body could not be parsed as JSON. Underlying: ${(e as Error).message}`,
    };
    return new Response(JSON.stringify(err), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { explanation, target, submitted, food } = body;
  if (typeof explanation !== 'string' || explanation.trim().length === 0) {
    const err: ErrorResponse = { error: 'missing_explanation', detail: 'Field "explanation" must be a non-empty string.' };
    return new Response(JSON.stringify(err), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (explanation.length > 500) {
    const err: ErrorResponse = { error: 'explanation_too_long', detail: `Got ${explanation.length} chars, max 500.` };
    return new Response(JSON.stringify(err), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const userMessage = `Customer wanted: ${typeof target === 'string' ? target : '?'} of ${typeof food === 'string' ? food : '?'}.
Kid served: ${typeof submitted === 'string' ? submitted : '?'}.
Kid's explanation: "${explanation}"`;

  try {
    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!anthropicResp.ok) {
      const text = await anthropicResp.text();
      const err: ErrorResponse = {
        error: 'anthropic_upstream_error',
        detail: `Anthropic API returned HTTP ${anthropicResp.status}. Body (truncated): ${text.slice(0, 300)}`,
      };
      return new Response(JSON.stringify(err), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const json = (await anthropicResp.json()) as AnthropicResponse;
    const rawText = json.content?.[0]?.text ?? '';
    const score = parseScore(rawText);

    if (score === null) {
      const err: ErrorResponse = {
        error: 'unparseable_score',
        detail: `Claude returned "${rawText}" which does not contain a valid 1-5 score. Falling back is the right call here.`,
      };
      return new Response(JSON.stringify(err), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const reply: ValidateResponse = { score };
    return new Response(JSON.stringify(reply), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    const err: ErrorResponse = {
      error: 'network_or_parse_failure',
      detail: `Could not call Anthropic API. Underlying: ${(e as Error).message}. Frequent cause: missing ANTHROPIC_API_KEY env var or transient network blip.`,
    };
    return new Response(JSON.stringify(err), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export const config = { runtime: 'edge' };
