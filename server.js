const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Create tables
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      cat TEXT NOT NULL,
      price INTEGER NOT NULL,
      stock INTEGER DEFAULT 0,
      status TEXT DEFAULT 'new',
      img_data TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS faqs (
      id SERIAL PRIMARY KEY,
      cat TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Database initialized');
}

// PRODUCTS
app.get('/api/products', async (req, res) => {
  const r = await pool.query('SELECT * FROM products ORDER BY id DESC');
  res.json(r.rows);
});
app.post('/api/products', async (req, res) => {
  const { name, brand, cat, price, stock, status, img_data, description } = req.body;
  const r = await pool.query(
    'INSERT INTO products (name,brand,cat,price,stock,status,img_data,description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [name, brand, cat, price, stock||0, status||'new', img_data||null, description||null]
  );
  res.json(r.rows[0]);
});
app.patch('/api/products/:id', async (req, res) => {
  const { stock } = req.body;
  await pool.query('UPDATE products SET stock=$1 WHERE id=$2', [stock, req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/products/:id', async (req, res) => {
  await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ORDERS
app.get('/api/orders', async (req, res) => {
  const r = await pool.query('SELECT * FROM orders ORDER BY id DESC');
  res.json(r.rows);
});
app.post('/api/orders', async (req, res) => {
  const { order_num, customer, phone, email, district, address, items, delivery, total, status } = req.body;
  const r = await pool.query(
    'INSERT INTO orders (order_num,customer,phone,email,district,address,items,delivery,total,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
    [order_num, customer, phone, email, district, address, JSON.stringify(items), delivery, total, status||'Боловсруулж байна']
  );
  res.json(r.rows[0]);
});
app.patch('/api/orders/:id', async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE orders SET status=$1 WHERE id=$2', [status, req.params.id]);
  res.json({ ok: true });
});

// FAQS
app.get('/api/faqs', async (req, res) => {
  const r = await pool.query('SELECT * FROM faqs ORDER BY id ASC');
  res.json(r.rows);
});
app.post('/api/faqs', async (req, res) => {
  const { cat, question, answer } = req.body;
  const r = await pool.query(
    'INSERT INTO faqs (cat,question,answer) VALUES ($1,$2,$3) RETURNING *',
    [cat, question, answer]
  );
  res.json(r.rows[0]);
});
app.patch('/api/faqs/:id', async (req, res) => {
  const { cat, question, answer } = req.body;
  await pool.query('UPDATE faqs SET cat=$1,question=$2,answer=$3 WHERE id=$4', [cat, question, answer, req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/faqs/:id', async (req, res) => {
  await pool.query('DELETE FROM faqs WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => console.log(`AURUM running on port ${PORT}`));
});
