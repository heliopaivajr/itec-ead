import React from 'react';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote:
      'O curso de teologia do ITEC transformou minha visão ministerial. A qualidade do conteúdo e o cuidado dos professores fizeram toda a diferença na minha formação.',
    role: 'Aluno(a) — Graduação em Teologia',
  },
  {
    quote:
      'Mesmo à distância, é possível sentir o cuidado espiritual e acadêmico em cada aula. A plataforma é intuitiva e o conteúdo é profundo e transformador.',
    role: 'Aluno(a) — SETEB',
  },
  {
    quote:
      'O curso ministerial de mulheres me preparou para servir com fundamento bíblico sólido e propósito claro. Recomendo a todas as irmãs.',
    role: 'Aluna — Curso Ministerial de Mulheres',
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-itec-bloodRed/30 blur-3xl" />
      </div>
      <div className="container-custom relative z-10">
        <div className="text-center mb-12">
          <h2 className="font-merriweather font-bold text-3xl lg:text-4xl mb-4">
            Depoimentos <span className="text-itec-bloodRed">Reais</span> de Alunos
          </h2>
          <p className="text-white/70 max-w-3xl mx-auto">
            Depoimentos verdadeiros de quem está sendo transformado através da formação teológica do ITEC.
          </p>
          <p className="text-white/50 text-sm mt-2 italic">
            Por enquanto, preservamos a identidade dos alunos.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm p-6 rounded-lg border border-itec-bloodRed/30 relative hover:border-itec-bloodRed/60 transition-colors"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-itec-bloodRed/30" />
              <p className="text-white/90 mb-6 italic leading-relaxed">"{t.quote}"</p>
              <div className="pt-4 border-t border-white/10">
                <p className="text-itec-bloodRed text-sm font-semibold">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
