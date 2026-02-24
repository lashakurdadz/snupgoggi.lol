const { Pool } = require('@neondatabase/serverless');

// Try common env var names for a Postgres connection string.
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

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guests (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      will_donate BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

module.exports = async (req, res) => {
  try {
    await ensureTable();
  } catch (err) {
    console.error('Error ensuring guests table:', err);
    return res.status(500).json({ error: 'Database setup failed.' });
  }

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `
        SELECT
          name,
          will_donate AS "willDonate",
          created_at AS "createdAt"
        FROM guests
        ORDER BY created_at ASC
      `
      );
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error loading guests:', err);
      return res.status(500).json({ error: 'Failed to load guests.' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const willDonate = Boolean(body.willDonate);

    if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    try {
      const existing = await pool.query(
        `
        SELECT
          name,
          will_donate AS "willDonate",
          created_at AS "createdAt"
        FROM guests
        WHERE LOWER(name) = LOWER($1)
        LIMIT 1
      `,
        [name]
      );

      if (existing.rows.length > 0) {
        return res.status(200).json({
          message: 'You are already on the list!',
          guest: existing.rows[0],
        });
      }

      const inserted = await pool.query(
        `
        INSERT INTO guests (name, will_donate)
        VALUES ($1, $2)
        RETURNING
          name,
          will_donate AS "willDonate",
          created_at AS "createdAt"
      `,
        [name, willDonate]
      );

      return res.status(201).json({
        message: 'You are on the list!',
        guest: inserted.rows[0],
      });
    } catch (err) {
      console.error('Error saving guest:', err);
      return res.status(500).json({ error: 'Failed to save your spot.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method Not Allowed' });
};

