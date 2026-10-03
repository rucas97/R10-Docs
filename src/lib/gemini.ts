import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

// IMPORTANT: Edit .env.local to match YOUR proxy's port.
// Common ports: 7890 (Clash), 10809 (v2ray), 2080 (Nekoray)
const proxyUrl = process.env.GEMINI_PROXY_URL;

if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
  console.log('[gemini] Using proxy:', proxyUrl);
} else {
  console.warn('[gemini] WARNING: No GEMINI_PROXY_URL set. Direct connection will be blocked.');
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
