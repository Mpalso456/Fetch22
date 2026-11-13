/**
 * Referral lifecycle state machine.
 *
 * received → contacted → scheduled → seen → treatment_complete → report_sent → closed
 * Any open state can move to `lost` (patient never booked, went elsewhere, declined).
 * A `lost` referral can be reopened to `contacted`.
 */
import type { ReferralStatus } from '../db/schema';

export const STATUS_ORDER: ReferralStatus[] = [
  'received',
  'contacted',
  'scheduled',
  'seen',
  'treatment_complete',
  'report_sent',
  'closed',
];

export const STATUS_LABELS: Record<ReferralStatus, string> = {
  received: 'New referral',
  contacted: 'Patient contacted',
  scheduled: 'Scheduled',
  seen: 'Seen',
  treatment_complete: 'Treatment complete',
  report_sent: 'Report sent to referrer',
  closed: 'Closed',
  lost: 'Lost',
};

const TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  received: ['contacted', 'scheduled', 'lost'],
  contacted: ['scheduled', 'lost'],
  scheduled: ['seen', 'contacted', 'lost'],
  // Some patients are seen and the referrer is told no treatment was needed.
  seen: ['treatment_complete', 'report_sent', 'lost'],
  treatment_complete: ['report_sent'],
  report_sent: ['closed'],
  closed: [],
  lost: ['contacted'],
};

/** Timestamp column set when a referral enters each status. */
export const STATUS_TIMESTAMP = {
  received: 'receivedAt',
  contacted: 'contactedAt',
  scheduled: 'scheduledAt',
  seen: 'seenAt',
  treatment_complete: 'treatmentCompletedAt',
  report_sent: 'reportSentAt',
  closed: 'closedAt',
  lost: null,
} as const satisfies Record<ReferralStatus, string | null>;

export const OPEN_STATUSES: ReferralStatus[] = ['received', 'contacted', 'scheduled', 'seen', 'treatment_complete'];

/** Statuses after which the referrer is owed a report. */
export const REPORT_OWED_STATUSES: ReferralStatus[] = ['seen', 'treatment_complete'];

export function allowedTransitions(from: ReferralStatus): ReferralStatus[] {
  return TRANSITIONS[from];
}

export function canTransition(from: ReferralStatus, to: ReferralStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: ReferralStatus,
    public readonly to: ReferralStatus,
  ) {
    super(`Cannot move a referral from "${from}" to "${to}"`);
    this.name = 'InvalidTransitionError';
  }
}

export function assertTransition(from: ReferralStatus, to: ReferralStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}

/** The single "next step" button shown in the pipeline UI. */
export function nextStep(from: ReferralStatus): ReferralStatus | null {
  const forward = TRANSITIONS[from].filter((s) => s !== 'lost' && STATUS_ORDER.indexOf(s) > STATUS_ORDER.indexOf(from));
  return forward[0] ?? null;
}
