
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 py-20 overflow-hidden">
      {/* Futuristic Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlYTM4NGMiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjxwYXRoIGQ9Ik02MCAyOGMwIDYuNjMtNS4zNyAxMi0xMiAxMnMtMTItNS4zNy0xMi0xMiA1LjM3LTEyIDEyLTEyIDEyIDUuMzcgMTIgMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat"></div>
      </div>
      
      {/* Animated Red Lines */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-itec-bloodRed to-transparent opacity-80 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-itec-bloodRed to-transparent opacity-80 animate-pulse-slow"></div>
        <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-transparent via-itec-bloodRed to-transparent opacity-80 animate-pulse-slow"></div>
        <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-transparent via-itec-bloodRed to-transparent opacity-80 animate-pulse-slow"></div>
      </div>
      
      {/* Glowing Circle */}
      <div className="absolute -right-40 -bottom-40 w-96 h-96 rounded-full bg-itec-bloodRed opacity-20 blur-3xl animate-pulse-slow"></div>
      <div className="absolute -left-40 -top-40 w-96 h-96 rounded-full bg-itec-bloodRed opacity-20 blur-3xl animate-pulse-slow"></div>
      
      {/* ── Card Matrículas Abertas — canto inferior esquerdo ── */}
      <Link
        to="/reservar-vaga"
        className="absolute bottom-8 left-6 z-20 group hidden md:block"
        style={{ transform: 'rotate(-4deg)' }}
      >
        <div
          className="relative px-7 py-5 rounded-2xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:rotate-0"
          style={{
            background: 'linear-gradient(135deg, #d40e28 0%, #9b0a20 45%, #5c000f 100%)',
            boxShadow: '0 12px 40px rgba(200,16,46,0.6), inset 0 1px 0 rgba(255,255,255,0.18)',
            minWidth: '220px',
          }}
        >
          {/* Brilho interno */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.14) 0%, transparent 55%)' }} />
          {/* Linha decorativa topo */}
          <div className="absolute top-0 left-5 right-5 h-px bg-white/25 rounded-full" />

          <div className="relative z-10 space-y-2">
            {/* Tag */}
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-300 shrink-0" />
              <span className="text-orange-200 text-[10px] font-extrabold uppercase tracking-[.2em]">
                Novos Alunos · 2025
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-orange-300 animate-pulse ml-1" />
            </div>

            {/* Título grande */}
            <p className="text-white font-merriweather font-extrabold text-xl uppercase leading-tight tracking-wide">
              Matrículas<br />Abertas
            </p>

            {/* Subtítulo */}
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">
              Reserve sua vaga
            </p>

            {/* CTA */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-white/15">
              <span className="text-white/80 text-xs font-bold uppercase tracking-wider">Inscreva-se agora</span>
              <ArrowRight className="h-3.5 w-3.5 text-white/80 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>

      {/* Versão mobile — inline no texto */}
      <div className="md:hidden px-4 pb-2">
        <Link
          to="/reservar-vaga"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm uppercase tracking-wider"
          style={{ background: 'linear-gradient(135deg, #d40e28 0%, #9b0a20 100%)' }}
        >
          <Flame className="h-4 w-4 text-orange-300" />
          Matrículas Abertas — Reserve sua vaga
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="container-custom relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6">
            <div className="inline-block p-2 bg-itec-bloodRed/20 rounded-lg backdrop-blur-sm border border-itec-bloodRed/30 mb-4">
              <img
                src="/uploads/00c3510e-28c5-45a4-9b59-cfd3d101068d.png"
                alt="ITEC Logo"
                className="h-16 w-auto"
                width={120}
                height={64}
              />
            </div>
            <h1 className="font-merriweather font-bold text-4xl lg:text-5xl leading-tight">
              <span className="text-white">Formação Teológica de</span> <span className="text-itec-bloodRed">Excelência</span> <span className="text-white">para sua Vocação Cristã</span>
            </h1>
            <p className="text-lg opacity-90">
              O ITEC oferece um curso livre de teologia, unindo tradição, inovação e formação espiritual autêntica para sua jornada ministerial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild className="bg-itec-bloodRed hover:bg-itec-bloodRed/90 text-white border-2 border-transparent hover:border-itec-bloodRed hover:bg-transparent transition-all duration-300">
                <Link to="/cursos">Conheça Nossos Cursos</Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent text-itec-bloodRed border-itec-bloodRed hover:bg-itec-bloodRed hover:text-white transition-all duration-300">
                <Link to="/ebook">Baixar E-book Gratuito</Link>
              </Button>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 text-sm">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="w-8 h-8 rounded-full border-2 border-itec-bloodRed/50 overflow-hidden bg-black/50" />
                ))}
              </div>
              <p>Mais de <strong className="text-itec-bloodRed">1.200 alunos</strong> já formados</p>
            </div>
          </div>
          
          <div className="relative">

            <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-lg shadow-xl border border-itec-bloodRed/50 transform rotate-1 animate-pulse-slow">
              <div className="absolute -top-3 -right-3 bg-itec-bloodRed text-white text-xs font-bold px-3 py-1 rounded-full animate-glow">
                Inscrições Abertas
              </div>
              <h2 className="font-merriweather font-bold text-itec-bloodRed text-xl mb-3">Graduação em Teologia</h2>
              <ul className="space-y-2 text-sm text-white">
                <li className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-itec-bloodRed/20 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-itec-bloodRed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Duração: 3 anos (185 créditos)</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-itec-bloodRed/20 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-itec-bloodRed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Modalidade: Híbrida (Presencial e Online)</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-itec-bloodRed/20 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-itec-bloodRed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Aulas gravadas e ao vivo</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-itec-bloodRed/20 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-itec-bloodRed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Mentoria espiritual</span>
                </li>
              </ul>
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 line-through text-sm">R$ 299,90</span>
                  <div className="text-itec-bloodRed font-bold">R$ 249,90<span className="text-xs font-normal text-white">/mês</span></div>
                </div>
                <Button asChild className="bg-itec-bloodRed hover:bg-itec-bloodRed/80 text-white">
                  <Link to="/matricula">Matricule-se</Link>
                </Button>
              </div>
            </div>
            
            {/* Animated dots pattern */}
            <div className="absolute -z-10 -bottom-10 -right-10 w-32 h-32 grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full bg-itec-bloodRed opacity-${(i % 3 + 5) * 10} animate-pulse-slow delay-${i * 100}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
