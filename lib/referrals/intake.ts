/** Validation for the public referral portal form (submitted by referring offices). */
import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : undefined));

export const referralIntakeSchema = z.object({
  referrerFirstName: z.string().trim().min(1, 'Referring doctor first name is required').max(100),
  referrerLastName: z.string().trim().min(1, 'Referring doctor last name is required').max(100),
  referrerEmail: z.string().trim().toLowerCase().email('A valid email is required so we can send your report'),
  referrerPhone: optionalText,
  practiceName: z.string().trim().min(1, 'Practice name is required').max(200),
  patientFirstName: z.string().trim().min(1, 'Patient first name is required').max(100),
  patientLastName: z.string().trim().min(1, 'Patient last name is required').max(100),
  patientPhone: z
    .string()
    .trim()
    .regex(/^[0-9()+\-.\s]{7,20}$/, 'Enter a valid phone number'),
  patientDateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  reason: z.string().trim().min(1, 'Select a reason for referral'),
  teeth: optionalText,
  urgency: z.enum(['routine', 'urgent', 'emergency']).default('routine'),
  clinicalNotes: optionalText,
  /** Referring office confirms the patient agreed to be contacted by text about scheduling. */
  patientConsentsToText: z
    .union([z.literal('on'), z.literal('true'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'on' || v === 'true'),
});

export type ReferralIntake = z.infer<typeof referralIntakeSchema>;
