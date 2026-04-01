import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('data.db');

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    displayName TEXT NOT NULL,
    city TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    isActive INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    uploadDate TEXT NOT NULL,
    locationId TEXT,
    FOREIGN KEY (locationId) REFERENCES locations(id)
  );

  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fileId INTEGER NOT NULL,
    locationId TEXT,
    billNo TEXT,
    billDate TEXT NOT NULL,
    billTime TEXT NOT NULL,
    productName TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL,
    rate REAL NOT NULL,
    totalAmount REAL NOT NULL,
    timeSlot TEXT NOT NULL,
    hour INTEGER NOT NULL,
    FOREIGN KEY (fileId) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (locationId) REFERENCES locations(id)
  );
`);

// Add locationId columns if they don't exist (for existing DBs)
try {
  db.exec('ALTER TABLE files ADD COLUMN locationId TEXT REFERENCES locations(id)');
} catch (e) { /* Column might already exist */ }

try {
  db.exec('ALTER TABLE records ADD COLUMN locationId TEXT REFERENCES locations(id)');
} catch (e) { /* Column might already exist */ }

// Enable foreign keys
db.pragma('foreign_keys = ON');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' })); // Increase limit for large JSON payloads

  // Location API Routes
  app.get('/api/locations', (req, res) => {
    const locations = db.prepare('SELECT * FROM locations').all();
    res.json(locations);
  });

  app.post('/api/locations', (req, res) => {
    const { id, displayName, city, timezone, isActive } = req.body;
    try {
      db.prepare('INSERT INTO locations (id, displayName, city, timezone, isActive) VALUES (?, ?, ?, ?, ?)').run(
        id, displayName, city, timezone || 'Asia/Kolkata', isActive === undefined ? 1 : (isActive ? 1 : 0)
      );
      res.json({ success: true, id });
    } catch (error) {
      console.error('DB Insert Error:', error);
      res.status(500).json({ error: 'Failed to create location' });
    }
  });

  app.put('/api/locations/:id', (req, res) => {
    const { displayName, city, timezone, isActive } = req.body;
    try {
      db.prepare('UPDATE locations SET displayName = ?, city = ?, timezone = ?, isActive = ? WHERE id = ?').run(
        displayName, city, timezone, isActive ? 1 : 0, req.params.id
      );
      res.json({ success: true });
    } catch (error) {
      console.error('DB Update Error:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  });

  // API Routes
  app.get('/api/files', (req, res) => {
    const files = db.prepare('SELECT * FROM files ORDER BY uploadDate DESC').all();
    res.json(files);
  });

  app.post('/api/files', (req, res) => {
    const { filename, records, locationId } = req.body;
    
    if (!filename || !records || !Array.isArray(records) || !locationId) {
      return res.status(400).json({ error: 'Invalid payload or missing locationId' });
    }

    // Deduplication logic
    // Fetch existing records for this location to check against
    const existingRecords = db.prepare(`
      SELECT billNo, billDate, billTime, productName, quantity 
      FROM records 
      WHERE locationId = ?
    `).all(locationId);

    const existingSet = new Set(
      existingRecords.map(r => 
        `${r.billNo}|${r.billDate}|${r.billTime}|${r.productName}|${r.quantity}`
      )
    );

    const newRecords = records.filter(record => {
      const key = `${record.billNo || null}|${record.billDate}|${record.billTime}|${record.productName}|${record.quantity}`;
      if (existingSet.has(key)) {
        return false; // Skip duplicate
      }
      existingSet.add(key); // Add to set to prevent duplicates within the same upload batch
      return true;
    });

    if (newRecords.length === 0) {
      return res.json({ success: true, fileId: null, message: 'All records were duplicates and skipped.' });
    }

    const insertFile = db.prepare('INSERT INTO files (filename, uploadDate, locationId) VALUES (?, ?, ?)');
    const insertRecord = db.prepare(`
      INSERT INTO records (fileId, locationId, billNo, billDate, billTime, productName, category, quantity, rate, totalAmount, timeSlot, hour)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((recordsToInsert) => {
      const info = insertFile.run(filename, new Date().toISOString(), locationId);
      const fileId = info.lastInsertRowid;

      for (const record of recordsToInsert) {
        insertRecord.run(
          fileId,
          locationId,
          record.billNo || null,
          record.billDate, // ISO string
          record.billTime,
          record.productName,
          record.category,
          record.quantity,
          record.rate,
          record.totalAmount,
          record.timeSlot,
          record.hour
        );
      }
      return fileId;
    });

    try {
      const fileId = transaction(newRecords);
      res.json({ success: true, fileId, insertedCount: newRecords.length, totalCount: records.length });
    } catch (error) {
      console.error('DB Insert Error:', error);
      res.status(500).json({ error: 'Failed to save data' });
    }
  });

  app.put('/api/files/:id/reassign', (req, res) => {
    const { locationId } = req.body;
    const fileId = req.params.id;
    if (!locationId) return res.status(400).json({ error: 'Missing locationId' });

    const transaction = db.transaction(() => {
      db.prepare('UPDATE files SET locationId = ? WHERE id = ?').run(locationId, fileId);
      db.prepare('UPDATE records SET locationId = ? WHERE fileId = ?').run(locationId, fileId);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error) {
      console.error('DB Update Error:', error);
      res.status(500).json({ error: 'Failed to reassign location' });
    }
  });

  app.delete('/api/files/:id', (req, res) => {
    const fileId = req.params.id;
    try {
      db.prepare('DELETE FROM files WHERE id = ?').run(fileId);
      res.json({ success: true });
    } catch (error) {
      console.error('DB Delete Error:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  app.get('/api/records', (req, res) => {
    const records = db.prepare('SELECT * FROM records').all();
    res.json(records);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
