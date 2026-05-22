import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Target, Eye, Heart, BookOpen, Users, Award, MapPin, Calendar } from 'lucide-react';

const valores = [
  { icon: BookOpen, title: 'Excelência Acadêmica', desc: 'Compromisso com um ensino teológico rigoroso, fundamentado nas Escrituras e nos melhores recursos da tradição cristã reformada.' },
  { icon: Heart,    title: 'Formação Espiritual',  desc: 'Acreditamos que o conhecimento deve transformar o caráter. Integramos a vida devocional ao currículo acadêmico.' },
  { icon: Users,    title: 'Comunidade de Fé',     desc: 'Fomentamos vínculos duradouros entre alunos, professores e igrejas, construindo uma rede de apoio ministerial.' },
  { icon: Award,    title: 'Missão Prática',        desc: 'Preparamos líderes para servir com eficiência nas igrejas locais, missões e demais esferas da sociedade.' },
];

const linha_do_tempo = [
  { ano: '2025', evento: 'Fundação do ITEC em Paulista-PE com muita oração, com a primeira turma de Teologia Básica.' },
  { ano: '2010', evento: 'Expansão para o ensino semipresencial, atendendo alunos de todo o Nordeste.' },
  { ano: '2015', evento: 'Lançamento do curso de Graduação em Teologia com 185 créditos.' },
  { ano: '2020', evento: 'Migração para o modelo 100% EAD, com plataforma digital própria.' },
  { ano: '2025', evento: 'Nova plataforma ITEC EAD com área do aluno, ao vivo e comunidade integrados.' },
];

export default function Sobre() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -right-32 top-0 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            <Heart className="h-4 w-4" />
            Nossa Identidade
          </div>
          <h1 className="font-merriweather font-bold text-4xl md:text-5xl text-white mb-6">
            Nossa <span className="text-primary">Missão</span>
          </h1>
          <p className="text-lg text-white/70 max-w-3xl mx-auto leading-relaxed">
            O Instituto de Teologia Cristã (ITEC) existe para formar servos de Deus com excelência acadêmica,
            profundidade espiritual e comprometimento com a missão da Igreja no mundo.
          </p>
        </div>
      </section>

      {/* Missão, Visão, Valores */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-start mb-20">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="mt-1 h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-merriweather font-bold text-2xl text-foreground mb-3">Missão</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Proporcionar formação teológica integral — acadêmica, espiritual e prática —
                    a cristãos comprometidos com o Reino de Deus, preparando-os para o ministério
                    nas igrejas locais e na missão global.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-merriweather font-bold text-2xl text-foreground mb-3">Visão</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Ser referência em educação teológica no Brasil, formando líderes que transformam
                    comunidades pela Palavra de Deus e pelo exemplo de vida cristã autêntica.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '+1.200', label: 'Alunos formados' },
                { num: '2025', label: 'Ano de fundação' },
                { num: '3 cursos', label: 'de formação' },
                { num: '100%', label: 'Online' },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors">
                  <p className="font-merriweather font-bold text-3xl text-primary mb-1">{s.num}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Valores */}
          <div className="text-center mb-12">
            <h2 className="font-merriweather font-bold text-3xl text-foreground mb-3">Nossos Valores</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Princípios que guiam cada decisão, cada aula e cada relacionamento no ITEC.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valores.map(v => (
              <div key={v.title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-merriweather font-semibold text-lg text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Linha do tempo */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-merriweather font-bold text-3xl text-foreground mb-3">Nossa História</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Nascido em oração em 2025, fiel à vocação de formar servos de Deus.</p>
          </div>
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-8">
              {linha_do_tempo.map(item => (
                <div key={item.ano} className="flex gap-6 items-start">
                  <div className="relative z-10 h-16 w-16 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{item.ano}</span>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 flex-1 mt-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.evento}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Localização */}
      <section className="py-16 bg-background">
        <div className="container-custom text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground text-sm mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Unidade Janga · Paulista-PE · Brasil</span>
          </div>
          <h2 className="font-merriweather font-bold text-2xl text-foreground mb-4">Venha nos Conhecer</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Nossa sede está localizada em Paulista-PE. A formação é híbrida (presencial e online),
            realizamos eventos presenciais, cultos e encontros de comunidade ao longo do ano.
          </p>
          <p className="text-xs text-muted-foreground mb-2">secretaria@itecedu.com · (81) 99116-1448 · itecedu.com</p>
          <a href="/contato" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            <Calendar className="h-4 w-4" /> Entrar em contato
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
