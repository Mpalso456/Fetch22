import Link from 'next/link';
import { notFound } from 'next/navigation';
import { outreachTypeEnum } from '@/lib/db/schema';
import { money, pct, shortDate } from '@/lib/format';
import { getReferrer, monthlyCounts } from '@/lib/services/referrers';
import { reasonLabel } from '@/lib/specialties';
import { getCurrentOrg } from '@/lib/tenant';
import { addOutreach } from '../../actions';
import { HealthBadge, Sparkline, Stat, StatusBadge } from '../../components';

export const dynamic = 'force-dynamic';

const OUTREACH_LABELS: Record<(typeof outreachTypeEnum.enumValues)[number], string> = {
  office_visit: 'Office visit',
  lunch_and_learn: 'Lunch & learn',
  ce_event: 'CE event',
  gift: 'Gift / thank-you',
  call: 'Phone call',
  email: 'Email',
  study_club: 'Study club',
};

export default async function ReferrerDetail({ params }: { params: { id: string } }) {
  const { db, org } = await getCurrentOrg();
  if (!/^[0-9a-f-]{36}$/.test(params.id)) notFound();
  const r = await getReferrer(db, org.id, params.id);
  if (!r) notFound();
  const h = r.health;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <p className="crumbs">
        <Link href="/crm/referrers">← Referring doctors</Link>
      </p>
      <div className="title-row">
        <h1>
          Dr. {r.firstName} {r.lastName}, {r.credential}
        </h1>
        <HealthBadge status={h.status} />
      </div>
      <p className="muted">
        {r.practice?.name}
        {r.practice?.city ? ` · ${r.practice.city}, ${r.practice.state}` : ''} · {r.email ?? 'no email'} · reports by {r.preferredReportChannel}
        {r.relationshipOwner ? ` · owner: ${r.relationshipOwner}` : ''}
      </p>
      {(h.status === 'lapsed' || h.status === 'declining') && <div className="alert">{h.reason}. Consider reaching out.</div>}

      <section className="stats">
        <Stat label="Health score" value={h.score} />
        <Stat label="Last 90 days" value={h.last90} hint={`${pct(h.trendPct)} vs prior 90`} />
        <Stat label="All-time referrals" value={h.totalReferrals} />
        <Stat label="Usual interval" value={h.typicalIntervalDays ? `${h.typicalIntervalDays} d` : '—'} hint={h.daysSinceLast !== null ? `last ${h.daysSinceLast} days ago` : undefined} />
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Referrals per month</h2>
          <Sparkline data={monthlyCounts(r.referrals.map((x) => x.receivedAt), 12)} />
          <h2 style={{ marginTop: 20 }}>Referral history</h2>
          <table>
            <thead>
              <tr>
                <th>Received</th>
                <th>Patient</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="num">Value</th>
              </tr>
            </thead>
            <tbody>
              {r.referrals.slice(0, 25).map((x) => (
                <tr key={x.id}>
                  <td className="small">{shortDate(x.receivedAt)}</td>
                  <td>
                    <Link href={`/crm/referrals/${x.id}`}>
                      {x.patient.firstName} {x.patient.lastName}
                    </Link>
                  </td>
                  <td className="small">
                    {reasonLabel(x.specialty, x.reason)}
                    {x.teeth ? ` · #${x.teeth}` : ''}
                  </td>
                  <td>
                    <StatusBadge status={x.status} />
                  </td>
                  <td className="num">{x.estimatedValueCents ? money(x.estimatedValueCents) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>Log outreach</h2>
          <form action={addOutreach} className="form">
            <input type="hidden" name="referrerId" value={r.id} />
            <label>
              Type
              <select name="type" required defaultValue="office_visit">
                {outreachTypeEnum.enumValues.map((t) => (
                  <option key={t} value={t}>
                    {OUTREACH_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input type="date" name="occurredAt" required defaultValue={today} max={today} />
            </label>
            <label>
              By
              <input name="owner" defaultValue={r.relationshipOwner ?? ''} />
            </label>
            <label>
              Notes
              <textarea name="notes" rows={3} />
            </label>
            <button className="btn" type="submit">
              Save
            </button>
          </form>
          <h2 style={{ marginTop: 20 }}>Outreach history</h2>
          {r.outreach.length === 0 ? (
            <p className="muted">No outreach logged yet.</p>
          ) : (
            <ul className="timeline">
              {r.outreach.map((o) => (
                <li key={o.id}>
                  <strong>{OUTREACH_LABELS[o.type]}</strong> · {shortDate(o.occurredAt)}
                  {o.owner ? ` · ${o.owner}` : ''}
                  {o.notes && <div className="muted small">{o.notes}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
