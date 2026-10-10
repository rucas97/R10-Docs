import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const geminiKey = process.env.GEMINI_API_KEY || '';
const groqKey = process.env.GROQ_API_KEY || '';

const gemini = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
const groq = groqKey ? new Groq({ apiKey: groqKey }) : null;

type Provider = { name: string; kind: 'gemini' | 'groq'; model: string };

const CHAIN: Provider[] = [
  { name: 'gemini-3.5-flash',      kind: 'gemini', model: 'gemini-3.5-flash' },
  { name: 'gemini-3.1-flash-lite', kind: 'gemini', model: 'gemini-3.1-flash-lite' },
  { name: 'groq-gpt-oss-120b',     kind: 'groq',   model: 'openai/gpt-oss-120b' },
  { name: 'groq-gpt-oss-20b',      kind: 'groq',   model: 'openai/gpt-oss-20b' },
];

let stickyProvider: string | null = null;
const cooldownUntil = new Map<string, number>();
const COOLDOWN_MS = 60_000;

function isCoolingDown(name: string) {
  const t = cooldownUntil.get(name);
  return t != null && t > Date.now();
}
function markCooldown(name: string) {
  cooldownUntil.set(name, Date.now() + COOLDOWN_MS);
  console.log(`[llm] ${name} cooldown 60s`);
}
function getOrdered(): Provider[] {
  if (stickyProvider) {
    const sticky = CHAIN.find((p) => p.name === stickyProvider);
    if (sticky) return [sticky, ...CHAIN.filter((p) => p.name !== stickyProvider)];
  }
  return CHAIN;
}

function isRateLimit(err: any): boolean {
  const s = err?.status ?? err?.response?.status;
  if (s === 429) return true;
  const m = String(err?.message || '').toLowerCase();
  return m.includes('429') || m.includes('rate limit') || m.includes('quota') || m.includes('resource_exhausted');
}
function isOverload(err: any): boolean {
  const s = err?.status ?? err?.response?.status;
  if ([500, 502, 503, 504].includes(s)) return true;
  const m = String(err?.message || '').toLowerCase();
  return m.includes('overloaded') || m.includes('unavailable') || m.includes('high demand') || m.includes('timeout');
}
function isRetired(err: any): boolean {
  const m = String(err?.message || '').toLowerCase();
  return (
    m.includes('no longer available') ||
    m.includes('does not exist') ||
    m.includes('not found') ||
    m.includes('deprecated') ||
    m.includes('decommissioned')
  );
}

type NeutralMsg = { role: 'user' | 'assistant'; content: string };
type StreamOpts = { systemPrompt: string; history: NeutralMsg[]; message: string };

function toGeminiHistory(h: NeutralMsg[]) {
  return h.map((m) => ({
    role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
    parts: [{ text: m.content }],
  }));
}

async function* streamGemini(p: Provider, o: StreamOpts): AsyncIterable<string> {
  if (!gemini) throw new Error('Gemini not configured');
  const model = gemini.getGenerativeModel({
    model: p.model,
    systemInstruction: o.systemPrompt,
  });
  const chat = model.startChat({ history: toGeminiHistory(o.history) });
  const result = await chat.sendMessageStream(o.message);
  for await (const chunk of result.stream) {
    const t = chunk.text?.();
    if (t) yield t;
  }
}

async function* streamGroq(p: Provider, o: StreamOpts): AsyncIterable<string> {
  if (!groq) throw new Error('Groq not configured');
  const completion = await groq.chat.completions.create({
    model: p.model,
    messages: [
      { role: 'system', content: o.systemPrompt },
      ...o.history,
      { role: 'user', content: o.message },
    ],
    stream: true,
    temperature: 0.3,
    max_tokens: 2048,
  });
  for await (const chunk of completion) {
    const t = chunk.choices?.[0]?.delta?.content;
    if (t) yield t;
  }
}

async function* streamFrom(p: Provider, o: StreamOpts): AsyncIterable<string> {
  if (p.kind === 'gemini') yield* streamGemini(p, o);
  else yield* streamGroq(p, o);
}

export async function streamChat(o: StreamOpts): Promise<{ stream: AsyncIterable<string>; provider: string }> {
  const errors: string[] = [];
  for (const p of getOrdered()) {
    if (isCoolingDown(p.name)) { console.log(`[llm] skip ${p.name} (cooling)`); continue; }
    try {
      console.log(`[llm] trying ${p.name}`);
      const gen = streamFrom(p, o);
      const it = gen[Symbol.asyncIterator]();
      const first = await it.next();
      stickyProvider = p.name;
      console.log(`[llm] ✅ ${p.name}`);
      const wrapped = (async function* () {
        if (!first.done) yield first.value;
        while (true) {
          const n = await it.next();
          if (n.done) return;
          yield n.value;
        }
      })();
      return { stream: wrapped, provider: p.name };
    } catch (err: any) {
      const tag = isRetired(err) ? 'retired' : isRateLimit(err) ? '429' : isOverload(err) ? '503' : 'err';
      if (isRateLimit(err) || isRetired(err)) markCooldown(p.name);
      console.warn(`[llm] ${p.name} ${tag}:`, err?.message?.slice(0, 140));
      errors.push(`${p.name}:${tag}`);
    }
  }
  throw new Error(`All providers failed (${errors.join('; ') || 'none'})`);
}

type GenOpts = { systemPrompt?: string; prompt: string; maxTokens?: number };

async function genGemini(p: Provider, o: GenOpts): Promise<string> {
  if (!gemini) throw new Error('Gemini not configured');
  const model = gemini.getGenerativeModel({
    model: p.model,
    systemInstruction: o.systemPrompt,
    generationConfig: o.maxTokens ? { maxOutputTokens: o.maxTokens } : undefined,
  });
  const r = await model.generateContent(o.prompt);
  return r.response.text().trim();
}

async function genGroq(p: Provider, o: GenOpts): Promise<string> {
  if (!groq) throw new Error('Groq not configured');
  const r = await groq.chat.completions.create({
    model: p.model,
    messages: [
      ...(o.systemPrompt ? [{ role: 'system' as const, content: o.systemPrompt }] : []),
      { role: 'user' as const, content: o.prompt },
    ],
    temperature: 0.3,
    max_tokens: o.maxTokens ?? 500,
  });
  return r.choices?.[0]?.message?.content?.trim() ?? '';
}

/**
 * Single pass through the provider chain.
 */

function repairSummary(text: string): string {
  if (!text) return text;
  let t = text.trim();
  if (!t) return t;

  // Strip common trailing prefixes the model might append
  t = t.replace(/^خلاصه\s*[:：]\s*/i, '').trim();

  const terminators = ['.', '!', '?', '؟', '۔', '…', '\u061F'];
  if (terminators.some((c) => t.endsWith(c))) return t;

  // Cut back to the last terminator
  const lastIdx = Math.max(
    t.lastIndexOf('.'),
    t.lastIndexOf('!'),
    t.lastIndexOf('?'),
    t.lastIndexOf('؟'),
    t.lastIndexOf('۔'),
  );
  if (lastIdx > 20) return t.slice(0, lastIdx + 1).trim();

  // No terminator anywhere — try last newline
  const lastNl = t.lastIndexOf('\n');
  if (lastNl > 30) return t.slice(0, lastNl).trim() + '.';

  // Fallback: append a Persian period so it at least looks complete
  return t + '.';
}

export async function generateText(o: GenOpts): Promise<{ text: string; provider: string }> {
  const errors: string[] = [];
  for (const p of getOrdered()) {
    if (isCoolingDown(p.name)) continue;
    try {
      console.log(`[llm] generate ${p.name}`);
      const text = p.kind === 'gemini' ? await genGemini(p, o) : await genGroq(p, o);
      stickyProvider = p.name;
      console.log(`[llm] ✅ ${p.name}`);
      return { text, provider: p.name };
    } catch (err: any) {
      const tag = isRetired(err) ? 'retired' : isRateLimit(err) ? '429' : isOverload(err) ? '503' : 'err';
      if (isRateLimit(err) || isRetired(err)) markCooldown(p.name);
      console.warn(`[llm] ${p.name} ${tag}:`, err?.message?.slice(0, 140));
      errors.push(`${p.name}:${tag}`);
    }
  }
  throw new Error(`All providers failed (${errors.join('; ') || 'none'})`);
}

/**
 * Aggressive retry for BLOCKING calls (summary generation).
 * Repeats the full provider chain up to `maxRounds` times with exponential backoff,
 * clearing cooldowns between rounds so a transient 429 doesn't permanently block.
 * Throws if every round fails — callers must treat this as a hard failure.
 */
export async function generateTextWithRetry(
  o: GenOpts,
  maxRounds = 4
): Promise<{ text: string; provider: string }> {
  let lastErr: any = null;

  for (let round = 0; round < maxRounds; round++) {
    if (round > 0) {
      const wait = 2000 * round; // 2s, 4s, 6s
      console.log(`[llm] summary round ${round + 1}/${maxRounds} after ${wait}ms wait`);
      // Clear cooldowns so preferred providers get another shot
      cooldownUntil.clear();
      stickyProvider = null;
      await new Promise((r) => setTimeout(r, wait));
    }
    try {
      console.log(`[llm] summary round ${round + 1}/${maxRounds}`);
      const res = await generateText(o);
      if (res.text && res.text.length >= 20) {
        return { ...res, text: repairSummary(res.text) };
      }
      console.warn(`[llm] summary too short (${res.text?.length ?? 0} chars), retrying`);
      lastErr = new Error('Summary too short');
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr ?? new Error('Summary generation failed after all rounds');
}
