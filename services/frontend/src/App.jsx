import { useState } from 'react'

const ORDERS_URL = window.ORDERS_SERVICE_URL

export default function App() {
  const [item, setItem] = useState('')
  const [qty, setQty] = useState(1)
  const [result, setResult] = useState(null)

  async function placeOrder(e) {
    e.preventDefault()
    const res = await fetch(`${ORDERS_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, qty: Number(qty) }),
    })
    setResult(await res.json())
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 480, margin: '40px auto' }}>
      <h1>DanaEats</h1>
      <form onSubmit={placeOrder}>
        <input placeholder="Dish name" value={item} onChange={(e) => setItem(e.target.value)} required />
        <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
        <button type="submit">Order</button>
      </form>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  )
}
