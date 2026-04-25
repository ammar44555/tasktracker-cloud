const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static('public'));
const pool = new Pool({
 connectionString: process.env.DATABASE_URL,
 ssl: { rejectUnauthorized: false }
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/tasks', async (req, res) => {
 const r = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
 res.json(r.rows);
});
app.post('/api/tasks', async (req, res) => {
 const { title } = req.body;
 const r = await pool.query(
 'INSERT INTO tasks (title) VALUES ($1) RETURNING *', [title]
 );
 res.json(r.rows[0]);
});
async function initDB() {
 await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
 id SERIAL PRIMARY KEY,
 title VARCHAR(200),
 done BOOLEAN DEFAULT false,
 created_at TIMESTAMP DEFAULT NOW()
 )`);
}
app.listen(PORT, async () => {
 await initDB();
 console.log('Server running on port ' + PORT);
});
