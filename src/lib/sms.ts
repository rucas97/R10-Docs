import FarazSMS from 'farazsms';

export async function sendSms(phone: string, patternCode: string | undefined, variables: Record<string, string>) {
  const apiKey = process.env.FARAZSMS_API_KEY;

  if (!apiKey || !patternCode || !phone) {
    console.log('[SMS] Skipped: Missing config or phone.', { phone, patternCode });
    return;
  }

  try {
    const localPhone = phone.replace(/^\+98/, '0').replace(/^98/, '0');
    const sms = new FarazSMS(apiKey);
    
    // Convert object keys to FarazSMS expected format (e.g., { subject: "test" })
    await sms.sendPattern(patternCode, localPhone, variables);
    console.log(`[SMS] ✅ Sent to ${localPhone} using pattern ${patternCode}`);
  } catch (e: any) {
    console.error('[SMS] Failed:', e?.message);
  }
}
