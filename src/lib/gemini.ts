import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

const proxyUrl = process.env.GEMINI_PROXY_URL;
if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
  console.log('[gemini] Proxy active:', proxyUrl);
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Ordered list — first that works wins.
// 3.5-flash is best but often overloaded. 2.5 and 2.0 are more available.
export const MODEL_CHAIN = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

function isRetryable(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  if (RETRYABLE_STATUSES.includes(status)) return true;
  const msg = String(err?.message || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('service unavailable') ||
    msg.includes('rate limit') ||
    msg.includes('quota')
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Try to send a streaming message across the model chain with retries.
 * Returns { stream, model, chat } on success.
 */
export async function sendWithFallback(opts: {
  systemInstruction: string;
  history: { role: 'user' | 'model'; parts: { text: string }[] }[];
  message: string;
}): Promise<{ stream: AsyncIterable<any>; model: string }> {
  let lastErr: any = null;

  for (const modelName of MODEL_CHAIN) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[gemini] trying ${modelName} (attempt ${attempt + 1})`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: opts.systemInstruction,
        });
        const chat = model.startChat({ history: opts.history });
        const result = await chat.sendMessageStream(opts.message);

        // Kick off the stream once to confirm it works before returning
        // (some 503s only surface on the first read)
        const iterator = result.stream[Symbol.asyncIterator]();
        const first = await iterator.next();
        if (first.done) {
          // Empty but valid
          return {
            stream: (async function* () {})() as any,
            model: modelName,
          };
        }

        const wrapped = (async function* () {
          yield first.value;
          for await (const chunk of { [Symbol.asyncIterator]: () => iterator } as any) {
            yield chunk;
          }
        })();

        console.log(`[gemini] ✅ using ${modelName}`);
        return { stream: wrapped as any, model: modelName };
      } catch (err: any) {
        lastErr = err;
        if (!isRetryable(err)) {
          console.warn(`[gemini] non-retryable on ${modelName}:`, err?.message);
          break; // try next model anyway
        }
        const wait = 800 * (attempt + 1);
        console.warn(`[gemini] ${modelName} failed (${err?.status ?? '?'}), retrying in ${wait}ms`);
        await sleep(wait);
      }
    }
  }

  throw lastErr ?? new Error('All Gemini models failed');
}

/**
 * Non-streaming variant for the summary call.
 */
export async function generateWithFallback(opts: {
  systemInstruction?: string;
  prompt: string;
  maxOutputTokens?: number;
}): Promise<{ text: string; model: string }> {
  let lastErr: any = null;

  for (const modelName of MODEL_CHAIN) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[gemini] generate ${modelName} (attempt ${attempt + 1})`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: opts.systemInstruction,
          generationConfig: opts.maxOutputTokens
            ? { maxOutputTokens: opts.maxOutputTokens }
            : undefined,
        });
        const result = await model.generateContent(opts.prompt);
        const text = result.response.text().trim();
        console.log(`[gemini] ✅ generated with ${modelName}`);
        return { text, model: modelName };
      } catch (err: any) {
        lastErr = err;
        if (!isRetryable(err)) break;
        const wait = 1200 * (attempt + 1);
        console.warn(`[gemini] ${modelName} ${err?.status ?? '?'} — retry in ${wait}ms`);
        await sleep(wait);
      }
    }
  }

  throw lastErr ?? new Error('All Gemini models failed');
}
