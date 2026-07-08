import { sql, ensureTables } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, erro: 'Método não permitido.' });
  }
  try {
    await ensureTables();
    const { pin, jogadorId, perguntaIndice, resposta } = req.body || {};

    if (!pin || !jogadorId || typeof perguntaIndice !== 'number' || typeof resposta !== 'number') {
      return res.status(400).json({ ok: false, erro: 'Dados inválidos.' });
    }

    const salas = await sql`SELECT fase, pergunta_atual, fase_inicio FROM quiz_salas WHERE pin = ${pin}`;
    if (salas.length === 0) return res.status(404).json({ ok: false, erro: 'Sala não encontrada.' });

    const sala = salas[0];
    if (sala.fase !== 'pergunta' || sala.pergunta_atual !== perguntaIndice) {
      return res.status(409).json({ ok: false, erro: 'Já não é possível responder a esta pergunta.' });
    }

    const tempoMs = Date.now() - new Date(sala.fase_inicio).getTime();

    await sql`
      INSERT INTO quiz_respostas (pin, jogador_id, pergunta_indice, resposta, tempo_ms)
      VALUES (${pin}, ${jogadorId}, ${perguntaIndice}, ${resposta}, ${tempoMs})
      ON CONFLICT (pin, jogador_id, pergunta_indice) DO NOTHING
    `;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao responder:', err);
    return res.status(500).json({ ok: false, erro: 'Erro interno do servidor.' });
  }
}
