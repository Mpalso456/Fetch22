import Link from 'next/link';
import { daysAgo } from '@/lib/format';
import { OPEN_STATUSES, STATUS_LABELS, nextStep } from '@/lib/referrals/status';
import { listReferrals } from '@/lib/services/referrals';
import { reasonLabel } from '@/lib/specialties';
import { getCurrentOrg } from '@/lib/tenant';
import { moveReferral } from '../actions';

export const dynamic = 'force-dynamic';

export default async function ReferralPipeline() {
  const { db, org } = await getCurrentOrg();
  const referrals = await listReferrals(db, org.id, OPEN_STATUSES);
  const now = new Date();

  return (
    <>
      <h1>Referral pipeline</h1>
      <p className="muted">Every open referral from received to report sent. Move each one forward as the patient progresses; the referring doctor's report is due once treatment is complete.</p>
      <div className="board">
        {OPEN_STATUSES.map((status) => {
          const col = referrals.filter((r) => r.status === status);
          return (
            <section key={status} className="board-col">
              <h2>
                {STATUS_LABELS[status]} <span className="muted">{col.length}</span>
              </h2>
              {col.map((r) => {
                const next = nextStep(r.status);
                const ageDays = Math.floor((now.getTime() - r.receivedAt.getTime()) / 86400000);
                return (
                  <article key={r.id} className={`ticket ${r.urgency !== 'routine' ? 'ticket-urgent' : ''}`}>
                    <Link href={`/crm/referrals/${r.id}`} className="ticket-title">
                      {r.patient.firstName} {r.patient.lastName}
                    </Link>
                    <div className="small">
                      {reasonLabel(r.specialty, r.reason)}
                      {r.teeth ? ` · #${r.teeth}` : ''}
                    </div>
                    <div className="muted small">
                      {r.referringProvider ? `Dr. ${r.referringProvider.lastName}` : 'Self-referred'} · {daysAgo(r.receivedAt, now)}
                    </div>
                    {r.urgency !== 'routine' && <span className="badge urgent">{r.urgency}</span>}
                    {status === 'received' && ageDays > 2 && <span className="badge warn">waiting {ageDays} d</span>}
                    {next && (
                      <form action={moveReferral}>
                        <input type="hidden" name="referralId" value={r.id} />
                        <input type="hidden" name="to" value={next} />
                        <button className="btn-small" type="submit">
                          → {STATUS_LABELS[next]}
                        </button>
                      </form>
                    )}
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}
