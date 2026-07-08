import { sql, ensureTables } from './_db.js';

function gerarPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, erro: 'Método não permitido.' });
  }
  try {
    await ensureTables();

    let pin;
    for (let tentativa = 0; tentativa < 8; tentativa++) {
      const candidato = gerarPin();
      const existe = await sql`SELECT 1 FROM quiz_salas WHERE pin = ${candidato}`;
      if (existe.length === 0) { pin = candidato; break; }
    }
    if (!pin) {
      return res.status(500).json({ ok: false, erro: 'Não foi possível gerar um código de sala. Tenta outra vez.' });
    }

    await sql`
      INSERT INTO quiz_salas (pin, fase, pergunta_atual, fase_inicio)
      VALUES (${pin}, 'lobby', 0, NOW())
    `;

    return res.status(200).json({ ok: true, pin });
  } catch (err) {
    console.error('Erro ao criar sala:', err);
    return res.status(500).json({ ok: false, erro: 'Erro interno do servidor.' });
  }
}
