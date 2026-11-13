'use server';

import { redirect } from 'next/navigation';
import { ZodError } from 'zod';
import { getDb } from '@/lib/db';
import { createReferralFromPortal } from '@/lib/services/referrals';

export interface ReferralFormState {
  errors?: Record<string, string>;
  message?: string;
}

export async function submitReferral(slug: string, _prev: ReferralFormState, formData: FormData): Promise<ReferralFormState> {
  const raw = Object.fromEntries(formData.entries());
  try {
    const db = await getDb();
    await createReferralFromPortal(db, slug, raw);
  } catch (err) {
    if (err instanceof ZodError) {
      const errors: Record<string, string> = {};
      for (const issue of err.issues) {
        const key = String(issue.path[0] ?? 'form');
        errors[key] ??= issue.message;
      }
      return { errors, message: 'Please correct the highlighted fields.' };
    }
    console.error('Referral submission failed', err instanceof Error ? err.message : err);
    return { message: 'Something went wrong submitting this referral. Please call our office.' };
  }
  redirect(`/refer/${slug}/thanks`);
}
