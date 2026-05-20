import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GraduationCap, BookOpen, Mail, Users } from 'lucide-react';

const docentes = [
  {
    nome: 'Pr. Roberto Almeida',
    titulacao: 'Doutor em Teologia Sistemática',
    instituicao: 'Westminster Theological Seminary',
    area: 'Teologia Sistemática e Apologética',
    bio: 'Mais de 20 anos dedicados ao ensino e pesquisa em Teologia Sistemática. Autor de artigos sobre doutrinas reformadas e apologética cristã contemporânea.',
    disciplinas: ['Teologia Sistemática I e II', 'Cristologia', 'Apologética'],
    iniciais: 'RA',
  },
  {
    nome: 'Pr. Marcos Ferreira',
    titulacao: 'Mestre em Exegese do Novo Testamento',
    instituicao: 'Seminário Bíblico do Nordeste',
    area: 'Exegese e Hermenêutica',
    bio: 'Especialista em línguas originais (grego koinê e hebraico bíblico). Traduz e comenta textos do Novo Testamento para uso acadêmico e pastoral.',
    disciplinas: ['Grego Bíblico', 'Hermenêutica', 'Exegese do NT'],
    iniciais: 'MF',
  },
  {
    nome: 'Pra. Ana Cristina Souza',
    titulacao: 'Especialista em Ministério Pastoral',
    instituicao: 'Faculdade Teológica do Brasil',
    area: 'Teologia Pastoral e Aconselhamento',
    bio: 'Pastora com vasta experiência em aconselhamento cristão e formação de líderes. Atua no desenvolvimento ministerial de mulheres e jovens na Igreja.',
    disciplinas: ['Teologia Pastoral', 'Aconselhamento Bíblico', 'Ministério da Mulher'],
    iniciais: 'AS',
  },
  {
    nome: 'Pr. Carlos Eduardo Lima',
    titulacao: 'Mestre em Teologia Bíblica',
    instituicao: 'Calvin Theological Seminary',
    area: 'Antigo Testamento e Missiologia',
    bio: 'Pesquisador do Antigo Testamento e teólogo missionário com experiência em campo. Desenvolve materiais de missiologia para contextos brasileiros.',
    disciplinas: ['Teologia do AT', 'Missiologia', 'Introdução à Bíblia'],
    iniciais: 'CL',
  },
  {
    nome: 'Pr. José Henrique Barbosa',
    titulacao: 'Bacharel em Teologia com pós em Homilética',
    instituicao: 'Instituto Bíblico das Assembleias de Deus',
    area: 'Homilética e Práticas Ministeriais',
    bio: 'Pastor fundador do ITEC e docente com mais de 25 anos de ministério. Especialista em formação de pregadores e desenvolvimento de lideranças locais.',
    disciplinas: ['Homilética', 'Práticas Ministeriais', 'Ética Cristã'],
    iniciais: 'JB',
  },
  {
    nome: 'Dra. Fernanda Costa',
    titulacao: 'Doutora em História da Igreja',
    instituicao: 'Universidade Federal de Pernambuco',
    area: 'História da Igreja e Patrística',
    bio: 'Pesquisadora da história do Cristianismo no Brasil e dos Pais da Igreja. Combina rigor acadêmico com aplicação pastoral na sala de aula.',
    disciplinas: ['História da Igreja I e II', 'Patrística', 'Reforma Protestante'],
    iniciais: 'FC',
  },
];

const cores = [
  'bg-red-900/30 text-red-300 border-red-800/40',
  'bg-blue-900/30 text-blue-300 border-blue-800/40',
  'bg-purple-900/30 text-purple-300 border-purple-800/40',
  'bg-teal-900/30 text-teal-300 border-teal-800/40',
  'bg-orange-900/30 text-orange-300 border-orange-800/40',
  'bg-green-900/30 text-green-300 border-green-800/40',
];

export default function Docentes() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-black via-gray-900 to-gray-800">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -left-32 top-0 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            <Users className="h-4 w-4" />
            Corpo Docente
          </div>
          <h1 className="font-merriweather font-bold text-4xl md:text-5xl text-white mb-6">
            Nossos <span className="text-primary">Docentes</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Professores comprometidos com a excelência acadêmica e a formação espiritual,
            com titulação e experiência pastoral reconhecidas.
          </p>
        </div>
      </section>

      {/* Grid de docentes */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {docentes.map((d, i) => (
              <div key={d.nome} className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`h-14 w-14 rounded-full border-2 flex items-center justify-center font-merriweather font-bold text-lg shrink-0 ${cores[i % cores.length]}`}>
                    {d.iniciais}
                  </div>
                  <div>
                    <h3 className="font-merriweather font-bold text-foreground leading-tight">{d.nome}</h3>
                    <p className="text-xs text-primary font-medium mt-0.5">{d.area}</p>
                  </div>
                </div>

                {/* Titulação */}
                <div className="flex items-start gap-2 mb-3">
                  <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground font-medium">{d.titulacao}</p>
                    <p className="text-xs text-muted-foreground">{d.instituicao}</p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{d.bio}</p>

                {/* Disciplinas */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Disciplinas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.disciplinas.map(disc => (
                      <span key={disc} className="text-xs bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {disc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container-custom text-center">
          <h2 className="font-merriweather font-bold text-2xl text-foreground mb-4">
            Interessado em lecionar no ITEC?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Buscamos professores comprometidos com a fé reformada e com experiência acadêmica e pastoral.
            Entre em contato com nossa coordenação.
          </p>
          <a href="/contato" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            <Mail className="h-4 w-4" /> Fale com a coordenação
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
