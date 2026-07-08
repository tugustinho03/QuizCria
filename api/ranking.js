import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS ranking_escolas (
      id SERIAL PRIMARY KEY,
      escola TEXT NOT NULL,
      pontuacao INTEGER NOT NULL,
      tempo_ms INTEGER NOT NULL,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `;
}

export default async function handler(req, res) {
  try {
    await ensureTable();

    if (req.method === 'POST') {
      const { escola, pontuacao, tempo_ms } = req.body || {};

      if (!escola || typeof escola !== 'string' || !escola.trim()) {
        return res.status(400).json({ ok: false, erro: 'Nome da escola em falta.' });
      }
      if (typeof pontuacao !== 'number' || typeof tempo_ms !== 'number') {
        return res.status(400).json({ ok: false, erro: 'Pontuação ou tempo inválidos.' });
      }

      const escolaLimpa = escola.trim().slice(0, 60);

      await sql`
        INSERT INTO ranking_escolas (escola, pontuacao, tempo_ms)
        VALUES (${escolaLimpa}, ${pontuacao}, ${tempo_ms})
      `;

      return res.status(200).json({ ok: true, mensagem: 'Resultado guardado com sucesso.' });
    }

    if (req.method === 'GET') {
      const linhas = await sql`
        SELECT escola, pontuacao, tempo_ms
        FROM ranking_escolas
        ORDER BY pontuacao DESC, tempo_ms ASC
        LIMIT 20
      `;
      return res.status(200).json({ ok: true, ranking: linhas });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ ok: false, erro: 'Método não permitido.' });

  } catch (err) {
    console.error('Erro na API de ranking:', err);
    return res.status(500).json({ ok: false, erro: 'Erro interno do servidor.' });
  }
}
