const express = require('express');
const { Pool } = require('pg');
const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static('public'));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Azure Blob Storage connection
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.STORAGE_KEY
);
const containerClient = blobServiceClient.getContainerClient('uploads');

// Multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize database table
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title } = req.body;
    const result = await pool.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      [title]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== NEW: Storage Endpoints ======

// Upload file to Blob Storage
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const blobName = Date.now() + '-' + req.file.originalname;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype }
    });

    res.json({
      success: true,
      name: blobName,
      url: blockBlobClient.url,
      size: req.file.size
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List all files in container
app.get('/api/files', async (req, res) => {
  try {
    const files = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      files.push({
        name: blob.name,
        size: blob.properties.contentLength,
        modified: blob.properties.lastModified
      });
    }
    res.json(files);
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Download file (generates SAS URL)
app.get('/api/files/:name', async (req, res) => {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(req.params.name);
    const downloadResponse = await blockBlobClient.download();
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.name}"`);
    downloadResponse.readableStreamBody.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete file
app.delete('/api/files/:name', async (req, res) => {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(req.params.name);
    await blockBlobClient.delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, async () => {
  await initDB();
  console.log('Server running on port ' + PORT);
});
