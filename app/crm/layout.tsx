import Link from 'next/link';
import { isDemoMode } from '@/lib/db';
import { getPack } from '@/lib/specialties';
import { getCurrentOrg } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const { org } = await getCurrentOrg();
  return (
    <div className="crm">
      <header className="crm-header">
        <div className="crm-header-inner">
          <Link href="/crm" className="brand">
            Fetch 22 <span className="brand-sub">Specialist CRM</span>
          </Link>
          <nav className="crm-nav">
            <Link href="/crm">Dashboard</Link>
            <Link href="/crm/referrers">Referring doctors</Link>
            <Link href="/crm/referrals">Referrals</Link>
            <Link href={`/refer/${org.slug}`} target="_blank">
              Referral portal ↗
            </Link>
          </nav>
          <div className="org-chip">
            {org.name} · {getPack(org.specialty).shortLabel}
          </div>
        </div>
      </header>
      {isDemoMode() && <div className="demo-banner">Demo data — fictional practice, doctors and patients.</div>}
      <main className="crm-main">{children}</main>
    </div>
  );
}
