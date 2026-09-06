import { useState } from 'react'
import './App.css'

const ORDERS_URL = window.ORDERS_SERVICE_URL

const BURGER = { name: 'Mac Dana Burger', price: 6.9 }

const ADDONS = [
  { id: 'cheese', name: 'Extra Cheese', price: 1.0 },
  { id: 'bacon', name: 'Bacon', price: 1.5 },
  { id: 'egg', name: 'Fried Egg', price: 1.0 },
  { id: 'avocado', name: 'Avocado', price: 1.5 },
  { id: 'onions', name: 'Caramelized Onions', price: 0.75 },
  { id: 'pickles', name: 'Pickles', price: 0.5 },
  { id: 'spicyMayo', name: 'Spicy Mayo', price: 0.5 },
  { id: 'extraPatty', name: 'Extra Patty', price: 2.5 },
]

function money(n) {
  return `$${n.toFixed(2)}`
}

export default function App() {
  const [selectedAddons, setSelectedAddons] = useState([])
  const [qty, setQty] = useState(1)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)

  const addonsTotal = ADDONS.filter((a) => selectedAddons.includes(a.id)).reduce((sum, a) => sum + a.price, 0)
  const total = (BURGER.price + addonsTotal) * qty

  function toggleAddon(id) {
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  async function placeOrder(e) {
    e.preventDefault()
    setPlacing(true)
    setError(null)

    const chosenAddons = ADDONS.filter((a) => selectedAddons.includes(a.id))
    const item = chosenAddons.length
      ? `${BURGER.name} + ${chosenAddons.map((a) => a.name).join(', ')}`
      : BURGER.name

    try {
      const res = await fetch(`${ORDERS_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, qty }),
      })
      if (!res.ok) throw new Error(`Order failed (${res.status})`)
      const data = await res.json()
      setOrder({ ...data, addons: chosenAddons, qty, total })
    } catch (err) {
      setError(err.message || 'Something went wrong placing your order.')
    } finally {
      setPlacing(false)
    }
  }

  function newOrder() {
    setOrder(null)
    setSelectedAddons([])
    setQty(1)
    setError(null)
  }

  return (
    <div className="page">
      <div className="brand">
        <h1>🍔 Mac Dana</h1>
        <p>One great burger. Make it yours.</p>
      </div>

      {order ? (
        <div className="card confirmation">
          <div className="checkmark">✅</div>
          <h2>Order placed!</h2>
          <p className="order-id">Order #{order.orderId}</p>
          <div className="receipt">
            <div className="receipt-line">
              <span>{BURGER.name} x{order.qty}</span>
              <span>{money(BURGER.price * order.qty)}</span>
            </div>
            {order.addons.map((a) => (
              <div className="receipt-line" key={a.id}>
                <span>+ {a.name}</span>
                <span>{money(a.price * order.qty)}</span>
              </div>
            ))}
            <div className="receipt-line" style={{ fontWeight: 600, marginTop: 6 }}>
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
          <button className="new-order-button" onClick={newOrder}>Order another</button>
        </div>
      ) : (
        <form className="card" onSubmit={placeOrder}>
          {error && <div className="error-banner">{error}</div>}

          <div className="burger-header">
            <div className="burger-emoji">🍔</div>
            <div>
              <h2>{BURGER.name}</h2>
              <p className="price">{money(BURGER.price)}</p>
            </div>
          </div>

          <fieldset>
            <legend>Add-ons</legend>
            {ADDONS.map((a) => (
              <div className="addon-row" key={a.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedAddons.includes(a.id)}
                    onChange={() => toggleAddon(a.id)}
                  />
                  {a.name}
                </label>
                <span className="addon-price">+{money(a.price)}</span>
              </div>
            ))}
          </fieldset>

          <div className="qty-row">
            <span>Quantity</span>
            <div className="qty-controls">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>-</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(9, q + 1))} disabled={qty >= 9}>+</button>
            </div>
          </div>

          <div className="total-row">
            <span>Total</span>
            <span className="amount">{money(total)}</span>
          </div>

          <button className="order-button" type="submit" disabled={placing}>
            {placing ? 'Placing order...' : 'Place order'}
          </button>
        </form>
      )}
    </div>
  )
}
