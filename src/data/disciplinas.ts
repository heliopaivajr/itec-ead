export type TipoDisciplina = 'obrigatoria' | 'eletiva' | 'eletiva_obrigatoria';
export type AreaDisciplina = 'B' | 'T' | 'P';
export type TipoPrerequisito = 'formal' | 'recomendado' | 'corequisito';

export interface Disciplina {
  codigo: string;
  nome: string;
  modulo: 1 | 2 | 3 | 4 | 5 | 6;
  ano: 1 | 2 | 3;
  carga_horaria: number;
  horas_presencial: number;
  horas_ead: number;
  tipo: TipoDisciplina;
  area: AreaDisciplina;
}

export interface Prerequisito {
  disciplina_codigo: string;
  prerequisito_codigo: string;
  tipo: TipoPrerequisito;
}

export const AREA_LABEL: Record<AreaDisciplina, string> = {
  B: 'Bíblico',
  T: 'Teológico',
  P: 'Prático',
};

export const AREA_COLOR: Record<AreaDisciplina, string> = {
  B: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  T: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  P: 'bg-green-500/15 text-green-400 border-green-500/30',
};

export const TIPO_LABEL: Record<TipoDisciplina, string> = {
  obrigatoria: 'Obrigatória',
  eletiva: 'Eletiva',
  eletiva_obrigatoria: 'Eletiva Obrigatória',
};

export const TIPO_COLOR: Record<TipoDisciplina, string> = {
  obrigatoria: 'bg-foreground/10 text-foreground/70 border-foreground/20',
  eletiva: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  eletiva_obrigatoria: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

export const MODULO_PERIODO: Record<number, string> = {
  1: '1º Módulo — Fev–Jun (1º Ano)',
  2: '2º Módulo — Ago–Dez (1º Ano)',
  3: '3º Módulo — Fev–Jun (2º Ano)',
  4: '4º Módulo — Ago–Dez (2º Ano)',
  5: '5º Módulo — Fev–Jun (3º Ano)',
  6: '6º Módulo — Ago–Dez (3º Ano)',
};

export const disciplinas: Disciplina[] = [
  // ── 1º Módulo ──────────────────────────────────────────────────
  { codigo: 'B1-ANT01',   nome: 'Introdução ao Antigo Testamento I (Pentateuco)',                        modulo: 1, ano: 1, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'P1-ESPCR',   nome: 'Espiritualidade Cristã',                                               modulo: 1, ano: 1, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'P' },
  { codigo: 'B1-BIBLI',   nome: 'Introdução Bíblica: Bibliologia',                                      modulo: 1, ano: 1, carga_horaria: 30, horas_presencial: 20, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'B1-NOVO1',   nome: 'Introdução ao Novo Testamento I (Evangelhos)',                         modulo: 1, ano: 1, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'T1-TEOS1',   nome: 'Teologia Sistemática I: Doutrina de Deus e Antropologia/Hamartiologia', modulo: 1, ano: 1, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'T' },
  { codigo: 'P1-MISS1',   nome: 'Missiologia I: Teologia em Missões (introdução)',                      modulo: 1, ano: 1, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'P' },

  // ── 2º Módulo ──────────────────────────────────────────────────
  { codigo: 'B1-ANT02',   nome: 'Introdução ao Antigo Testamento II (Históricos)',                      modulo: 2, ano: 1, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'T1-INTER-E', nome: 'Período Interbíblico',                                                modulo: 2, ano: 1, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'eletiva',            area: 'T' },
  { codigo: 'T1-HIST1',   nome: 'História da Igreja I: Primitiva e Medieval',                          modulo: 2, ano: 1, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'T' },
  { codigo: 'T1-TEOS2',   nome: 'Teologia Sistemática II: Cristologia',                                modulo: 2, ano: 1, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'T' },
  { codigo: 'B1-GREK1',   nome: 'Língua Grega I',                                                      modulo: 2, ano: 1, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'T1-FILOS-E', nome: 'Introdução à Filosofia',                                              modulo: 2, ano: 1, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'eletiva',            area: 'T' },
  { codigo: 'B1-NOVO2',   nome: 'Introdução ao Novo Testamento II (Atos)',                             modulo: 2, ano: 1, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'T1-HIST2',   nome: 'História da Igreja II: Reforma e Modernidade',                        modulo: 2, ano: 1, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'T' },

  // ── 3º Módulo ──────────────────────────────────────────────────
  { codigo: 'B2-GREK2',   nome: 'Língua Grega II',                                                     modulo: 3, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'T2-HBRAS-E', nome: 'História da Igreja do Brasil',                                        modulo: 3, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'eletiva',            area: 'T' },
  { codigo: 'B2-ANT03',   nome: 'Introdução ao Antigo Testamento III (Proféticos)',                    modulo: 3, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'T2-TEOS3',   nome: 'Teologia Sistemática III: Soteriologia e Pneumatologia',              modulo: 3, ano: 2, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'T' },
  { codigo: 'B2-NOVO3',   nome: 'Introdução ao Novo Testamento III (Cartas Paulinas)',                 modulo: 3, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'T2-ARQCB-E', nome: 'Arqueologia e Costumes Bíblicos / Geografia Bíblica',                modulo: 3, ano: 2, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'eletiva',            area: 'T' },
  { codigo: 'T2-ETICA',   nome: 'Ética Cristã',                                                        modulo: 3, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'T' },
  { codigo: 'T2-MISS2',   nome: 'Missiologia II: Evangelismo',                                         modulo: 3, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'P' },

  // ── 4º Módulo ──────────────────────────────────────────────────
  { codigo: 'T2-HERMB',   nome: 'Hermenêutica Bíblica',                                                modulo: 4, ano: 2, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'B2-HEBR1-E', nome: 'Língua Hebraica I',                                                   modulo: 4, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'eletiva_obrigatoria', area: 'B' },
  { codigo: 'B2-ANT04',   nome: 'Introdução ao Antigo Testamento IV (Poéticos)',                       modulo: 4, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'T2-MISS3',   nome: 'Missiologia III: História em Missões',                                modulo: 4, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'P' },
  { codigo: 'B2-EXENT',   nome: 'Exegese do Novo Testamento',                                          modulo: 4, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'B2-HEBR2-E', nome: 'Língua Hebraica II',                                                  modulo: 4, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'eletiva',            area: 'B' },
  { codigo: 'T2-ESCTO',   nome: 'Escatologia',                                                         modulo: 4, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'T' },
  { codigo: 'B2-NOVO4',   nome: 'Introdução ao Novo Testamento IV (Cartas Gerais)',                    modulo: 4, ano: 2, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'B' },

  // ── 5º Módulo ──────────────────────────────────────────────────
  { codigo: 'T3-MISS4',   nome: 'Missiologia IV: Implantação de Igreja',                               modulo: 5, ano: 3, carga_horaria: 40, horas_presencial: 40, horas_ead: 10, tipo: 'obrigatoria',        area: 'P' },
  { codigo: 'B3-EXEAT-E', nome: 'Exegese do Antigo Testamento',                                        modulo: 5, ano: 3, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'eletiva',            area: 'B' },
  { codigo: 'P3-ACOS1',   nome: 'Aconselhamento Bíblico I',                                            modulo: 5, ano: 3, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'P' },
  { codigo: 'P3-ACOS2',   nome: 'Aconselhamento Bíblico II',                                           modulo: 5, ano: 3, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'P' },
  { codigo: 'P3-HOMIT',   nome: 'Homilética I (Teoria)',                                               modulo: 5, ano: 3, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'P' },
  { codigo: 'T3-TEOCO',   nome: 'Teologia Contemporânea',                                              modulo: 5, ano: 3, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'eletiva',            area: 'T' },
  { codigo: 'P3-HOMIP',   nome: 'Homilética II (Oratória e Prática)',                                  modulo: 5, ano: 3, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'P' },
  { codigo: 'P3-LIDMI',   nome: 'Liderança Ministerial',                                               modulo: 5, ano: 3, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'P' },

  // ── 6º Módulo ──────────────────────────────────────────────────
  { codigo: 'P3-LITCU',   nome: 'Liturgia do Culto Cristão',                                           modulo: 6, ano: 3, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'P' },
  { codigo: 'P3-CAPEL-E', nome: 'Capelania e Visitação',                                               modulo: 6, ano: 3, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'eletiva',            area: 'P' },
  { codigo: 'T3-APOLO',   nome: 'Apologética',                                                         modulo: 6, ano: 3, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'obrigatoria',        area: 'T' },
  { codigo: 'B3-TEAT',    nome: 'Teologia do Antigo Testamento',                                       modulo: 6, ano: 3, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'P3-PRATM',   nome: 'Prática Ministerial e Adoração',                                      modulo: 6, ano: 3, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'P' },
  { codigo: 'T3-SEITA-E', nome: 'Seitas e Heresias',                                                   modulo: 6, ano: 3, carga_horaria: 40, horas_presencial: 30, horas_ead: 10, tipo: 'eletiva',            area: 'T' },
  { codigo: 'B3-TENT',    nome: 'Teologia do Novo Testamento',                                         modulo: 6, ano: 3, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'B' },
  { codigo: 'P3-EDUCA',   nome: 'Educação Cristã e Discipulado',                                       modulo: 6, ano: 3, carga_horaria: 60, horas_presencial: 30, horas_ead: 30, tipo: 'obrigatoria',        area: 'P' },
];

export const prerequisitos: Prerequisito[] = [
  // NT sequência
  { disciplina_codigo: 'B1-NOVO2',   prerequisito_codigo: 'B1-NOVO1',   tipo: 'formal' },
  { disciplina_codigo: 'B2-NOVO3',   prerequisito_codigo: 'B1-NOVO2',   tipo: 'formal' },
  { disciplina_codigo: 'B2-NOVO4',   prerequisito_codigo: 'B2-NOVO3',   tipo: 'formal' },
  // AT sequência
  { disciplina_codigo: 'B1-ANT02',   prerequisito_codigo: 'B1-ANT01',   tipo: 'formal' },
  { disciplina_codigo: 'B2-ANT03',   prerequisito_codigo: 'B1-ANT02',   tipo: 'formal' },
  { disciplina_codigo: 'B2-ANT04',   prerequisito_codigo: 'B2-ANT03',   tipo: 'formal' },
  // Teologia Sistemática
  { disciplina_codigo: 'T1-TEOS2',   prerequisito_codigo: 'T1-TEOS1',   tipo: 'formal' },
  { disciplina_codigo: 'T2-TEOS3',   prerequisito_codigo: 'T1-TEOS2',   tipo: 'formal' },
  { disciplina_codigo: 'T2-ESCTO',   prerequisito_codigo: 'T2-TEOS3',   tipo: 'recomendado' },
  // Hermenêutica
  { disciplina_codigo: 'T2-HERMB',   prerequisito_codigo: 'B1-BIBLI',   tipo: 'recomendado' },
  { disciplina_codigo: 'T2-HERMB',   prerequisito_codigo: 'T1-TEOS1',   tipo: 'recomendado' },
  { disciplina_codigo: 'T2-HERMB',   prerequisito_codigo: 'B1-GREK1',   tipo: 'recomendado' },
  // Grego
  { disciplina_codigo: 'B2-GREK2',   prerequisito_codigo: 'B1-GREK1',   tipo: 'formal' },
  // Hebraico
  { disciplina_codigo: 'B2-HEBR2-E', prerequisito_codigo: 'B2-HEBR1-E', tipo: 'formal' },
  // Exegese NT
  { disciplina_codigo: 'B2-EXENT',   prerequisito_codigo: 'B2-GREK2',   tipo: 'recomendado' },
  { disciplina_codigo: 'B2-EXENT',   prerequisito_codigo: 'T2-HERMB',   tipo: 'recomendado' },
  // Exegese AT
  { disciplina_codigo: 'B3-EXEAT-E', prerequisito_codigo: 'B2-HEBR2-E', tipo: 'recomendado' },
  { disciplina_codigo: 'B3-EXEAT-E', prerequisito_codigo: 'T2-HERMB',   tipo: 'recomendado' },
  // Homilética
  { disciplina_codigo: 'P3-HOMIP',   prerequisito_codigo: 'P3-HOMIT',   tipo: 'formal' },
  // Aconselhamento
  { disciplina_codigo: 'P3-ACOS2',   prerequisito_codigo: 'P3-ACOS1',   tipo: 'formal' },
  // Missiologia
  { disciplina_codigo: 'T2-MISS2',   prerequisito_codigo: 'P1-MISS1',   tipo: 'recomendado' },
  { disciplina_codigo: 'T2-MISS3',   prerequisito_codigo: 'T2-MISS2',   tipo: 'recomendado' },
  { disciplina_codigo: 'T3-MISS4',   prerequisito_codigo: 'T2-MISS3',   tipo: 'recomendado' },
  // História da Igreja
  { disciplina_codigo: 'T1-HIST2',   prerequisito_codigo: 'T1-HIST1',   tipo: 'formal' },
];

export const disciplinasByModulo = (modulo: number) =>
  disciplinas.filter(d => d.modulo === modulo);

export const prerequisitosDe = (codigo: string) =>
  prerequisitos.filter(p => p.disciplina_codigo === codigo);

export const disciplinaByCode = (codigo: string) =>
  disciplinas.find(d => d.codigo === codigo);
