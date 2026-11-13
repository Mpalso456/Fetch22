import { HEALTH_LABELS, type ReferrerHealthStatus } from '@/lib/referrers/health';
import { STATUS_LABELS } from '@/lib/referrals/status';
import type { ReferralStatus } from '@/lib/db/schema';

export function HealthBadge({ status }: { status: ReferrerHealthStatus }) {
  return <span className={`badge health-${status}`}>{HEALTH_LABELS[status]}</span>;
}

export function StatusBadge({ status }: { status: ReferralStatus }) {
  return <span className={`badge status-${status}`}>{STATUS_LABELS[status]}</span>;
}

export function Stat({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: 'warn' | 'good' }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export function Sparkline({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="spark" role="img" aria-label={`Referrals per month: ${data.map((d) => `${d.label} ${d.count}`).join(', ')}`}>
      {data.map((d, i) => (
        <div key={i} className="spark-col" title={`${d.label}: ${d.count}`}>
          <div className="spark-bar" style={{ height: `${(d.count / max) * 100}%` }} />
          <div className="spark-label">{d.label.slice(0, 1)}</div>
        </div>
      ))}
    </div>
  );
}
