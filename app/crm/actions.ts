'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { outreachTypeEnum, referralStatusEnum } from '@/lib/db/schema';
import { transitionReferral } from '@/lib/services/referrals';
import { logOutreach } from '@/lib/services/referrers';
import { getCurrentOrg } from '@/lib/tenant';

const transitionInput = z.object({
  referralId: z.string().uuid(),
  to: z.enum(referralStatusEnum.enumValues),
  note: z.string().trim().max(1000).optional(),
}).refine((v) => v.to !== 'lost' || !!v.note, { message: 'A reason is required when marking a referral lost', path: ['note'] });

export async function moveReferral(formData: FormData) {
  const input = transitionInput.parse({
    referralId: formData.get('referralId'),
    to: formData.get('to'),
    note: formData.get('note') || undefined,
  });
  const { db, org } = await getCurrentOrg();
  await transitionReferral(db, org.id, input.referralId, input.to, { note: input.note, actor: 'Front desk' });
  revalidatePath('/crm', 'layout');
}

const outreachInput = z.object({
  referrerId: z.string().uuid(),
  type: z.enum(outreachTypeEnum.enumValues),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  owner: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export async function addOutreach(formData: FormData) {
  const input = outreachInput.parse({
    referrerId: formData.get('referrerId'),
    type: formData.get('type'),
    occurredAt: formData.get('occurredAt'),
    owner: formData.get('owner') || undefined,
    notes: formData.get('notes') || undefined,
  });
  const { db, org } = await getCurrentOrg();
  await logOutreach(db, org.id, input.referrerId, {
    type: input.type,
    occurredAt: new Date(`${input.occurredAt}T12:00:00`),
    owner: input.owner,
    notes: input.notes,
  });
  revalidatePath(`/crm/referrers/${input.referrerId}`);
  revalidatePath('/crm');
}
