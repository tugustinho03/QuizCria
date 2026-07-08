import { sql, ensureTables } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, erro: 'Método não permitido.' });
  }
  try {
    await ensureTables();

    const { pin, nome } = req.body || {};
    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ ok: false, erro: 'Código de sala em falta.' });
    }
    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      return res.status(400).json({ ok: false, erro: 'Escreve o teu nome.' });
    }

    const salas = await sql`SELECT pin, fase FROM quiz_salas WHERE pin = ${pin}`;
    if (salas.length === 0) {
      return res.status(404).json({ ok: false, erro: 'Não existe nenhuma sala com esse código.' });
    }
    if (salas[0].fase !== 'lobby') {
      return res.status(409).json({ ok: false, erro: 'Este jogo já começou. Pede um código novo.' });
    }

    const nomeLimpo = nome.trim().slice(0, 30);
    const resultado = await sql`
      INSERT INTO quiz_jogadores (pin, nome)
      VALUES (${pin}, ${nomeLimpo})
      RETURNING id
    `;

    return res.status(200).json({ ok: true, jogadorId: resultado[0].id, nome: nomeLimpo });
  } catch (err) {
    console.error('Erro ao entrar na sala:', err);
    return res.status(500).json({ ok: false, erro: 'Erro interno do servidor.' });
  }
}
