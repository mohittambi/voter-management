import { sendWhatsApp } from './messaging';

/** Digits only; 10-digit Indian or 91XXXXXXXXXX. If unset, no office WhatsApp copy. */
function officeNotifyDigits(): string {
  return (process.env.VEDANT_OFFICE_NOTIFY_WHATSAPP || '').replaceAll(/\D/g, '');
}

/** Normalised mobile for Way2Smart (91…). */
export function toIndia91(digits: string): string {
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function vedantOfficeMobile91(): string | null {
  const d = officeNotifyDigits();
  if (!d) return null;
  return toIndia91(d);
}

/** Display in Marathi line: prefer 10-digit national form. */
export function formatMobileMarathiDisplay(mobileRaw: string): string {
  const d = mobileRaw.replaceAll(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length === 10) return d;
  return d;
}

export function buildVedantPersonLine(
  nameMarathi: string,
  nameEnglish: string,
  mobileRaw: string
): string {
  const name = (nameMarathi || nameEnglish).trim() || 'नागरिक';
  const mob = formatMobileMarathiDisplay(mobileRaw);
  if (!mob) return `श्री. ${name}`;
  return `श्री. ${name} (मो. ${mob})`;
}

/** e.g. "रेशन कार्ड" → "रेशन कार्डचे" */
export function serviceTypeGenitiveMarathi(serviceName: string): string {
  const t = serviceName.trim();
  if (!t) return 'कामाचे';
  if (/चे$|ची$|चा$/.test(t)) return t;
  return `${t}चे`;
}

export function smsVedantWorkSubmitted(personLine: string, servicePart: string): string {
  return `नमस्कार,\nवेदांत कार्यालय, मनोली येथे ${personLine} यांचे ${servicePart} काम जमा करण्यात आले आहे.\n\nधन्यवाद.`;
}

export function smsVedantWorkCompleted(personLine: string, servicePart: string): string {
  return `नमस्कार,\nवेदांत कार्यालय, मनोली येथे ${personLine} यांचे ${servicePart} काम पूर्ण करण्यात आले आहे.\n\nधन्यवाद.`;
}

/** Same template payload to office number (8412865555 etc.) when configured. */
export async function sendVedantOfficeWhatsAppCopy(
  event: 'vedant_work_submitted' | 'vedant_work_completed',
  bodyParams: [string, string]
): Promise<void> {
  const office91 = vedantOfficeMobile91();
  if (!office91) return;
  await sendWhatsApp(office91, { event, bodyParams });
}
