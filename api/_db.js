import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL);

export async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_salas (
      pin TEXT PRIMARY KEY,
      fase TEXT NOT NULL DEFAULT 'lobby',
      pergunta_atual INTEGER NOT NULL DEFAULT 0,
      fase_inicio TIMESTAMP DEFAULT NOW(),
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_jogadores (
      id SERIAL PRIMARY KEY,
      pin TEXT NOT NULL,
      nome TEXT NOT NULL,
      pontos INTEGER NOT NULL DEFAULT 0,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_respostas (
      id SERIAL PRIMARY KEY,
      pin TEXT NOT NULL,
      jogador_id INTEGER NOT NULL,
      pergunta_indice INTEGER NOT NULL,
      resposta INTEGER NOT NULL,
      tempo_ms INTEGER NOT NULL,
      pontos_ganhos INTEGER NOT NULL DEFAULT 0,
      criado_em TIMESTAMP DEFAULT NOW(),
      UNIQUE(pin, jogador_id, pergunta_indice)
    )
  `;
}
