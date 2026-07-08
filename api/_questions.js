export const QUESTIONS = [
  { question: "Qual é a capital de Portugal?", answers: ["Porto", "Lisboa", "Coimbra", "Faro"], correct: 1 },
  { question: "Em que concelho fica a Feira de São Pedro?", answers: ["Alenquer", "Torres Vedras", "Lourinhã", "Caldas da Rainha"], correct: 1 },
  { question: "Qual é o maior planeta do sistema solar?", answers: ["Terra", "Marte", "Júpiter", "Saturno"], correct: 2 },
  { question: "Quantos jogadores tem uma equipa de futebol?", answers: ["9", "10", "11", "12"], correct: 2 },
  { question: "Qual destes é um rio português?", answers: ["Ebro", "Sena", "Tejo", "Reno"], correct: 2 },
  { question: "O jornal Badaladas é um órgão de comunicação social de que tipo?", answers: ["Diário nacional", "Semanário regional", "Revista mensal de moda", "Jornal desportivo"], correct: 1 },
];

export const TIME_PER_QUESTION_MS = 15000; // 15s por pergunta — ritmo mais rápido, estilo Kahoot
export const REVEAL_DURATION_MS = 4000;    // revelação mais curta e dinâmica
export const PLACAR_DURATION_MS = 4500;    // ecrã de classificação em tempo real entre perguntas
export const MAX_POINTS = 1000;
