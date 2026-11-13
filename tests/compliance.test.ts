import { describe, expect, it } from 'vitest';
import { checkMessage, isQuietHours, isRevocationReply, type ConsentEntry } from '@/lib/messaging/compliance';

// 2026-11-13 18:00 UTC = 11:00 in Denver.
const now = new Date('2026-11-13T18:00:00Z');
const tz = 'America/Denver';
const reminder = 'Summit Endo: your appointment is Tue 11/17 at 9:00am. Reply C to confirm. Reply STOP to opt out.';
const grant = (purpose: ConsentEntry['purpose'], extra: Partial<ConsentEntry> = {}): ConsentEntry => ({
  channel: 'sms',
  purpose,
  status: 'granted',
  isWritten: false,
  recordedAt: new Date('2026-10-01T00:00:00Z'),
  ...extra,
});

describe('checkMessage', () => {
  it('sends an appointment reminder with consent', () => {
    expect(checkMessage({ channel: 'sms', purpose: 'appointment', body: reminder, consents: [grant('appointment')], timezone: tz, now })).toEqual({
      allowed: true,
      basis: 'consent',
    });
  });

  it('allows an exempt reminder without consent only within exemption limits', () => {
    const ok = checkMessage({ channel: 'sms', purpose: 'appointment', body: reminder, consents: [], timezone: tz, now });
    expect(ok).toEqual({ allowed: true, basis: 'healthcare_exemption' });

    const noOptOut = checkMessage({ channel: 'sms', purpose: 'appointment', body: 'Appt Tue 9am', consents: [], timezone: tz, now });
    expect(noOptOut.allowed).toBe(false);

    const tooMany = checkMessage({
      channel: 'sms',
      purpose: 'appointment',
      body: reminder,
      consents: [],
      timezone: tz,
      now,
      priorExemptSends: [new Date('2026-11-12T18:00:00Z'), new Date('2026-11-10T18:00:00Z'), new Date('2026-11-09T18:00:00Z')],
    });
    expect(tooMany.allowed).toBe(false);
  });

  it('blocks everything on that channel+purpose after revocation', () => {
    const consents = [grant('appointment'), grant('appointment', { status: 'revoked', recordedAt: new Date('2026-11-01T00:00:00Z') })];
    const r = checkMessage({ channel: 'sms', purpose: 'appointment', body: reminder, consents, timezone: tz, now });
    expect(r.allowed).toBe(false);
  });

  it('requires written consent for marketing', () => {
    const body = 'Summit Endo: 20% off whitening this month! Reply STOP to opt out.';
    expect(checkMessage({ channel: 'sms', purpose: 'marketing', body, consents: [grant('marketing')], timezone: tz, now }).allowed).toBe(false);
    expect(checkMessage({ channel: 'sms', purpose: 'marketing', body, consents: [grant('marketing', { isWritten: true })], timezone: tz, now }).allowed).toBe(true);
  });

  it('rejects promotional content disguised as a reminder', () => {
    const body = 'Reminder: your visit Tue. Ask about our whitening special! Reply STOP to opt out.';
    expect(checkMessage({ channel: 'sms', purpose: 'appointment', body, consents: [grant('appointment')], timezone: tz, now }).allowed).toBe(false);
  });

  it('does not let billing ride the healthcare exemption', () => {
    expect(checkMessage({ channel: 'sms', purpose: 'billing', body: 'Balance due. Reply STOP to opt out.', consents: [], timezone: tz, now }).allowed).toBe(false);
  });

  it('respects quiet hours in the patient timezone', () => {
    const late = new Date('2026-11-14T05:00:00Z'); // 22:00 Denver
    expect(isQuietHours(late, tz)).toBe(true);
    expect(checkMessage({ channel: 'sms', purpose: 'appointment', body: reminder, consents: [grant('appointment')], timezone: tz, now: late }).allowed).toBe(false);
  });
});

describe('isRevocationReply', () => {
  it.each(['STOP', 'stop.', 'Unsubscribe', 'please remove me', 'Do not text me', 'quit'])('treats "%s" as revocation', (t) => {
    expect(isRevocationReply(t)).toBe(true);
  });
  it.each(['C', 'Yes', 'see you then', 'can I move to 3pm?'])('does not treat "%s" as revocation', (t) => {
    expect(isRevocationReply(t)).toBe(false);
  });
});
