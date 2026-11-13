/**
 * Referring-provider relationship health.
 *
 * Pure function over a referrer's referral dates, so it is easy to test and
 * can later run as a nightly job. The goal is an early warning when a
 * referrer is drifting away — the core value of a specialist CRM.
 */

export type ReferrerHealthStatus = 'new' | 'growing' | 'steady' | 'declining' | 'lapsed' | 'dormant';

export interface ReferrerHealth {
  status: ReferrerHealthStatus;
  /** 0–100, higher is healthier. */
  score: number;
  totalReferrals: number;
  last90: number;
  prior90: number;
  /** Change in referrals: last 90 days vs. the 90 days before, in percent. Null when prior90 is 0. */
  trendPct: number | null;
  daysSinceLast: number | null;
  /** Median days between consecutive referrals. Null with fewer than 2 referrals. */
  typicalIntervalDays: number | null;
  /** Human-readable reason for the status, shown in alerts. */
  reason: string;
}

const DAY = 24 * 60 * 60 * 1000;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeReferrerHealth(referralDates: Date[], now: Date = new Date()): ReferrerHealth {
  const times = referralDates
    .map((d) => d.getTime())
    .filter((t) => t <= now.getTime())
    .sort((a, b) => a - b);
  const total = times.length;
  const nowMs = now.getTime();

  const last90 = times.filter((t) => t > nowMs - 90 * DAY).length;
  const prior90 = times.filter((t) => t <= nowMs - 90 * DAY && t > nowMs - 180 * DAY).length;
  const trendPct = prior90 === 0 ? null : Math.round(((last90 - prior90) / prior90) * 100);
  const daysSinceLast = total ? Math.floor((nowMs - times[total - 1]) / DAY) : null;

  const intervals = times.slice(1).map((t, i) => (t - times[i]) / DAY);
  const typicalIntervalDays = intervals.length ? Math.round(median(intervals)) : null;

  const base = { totalReferrals: total, last90, prior90, trendPct, daysSinceLast, typicalIntervalDays };

  if (total === 0) {
    return { ...base, status: 'new', score: 50, reason: 'No referrals yet' };
  }

  // Silence threshold: how long without a referral is unusual *for this referrer*.
  // At least 60 days, otherwise 2.5x their usual rhythm.
  const silenceThreshold = Math.max(60, (typicalIntervalDays ?? 60) * 2.5);
  const firstMs = times[0];
  const tenureDays = (nowMs - firstMs) / DAY;

  let status: ReferrerHealthStatus;
  let reason: string;

  if (daysSinceLast! > 365) {
    status = 'dormant';
    reason = `No referrals in over a year`;
  } else if (total >= 2 && daysSinceLast! > silenceThreshold) {
    status = 'lapsed';
    reason = `No referral in ${daysSinceLast} days (usually every ~${typicalIntervalDays} days)`;
  } else if (tenureDays < 90) {
    status = 'new';
    reason = `First referral ${Math.floor(tenureDays)} days ago`;
  } else if (prior90 >= 2 && last90 <= prior90 * 0.6) {
    status = 'declining';
    reason = `${last90} referrals in the last 90 days vs ${prior90} the 90 days before`;
  } else if (last90 >= 2 && last90 >= Math.max(prior90 * 1.3, prior90 + 1)) {
    status = 'growing';
    reason = `${last90} referrals in the last 90 days vs ${prior90} the 90 days before`;
  } else {
    status = 'steady';
    reason = `${last90} referrals in the last 90 days`;
  }

  return { ...base, status, score: scoreFor(status, last90, daysSinceLast!, silenceThreshold), reason };
}

function scoreFor(status: ReferrerHealthStatus, last90: number, daysSinceLast: number, silenceThreshold: number): number {
  // Volume component: saturates at 12 referrals / 90 days (~1 per week).
  const volume = Math.min(last90 / 12, 1) * 50;
  // Recency component: full marks if recent, zero at the silence threshold.
  const recency = Math.max(0, 1 - daysSinceLast / silenceThreshold) * 40;
  const adjustment: Record<ReferrerHealthStatus, number> = {
    growing: 10,
    steady: 5,
    new: 5,
    declining: -10,
    lapsed: -20,
    dormant: -40,
  };
  return Math.max(0, Math.min(100, Math.round(volume + recency + adjustment[status])));
}

export const NEEDS_ATTENTION: ReferrerHealthStatus[] = ['lapsed', 'declining'];

export const HEALTH_LABELS: Record<ReferrerHealthStatus, string> = {
  new: 'New',
  growing: 'Growing',
  steady: 'Steady',
  declining: 'Declining',
  lapsed: 'Lapsed',
  dormant: 'Dormant',
};
