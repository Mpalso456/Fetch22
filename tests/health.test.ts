import { describe, expect, it } from 'vitest';
import { computeReferrerHealth } from '@/lib/referrers/health';

const now = new Date('2026-11-13T12:00:00Z');
const daysAgo = (...d: number[]) => d.map((n) => new Date(now.getTime() - n * 86400000));

describe('computeReferrerHealth', () => {
  it('treats a referrer with no referrals as new', () => {
    const h = computeReferrerHealth([], now);
    expect(h.status).toBe('new');
    expect(h.daysSinceLast).toBeNull();
  });

  it('flags a regular referrer who has gone quiet as lapsed', () => {
    // Referred roughly every 14 days, then nothing for 75 days.
    const h = computeReferrerHealth(daysAgo(75, 89, 103, 117, 131, 145, 159, 173), now);
    expect(h.status).toBe('lapsed');
    expect(h.typicalIntervalDays).toBe(14);
    expect(h.reason).toMatch(/75 days/);
  });

  it('does not flag an infrequent referrer within their normal rhythm', () => {
    // Refers about every 45 days; last one 50 days ago -> within 2.5x rhythm.
    const h = computeReferrerHealth(daysAgo(50, 95, 140, 185, 230), now);
    expect(h.status).not.toBe('lapsed');
  });

  it('detects decline vs the prior 90 days', () => {
    const h = computeReferrerHealth(daysAgo(10, 100, 110, 120, 130, 140, 150), now);
    expect(h.last90).toBe(1);
    expect(h.prior90).toBe(6);
    expect(h.status).toBe('declining');
    expect(h.trendPct).toBe(-83);
  });

  it('detects growth', () => {
    const h = computeReferrerHealth(daysAgo(5, 15, 25, 35, 45, 60, 120, 200), now);
    expect(h.status).toBe('growing');
  });

  it('marks year-long silence as dormant with a low score', () => {
    const h = computeReferrerHealth(daysAgo(400, 420, 440), now);
    expect(h.status).toBe('dormant');
    expect(h.score).toBeLessThan(10);
  });

  it('marks first-quarter referrers as new', () => {
    const h = computeReferrerHealth(daysAgo(5, 30), now);
    expect(h.status).toBe('new');
  });

  it('ignores future-dated referrals', () => {
    const h = computeReferrerHealth([new Date(now.getTime() + 86400000)], now);
    expect(h.totalReferrals).toBe(0);
  });

  it('scores healthy referrers above lapsed ones', () => {
    const steady = computeReferrerHealth(daysAgo(3, 10, 20, 35, 50, 70, 95, 110, 130, 150, 170), now);
    const lapsed = computeReferrerHealth(daysAgo(80, 94, 108, 122, 136), now);
    expect(steady.score).toBeGreaterThan(lapsed.score);
  });
});
