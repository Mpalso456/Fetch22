import Link from 'next/link';
import { daysAgo, money, pct } from '@/lib/format';
import { getDashboard } from '@/lib/services/dashboard';
import { getCurrentOrg } from '@/lib/tenant';
import { HealthBadge, Stat } from './components';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const { db, org } = await getCurrentOrg();
  const d = await getDashboard(db, org.id);
  const trend = d.prior30 ? Math.round(((d.last30 - d.prior30) / d.prior30) * 100) : null;

  return (
    <>
      <h1>Dashboard</h1>
      <section className="stats">
        <Stat label="Referrals, last 30 days" value={d.last30} hint={`${pct(trend)} vs prior 30 days`} tone={trend !== null && trend < 0 ? 'warn' : 'good'} />
        <Stat label="Open referrals" value={d.openCount} hint={`${money(d.openValueCents)} in pipeline`} />
        <Stat label="Not yet scheduled" value={d.unscheduledCount} hint={`${d.staleNewCount} waiting > 2 days`} tone={d.staleNewCount ? 'warn' : undefined} />
        <Stat label="Reports owed to referrers" value={d.reportsOwedCount} hint={`${d.overdueReportsCount} overdue`} tone={d.overdueReportsCount ? 'warn' : undefined} />
        <Stat label="Active referring doctors" value={`${d.activeReferrers}/${d.totalReferrers}`} hint="referred in last 90 days" />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Relationships needing attention</h2>
          <span className="muted">{money(d.atRiskValueCents)} of referral value in the last 12 months</span>
        </div>
        {d.attention.length === 0 ? (
          <p className="muted">All referring relationships look healthy.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Referring doctor</th>
                <th>Status</th>
                <th>Why</th>
                <th>Last outreach</th>
                <th className="num">12-mo value</th>
              </tr>
            </thead>
            <tbody>
              {d.attention.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/crm/referrers/${r.id}`}>{r.name}</Link>
                    <div className="muted small">{r.practiceName}</div>
                  </td>
                  <td>
                    <HealthBadge status={r.health.status} />
                  </td>
                  <td className="small">{r.health.reason}</td>
                  <td className="small">{daysAgo(r.lastOutreachAt)}</td>
                  <td className="num">{money(r.value12mCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Top referring doctors</h2>
          <Link href="/crm/referrers">View all →</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Referring doctor</th>
              <th>Health</th>
              <th className="num">Last 90 days</th>
              <th className="num">Trend</th>
              <th className="num">12-mo value</th>
            </tr>
          </thead>
          <tbody>
            {d.topReferrers.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/crm/referrers/${r.id}`}>{r.name}</Link>
                  <div className="muted small">{r.practiceName}</div>
                </td>
                <td>
                  <HealthBadge status={r.health.status} />
                </td>
                <td className="num">{r.health.last90}</td>
                <td className="num">{pct(r.health.trendPct)}</td>
                <td className="num">{money(r.value12mCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
