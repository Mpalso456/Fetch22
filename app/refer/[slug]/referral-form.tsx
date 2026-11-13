'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { submitReferral, type ReferralFormState } from './actions';

function Field({ name, label, error, ...rest }: { name: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={error ? 'has-error' : undefined}>
      {label}
      <input name={name} aria-invalid={!!error} {...rest} />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending}>
      {pending ? 'Sending…' : 'Send referral'}
    </button>
  );
}

export function ReferralForm({ slug, reasons }: { slug: string; reasons: Record<string, string> }) {
  const [state, action] = useFormState<ReferralFormState, FormData>(submitReferral.bind(null, slug), {});
  const e = state.errors ?? {};

  return (
    <form action={action} className="form portal-form">
      {state.message && <div className="alert">{state.message}</div>}
      <fieldset>
        <legend>Referring doctor</legend>
        <div className="row-2">
          <Field name="referrerFirstName" label="First name" required autoComplete="given-name" error={e.referrerFirstName} />
          <Field name="referrerLastName" label="Last name" required autoComplete="family-name" error={e.referrerLastName} />
        </div>
        <Field name="practiceName" label="Practice name" required autoComplete="organization" error={e.practiceName} />
        <div className="row-2">
          <Field name="referrerEmail" label="Email (for your report)" type="email" required autoComplete="email" error={e.referrerEmail} />
          <Field name="referrerPhone" label="Office phone" type="tel" autoComplete="tel" error={e.referrerPhone} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Patient</legend>
        <div className="row-2">
          <Field name="patientFirstName" label="First name" required error={e.patientFirstName} />
          <Field name="patientLastName" label="Last name" required error={e.patientLastName} />
        </div>
        <div className="row-2">
          <Field name="patientPhone" label="Mobile phone" type="tel" required error={e.patientPhone} />
          <Field name="patientDateOfBirth" label="Date of birth" type="date" error={e.patientDateOfBirth} />
        </div>
        <label className="check">
          <input type="checkbox" name="patientConsentsToText" />
          Patient agreed to receive scheduling texts from our office
        </label>
      </fieldset>

      <fieldset>
        <legend>Referral</legend>
        <div className="row-2">
          <label className={e.reason ? 'has-error' : undefined}>
            Reason
            <select name="reason" required defaultValue="">
              <option value="" disabled>
                Select…
              </option>
              {Object.entries(reasons).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            {e.reason && <span className="field-error">{e.reason}</span>}
          </label>
          <Field name="teeth" label="Tooth / area" placeholder="e.g. 19" error={e.teeth} />
        </div>
        <label>
          Urgency
          <select name="urgency" defaultValue="routine">
            <option value="routine">Routine</option>
            <option value="urgent">Urgent (within 48 hours)</option>
            <option value="emergency">Emergency (today)</option>
          </select>
        </label>
        <label>
          Clinical notes
          <textarea name="clinicalNotes" rows={4} placeholder="Symptoms, findings, radiograph notes…" />
        </label>
      </fieldset>
      <Submit />
    </form>
  );
}
