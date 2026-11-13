/**
 * Outbound-message compliance gate (TCPA / HIPAA marketing).
 *
 * Every automated patient message must pass `checkMessage` before sending.
 * This encodes product policy, not legal advice — rules must be reviewed by
 * counsel (notably the FCC consent-revocation order effective 2026-11-25).
 *
 * Policy summary:
 * - Consent is tracked per channel AND per purpose; the latest ledger entry wins.
 *   Any revocation blocks that channel+purpose immediately.
 * - Marketing requires an explicit, *written* grant.
 * - Appointment / care-instruction texts may rely on the TCPA healthcare exemption
 *   when no explicit consent exists, but only within its limits: ≤160 chars,
 *   opt-out language, ≤1 per day and ≤3 per week, no marketing/billing content.
 * - Billing texts require an explicit grant (the healthcare exemption excludes billing).
 * - Quiet hours: nothing before 08:00 or after 21:00 in the patient's local time.
 */
import type { Channel, MessagePurpose } from '../db/schema';

export interface ConsentEntry {
  channel: Channel;
  purpose: MessagePurpose;
  status: 'granted' | 'revoked';
  isWritten: boolean;
  recordedAt: Date;
}

export interface MessageCheckInput {
  channel: Channel;
  purpose: MessagePurpose;
  body: string;
  consents: ConsentEntry[];
  /** Timestamps of prior messages to this patient that relied on the healthcare exemption. */
  priorExemptSends?: Date[];
  /** Patient's IANA timezone. */
  timezone: string;
  now?: Date;
}

export type MessageCheckResult = { allowed: true; basis: 'consent' | 'healthcare_exemption' } | { allowed: false; reasons: string[] };

export const QUIET_START_HOUR = 21;
export const QUIET_END_HOUR = 8;
const OPT_OUT_PATTERN = /\b(reply|text)\s+stop\b/i;
const MARKETING_PATTERN = /\b(special|discount|% off|promo|offer|free whitening|limited time|deal)\b/i;

/** Latest ledger entry for a channel+purpose, or undefined. */
export function currentConsent(consents: ConsentEntry[], channel: Channel, purpose: MessagePurpose): ConsentEntry | undefined {
  return consents
    .filter((c) => c.channel === channel && c.purpose === purpose)
    .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
}

export function localHour(date: Date, timezone: string): number {
  const hour = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hourCycle: 'h23' }).format(date);
  return Number(hour);
}

export function isQuietHours(date: Date, timezone: string): boolean {
  const h = localHour(date, timezone);
  return h >= QUIET_START_HOUR || h < QUIET_END_HOUR;
}

export function checkMessage(input: MessageCheckInput): MessageCheckResult {
  const now = input.now ?? new Date();
  const reasons: string[] = [];
  const consent = currentConsent(input.consents, input.channel, input.purpose);

  if (consent?.status === 'revoked') {
    return { allowed: false, reasons: [`Patient revoked ${input.channel} consent for ${input.purpose} messages`] };
  }

  if (input.channel !== 'email' && isQuietHours(now, input.timezone)) {
    reasons.push(`Quiet hours (${QUIET_END_HOUR}:00–${QUIET_START_HOUR}:00 patient local time)`);
  }

  if (input.purpose !== 'marketing' && MARKETING_PATTERN.test(input.body)) {
    reasons.push('Message contains promotional language; classify it as marketing');
  }

  if (input.purpose === 'marketing') {
    if (!consent || consent.status !== 'granted' || !consent.isWritten) {
      reasons.push('Marketing requires prior express written consent');
    }
    return reasons.length ? { allowed: false, reasons } : { allowed: true, basis: 'consent' };
  }

  if (consent?.status === 'granted') {
    return reasons.length ? { allowed: false, reasons } : { allowed: true, basis: 'consent' };
  }

  // No explicit consent on file: only the healthcare exemption can apply.
  if (input.purpose === 'billing') {
    reasons.push('Billing messages require explicit consent (not covered by the healthcare exemption)');
    return { allowed: false, reasons };
  }
  if (input.channel === 'sms') {
    if (input.body.length > 160) reasons.push('Exempt healthcare texts must be 160 characters or fewer');
    if (!OPT_OUT_PATTERN.test(input.body)) reasons.push('Exempt healthcare texts must include opt-out language (e.g. "Reply STOP to opt out")');
  }
  const prior = (input.priorExemptSends ?? []).map((d) => d.getTime());
  const day = 24 * 60 * 60 * 1000;
  if (prior.filter((t) => t > now.getTime() - day).length >= 1) reasons.push('Healthcare exemption allows at most 1 message per day');
  if (prior.filter((t) => t > now.getTime() - 7 * day).length >= 3) reasons.push('Healthcare exemption allows at most 3 messages per week');

  return reasons.length ? { allowed: false, reasons } : { allowed: true, basis: 'healthcare_exemption' };
}

/** Inbound keywords that must be treated as a revocation ("any reasonable means"). */
const REVOCATION_KEYWORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit', 'revoke', 'opt out', 'optout', 'remove me', "don't text", 'do not text'];

export function isRevocationReply(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[.!]+$/, '');
  return REVOCATION_KEYWORDS.some((k) => t === k || t.startsWith(`${k} `) || (k.includes(' ') && t.includes(k)));
}
