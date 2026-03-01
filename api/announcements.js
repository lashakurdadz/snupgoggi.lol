const { Pool } = require('@neondatabase/serverless');

const connectionString =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error(
    'Missing database connection string. Set DATABASE_URL (or NEON_DATABASE_URL / POSTGRES_URL) in your Vercel project settings.'
  );
}

const pool = new Pool({ connectionString });

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcement_signups (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

module.exports = async (req, res) => {
  try {
    await ensureTable();
  } catch (err) {
    console.error('Error ensuring announcement_signups table:', err);
    return res.status(500).json({ error: 'Database setup failed.' });
  }

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `
        SELECT
          email,
          created_at AS "createdAt"
        FROM announcement_signups
        ORDER BY created_at DESC
      `
      );
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error loading announcement signups:', err);
      return res.status(500).json({ error: 'Failed to load signups.' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email.' });
    }

    try {
      const inserted = await pool.query(
        `
        INSERT INTO announcement_signups (email)
        VALUES ($1)
        ON CONFLICT (email) DO NOTHING
        RETURNING
          email,
          created_at AS "createdAt"
      `,
        [email]
      );

      if (inserted.rows.length === 0) {
        return res.status(200).json({
          message: "You're already on the list. We'll notify you when the lineup drops.",
        });
      }

      return res.status(201).json({
        message: "You're on the list. We'll notify you when the lineup drops.",
      });
    } catch (err) {
      console.error('Error saving announcement signup:', err);
      return res.status(500).json({ error: 'Failed to save your email.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method Not Allowed' });
};
