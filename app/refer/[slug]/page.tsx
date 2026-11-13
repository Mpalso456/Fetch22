import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getOrganizationBySlug } from '@/lib/services/referrals';
import { getPack } from '@/lib/specialties';
import { ReferralForm } from './referral-form';

export const dynamic = 'force-dynamic';

export default async function ReferPage({ params }: { params: { slug: string } }) {
  const db = await getDb();
  const org = await getOrganizationBySlug(db, params.slug);
  if (!org) notFound();
  const pack = getPack(org.specialty);

  return (
    <main className="portal">
      <header className="portal-head">
        <div className="muted small">Secure referral</div>
        <h1>Refer a patient to {org.name}</h1>
        <p className="muted">
          {pack.label}. We&apos;ll contact your patient to schedule, keep you updated, and send you a report when treatment is complete.
        </p>
      </header>
      <ReferralForm slug={org.slug} reasons={pack.referralReasons} />
      <p className="muted small portal-foot">Submitted information is transmitted securely and used only to coordinate this patient&apos;s care.</p>
    </main>
  );
}
