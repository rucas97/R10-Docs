import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

const proxyUrl = process.env.GEMINI_PROXY_URL;
if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
  console.log('[gemini] Proxy active:', proxyUrl);
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Only two models — the best and the most-available fallback.
// Adding more = more wasted requests when quota is tight.
export const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
];

// Remember which model worked last time — try it first, always.
let stickyModel: string | null = null;

// Per-model cooldown: if a model 429s, don't try it again for N seconds.
const cooldownUntil = new Map<string, number>();
const COOLDOWN_MS = 60_000; // 1 minute

function isCoolingDown(model: string): boolean {
  const t = cooldownUntil.get(model);
  return t != null && t > Date.now();
}

function markCooldown(model: string) {
  cooldownUntil.set(model, Date.now() + COOLDOWN_MS);
  console.log(`[gemini] ${model} cooldown for ${COOLDOWN_MS / 1000}s`);
}

function getOrderedModels(): string[] {
  const list = [...MODEL_CHAIN];
  if (stickyModel && list.includes(stickyModel)) {
    // move sticky to front
    return [stickyModel, ...list.filter((m) => m !== stickyModel)];
  }
  return list;
}

function isRateLimit(err: any): boolean {
  const s = err?.status ?? err?.response?.status;
  if (s === 429) return true;
  const m = String(err?.message || '').toLowerCase();
  return m.includes('429') || m.includes('quota') || m.includes('rate limit') || m.includes('resource_exhausted');
}

function isOverload(err: any): boolean {
  const s = err?.status ?? err?.response?.status;
  if (s === 503 || s === 500 || s === 502 || s === 504) return true;
  const m = String(err?.message || '').toLowerCase();
  return m.includes('503') || m.includes('overloaded') || m.includes('high demand') || m.includes('service unavailable');
}

/**
 * Try models in order, ONE attempt each. No retries within a model.
 * Rate limit → mark cooldown, jump to next.
 * Overload → jump to next.
 */
export async function sendWithFallback(opts: {
  systemInstruction: string;
  history: { role: 'user' | 'model'; parts: { text: string }[] }[];
  message: string;
}): Promise<{ stream: AsyncIterable<any>; model: string }> {
  const errors: string[] = [];

  for (const modelName of getOrderedModels()) {
    if (isCoolingDown(modelName)) {
      console.log(`[gemini] skip ${modelName} (cooling down)`);
      continue;
    }
    try {
      console.log(`[gemini] trying ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: opts.systemInstruction,
      });
      const chat = model.startChat({ history: opts.history });
      const result = await chat.sendMessageStream(opts.message);

      // Verify first chunk arrives
      const iterator = result.stream[Symbol.asyncIterator]();
      const first = await iterator.next();

      stickyModel = modelName;
      console.log(`[gemini] ✅ ${modelName}`);

      if (first.done) {
        return { stream: (async function* () {})(), model: modelName };
      }
      const wrapped = (async function* () {
        yield first.value;
        while (true) {
          const n = await iterator.next();
          if (n.done) return;
          yield n.value;
        }
      })();
      return { stream: wrapped, model: modelName };
    } catch (err: any) {
      if (isRateLimit(err)) markCooldown(modelName);
      const tag = isRateLimit(err) ? '429' : isOverload(err) ? '503' : 'err';
      console.warn(`[gemini] ${modelName} ${tag}:`, err?.message?.slice(0, 120));
      errors.push(`${modelName}: ${tag}`);
    }
  }

  const detail = errors.join('; ') || 'no models available';
  throw new Error(`All Gemini models failed (${detail})`);
}

export async function generateWithFallback(opts: {
  systemInstruction?: string;
  prompt: string;
  maxOutputTokens?: number;
}): Promise<{ text: string; model: string }> {
  const errors: string[] = [];

  for (const modelName of getOrderedModels()) {
    if (isCoolingDown(modelName)) {
      console.log(`[gemini] skip ${modelName} (cooling down)`);
      continue;
    }
    try {
      console.log(`[gemini] generate ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: opts.systemInstruction,
        generationConfig: opts.maxOutputTokens ? { maxOutputTokens: opts.maxOutputTokens } : undefined,
      });
      const result = await model.generateContent(opts.prompt);
      const text = result.response.text().trim();
      stickyModel = modelName;
      console.log(`[gemini] ✅ ${modelName}`);
      return { text, model: modelName };
    } catch (err: any) {
      if (isRateLimit(err)) markCooldown(modelName);
      const tag = isRateLimit(err) ? '429' : isOverload(err) ? '503' : 'err';
      console.warn(`[gemini] ${modelName} ${tag}:`, err?.message?.slice(0, 120));
      errors.push(`${modelName}: ${tag}`);
    }
  }

  throw new Error(`All Gemini models failed (${errors.join('; ')})`);
}
