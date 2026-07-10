export const QUESTIONS = [
  { question: "Em que concelho se edita o jornal Badaladas?",  answers: ["Alenquer",   "Torres Vedras", "Lourinhã", "Caldas da Rainha"], correct: 1 },
  { question: "O jornal Badaladas é um órgão de comunicação social de que tipo?",       answers: ["Jornal desportivo",  "Revista mensal de moda","Diário nacional", "Semanário regional"],   correct: 3 },
  { question: "O jornal Badaladas acompanha a vida de Torres Vedras há várias décadas. Em que ano foi publicado o seu primeiro número?",   answers: ["1972", "1926",   "1948",  "1960"], correct: 2 },
  {question: "Qual o nome do seu fundador?", answers:["Padre Joaquim Maria de Sousa", "Padre Álvaro Bizarro", "Padre Vítor Melícias","Padre Marcelo Rossi"], correct: 2},
   {question:"A que dia da semana sai o jornal?", answers:["Quarta-feira", "Quinta-feira", "Sexta-feira","Terça-feira"], correct: 2},
   {question: "Quantos jornalistas trabalham no Badaladas?", answers:["Nove", "Sete", "Dois","Quatro"], correct: 3},
   {question:"Que nome se dá à página do jornal que apresenta as festas e os eventos da região?", answers:["Necrologia", "Roteiro", "Passatempos","Oeste"], correct: 1},
   {question:"Em que ano é que o jornal Badaladas deixou de ser propriedade da igreja e passou para uma empresa privada?", answers:["2005", "2015", "2020","2025"], correct: 3},
];



export const TIME_PER_QUESTION_MS = 15000; // 15s por pergunta
export const REVEAL_DURATION_MS = 4000;    // revelação mais curta e dinâmica
export const PLACAR_DURATION_MS = 4500;    // ecrã de classificação em tempo real entre perguntas
export const MAX_POINTS = 1000;
