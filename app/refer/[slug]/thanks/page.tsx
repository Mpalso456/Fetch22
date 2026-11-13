import Link from 'next/link';

export default function Thanks({ params }: { params: { slug: string } }) {
  return (
    <main className="portal">
      <h1>Referral received ✓</h1>
      <p>Thank you. Our team will contact your patient to schedule, and you&apos;ll receive a report when treatment is complete.</p>
      <p>
        <Link href={`/refer/${params.slug}`}>Refer another patient</Link>
      </p>
    </main>
  );
}
