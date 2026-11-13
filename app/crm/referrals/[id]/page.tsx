import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentConsent } from '@/lib/messaging/compliance';
import { money, shortDate } from '@/lib/format';
import { STATUS_LABELS, allowedTransitions } from '@/lib/referrals/status';
import { getReferral } from '@/lib/services/referrals';
import { getPack, reasonLabel } from '@/lib/specialties';
import { getCurrentOrg } from '@/lib/tenant';
import { moveReferral } from '../../actions';
import { StatusBadge } from '../../components';

export const dynamic = 'force-dynamic';

export default async function ReferralDetail({ params }: { params: { id: string } }) {
  const { db, org } = await getCurrentOrg();
  if (!/^[0-9a-f-]{36}$/.test(params.id)) notFound();
  const r = await getReferral(db, org.id, params.id);
  if (!r) notFound();
  const pack = getPack(r.specialty);
  const smsConsent = currentConsent(
    r.patient.consents.map((c) => ({ ...c })),
    'sms',
    'appointment',
  );
  const moves = allowedTransitions(r.status);

  return (
    <>
      <p className="crumbs">
        <Link href="/crm/referrals">← Referral pipeline</Link>
      </p>
      <div className="title-row">
        <h1>
          {r.patient.firstName} {r.patient.lastName}
        </h1>
        <StatusBadge status={r.status} />
        {r.urgency !== 'routine' && <span className="badge urgent">{r.urgency}</span>}
      </div>
      <p className="muted">
        {reasonLabel(r.specialty, r.reason)}
        {r.teeth ? ` · tooth #${r.teeth}` : ''} · via {r.source} · received {shortDate(r.receivedAt)}
        {r.estimatedValueCents ? ` · est. ${money(r.estimatedValueCents)}` : ''}
      </p>

      <div className="grid-2">
        <section className="card">
          <h2>Referred by</h2>
          {r.referringProvider ? (
            <p>
              <Link href={`/crm/referrers/${r.referringProvider.id}`}>
                Dr. {r.referringProvider.firstName} {r.referringProvider.lastName}
              </Link>
              <br />
              <span className="muted small">
                {r.referringProvider.practice?.name} · report by {r.referringProvider.preferredReportChannel}
              </span>
            </p>
          ) : (
            <p className="muted">Self-referred</p>
          )}
          {r.clinicalNotes && (
            <>
              <h2>Clinical notes from referrer</h2>
              <p>{r.clinicalNotes}</p>
            </>
          )}
          <h2>Patient contact</h2>
          <p className="small">
            {r.patient.phone ?? 'No phone'} · Text reminders:{' '}
            {smsConsent?.status === 'granted' ? <span className="ok">consent on file</span> : smsConsent?.status === 'revoked' ? <span className="warn-text">opted out</span> : <span className="muted">no explicit consent (exempt reminders only)</span>}
          </p>
          <h2>Report checklist for the referring doctor</h2>
          <ul className="checklist">
            {pack.reportChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Update status</h2>
          {moves.length === 0 ? (
            <p className="muted">This referral is closed.</p>
          ) : (
            <form action={moveReferral} className="form">
              <input type="hidden" name="referralId" value={r.id} />
              <label>
                Move to
                <select name="to" required>
                  {moves.map((m) => (
                    <option key={m} value={m}>
                      {STATUS_LABELS[m]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Note (required reason if marking lost)
                <input name="note" />
              </label>
              <button className="btn" type="submit">
                Update
              </button>
            </form>
          )}
          <h2 style={{ marginTop: 20 }}>Timeline</h2>
          <ul className="timeline">
            {r.events.map((e) => (
              <li key={e.id}>
                <strong>{STATUS_LABELS[e.toStatus]}</strong> · {shortDate(e.at)}
                {e.actor ? ` · ${e.actor}` : ''}
                {e.note && <div className="muted small">{e.note}</div>}
              </li>
            ))}
          </ul>
          {r.lostReason && <p className="warn-text small">Lost: {r.lostReason}</p>}
        </section>
      </div>
    </>
  );
}
