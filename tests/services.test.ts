import { beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type DB } from '@/lib/db';
import { seedDemo } from '@/lib/db/seed';
import { getDashboard } from '@/lib/services/dashboard';
import { createReferralFromPortal, getReferral, transitionReferral } from '@/lib/services/referrals';
import { listReferrersWithHealth, logOutreach } from '@/lib/services/referrers';
import { InvalidTransitionError } from '@/lib/referrals/status';

const now = new Date('2026-11-13T12:00:00Z');
let db: DB;
let orgId: string;

const intake = {
  referrerFirstName: 'Nora',
  referrerLastName: 'Fields',
  referrerEmail: 'Nora.Fields@Example.com',
  practiceName: 'Riverside Dental',
  patientFirstName: 'Pat',
  patientLastName: 'Test',
  patientPhone: '(303) 555-0199',
  reason: 'rct',
  teeth: '19',
  urgency: 'urgent',
  patientConsentsToText: 'on',
};

beforeAll(async () => {
  db = await createTestDb();
  orgId = await seedDemo(db, now);
});

describe('referral portal intake', () => {
  it('creates referrer, patient, referral, event and consent', async () => {
    const { referral, referrer } = await createReferralFromPortal(db, 'summit-endo', intake, now);
    expect(referral.status).toBe('received');
    expect(referral.source).toBe('portal');
    expect(referrer.email).toBe('nora.fields@example.com');

    const full = await getReferral(db, orgId, referral.id);
    expect(full?.events).toHaveLength(1);
    expect(full?.patient.consents.map((c) => [c.channel, c.purpose, c.status])).toEqual([['sms', 'appointment', 'granted']]);
  });

  it('reuses an existing referrer matched by email', async () => {
    const a = await createReferralFromPortal(db, 'summit-endo', intake, now);
    const b = await createReferralFromPortal(db, 'summit-endo', { ...intake, referrerEmail: 'nora.fields@example.com' }, now);
    expect(a.referrer.id).toBe(b.referrer.id);
  });

  it('rejects invalid input and unknown reasons', async () => {
    await expect(createReferralFromPortal(db, 'summit-endo', { ...intake, referrerEmail: 'nope' }, now)).rejects.toThrow();
    await expect(createReferralFromPortal(db, 'summit-endo', { ...intake, reason: 'braces' }, now)).rejects.toThrow(/Unknown referral reason/);
    await expect(createReferralFromPortal(db, 'no-such-practice', intake, now)).rejects.toThrow(/not found/);
  });
});

describe('referral transitions', () => {
  it('records timestamps and an audit trail, and rejects invalid moves', async () => {
    const { referral } = await createReferralFromPortal(db, 'summit-endo', intake, now);
    await transitionReferral(db, orgId, referral.id, 'scheduled', { now, actor: 'test' });
    const seen = await transitionReferral(db, orgId, referral.id, 'seen', { now });
    expect(seen.seenAt).toEqual(now);
    await expect(transitionReferral(db, orgId, referral.id, 'closed', { now })).rejects.toThrow(InvalidTransitionError);
    const full = await getReferral(db, orgId, referral.id);
    expect(full?.events.map((e) => e.toStatus)).toEqual(['received', 'scheduled', 'seen']);
  });

  it('cannot touch another organization\'s referral', async () => {
    const { referral } = await createReferralFromPortal(db, 'summit-endo', intake, now);
    await expect(transitionReferral(db, '00000000-0000-0000-0000-000000000000', referral.id, 'contacted')).rejects.toThrow(/not found/);
  });
});

describe('referrer health + dashboard on seeded data', () => {
  it('surfaces the varied referrer patterns from the demo seed', async () => {
    const referrers = await listReferrersWithHealth(db, orgId, now);
    const statuses = new Set(referrers.map((r) => r.health.status));
    expect(statuses.has('lapsed')).toBe(true);
    expect(statuses.has('dormant')).toBe(true);
    const hallstrom = referrers.find((r) => r.name.includes('Hallström'))!;
    expect(hallstrom.health.status).toBe('lapsed');
  });

  it('computes dashboard KPIs', async () => {
    const d = await getDashboard(db, orgId, now);
    expect(d.totalReferrers).toBeGreaterThan(10);
    expect(d.attention.length).toBeGreaterThan(0);
    expect(d.atRiskValueCents).toBeGreaterThan(0);
    expect(d.openCount).toBeGreaterThan(0);
  });

  it('logs outreach against a referrer', async () => {
    const [r] = await listReferrersWithHealth(db, orgId, now);
    const row = await logOutreach(db, orgId, r.id, { type: 'lunch_and_learn', occurredAt: now, owner: 'Kim' });
    expect(row.type).toBe('lunch_and_learn');
  });
});
