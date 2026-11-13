import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { DB } from '../db';
import * as s from '../db/schema';
import type { ReferralStatus } from '../db/schema';
import { referralIntakeSchema } from '../referrals/intake';
import { STATUS_TIMESTAMP, assertTransition } from '../referrals/status';
import { getPack } from '../specialties';

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}

export async function getOrganizationBySlug(db: DB, slug: string) {
  return db.query.organizations.findFirst({ where: eq(s.organizations.slug, slug) });
}

/**
 * Create a referral submitted through the public referral portal.
 * Matches the referring provider by email (creating provider + practice if new).
 */
export async function createReferralFromPortal(db: DB, orgSlug: string, raw: unknown, now: Date = new Date()) {
  const input = referralIntakeSchema.parse(raw);
  const org = await getOrganizationBySlug(db, orgSlug);
  if (!org) throw new NotFoundError('Practice');
  const pack = getPack(org.specialty);
  if (!(input.reason in pack.referralReasons)) {
    throw new Error(`Unknown referral reason "${input.reason}" for ${pack.label}`);
  }

  return db.transaction(async (tx) => {
    let referrer = await tx.query.referringProviders.findFirst({
      where: and(eq(s.referringProviders.organizationId, org.id), eq(s.referringProviders.email, input.referrerEmail)),
    });
    if (!referrer) {
      let practice = await tx.query.referringPractices.findFirst({
        where: and(eq(s.referringPractices.organizationId, org.id), eq(s.referringPractices.name, input.practiceName)),
      });
      if (!practice) {
        [practice] = await tx
          .insert(s.referringPractices)
          .values({ organizationId: org.id, name: input.practiceName, phone: input.referrerPhone })
          .returning();
      }
      [referrer] = await tx
        .insert(s.referringProviders)
        .values({
          organizationId: org.id,
          practiceId: practice.id,
          firstName: input.referrerFirstName,
          lastName: input.referrerLastName,
          email: input.referrerEmail,
          phone: input.referrerPhone,
        })
        .returning();
    }

    const [patient] = await tx
      .insert(s.patients)
      .values({
        organizationId: org.id,
        firstName: input.patientFirstName,
        lastName: input.patientLastName,
        phone: input.patientPhone,
        dateOfBirth: input.patientDateOfBirth,
      })
      .returning();

    const [referral] = await tx
      .insert(s.referrals)
      .values({
        organizationId: org.id,
        patientId: patient.id,
        referringProviderId: referrer.id,
        specialty: org.specialty,
        reason: input.reason,
        teeth: input.teeth,
        clinicalNotes: input.clinicalNotes,
        urgency: input.urgency,
        source: 'portal',
        status: 'received',
        estimatedValueCents: pack.defaultCaseValueCents,
        receivedAt: now,
      })
      .returning();

    await tx.insert(s.referralEvents).values({
      organizationId: org.id,
      referralId: referral.id,
      toStatus: 'received',
      actor: `${input.referrerFirstName} ${input.referrerLastName} (portal)`,
      at: now,
    });

    if (input.patientConsentsToText) {
      await tx.insert(s.consentRecords).values({
        organizationId: org.id,
        patientId: patient.id,
        channel: 'sms',
        purpose: 'appointment',
        status: 'granted',
        source: `referral_portal:${referrer.id}`,
        recordedAt: now,
      });
    }

    return { referral, referrer, patient, organization: org };
  });
}

export async function transitionReferral(
  db: DB,
  organizationId: string,
  referralId: string,
  to: ReferralStatus,
  opts: { note?: string; actor?: string; lostReason?: string; now?: Date } = {},
) {
  const now = opts.now ?? new Date();
  return db.transaction(async (tx) => {
    const current = await tx.query.referrals.findFirst({
      where: and(eq(s.referrals.id, referralId), eq(s.referrals.organizationId, organizationId)),
    });
    if (!current) throw new NotFoundError('Referral');
    assertTransition(current.status, to);

    const tsField = STATUS_TIMESTAMP[to];
    const [updated] = await tx
      .update(s.referrals)
      .set({
        status: to,
        ...(tsField ? { [tsField]: now } : {}),
        ...(to === 'lost' ? { lostReason: opts.lostReason ?? opts.note ?? null } : {}),
      })
      .where(eq(s.referrals.id, referralId))
      .returning();

    await tx.insert(s.referralEvents).values({
      organizationId,
      referralId,
      fromStatus: current.status,
      toStatus: to,
      note: opts.note,
      actor: opts.actor,
      at: now,
    });
    return updated;
  });
}

export async function listReferrals(db: DB, organizationId: string, statuses?: ReferralStatus[]) {
  return db.query.referrals.findMany({
    where: statuses?.length
      ? and(eq(s.referrals.organizationId, organizationId), inArray(s.referrals.status, statuses))
      : eq(s.referrals.organizationId, organizationId),
    orderBy: [desc(s.referrals.receivedAt)],
    with: { patient: true, referringProvider: { with: { practice: true } } },
  });
}

export async function getReferral(db: DB, organizationId: string, referralId: string) {
  return db.query.referrals.findFirst({
    where: and(eq(s.referrals.id, referralId), eq(s.referrals.organizationId, organizationId)),
    with: {
      patient: { with: { consents: true } },
      referringProvider: { with: { practice: true } },
      events: { orderBy: [asc(s.referralEvents.at)] },
    },
  });
}
