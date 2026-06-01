const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Database
const db = new Database(path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH || '/data', 'aurum.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    cat TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new',
    img_data TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_num TEXT NOT NULL,
    customer TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    district TEXT,
    address TEXT,
    items TEXT,
    delivery INTEGER DEFAULT 10000,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'Боловсруулж байна',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cat TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ===== PRODUCTS =====
app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/products', (req, res) => {
  const { name, brand, cat, price, stock, status, img_data, description } = req.body;
  const stmt = db.prepare('INSERT INTO products (name, brand, cat, price, stock, status, img_data, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(name, brand, cat, price, stock || 0, status || 'new', img_data || null, description || null);
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.json(row);
});

app.patch('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(fields), id];
  db.prepare(`UPDATE products SET ${sets} WHERE id = ?`).run(...values);
  res.json({ ok: true });
});

app.delete('/api/products/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===== ORDERS =====
app.get('/api/orders', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/orders', (req, res) => {
  const { order_num, customer, phone, email, district, address, items, delivery, total, status } = req.body;
  const stmt = db.prepare('INSERT INTO orders (order_num, customer, phone, email, district, address, items, delivery, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(order_num, customer, phone, email, district, address, JSON.stringify(items), delivery, total, status || 'Боловсруулж байна');
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.json(row);
});

app.patch('/api/orders/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

// ===== FAQS =====
app.get('/api/faqs', (req, res) => {
  const rows = db.prepare('SELECT * FROM faqs ORDER BY id ASC').all();
  res.json(rows);
});

app.post('/api/faqs', (req, res) => {
  const { cat, question, answer } = req.body;
  const result = db.prepare('INSERT INTO faqs (cat, question, answer) VALUES (?, ?, ?)').run(cat, question, answer);
  const row = db.prepare('SELECT * FROM faqs WHERE id = ?').get(result.lastInsertRowid);
  res.json(row);
});

app.patch('/api/faqs/:id', (req, res) => {
  const { cat, question, answer } = req.body;
  db.prepare('UPDATE faqs SET cat = ?, question = ?, answer = ? WHERE id = ?').run(cat, question, answer, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/faqs/:id', (req, res) => {
  db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`AURUM server running on port ${PORT}`);
});
