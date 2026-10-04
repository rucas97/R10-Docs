import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

// Only wire a proxy if GEMINI_PROXY_URL is set (local dev in restricted regions).
// On Vercel, this env var is absent, so we skip undici entirely.
const proxyUrl = process.env.GEMINI_PROXY_URL;

if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
  console.log('[gemini] Proxy active:', proxyUrl);
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
