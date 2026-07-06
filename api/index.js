import express from 'express';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ranking (
      id        SERIAL PRIMARY KEY,
      escola    VARCHAR(255) NOT NULL,
      pontuacao INTEGER NOT NULL,
      tempo_ms  INTEGER NOT NULL,
      criado_em TIMESTAMP DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ranking_escola_unique ON ranking(escola);
  `);
  schemaReady = true;
}

const app = express();
app.use(express.json());

// GET /api/ranking — top ranking (best score per school)
app.get('/api/ranking', async (req, res) => {
  try {
    await ensureSchema();
    const result = await pool.query(`
      SELECT escola, pontuacao, tempo_ms
      FROM ranking
      ORDER BY pontuacao DESC, tempo_ms ASC
      LIMIT 50
    `);
    res.json({ ok: true, ranking: result.rows });
  } catch (err) {
    console.error('GET /api/ranking error:', err.message);
    res.status(500).json({ ok: false, erro: 'Erro ao carregar ranking.' });
  }
});

// POST /api/ranking — save or update a school's best score
app.post('/api/ranking', async (req, res) => {
  const { escola, pontuacao, tempo_ms } = req.body || {};

  const pontuacaoNum = Number(pontuacao);
  const tempoNum = Number(tempo_ms);

  if (
    !escola ||
    typeof escola !== 'string' ||
    !Number.isInteger(pontuacaoNum) ||
    !Number.isInteger(tempoNum) ||
    pontuacaoNum < 0 || pontuacaoNum > 100000 ||
    tempoNum < 0 || tempoNum > 3600000
  ) {
    return res.status(400).json({ ok: false, erro: 'Dados inválidos.' });
  }

  const escolaClean = String(escola).trim().slice(0, 255);
  if (!escolaClean) {
    return res.status(400).json({ ok: false, erro: 'Nome da escola inválido.' });
  }

  try {
    await ensureSchema();
    await pool.query(`
      INSERT INTO ranking (escola, pontuacao, tempo_ms)
      VALUES ($1, $2, $3)
      ON CONFLICT (escola) DO UPDATE
        SET pontuacao = EXCLUDED.pontuacao,
            tempo_ms  = EXCLUDED.tempo_ms,
            criado_em = NOW()
        WHERE EXCLUDED.pontuacao > ranking.pontuacao
           OR (EXCLUDED.pontuacao = ranking.pontuacao AND EXCLUDED.tempo_ms < ranking.tempo_ms)
    `, [escolaClean, pontuacaoNum, tempoNum]);

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/ranking error:', err.message);
    res.status(500).json({ ok: false, erro: 'Erro ao guardar resultado.' });
  }
});

export default app;
