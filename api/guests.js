const { sql } = require('@vercel/postgres');

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS guests (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      will_donate BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
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
      const result = await sql`
        SELECT
          name,
          will_donate AS "willDonate",
          created_at AS "createdAt"
        FROM guests
        ORDER BY created_at ASC;
      `;
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
      const existing = await sql`
        SELECT
          name,
          will_donate AS "willDonate",
          created_at AS "createdAt"
        FROM guests
        WHERE LOWER(name) = LOWER(${name})
        LIMIT 1;
      `;

      if (existing.rows.length > 0) {
        return res.status(200).json({
          message: 'You are already on the list!',
          guest: existing.rows[0],
        });
      }

      const inserted = await sql`
        INSERT INTO guests (name, will_donate)
        VALUES (${name}, ${willDonate})
        RETURNING
          name,
          will_donate AS "willDonate",
          created_at AS "createdAt";
      `;

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

