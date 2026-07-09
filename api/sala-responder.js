import { sql, ensureTables } from './_db.js';
import { QUESTIONS, TIME_PER_QUESTION_MS } from './_questions.js';

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

    const perguntaValida = QUESTIONS[perguntaIndice];
    if (!perguntaValida || resposta < 0 || resposta >= perguntaValida.answers.length || !Number.isInteger(resposta)) {
      return res.status(400).json({ ok: false, erro: 'Resposta inválida.' });
    }

    // Confirma que o jogador pertence mesmo a esta sala — evita que um pedido
    // manipulado atribua/roube pontos a um jogador de outra sala.
    const jogadores = await sql`
      SELECT id FROM quiz_jogadores WHERE id = ${jogadorId} AND pin = ${pin}
    `;
    if (jogadores.length === 0) {
      return res.status(403).json({ ok: false, erro: 'Jogador não pertence a esta sala.' });
    }

    const salas = await sql`SELECT fase, pergunta_atual, fase_inicio FROM quiz_salas WHERE pin = ${pin}`;
    if (salas.length === 0) return res.status(404).json({ ok: false, erro: 'Sala não encontrada.' });

    const sala = salas[0];
    const tempoMs = Date.now() - new Date(sala.fase_inicio).getTime();

    // Corte por tempo independente do polling: a fase só avança quando algum
    // pedido de /api/sala-estado a "empurra", por isso há uma janela em que a
    // fase ainda diz 'pergunta' mas o cronómetro já esgotou. Rejeita aqui
    // também, para não aceitar respostas tardias nessa janela.
    if (sala.fase !== 'pergunta' || sala.pergunta_atual !== perguntaIndice || tempoMs > TIME_PER_QUESTION_MS) {
      return res.status(409).json({ ok: false, erro: 'Já não é possível responder a esta pergunta.' });
    }

    // INSERT ... SELECT com a mesma condição de fase/tempo, para que a
    // aceitação da resposta seja atómica com a validação — um pedido
    // concorrente que só chegasse depois da fase mudar não consegue inserir,
    // mesmo que tenha passado na verificação acima (proteção contra corrida
    // entre esta leitura e a escrita seguinte).
    const inserido = await sql`
      INSERT INTO quiz_respostas (pin, jogador_id, pergunta_indice, resposta, tempo_ms)
      SELECT ${pin}, ${jogadorId}, ${perguntaIndice}, ${resposta}, ${tempoMs}
      WHERE EXISTS (
        SELECT 1 FROM quiz_salas
        WHERE pin = ${pin} AND fase = 'pergunta' AND pergunta_atual = ${perguntaIndice}
      )
      ON CONFLICT (pin, jogador_id, pergunta_indice) DO NOTHING
      RETURNING id
    `;

    if (inserido.length === 0) {
      return res.status(409).json({ ok: false, erro: 'Já não é possível responder a esta pergunta.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao responder:', err);
    return res.status(500).json({ ok: false, erro: 'Erro interno do servidor.' });
  }
}
