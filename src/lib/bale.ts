// Bale Bot API helpers — free tier, no business license required.

const BALE_API = 'https://tapi.bale.ai';

export async function baleSendMessage(chatId: number | string, text: string) {
  const token = process.env.BALE_BOT_TOKEN;
  if (!token) throw new Error('BALE_BOT_TOKEN missing');

  const res = await fetch(`${BALE_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'Bale send failed');
  return data;
}

export function buildBaleDeepLink(sessionId: string) {
  const username = process.env.BALE_BOT_USERNAME || 'Docwize_bot';
  return `https://ble.ir/${username}?start=${encodeURIComponent(sessionId)}`;
}
