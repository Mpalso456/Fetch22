/**
 * Resolves the organization the CRM is operating on.
 *
 * PRE-AUTH STAND-IN: until real user accounts exist, the CRM serves a single
 * organization — the seeded demo practice, or CRM_ORG_SLUG when connected to a
 * real database. Access is gated by middleware.ts (HTTP Basic auth).
 */
import { getDb, isDemoMode } from './db';
import { getOrganizationBySlug } from './services/referrals';

export async function getCurrentOrg() {
  const db = await getDb();
  const slug = process.env.CRM_ORG_SLUG ?? (isDemoMode() ? 'summit-endo' : undefined);
  if (!slug) throw new Error('CRM_ORG_SLUG must be set when DATABASE_URL is configured');
  const org = await getOrganizationBySlug(db, slug);
  if (!org) throw new Error(`Organization "${slug}" not found`);
  return { db, org };
}
