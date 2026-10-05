import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const geminiKey = process.env.GEMINI_API_KEY || '';
const groqKey = process.env.GROQ_API_KEY || '';

const gemini = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
const groq = groqKey ? new Groq({ apiKey: groqKey }) : null;

type Provider = { name: string; kind: 'gemini' | 'groq'; model: string };

// Gemini first (better Farsi quality), Groq as fallback (much larger free quota)
const CHAIN: Provider[] = [
  { name: 'gemini-2.5-flash', kind: 'gemini', model: 'gemini-2.5-flash' },
  { name: 'gemini-2.0-flash-lite', kind: 'gemini', model: 'gemini-2.0-flash-lite' },
  { name: 'groq-llama-3.3-70b', kind: 'groq', model: 'llama-3.3-70b-versatile' },
  { name: 'groq-llama-3.1-8b', kind: 'groq', model: 'llama-3.1-8b-instant' },
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

/**
 * Stream with provider fallback. Peeks first chunk to catch early failures.
 */
export async function streamChat(o: StreamOpts): Promise<{ stream: AsyncIterable<string>; provider: string }> {
  const errors: string[] = [];

  for (const p of getOrdered()) {
    if (isCoolingDown(p.name)) {
      console.log(`[llm] skip ${p.name} (cooling)`);
      continue;
    }
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
      if (isRateLimit(err)) markCooldown(p.name);
      const tag = isRateLimit(err) ? '429' : isOverload(err) ? '503' : 'err';
      console.warn(`[llm] ${p.name} ${tag}:`, err?.message?.slice(0, 120));
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
      if (isRateLimit(err)) markCooldown(p.name);
      const tag = isRateLimit(err) ? '429' : isOverload(err) ? '503' : 'err';
      console.warn(`[llm] ${p.name} ${tag}:`, err?.message?.slice(0, 120));
      errors.push(`${p.name}:${tag}`);
    }
  }
  throw new Error(`All providers failed (${errors.join('; ') || 'none'})`);
}
