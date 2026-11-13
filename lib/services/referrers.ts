import { and, desc, eq } from 'drizzle-orm';
import type { DB } from '../db';
import * as s from '../db/schema';
import type { OutreachType } from '../db/schema';
import { computeReferrerHealth, type ReferrerHealth } from '../referrers/health';

export interface ReferrerSummary {
  id: string;
  name: string;
  credential: string;
  practiceName: string | null;
  city: string | null;
  email: string | null;
  relationshipOwner: string | null;
  health: ReferrerHealth;
  lastOutreachAt: Date | null;
  /** Estimated value (cents) of referrals received in the last 12 months. */
  value12mCents: number;
}

const DAY = 24 * 60 * 60 * 1000;

export async function listReferrersWithHealth(db: DB, organizationId: string, now: Date = new Date()): Promise<ReferrerSummary[]> {
  const rows = await db.query.referringProviders.findMany({
    where: eq(s.referringProviders.organizationId, organizationId),
    with: {
      practice: true,
      referrals: { columns: { receivedAt: true, estimatedValueCents: true, status: true } },
      outreach: { columns: { occurredAt: true }, orderBy: [desc(s.outreachActivities.occurredAt)], limit: 1 },
    },
  });

  return rows
    .map((r) => {
      const health = computeReferrerHealth(
        r.referrals.map((x) => x.receivedAt),
        now,
      );
      const value12mCents = r.referrals
        .filter((x) => x.receivedAt.getTime() > now.getTime() - 365 * DAY && x.status !== 'lost')
        .reduce((sum, x) => sum + (x.estimatedValueCents ?? 0), 0);
      return {
        id: r.id,
        name: `Dr. ${r.firstName} ${r.lastName}`,
        credential: r.credential,
        practiceName: r.practice?.name ?? null,
        city: r.practice?.city ?? null,
        email: r.email,
        relationshipOwner: r.relationshipOwner,
        health,
        lastOutreachAt: r.outreach[0]?.occurredAt ?? null,
        value12mCents,
      };
    })
    .sort((a, b) => b.value12mCents - a.value12mCents);
}

export async function getReferrer(db: DB, organizationId: string, referrerId: string, now: Date = new Date()) {
  const r = await db.query.referringProviders.findFirst({
    where: and(eq(s.referringProviders.id, referrerId), eq(s.referringProviders.organizationId, organizationId)),
    with: {
      practice: true,
      referrals: { orderBy: [desc(s.referrals.receivedAt)], with: { patient: true } },
      outreach: { orderBy: [desc(s.outreachActivities.occurredAt)] },
    },
  });
  if (!r) return null;
  const health = computeReferrerHealth(
    r.referrals.map((x) => x.receivedAt),
    now,
  );
  return { ...r, health };
}

/** Referrals per month for the last `months` months (oldest first), for a sparkline. */
export function monthlyCounts(dates: Date[], months: number, now: Date = new Date()): { label: string; count: number }[] {
  const out: { label: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({
      label: start.toLocaleString('en-US', { month: 'short' }),
      count: dates.filter((d) => d >= start && d < end).length,
    });
  }
  return out;
}

export async function logOutreach(
  db: DB,
  organizationId: string,
  referrerId: string,
  input: { type: OutreachType; occurredAt: Date; owner?: string; notes?: string },
) {
  const referrer = await db.query.referringProviders.findFirst({
    where: and(eq(s.referringProviders.id, referrerId), eq(s.referringProviders.organizationId, organizationId)),
  });
  if (!referrer) throw new Error('Referring provider not found');
  const [row] = await db
    .insert(s.outreachActivities)
    .values({
      organizationId,
      referringProviderId: referrerId,
      practiceId: referrer.practiceId,
      type: input.type,
      occurredAt: input.occurredAt,
      owner: input.owner,
      notes: input.notes,
    })
    .returning();
  return row;
}
