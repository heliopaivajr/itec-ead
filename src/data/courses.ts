export type CourseId = 'teologia-livre' | 'seteb' | 'ministerial-mulheres';

export interface CourseMaterial {
  nome: string;
  horas: number;
  tipo: 'presencial' | 'ead' | 'misto';
  eletiva?: boolean;
}

export interface CourseModule {
  titulo: string;
  periodo?: string;
  materias: CourseMaterial[];
}

export interface Course {
  id: CourseId;
  nome: string;
  nomeCompleto: string;
  badge: string;
  badgeColor: string;
  requisito: string;
  duracao: string;
  horario: string;
  modalidade: string;
  descricao: string;
  totalHoras: string;
  totalCreditos?: string;
  grade: CourseModule[];
}

export const courses: Course[] = [
  {
    id: 'teologia-livre',
    nome: 'Teologia Livre',
    nomeCompleto: 'Graduação em Teologia — Curso Livre',
    badge: 'Graduação · Curso Livre',
    badgeColor: 'bg-red-900/40 text-red-300 border-red-800',
    requisito: 'Exige graduação prévia',
    duracao: '3 anos / 6 módulos',
    horario: 'Seg, Qua e Sex — 18h45 às 22h00',
    modalidade: 'Presencial + EAD (híbrido)',
    descricao: 'Formação teológica sólida para líderes comprometidos com o evangelho. Currículo completo com 185 créditos, unindo tradição e inovação no ensino bíblico.',
    totalHoras: '1.850h obrigatórias (2.060h totais)',
    totalCreditos: '185 créditos',
    grade: [
      {
        titulo: '1º Módulo',
        periodo: 'Fevereiro – Junho (1º Ano)',
        materias: [
          { nome: 'Introdução ao Novo Testamento I (Evangelhos)', horas: 40, tipo: 'misto' },
          { nome: 'Espiritualidade Cristã', horas: 40, tipo: 'misto' },
          { nome: 'Introdução Bíblica: Bibliologia', horas: 30, tipo: 'misto' },
          { nome: 'Introdução ao Antigo Testamento I (Pentateuco)', horas: 40, tipo: 'misto' },
          { nome: 'Teologia Sistemática I: Doutrina de Deus e Antropologia', horas: 60, tipo: 'misto' },
          { nome: 'Missiologia I: Teologia em Missões', horas: 60, tipo: 'misto' },
        ],
      },
      {
        titulo: '2º Módulo',
        periodo: 'Agosto – Dezembro (1º Ano)',
        materias: [
          { nome: 'Introdução ao Antigo Testamento II (Históricos)', horas: 40, tipo: 'misto' },
          { nome: 'Período Interbíblico', horas: 40, tipo: 'misto', eletiva: true },
          { nome: 'História da Igreja I: Primitiva e Medieval', horas: 60, tipo: 'misto' },
          { nome: 'Teologia Sistemática II: Cristologia', horas: 60, tipo: 'misto' },
          { nome: 'Língua Grega I', horas: 40, tipo: 'misto' },
          { nome: 'Introdução à Filosofia', horas: 40, tipo: 'misto', eletiva: true },
          { nome: 'Introdução ao Novo Testamento II (Atos)', horas: 40, tipo: 'misto' },
          { nome: 'História da Igreja II: Reforma e Modernidade', horas: 60, tipo: 'misto' },
        ],
      },
      {
        titulo: '3º Módulo',
        periodo: 'Fevereiro – Junho (2º Ano)',
        materias: [
          { nome: 'Língua Grega II', horas: 40, tipo: 'misto' },
          { nome: 'História da Igreja do Brasil', horas: 40, tipo: 'misto', eletiva: true },
          { nome: 'Introdução ao Antigo Testamento III (Proféticos)', horas: 40, tipo: 'misto' },
          { nome: 'Teologia Sistemática III: Soteriologia e Pneumatologia', horas: 60, tipo: 'misto' },
          { nome: 'Introdução ao Novo Testamento III (Cartas Paulinas)', horas: 40, tipo: 'misto' },
          { nome: 'Arqueologia e Costumes Bíblicos / Geografia', horas: 60, tipo: 'misto', eletiva: true },
          { nome: 'Ética Cristã', horas: 40, tipo: 'misto' },
          { nome: 'Missiologia II: Evangelismo', horas: 40, tipo: 'misto' },
        ],
      },
      {
        titulo: '4º Módulo',
        periodo: 'Agosto – Dezembro (2º Ano)',
        materias: [
          { nome: 'Hermenêutica Bíblica', horas: 60, tipo: 'misto' },
          { nome: 'Língua Hebraica I (obrigatória)', horas: 40, tipo: 'misto' },
          { nome: 'Introdução ao Antigo Testamento IV (Poéticos)', horas: 40, tipo: 'misto' },
          { nome: 'Missiologia III: História em Missões', horas: 40, tipo: 'misto' },
          { nome: 'Exegese do Novo Testamento', horas: 40, tipo: 'misto' },
          { nome: 'Língua Hebraica II', horas: 40, tipo: 'misto', eletiva: true },
          { nome: 'Escatologia', horas: 40, tipo: 'misto' },
          { nome: 'Introdução ao Novo Testamento IV (Cartas Gerais)', horas: 40, tipo: 'misto' },
        ],
      },
      {
        titulo: '5º Módulo',
        periodo: 'Fevereiro – Junho (3º Ano)',
        materias: [
          { nome: 'Missiologia IV: Implantação de Igreja', horas: 40, tipo: 'misto' },
          { nome: 'Exegese do Antigo Testamento', horas: 40, tipo: 'misto', eletiva: true },
          { nome: 'Aconselhamento Bíblico I', horas: 60, tipo: 'misto' },
          { nome: 'Aconselhamento Bíblico II', horas: 60, tipo: 'misto' },
          { nome: 'Homilética I (Teoria)', horas: 60, tipo: 'misto' },
          { nome: 'Teologia Contemporânea', horas: 40, tipo: 'misto', eletiva: true },
          { nome: 'Homilética II (Oratória e Prática)', horas: 40, tipo: 'misto' },
          { nome: 'Liderança Ministerial', horas: 60, tipo: 'misto' },
        ],
      },
      {
        titulo: '6º Módulo',
        periodo: 'Agosto – Dezembro (3º Ano)',
        materias: [
          { nome: 'Liturgia do Culto Cristão', horas: 40, tipo: 'misto' },
          { nome: 'Capelania e Visitação', horas: 40, tipo: 'misto', eletiva: true },
          { nome: 'Apologética', horas: 40, tipo: 'misto' },
          { nome: 'Teologia do Antigo Testamento', horas: 60, tipo: 'misto' },
          { nome: 'Prática Ministerial e Adoração', horas: 60, tipo: 'misto' },
          { nome: 'Seitas e Heresias', horas: 40, tipo: 'misto', eletiva: true },
          { nome: 'Teologia do Novo Testamento', horas: 60, tipo: 'misto' },
          { nome: 'Educação Cristã e Discipulado', horas: 60, tipo: 'misto' },
        ],
      },
    ],
  },
  {
    id: 'seteb',
    nome: 'SETEB',
    nomeCompleto: 'Seminário de Educação Teológica Básica',
    badge: 'Básico · 3 Anos',
    badgeColor: 'bg-blue-900/40 text-blue-300 border-blue-800',
    requisito: 'Aberto a todos',
    duracao: '3 anos',
    horario: 'Quintas-feiras — 19h00 às 20h00',
    modalidade: 'Presencial',
    descricao: 'Curso introdutório de teologia para cristãos que desejam aprofundar o conhecimento bíblico. Aulas semanais às quintas-feiras, cobrindo do fundamento teológico ao Novo Testamento.',
    totalHoras: 'Aulas semanais (1h/semana)',
    grade: [
      {
        titulo: 'Ano 1',
        periodo: 'Teologia Básica',
        materias: [
          { nome: 'Introdução à Teologia', horas: 0, tipo: 'presencial' },
          { nome: 'Doutrina de Deus', horas: 0, tipo: 'presencial' },
          { nome: 'Doutrina do Homem e do Pecado', horas: 0, tipo: 'presencial' },
          { nome: 'Doutrina da Salvação', horas: 0, tipo: 'presencial' },
          { nome: 'Doutrina do Espírito Santo', horas: 0, tipo: 'presencial' },
          { nome: 'Doutrina da Igreja', horas: 0, tipo: 'presencial' },
          { nome: 'Doutrina das Últimas Coisas', horas: 0, tipo: 'presencial' },
        ],
      },
      {
        titulo: 'Ano 2',
        periodo: 'Antigo Testamento',
        materias: [
          { nome: 'Introdução ao Antigo Testamento', horas: 0, tipo: 'presencial' },
          { nome: 'Pentateuco', horas: 0, tipo: 'presencial' },
          { nome: 'Livros Históricos', horas: 0, tipo: 'presencial' },
          { nome: 'Livros Poéticos e Sapienciais', horas: 0, tipo: 'presencial' },
          { nome: 'Profetas Maiores', horas: 0, tipo: 'presencial' },
          { nome: 'Profetas Menores', horas: 0, tipo: 'presencial' },
        ],
      },
      {
        titulo: 'Ano 3',
        periodo: 'Novo Testamento',
        materias: [
          { nome: 'Introdução ao Novo Testamento', horas: 0, tipo: 'presencial' },
          { nome: 'Evangelhos Sinóticos e João', horas: 0, tipo: 'presencial' },
          { nome: 'Atos dos Apóstolos', horas: 0, tipo: 'presencial' },
          { nome: 'Cartas Paulinas', horas: 0, tipo: 'presencial' },
          { nome: 'Cartas Gerais', horas: 0, tipo: 'presencial' },
          { nome: 'Apocalipse', horas: 0, tipo: 'presencial' },
        ],
      },
    ],
  },
  {
    id: 'ministerial-mulheres',
    nome: 'Ministerial Mulheres',
    nomeCompleto: 'Curso Ministerial para Mulheres',
    badge: 'Feminino · Anual',
    badgeColor: 'bg-purple-900/40 text-purple-300 border-purple-800',
    requisito: 'Exclusivo para mulheres',
    duracao: 'Anual (7 disciplinas)',
    horario: 'Quintas-feiras — 19h00 às 22h00',
    modalidade: 'Presencial',
    descricao: 'Formação ministerial especialmente desenvolvida para mulheres cristãs, abordando identidade, vocação, emoções e pregação sob uma perspectiva bíblica transformadora.',
    totalHoras: '40 encontros/ano (3h cada)',
    grade: [
      {
        titulo: 'Grade 2026',
        materias: [
          { nome: 'A Mulher e a Bíblia — Parte I (Antigo Testamento)', horas: 7, tipo: 'presencial' },
          { nome: 'A Mulher e a Bíblia — Parte II (Novo Testamento)', horas: 6, tipo: 'presencial' },
          { nome: 'A Mulher e a Vida Cristã', horas: 4, tipo: 'presencial' },
          { nome: 'A Mulher e as Emoções', horas: 6, tipo: 'presencial' },
          { nome: 'A Mulher e a Missão', horas: 5, tipo: 'presencial' },
          { nome: 'A Mulher e a Família', horas: 5, tipo: 'presencial' },
          { nome: 'A Mulher e a Pregação', horas: 7, tipo: 'presencial' },
        ],
      },
    ],
  },
];

export const getCourse = (id: CourseId) => courses.find(c => c.id === id);
