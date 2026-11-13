/**
 * Demo data: an endodontic practice with ~18 months of referral history.
 * Referrer patterns are deliberately varied (growing, steady, declining,
 * lapsed, new, dormant) so the relationship-health features have something
 * real to show. All names are fictional. Deterministic (seeded PRNG).
 */
import { count } from 'drizzle-orm';
import type { DB } from './index';
import * as s from './schema';
import type { ReferralStatus } from './schema';

const DAY = 24 * 60 * 60 * 1000;

function prng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

type Pattern = 'growing' | 'steady' | 'declining' | 'lapsed' | 'new' | 'dormant';

const REFERRERS: { first: string; last: string; practice: string; city: string; pattern: Pattern; perMonth: number }[] = [
  { first: 'Maya', last: 'Okafor', practice: 'Lakeside Family Dental', city: 'Denver', pattern: 'steady', perMonth: 4 },
  { first: 'Daniel', last: 'Reyes', practice: 'Lakeside Family Dental', city: 'Denver', pattern: 'growing', perMonth: 3 },
  { first: 'Priya', last: 'Natarajan', practice: 'Cherry Creek Smiles', city: 'Denver', pattern: 'declining', perMonth: 4 },
  { first: 'Tom', last: 'Hallström', practice: 'Highlands Dental Group', city: 'Denver', pattern: 'lapsed', perMonth: 2.5 },
  { first: 'Grace', last: 'Liu', practice: 'Highlands Dental Group', city: 'Denver', pattern: 'steady', perMonth: 2 },
  { first: 'Marcus', last: 'Bell', practice: 'Aurora Dental Care', city: 'Aurora', pattern: 'lapsed', perMonth: 1.5 },
  { first: 'Sofia', last: 'Marino', practice: 'Golden Peak Dentistry', city: 'Golden', pattern: 'growing', perMonth: 2 },
  { first: 'Ahmed', last: 'Karimi', practice: 'Westminster Dental Arts', city: 'Westminster', pattern: 'new', perMonth: 2 },
  { first: 'Rachel', last: 'Stein', practice: 'Boulder Creek Dental', city: 'Boulder', pattern: 'declining', perMonth: 3 },
  { first: 'Victor', last: 'Nguyen', practice: 'Englewood Smile Studio', city: 'Englewood', pattern: 'dormant', perMonth: 1.5 },
  { first: 'Hannah', last: 'Brooks', practice: 'Parker Family Dentistry', city: 'Parker', pattern: 'steady', perMonth: 1.5 },
  { first: 'Luis', last: 'Ortega', practice: 'Arvada Dental Center', city: 'Arvada', pattern: 'new', perMonth: 1 },
];

const PATIENT_FIRST = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery', 'Quinn', 'Drew', 'Sam', 'Robin', 'Jesse', 'Kendall', 'Parker', 'Reese'];
const PATIENT_LAST = ['Adams', 'Baker', 'Carter', 'Diaz', 'Evans', 'Foster', 'Garcia', 'Hughes', 'Ito', 'Jensen', 'Kim', 'Lopez', 'Moore', 'Patel', 'Quinn', 'Rossi'];
const REASONS = ['rct', 'rct', 'rct', 'evaluation', 'retreatment', 'cracked_tooth', 'pain_dx', 'apicoectomy', 'trauma'];
const TEETH = ['3', '14', '19', '30', '2', '15', '18', '31', '8', '9', '12', '5'];

/** Monthly rate multiplier for month m (0 = 18 months ago, 17 = this month). */
function rateFor(pattern: Pattern, m: number): number {
  switch (pattern) {
    case 'steady':
      return 1;
    case 'growing':
      return m < 12 ? 0.6 : 1.6;
    case 'declining':
      return m < 12 ? 1.2 : m < 15 ? 0.8 : 0.25;
    case 'lapsed':
      return m < 13 ? 1 : 0;
    case 'new':
      return m < 16 ? 0 : 1.2;
    case 'dormant':
      return m < 4 ? 1 : 0;
  }
}

function statusForAge(ageDays: number, rand: () => number): ReferralStatus {
  if (ageDays > 45) return rand() < 0.08 ? 'lost' : 'closed';
  if (ageDays > 21) return rand() < 0.5 ? 'closed' : rand() < 0.5 ? 'report_sent' : 'treatment_complete';
  if (ageDays > 7) return (['scheduled', 'seen', 'treatment_complete', 'report_sent'] as const)[Math.floor(rand() * 4)];
  return (['received', 'received', 'contacted', 'scheduled'] as const)[Math.floor(rand() * 4)];
}

export async function seedDemoIfEmpty(db: DB, now: Date = new Date()): Promise<void> {
  const [{ value }] = await db.select({ value: count() }).from(s.organizations);
  if (value > 0) return;
  await seedDemo(db, now);
}

export async function seedDemo(db: DB, now: Date = new Date()): Promise<string> {
  const rand = prng(22);
  return db.transaction(async (tx) => {
    const [org] = await tx
      .insert(s.organizations)
      .values({ name: 'Summit Endodontics', slug: 'summit-endo', specialty: 'endodontics', timezone: 'America/Denver' })
      .returning();
    const [location] = await tx
      .insert(s.locations)
      .values({ organizationId: org.id, name: 'Summit Endodontics — Denver', phone: '(303) 555-0142', address: '1200 Example St, Denver, CO' })
      .returning();
    await tx.insert(s.providers).values([
      { organizationId: org.id, locationId: location.id, name: 'Dr. Elena Park', role: 'doctor' },
      { organizationId: org.id, locationId: location.id, name: 'Dr. James Whitfield', role: 'doctor' },
      { organizationId: org.id, locationId: location.id, name: 'Kim Alvarez', role: 'referral_coordinator' },
    ]);

    const practiceIds = new Map<string, string>();
    for (const r of REFERRERS) {
      if (practiceIds.has(r.practice)) continue;
      const [p] = await tx
        .insert(s.referringPractices)
        .values({ organizationId: org.id, name: r.practice, city: r.city, state: 'CO', phone: '(303) 555-01' + String(10 + practiceIds.size) })
        .returning();
      practiceIds.set(r.practice, p.id);
    }

    let patientN = 0;
    for (const r of REFERRERS) {
      const [rp] = await tx
        .insert(s.referringProviders)
        .values({
          organizationId: org.id,
          practiceId: practiceIds.get(r.practice)!,
          firstName: r.first,
          lastName: r.last,
          credential: 'DDS',
          email: `${r.first}.${r.last}@example.com`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
          preferredReportChannel: rand() < 0.7 ? 'email' : 'fax',
          relationshipOwner: rand() < 0.5 ? 'Dr. Elena Park' : 'Kim Alvarez',
        })
        .returning();

      for (let m = 0; m < 18; m++) {
        const expected = r.perMonth * rateFor(r.pattern, m);
        const n = Math.floor(expected) + (rand() < expected % 1 ? 1 : 0);
        for (let k = 0; k < n; k++) {
          const receivedAt = new Date(now.getTime() - (17 - m) * 30 * DAY - Math.floor(rand() * 30) * DAY);
          if (receivedAt > now) continue;
          const ageDays = (now.getTime() - receivedAt.getTime()) / DAY;
          const status = statusForAge(ageDays, rand);
          const [patient] = await tx
            .insert(s.patients)
            .values({
              organizationId: org.id,
              firstName: PATIENT_FIRST[Math.floor(rand() * PATIENT_FIRST.length)],
              lastName: PATIENT_LAST[Math.floor(rand() * PATIENT_LAST.length)],
              phone: `(720) 555-${String(1000 + patientN).slice(-4)}`,
            })
            .returning();
          patientN++;
          const at = (days: number) => new Date(receivedAt.getTime() + days * DAY);
          const reached = (st: ReferralStatus) => {
            const order: ReferralStatus[] = ['received', 'contacted', 'scheduled', 'seen', 'treatment_complete', 'report_sent', 'closed'];
            return status !== 'lost' && order.indexOf(status) >= order.indexOf(st);
          };
          const [ref] = await tx
            .insert(s.referrals)
            .values({
              organizationId: org.id,
              patientId: patient.id,
              referringProviderId: rp.id,
              locationId: location.id,
              specialty: 'endodontics',
              reason: REASONS[Math.floor(rand() * REASONS.length)],
              teeth: TEETH[Math.floor(rand() * TEETH.length)],
              urgency: rand() < 0.15 ? 'urgent' : 'routine',
              source: (['portal', 'fax', 'phone', 'email'] as const)[Math.floor(rand() * 4)],
              status,
              estimatedValueCents: 120000 + Math.floor(rand() * 8) * 10000,
              lostReason: status === 'lost' ? 'Patient chose extraction at GP' : null,
              receivedAt,
              contactedAt: reached('contacted') ? at(1) : null,
              scheduledAt: reached('scheduled') ? at(2) : null,
              seenAt: reached('seen') ? at(8) : null,
              treatmentCompletedAt: reached('treatment_complete') ? at(8) : null,
              reportSentAt: reached('report_sent') ? at(10) : null,
              closedAt: reached('closed') ? at(30) : null,
            })
            .returning();
          await tx.insert(s.referralEvents).values({ organizationId: org.id, referralId: ref.id, toStatus: 'received', at: receivedAt, actor: 'seed' });
          if (status !== 'received') {
            await tx.insert(s.referralEvents).values({ organizationId: org.id, referralId: ref.id, fromStatus: 'received', toStatus: status, at: at(1), actor: 'seed' });
          }
          await tx.insert(s.consentRecords).values({
            organizationId: org.id,
            patientId: patient.id,
            channel: 'sms',
            purpose: 'appointment',
            status: 'granted',
            source: 'referral_portal',
            recordedAt: receivedAt,
          });
        }
      }

      // A little outreach history.
      const visits = r.pattern === 'lapsed' || r.pattern === 'dormant' ? 1 : 2 + Math.floor(rand() * 3);
      for (let v = 0; v < visits; v++) {
        await tx.insert(s.outreachActivities).values({
          organizationId: org.id,
          referringProviderId: rp.id,
          practiceId: practiceIds.get(r.practice)!,
          type: (['office_visit', 'lunch_and_learn', 'gift', 'call', 'study_club'] as const)[Math.floor(rand() * 5)],
          occurredAt: new Date(now.getTime() - Math.floor(rand() * 400 + (r.pattern === 'lapsed' ? 150 : 10)) * DAY),
          owner: rp.relationshipOwner,
        });
      }
    }
    return org.id;
  });
}
