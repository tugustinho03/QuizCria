export const QUESTIONS = [
   { question: "Em que concelho se edita o jornal Badaladas?",  answers: ["Alenquer",   "Torres Vedras", "Lourinhã", "Caldas da Rainha"], correct: 1 },
  { question: "O jornal Badaladas é um órgão de comunicação social de que tipo?",       answers: ["Jornal desportivo",  "Revista mensal de moda","Diário nacional", "Semanário regional"],   correct: 3 },
  { question: "O jornal Badaladas acompanha a vida de Torres Vedras há várias décadas. Em que ano foi publicado o seu primeiro número?",   answers: ["1972", "1926",   "1948",  "1960"], correct: 2 },
];


export const TIME_PER_QUESTION_MS = 15000; // 15s por pergunta — ritmo mais rápido, estilo Kahoot
export const REVEAL_DURATION_MS = 4000;    // revelação mais curta e dinâmica
export const PLACAR_DURATION_MS = 4500;    // ecrã de classificação em tempo real entre perguntas
export const MAX_POINTS = 1000;
