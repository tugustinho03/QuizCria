import { sql, ensureTables } from './_db.js';
import { QUESTIONS, TIME_PER_QUESTION_MS, REVEAL_DURATION_MS, PLACAR_DURATION_MS, MAX_POINTS } from './_questions.js';

async function revelarSeNecessario(sala) {
  const agora = Date.now();
  const inicio = new Date(sala.fase_inicio).getTime();
  const decorrido = agora - inicio;

  // Cada transição de fase usa um UPDATE condicional (WHERE fase = <fase esperada>)
  // com RETURNING para garantir que, mesmo com pedidos concorrentes (polling de
  // vários jogadores/TV em simultâneo), apenas UM pedido "ganha" a transição e
  // executa a atribuição de pontos — evitando pontos duplicados.

  if (sala.fase === 'pergunta' && decorrido >= TIME_PER_QUESTION_MS) {
    const bloqueio = await sql`
      UPDATE quiz_salas SET fase = 'revelacao', fase_inicio = NOW()
      WHERE pin = ${sala.pin} AND fase = 'pergunta' AND pergunta_atual = ${sala.pergunta_atual}
      RETURNING pin
    `;
    if (bloqueio.length === 0) {
      // Outro pedido concorrente já avançou a fase — devolve o estado atual sem repetir a pontuação.
      const atual = await sql`SELECT * FROM quiz_salas WHERE pin = ${sala.pin}`;
      return atual[0] || sala;
    }

    const pergunta = QUESTIONS[sala.pergunta_atual];
    const respostas = await sql`
      SELECT id, jogador_id, resposta, tempo_ms
      FROM quiz_respostas
      WHERE pin = ${sala.pin} AND pergunta_indice = ${sala.pergunta_atual}
    `;

    for (const r of respostas) {
      let pontosGanhos = 0;
      if (r.resposta === pergunta.correct) {
        const bonusVelocidade = Math.max(0, 1 - r.tempo_ms / TIME_PER_QUESTION_MS);
        pontosGanhos = Math.round(MAX_POINTS * (0.5 + 0.5 * bonusVelocidade));
      }
      if (pontosGanhos > 0) {
        await sql`UPDATE quiz_jogadores SET pontos = pontos + ${pontosGanhos} WHERE id = ${r.jogador_id}`;
      }
      await sql`UPDATE quiz_respostas SET pontos_ganhos = ${pontosGanhos} WHERE id = ${r.id}`;
    }

    return { ...sala, fase: 'revelacao', fase_inicio: new Date().toISOString() };
  }

  if (sala.fase === 'revelacao' && decorrido >= REVEAL_DURATION_MS) {
    const bloqueio = await sql`
      UPDATE quiz_salas SET fase = 'placar', fase_inicio = NOW()
      WHERE pin = ${sala.pin} AND fase = 'revelacao' AND pergunta_atual = ${sala.pergunta_atual}
      RETURNING pin
    `;
    if (bloqueio.length === 0) {
      const atual = await sql`SELECT * FROM quiz_salas WHERE pin = ${sala.pin}`;
      return atual[0] || sala;
    }
    return { ...sala, fase: 'placar', fase_inicio: new Date().toISOString() };
  }

  if (sala.fase === 'placar' && decorrido >= PLACAR_DURATION_MS) {
    const proxima = sala.pergunta_atual + 1;
    if (proxima < QUESTIONS.length) {
      const bloqueio = await sql`
        UPDATE quiz_salas SET fase = 'pergunta', pergunta_atual = ${proxima}, fase_inicio = NOW()
        WHERE pin = ${sala.pin} AND fase = 'placar' AND pergunta_atual = ${sala.pergunta_atual}
        RETURNING pin
      `;
      if (bloqueio.length === 0) {
        const atual = await sql`SELECT * FROM quiz_salas WHERE pin = ${sala.pin}`;
        return atual[0] || sala;
      }
      return { ...sala, fase: 'pergunta', pergunta_atual: proxima, fase_inicio: new Date().toISOString() };
    } else {
      const bloqueio = await sql`
        UPDATE quiz_salas SET fase = 'final'
        WHERE pin = ${sala.pin} AND fase = 'placar' AND pergunta_atual = ${sala.pergunta_atual}
        RETURNING pin
      `;
      if (bloqueio.length === 0) {
        const atual = await sql`SELECT * FROM quiz_salas WHERE pin = ${sala.pin}`;
        return atual[0] || sala;
      }
      return { ...sala, fase: 'final' };
    }
  }

  return sala;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, erro: 'Método não permitido.' });
  }
  try {
    await ensureTables();
    const { pin, papel, jogadorId } = req.query;

    if (!pin) return res.status(400).json({ ok: false, erro: 'Código de sala em falta.' });

    const salas = await sql`SELECT * FROM quiz_salas WHERE pin = ${pin}`;
    if (salas.length === 0) return res.status(404).json({ ok: false, erro: 'Sala não encontrada.' });

    const sala = await revelarSeNecessario(salas[0]);

    const jogadores = await sql`
      SELECT id, nome, pontos FROM quiz_jogadores WHERE pin = ${pin} ORDER BY pontos DESC, id ASC
    `;

    const agora = Date.now();
    const inicio = new Date(sala.fase_inicio).getTime();
    const decorrido = agora - inicio;
    const tempoTotalPorFase = {
      pergunta: TIME_PER_QUESTION_MS,
      revelacao: REVEAL_DURATION_MS,
      placar: PLACAR_DURATION_MS,
    };
    const tempoTotalMs = tempoTotalPorFase[sala.fase] || 0;
    const tempoRestanteMs = tempoTotalMs ? Math.max(0, tempoTotalMs - decorrido) : 0;

    const respostasAtuais = await sql`
      SELECT jogador_id, resposta FROM quiz_respostas WHERE pin = ${pin} AND pergunta_indice = ${sala.pergunta_atual}
    `;

    const jogadoresOrdenados = jogadores.map(j => ({ id: j.id, nome: j.nome, pontos: j.pontos }));

    const base = {
      ok: true,
      pin,
      fase: sala.fase,
      perguntaAtual: sala.pergunta_atual,
      totalPerguntas: QUESTIONS.length,
      tempoRestanteMs,
      tempoTotalMs,
      jogadores: jogadoresOrdenados,
      numRespostas: respostasAtuais.length,
    };

    if (papel === 'tv' && (sala.fase === 'pergunta' || sala.fase === 'revelacao')) {
      const pergunta = QUESTIONS[sala.pergunta_atual];
      base.pergunta = pergunta.question;
      base.opcoes = pergunta.answers;
      if (sala.fase === 'revelacao') {
        base.correta = pergunta.correct;
        // Distribuição de respostas por opção — para o gráfico de barras estilo Kahoot
        const distribuicao = new Array(pergunta.answers.length).fill(0);
        for (const r of respostasAtuais) {
          if (r.resposta >= 0 && r.resposta < distribuicao.length) distribuicao[r.resposta]++;
        }
        base.distribuicao = distribuicao;
      }
    }

    if (papel === 'jogador' && jogadorId) {
      const idNum = Number(jogadorId);
      const jaRespondeu = await sql`
        SELECT resposta, pontos_ganhos FROM quiz_respostas
        WHERE pin = ${pin} AND jogador_id = ${idNum} AND pergunta_indice = ${sala.pergunta_atual}
      `;
      base.jaRespondeu = jaRespondeu.length > 0;
      if (sala.fase === 'revelacao' && jaRespondeu.length > 0) {
        const pergunta = QUESTIONS[sala.pergunta_atual];
        base.correta = pergunta.correct;
        base.respostaDada = jaRespondeu[0].resposta;
        base.pontosGanhos = jaRespondeu[0].pontos_ganhos;
      }
      const idxEu = jogadoresOrdenados.findIndex(j => j.id === idNum);
      base.meusPontos = idxEu >= 0 ? jogadoresOrdenados[idxEu].pontos : 0;
      base.minhaPosicao = idxEu >= 0 ? idxEu + 1 : null;
      base.totalJogadores = jogadoresOrdenados.length;
    }

    return res.status(200).json(base);
  } catch (err) {
    console.error('Erro ao obter estado da sala:', err);
    return res.status(500).json({ ok: false, erro: 'Erro interno do servidor.' });
  }
}
