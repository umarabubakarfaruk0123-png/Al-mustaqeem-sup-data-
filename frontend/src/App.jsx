import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function App(){
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState(null)
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(()=>{
    fetch(`${API}/products`).then(r => r.json()).then(setProducts).catch(()=>setProducts([]))
  },[])

  const createOrder = async () => {
    if(!selected) return alert('Select a product')
    if(!phone) return alert('Enter phone number')
    setLoading(true)
    setMessage('Creating order...')
    try{
      const res = await fetch(`${API}/order`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ phone, productId: selected.id })
      })
      const data = await res.json()
      setOrder(data.order)
      setMessage('Order created. Use Simulate Payment to complete sandbox flow.')
    }catch(e){
      setMessage('Error creating order')
    }finally{ setLoading(false) }
  }

  const simulatePayment = async () => {
    if(!order) return
    setLoading(true); setMessage('Simulating payment...')
    try{
      const r = await fetch(`${API}/mock-pay/${encodeURIComponent(order.pay_ref)}`, { method: 'POST' })
      const j = await r.json()
      if(r.ok) {
        setMessage('Payment & topup completed: ' + (j.vtu ? j.vtu.details : ''))
        // refresh order
        const fresh = await (await fetch(`${API}/order/${order.id}`)).json()
        setOrder(fresh)
      } else {
        setMessage('Simulation failed: ' + (j.error || JSON.stringify(j)))
      }
    }catch(e){ setMessage('Simulation error') }
    setLoading(false)
  }

  return (
    <div className="container">
      <header>
        <h1>Al Mustaqeem Sup Data</h1>
        <p className="muted">Buy mobile data, airtime and pay bills (sandbox)</p>
      </header>

      <main>
        <section className="panel">
          <h2>Choose a product</h2>
          <div className="products">
            {products.map(p => (
              <div key={p.id} className={`card ${selected && selected.id===p.id ? 'selected':''}`} onClick={()=>setSelected(p)}>
                <strong>{p.name}</strong>
                <div className="muted">₦{p.amount}</div>
                <div className="muted small">{p.type}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Details</h2>
          <label>Phone number</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="080xxxxxxxx" />

          <div style={{marginTop:12}}>
            <button onClick={createOrder} disabled={loading}>Create Order</button>
            <button onClick={simulatePayment} disabled={!order || loading} style={{marginLeft:8}}>Simulate Payment</button>
          </div>

          {order && (
            <div className="order card">
              <div><strong>Order ID:</strong> {order.id}</div>
              <div><strong>Product:</strong> {order.product_name}</div>
              <div><strong>Amount:</strong> ₦{order.amount}</div>
              <div><strong>Status:</strong> {order.status}</div>
              <div><strong>VTU ref:</strong> {order.vturef || '—'}</div>
            </div>
          )}

          {message && <div className="message">{message}</div>}
        </section>
      </main>

      <footer>
        <small>Sandbox only — no real payments processed. For production, configure Paystack keys and VTU provider.</small>
      </footer>
    </div>
  )
}
