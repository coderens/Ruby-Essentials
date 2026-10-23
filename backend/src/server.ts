import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pg from 'pg';

const app = express();
const port = Number(process.env.PORT || 4000);
const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined }) : null;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  let database = 'not_configured';
  if (pool) {
    try { await pool.query('SELECT 1'); database = 'connected'; }
    catch { database = 'unavailable'; }
  }
  res.status(database === 'unavailable' ? 503 : 200).json({ ok: database !== 'unavailable', service: 'ruby-essentials-api', database });
});

app.get('/api/members', async (_req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database is not configured.' });
  try {
    const result = await pool.query('SELECT id, display_name, in_game_name, clan_role, joined_at FROM clan_members WHERE is_public = TRUE ORDER BY joined_at ASC');
    res.json({ members: result.rows });
  } catch {
    res.status(500).json({ error: 'Could not load clan members.' });
  }
});

app.get('/api/events', async (_req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database is not configured.' });
  try {
    const result = await pool.query('SELECT id, title, category, description, status, starts_at FROM clan_events ORDER BY starts_at NULLS LAST, created_at DESC');
    res.json({ events: result.rows });
  } catch {
    res.status(500).json({ error: 'Could not load clan events.' });
  }
});

app.listen(port, () => console.log(`Ruby Essentials API listening on ${port}`));