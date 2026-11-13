import { describe, expect, it } from 'vitest';
import { InvalidTransitionError, assertTransition, canTransition, nextStep } from '@/lib/referrals/status';

describe('referral status machine', () => {
  it('allows the happy path', () => {
    const path = ['received', 'contacted', 'scheduled', 'seen', 'treatment_complete', 'report_sent', 'closed'] as const;
    for (let i = 0; i < path.length - 1; i++) expect(canTransition(path[i], path[i + 1])).toBe(true);
  });

  it('does not allow closing before the report is sent', () => {
    expect(canTransition('treatment_complete', 'closed')).toBe(false);
    expect(() => assertTransition('seen', 'closed')).toThrow(InvalidTransitionError);
  });

  it('cannot lose a referral after treatment', () => {
    expect(canTransition('treatment_complete', 'lost')).toBe(false);
  });

  it('can reopen a lost referral', () => {
    expect(canTransition('lost', 'contacted')).toBe(true);
  });

  it('suggests the next forward step', () => {
    expect(nextStep('received')).toBe('contacted');
    expect(nextStep('seen')).toBe('treatment_complete');
    expect(nextStep('closed')).toBeNull();
  });
});
