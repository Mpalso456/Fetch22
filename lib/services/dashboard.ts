import { eq } from 'drizzle-orm';
import type { DB } from '../db';
import * as s from '../db/schema';
import { OPEN_STATUSES, REPORT_OWED_STATUSES } from '../referrals/status';
import { NEEDS_ATTENTION } from '../referrers/health';
import { listReferrersWithHealth } from './referrers';

const DAY = 24 * 60 * 60 * 1000;

export async function getDashboard(db: DB, organizationId: string, now: Date = new Date()) {
  const referrals = await db.query.referrals.findMany({
    where: eq(s.referrals.organizationId, organizationId),
    columns: { id: true, status: true, receivedAt: true, seenAt: true, treatmentCompletedAt: true, estimatedValueCents: true, urgency: true },
  });
  const referrers = await listReferrersWithHealth(db, organizationId, now);

  const inWindow = (d: Date, fromDays: number, toDays: number) =>
    d.getTime() > now.getTime() - fromDays * DAY && d.getTime() <= now.getTime() - toDays * DAY;

  const last30 = referrals.filter((r) => inWindow(r.receivedAt, 30, 0)).length;
  const prior30 = referrals.filter((r) => inWindow(r.receivedAt, 60, 30)).length;
  const open = referrals.filter((r) => OPEN_STATUSES.includes(r.status));
  const unscheduled = referrals.filter((r) => r.status === 'received' || r.status === 'contacted');
  const reportsOwed = referrals.filter((r) => REPORT_OWED_STATUSES.includes(r.status));
  const overdueReports = reportsOwed.filter((r) => {
    const anchor = r.treatmentCompletedAt ?? r.seenAt;
    return anchor && now.getTime() - anchor.getTime() > 2 * DAY;
  });
  const staleNew = unscheduled.filter((r) => now.getTime() - r.receivedAt.getTime() > 2 * DAY);

  const attention = referrers
    .filter((r) => NEEDS_ATTENTION.includes(r.health.status))
    .sort((a, b) => b.value12mCents - a.value12mCents);
  const atRiskValueCents = attention.reduce((sum, r) => sum + r.value12mCents, 0);

  return {
    last30,
    prior30,
    openCount: open.length,
    openValueCents: open.reduce((sum, r) => sum + (r.estimatedValueCents ?? 0), 0),
    unscheduledCount: unscheduled.length,
    staleNewCount: staleNew.length,
    reportsOwedCount: reportsOwed.length,
    overdueReportsCount: overdueReports.length,
    attention,
    atRiskValueCents,
    topReferrers: referrers.slice(0, 8),
    activeReferrers: referrers.filter((r) => r.health.last90 > 0).length,
    totalReferrers: referrers.length,
  };
}
