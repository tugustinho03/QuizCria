import { sql, ensureTables } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, erro: 'Método não permitido.' });
  }
  try {
    await ensureTables();
    const { pin } = req.body || {};
    if (!pin) return res.status(400).json({ ok: false, erro: 'Código de sala em falta.' });

    const salas = await sql`SELECT pin FROM quiz_salas WHERE pin = ${pin}`;
    if (salas.length === 0) return res.status(404).json({ ok: false, erro: 'Sala não encontrada.' });

    await sql`
      UPDATE quiz_salas
      SET fase = 'pergunta', pergunta_atual = 0, fase_inicio = NOW()
      WHERE pin = ${pin}
    `;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao iniciar sala:', err);
    return res.status(500).json({ ok: false, erro: 'Erro interno do servidor.' });
  }
}
