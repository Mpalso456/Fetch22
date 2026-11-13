export default function Home() {
  return (
    <main className="wrap">
      <h1>Fetch 22</h1>
      <p>End patient no-shows. Boost revenue. Easy setup.</p>
      <p>
        <strong>New:</strong> the specialist CRM for endodontists, oral surgeons and periodontists. Track every referring doctor,
        catch relationships before they lapse, and close the loop on every referral.
      </p>
      <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a className="btn" href="/pricing">See Pricing</a>
        <a className="btn btn-secondary" href="/crm">Open the CRM demo</a>
      </p>
    </main>
  )
}
