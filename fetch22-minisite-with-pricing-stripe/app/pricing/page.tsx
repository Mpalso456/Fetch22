'use client'
import { useState } from 'react'
export default function Pricing() {
  const [loading, setLoading] = useState(false)
  const handleCheckout = async (priceId: string) => {
    setLoading(true)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId })
    })
    const data = await res.json()
    window.location.href = data.url
  }
  return (
    <main className="p-10 text-center">
      <h1 className="text-4xl font-bold">Pricing</h1>
      <div className="mt-10 flex justify-center gap-10">
        <div className="border p-6 rounded-lg">
          <h2 className="text-2xl font-semibold">Starter</h2>
          <p className="mt-2">$149 / month</p>
          <button onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER!)} className="mt-4 bg-green-600 text-white px-6 py-2 rounded">
            Subscribe
          </button>
        </div>
        <div className="border p-6 rounded-lg">
          <h2 className="text-2xl font-semibold">Growth</h2>
          <p className="mt-2">$249 / month</p>
          <button onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_GROWTH!)} className="mt-4 bg-green-600 text-white px-6 py-2 rounded">
            Subscribe
          </button>
        </div>
      </div>
    </main>
  )
}