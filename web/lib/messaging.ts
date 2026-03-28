const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY || '';
const TWOFACTOR_SENDER_ID = process.env.TWOFACTOR_SENDER_ID || 'VEDANT';

const WAY2SMART_API_KEY = process.env.WAY2SMART_API_KEY || '';
const WAY2SMART_PHONE_NUMBER_ID = process.env.WAY2SMART_PHONE_NUMBER_ID || '';
const WAY2SMART_BASE_URL =
  (process.env.WAY2SMART_BASE_URL || 'https://console-api.way2smart.in/v3').replace(/\/$/, '');
const WAY2SMART_TEMPLATE_LANG = (process.env.WAY2SMART_TEMPLATE_LANG || 'mr').trim();

/** Notification kinds → approved Meta template names (env). */
const EVENT_TEMPLATE_ENV_KEYS = {
  service_request_created: 'WAY2SMART_TEMPLATE_SERVICE_REQUEST_CREATED',
  service_request_status_changed: 'WAY2SMART_TEMPLATE_SERVICE_REQUEST_STATUS_CHANGED',
  service_request_auto_advanced_shared: 'WAY2SMART_TEMPLATE_SERVICE_REQUEST_AUTO_ADVANCED_SHARED',
  service_request_auto_advanced_wip: 'WAY2SMART_TEMPLATE_SERVICE_REQUEST_AUTO_ADVANCED_WIP',
  birthday_greeting: 'WAY2SMART_TEMPLATE_BIRTHDAY_GREETING',
  anniversary_greeting: 'WAY2SMART_TEMPLATE_ANNIVERSARY_GREETING',
} as const;

export type WhatsAppEvent = keyof typeof EVENT_TEMPLATE_ENV_KEYS;

export type SendWhatsAppOptions = {
  event: WhatsAppEvent;
  /** Ordered body variables {{1}}, {{2}}, … (same order as in the approved template). */
  bodyParams: string[];
  /** Optional language override per send (defaults to WAY2SMART_TEMPLATE_LANG). */
  languageCode?: string;
};

function normaliseMobile(mobile: string): string {
  const digits = mobile.replaceAll(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function templateNameForEvent(event: WhatsAppEvent): string | undefined {
  const envKey = EVENT_TEMPLATE_ENV_KEYS[event];
  const name = process.env[envKey]?.trim();
  return name || undefined;
}

/**
 * WhatsApp via Way2Smart Cloud API (template messages).
 * Configure WAY2SMART_* and per-event template env vars; SMS remains on 2Factor.
 */
export async function sendWhatsApp(mobile: string, options: SendWhatsAppOptions): Promise<void> {
  if (!WAY2SMART_API_KEY || !WAY2SMART_PHONE_NUMBER_ID) {
    console.warn(
      '[messaging] WAY2SMART_API_KEY or WAY2SMART_PHONE_NUMBER_ID not set, skipping WhatsApp'
    );
    return;
  }

  const templateName = templateNameForEvent(options.event);
  if (!templateName) {
    const envKey = EVENT_TEMPLATE_ENV_KEYS[options.event];
    console.warn(`[messaging] ${envKey} not set, skipping WhatsApp for event=${options.event}`);
    return;
  }

  const phone = normaliseMobile(mobile);
  const lang = (options.languageCode || WAY2SMART_TEMPLATE_LANG).trim();

  const components =
    options.bodyParams.length > 0
      ? [
          {
            type: 'body' as const,
            parameters: options.bodyParams.map((text) => ({
              type: 'text' as const,
              text,
            })),
          },
        ]
      : undefined;

  const payload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang },
      ...(components ? { components } : {}),
    },
  };

  const url = `${WAY2SMART_BASE_URL}/${WAY2SMART_PHONE_NUMBER_ID}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: WAY2SMART_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[messaging] Way2Smart WhatsApp send failed (${res.status}): ${text}`);
    }
  } catch (err) {
    console.error('[messaging] Way2Smart WhatsApp send error:', err);
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
