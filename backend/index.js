const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const PORT = process.env.PORT || 4000;
const DB_FILE = process.env.DB_FILE || './data/db.sqlite';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Ensure data directory
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(DB_FILE);

// Create orders table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    phone TEXT,
    product_id TEXT,
    product_name TEXT,
    amount INTEGER,
    type TEXT,
    status TEXT,
    pay_ref TEXT,
    vturef TEXT,
    created_at TEXT
  )`);
});

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(bodyParser.json());

// Simple in-memory product catalog (could be moved to DB)
const products = [
  { id: 'data-mtn-1gb', name: 'MTN 1GB', amount: 500, type: 'data' },
  { id: 'data-mtn-2gb', name: 'MTN 2GB', amount: 1000, type: 'data' },
  { id: 'airtime-1000', name: 'Airtime ₦1,000', amount: 1000, type: 'airtime' },
  { id: 'dstv-padi', name: 'DSTV Padi (Basic)', amount: 3000, type: 'bills' }
];

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/order', (req, res) => {
  const { phone, productId } = req.body;
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(400).json({ error: 'Invalid product' });
  const id = uuidv4();
  const pay_ref = 'TEST-' + uuidv4();
  const created_at = new Date().toISOString();
  const order = {
    id,
    phone,
    product_id: product.id,
    product_name: product.name,
    amount: product.amount,
    type: product.type,
    status: 'pending',
    pay_ref,
    vturef: null,
    created_at
  };

  db.run(`INSERT INTO orders (id, phone, product_id, product_name, amount, type, status, pay_ref, vturef, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    order.id, order.phone, order.product_id, order.product_name, order.amount, order.type, order.status, order.pay_ref, order.vturef, order.created_at
  ], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }

    // Build a sandbox payment URL. If PAYSTACK_SECRET is configured you could call Paystack initialize here.
    // For now return a mock payment URL that the frontend can use to simulate payment.
    const payment_url = `${CLIENT_URL}/simulate-payment?reference=${encodeURIComponent(order.pay_ref)}`;
    res.json({ order, payment_url });
  });
});

app.get('/api/order/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'Order not found' });
    res.json(row);
  });
});

// Simulate a payment completion (for sandbox/testing)
app.post('/api/mock-pay/:pay_ref', (req, res) => {
  const pay_ref = req.params.pay_ref;
  db.get('SELECT * FROM orders WHERE pay_ref = ?', [pay_ref], (err, order) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status === 'paid') return res.json({ ok: true, message: 'Already paid' });

    // Mark order paid
    db.run('UPDATE orders SET status = ? WHERE pay_ref = ?', ['paid', pay_ref], function(uerr) {
      if (uerr) return res.status(500).json({ error: 'DB error' });

      // Call mocked VTU topup
      performMockTopup(order).then(vtu => {
        db.run('UPDATE orders SET vturef = ?, status = ? WHERE pay_ref = ?', [vtu.vturef, vtu.status, pay_ref]);
        res.json({ ok: true, order_id: order.id, vtu });
      }).catch(e => {
        console.error('VTU error', e);
        db.run('UPDATE orders SET status = ? WHERE pay_ref = ?', ['topup_failed', pay_ref]);
        res.status(500).json({ error: 'VTU error' });
      });
    });
  });
});

// Mock VTU topup function
function performMockTopup(order) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const vturef = 'VTU-' + uuidv4();
      // For demo, all topups succeed
      resolve({ success: true, vturef, status: 'completed', details: `Mock topup for ${order.phone} (${order.product_name})` });
    }, 1200);
  });
}

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
