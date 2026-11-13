import Link from 'next/link';
import { daysAgo, money, pct } from '@/lib/format';
import { HEALTH_LABELS, type ReferrerHealthStatus } from '@/lib/referrers/health';
import { listReferrersWithHealth } from '@/lib/services/referrers';
import { getCurrentOrg } from '@/lib/tenant';
import { HealthBadge } from '../components';

export const dynamic = 'force-dynamic';

export default async function Referrers({ searchParams }: { searchParams: { status?: string } }) {
  const { db, org } = await getCurrentOrg();
  const all = await listReferrersWithHealth(db, org.id);
  const filter = searchParams.status as ReferrerHealthStatus | undefined;
  const rows = filter && filter in HEALTH_LABELS ? all.filter((r) => r.health.status === filter) : all;
  const counts = all.reduce<Record<string, number>>((acc, r) => ((acc[r.health.status] = (acc[r.health.status] ?? 0) + 1), acc), {});

  return (
    <>
      <h1>Referring doctors</h1>
      <div className="filters">
        <Link href="/crm/referrers" className={!filter ? 'chip active' : 'chip'}>
          All ({all.length})
        </Link>
        {(Object.keys(HEALTH_LABELS) as ReferrerHealthStatus[])
          .filter((s) => counts[s])
          .map((s) => (
            <Link key={s} href={`/crm/referrers?status=${s}`} className={filter === s ? 'chip active' : 'chip'}>
              {HEALTH_LABELS[s]} ({counts[s]})
            </Link>
          ))}
      </div>
      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Referring doctor</th>
              <th>Practice</th>
              <th>Health</th>
              <th className="num">Score</th>
              <th className="num">Last 90 d</th>
              <th className="num">Trend</th>
              <th>Last referral</th>
              <th>Last outreach</th>
              <th className="num">12-mo value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/crm/referrers/${r.id}`}>{r.name}</Link>
                </td>
                <td className="small">
                  {r.practiceName}
                  <div className="muted">{r.city}</div>
                </td>
                <td>
                  <HealthBadge status={r.health.status} />
                </td>
                <td className="num">{r.health.score}</td>
                <td className="num">{r.health.last90}</td>
                <td className="num">{pct(r.health.trendPct)}</td>
                <td className="small">{r.health.daysSinceLast === null ? 'never' : `${r.health.daysSinceLast} days ago`}</td>
                <td className="small">{daysAgo(r.lastOutreachAt)}</td>
                <td className="num">{money(r.value12mCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
