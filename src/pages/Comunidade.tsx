import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Users, MessageSquare, Heart, Calendar, BookOpen, Music, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const espacos = [
  { icon: MessageSquare, title: 'Fórum Teológico',   desc: 'Discussões aprofundadas sobre textos bíblicos, doutrinas e temas da fé cristã. Moderado pelos professores do ITEC.', status: 'em breve' },
  { icon: Heart,         title: 'Grupos de Oração',  desc: 'Grupos pequenos organizados por região e turma para comunhão, oração intercessionária e crescimento espiritual mútuo.', status: 'em breve' },
  { icon: BookOpen,      title: 'Clube de Leitura',  desc: 'Leituras mensais de clássicos da teologia reformada, com debates online guiados por um docente convidado.', status: 'em breve' },
  { icon: Music,         title: 'Louvor & Devoção',  desc: 'Espaço para compartilhar hinos, reflexões devocionais e recursos de adoração para uso pessoal e congregacional.', status: 'em breve' },
  { icon: Calendar,      title: 'Eventos & Encontros', desc: 'Conferências, retiros, cultos de formatura e seminários presenciais e online abertos à comunidade ITEC.', status: 'em breve' },
  { icon: Users,         title: 'Rede de Egressos',  desc: 'Conecte-se com ex-alunos formados pelo ITEC, compartilhe experiências ministeriais e fortaleça a rede de servos de Deus.', status: 'em breve' },
];

export default function Comunidade() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            <Users className="h-4 w-4" />
            Comunidade ITEC
          </div>
          <h1 className="font-merriweather font-bold text-4xl md:text-5xl text-white mb-6">
            Mais do que um curso —<br /><span className="text-primary">uma Comunidade</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            No ITEC acreditamos que a formação teológica genuína acontece em comunidade.
            Aqui você encontra irmãos que caminham com você na fé e no serviço ao Reino.
          </p>
        </div>
      </section>

      {/* Espaços */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-merriweather font-bold text-3xl text-foreground mb-3">Espaços da Comunidade</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Recursos e espaços de convivência que estarão disponíveis para alunos matriculados.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {espacos.map(e => (
              <div key={e.title} className="bg-card border border-border rounded-xl p-6 relative overflow-hidden group hover:border-primary/40 transition-all duration-300">
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-yellow-900/30 text-yellow-400 border border-yellow-800/40 px-2 py-0.5 rounded-full">
                    <Lock className="h-2.5 w-2.5" /> Em breve
                  </span>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                  <e.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-merriweather font-semibold text-lg text-foreground mb-2">{e.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA matrícula */}
      <section className="py-16 bg-muted/30">
        <div className="container-custom text-center">
          <h2 className="font-merriweather font-bold text-2xl text-foreground mb-4">
            Faça parte desta comunidade
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Os espaços da comunidade estão disponíveis exclusivamente para alunos matriculados.
            Inscreva-se e comece sua jornada conosco.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/cursos" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              <BookOpen className="h-4 w-4" /> Ver cursos
            </Link>
            <Link to="/contato" className="inline-flex items-center justify-center gap-2 border border-border hover:border-primary/40 text-foreground font-semibold px-6 py-3 rounded-lg transition-colors">
              <MessageSquare className="h-4 w-4" /> Tirar dúvidas
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
