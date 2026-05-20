import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BookOpen, Clock, User, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const posts = [
  {
    slug: 'o-que-e-teologia-sistematica',
    categoria: 'Teologia',
    titulo: 'O que é Teologia Sistemática e por que todo cristão deveria estudá-la',
    resumo: 'A Teologia Sistemática organiza as grandes doutrinas da fé cristã de forma coerente e aplicável. Entenda por que esse estudo é indispensável para líderes e leigos.',
    autor: 'Pr. Roberto Almeida',
    data: '15 Mai 2025',
    leitura: '6 min',
    destaque: true,
  },
  {
    slug: 'hermeneutica-biblica-principios',
    categoria: 'Bíblia',
    titulo: 'Princípios fundamentais de Hermenêutica Bíblica para leigos',
    resumo: 'Como interpretar a Bíblia com fidelidade ao texto? Conheça os princípios que guiam uma leitura responsável das Escrituras.',
    autor: 'Pr. Marcos Ferreira',
    data: '8 Mai 2025',
    leitura: '5 min',
    destaque: false,
  },
  {
    slug: 'ministerio-da-mulher-na-igreja',
    categoria: 'Ministério',
    titulo: 'O ministério da mulher na Igreja: fundamentos bíblicos e teológicos',
    resumo: 'Uma análise equilibrada das passagens bíblicas sobre o papel da mulher no serviço cristão, com aplicações práticas para o contexto contemporâneo.',
    autor: 'Pra. Ana Cristina Souza',
    data: '1 Mai 2025',
    leitura: '8 min',
    destaque: false,
  },
  {
    slug: 'reforma-protestante-legado',
    categoria: 'História',
    titulo: 'O legado da Reforma Protestante para o Brasil do século XXI',
    resumo: 'Quinhentos anos após a Reforma, seus princípios ainda moldam a teologia, a cultura e a missão da Igreja evangélica brasileira.',
    autor: 'Dra. Fernanda Costa',
    data: '22 Abr 2025',
    leitura: '7 min',
    destaque: false,
  },
  {
    slug: 'como-preparar-sermao',
    categoria: 'Homilética',
    titulo: 'Como preparar um sermão expositivo em 7 passos',
    resumo: 'Um roteiro prático para pregadores iniciantes e experientes: da escolha do texto até a entrega no púlpito, com exemplos reais de estruturação.',
    autor: 'Pr. José Henrique Barbosa',
    data: '14 Abr 2025',
    leitura: '10 min',
    destaque: false,
  },
  {
    slug: 'missao-integral-desafios',
    categoria: 'Missão',
    titulo: 'Missão integral: proclamar e demonstrar o Evangelho no Brasil hoje',
    resumo: 'A missão da Igreja não se reduz ao verbal. Descubra como o conceito de missão integral desafia nossas igrejas a agir de forma plena no mundo.',
    autor: 'Pr. Carlos Eduardo Lima',
    data: '5 Abr 2025',
    leitura: '6 min',
    destaque: false,
  },
];

const categoriaCores: Record<string, string> = {
  Teologia: 'bg-blue-900/30 text-blue-300 border-blue-800/40',
  Bíblia:   'bg-yellow-900/30 text-yellow-300 border-yellow-800/40',
  Ministério:'bg-purple-900/30 text-purple-300 border-purple-800/40',
  História: 'bg-orange-900/30 text-orange-300 border-orange-800/40',
  Homilética:'bg-teal-900/30 text-teal-300 border-teal-800/40',
  Missão:   'bg-green-900/30 text-green-300 border-green-800/40',
};

export default function Blog() {
  const destaque = posts.find(p => p.destaque)!;
  const demais = posts.filter(p => !p.destaque);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-black via-gray-900 to-gray-800">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            <BookOpen className="h-4 w-4" />
            Blog ITEC
          </div>
          <h1 className="font-merriweather font-bold text-4xl md:text-5xl text-white mb-6">
            Reflexões <span className="text-primary">Teológicas</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Artigos, reflexões e recursos escritos pelo corpo docente do ITEC para edificar a Igreja e aprofundar a fé.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container-custom">

          {/* Post destaque */}
          <div className="bg-card border border-primary/30 rounded-xl p-8 mb-12 hover:border-primary/60 transition-all duration-300 group cursor-pointer">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`text-xs font-semibold border px-2.5 py-0.5 rounded-full ${categoriaCores[destaque.categoria]}`}>
                {destaque.categoria}
              </span>
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-semibold">
                ★ Destaque
              </span>
            </div>
            <h2 className="font-merriweather font-bold text-2xl md:text-3xl text-foreground mb-3 group-hover:text-primary transition-colors">
              {destaque.titulo}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-3xl">{destaque.resumo}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{destaque.autor}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{destaque.leitura} de leitura</span>
              <span>{destaque.data}</span>
              <span className="ml-auto flex items-center gap-1 text-primary font-medium">
                Ler artigo <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {/* Grid de posts */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demais.map(post => (
              <div key={post.slug} className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer">
                <div className="mb-3">
                  <span className={`text-xs font-semibold border px-2.5 py-0.5 rounded-full ${categoriaCores[post.categoria] ?? 'bg-muted text-muted-foreground border-border'}`}>
                    <Tag className="h-3 w-3 inline mr-1" />{post.categoria}
                  </span>
                </div>
                <h3 className="font-merriweather font-bold text-lg text-foreground mb-2 leading-snug flex-1 group-hover:text-primary transition-colors">
                  {post.titulo}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.resumo}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-4 border-t border-border">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.autor.split(' ').slice(0,2).join(' ')}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.leitura}</span>
                  <span className="ml-auto flex items-center gap-1 text-primary font-medium">
                    Ler <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-12">
            Mais artigos em breve. <Link to="/contato" className="text-primary hover:underline">Sugira um tema</Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
