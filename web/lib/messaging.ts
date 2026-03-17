const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY || '';
const TWOFACTOR_SENDER_ID = process.env.TWOFACTOR_SENDER_ID || 'VEDANT';

function normaliseMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export async function sendWhatsApp(mobile: string, message: string): Promise<void> {
  if (!TWOFACTOR_API_KEY) {
    console.warn('[messaging] TWOFACTOR_API_KEY not set, skipping WhatsApp');
    return;
  }
  const phone = normaliseMobile(mobile);
  try {
    const res = await fetch(
      `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/WHATSAPP/SEND`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ To: phone, Msg: message }),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[messaging] WhatsApp send failed (${res.status}): ${text}`);
    }
  } catch (err) {
    console.error('[messaging] WhatsApp send error:', err);
  }
}

export async function sendSMS(mobile: string, message: string): Promise<void> {
  if (!TWOFACTOR_API_KEY) {
    console.warn('[messaging] TWOFACTOR_API_KEY not set, skipping SMS');
    return;
  }
  const phone = normaliseMobile(mobile);
  try {
    const res = await fetch(
      `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/ADDON_SERVICES/SEND/TSMS`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          From: TWOFACTOR_SENDER_ID,
          To: phone,
          Msg: message,
        }),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[messaging] SMS send failed (${res.status}): ${text}`);
    }
  } catch (err) {
    console.error('[messaging] SMS send error:', err);
  }
}
