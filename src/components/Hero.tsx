import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight, Volume2, VolumeX } from 'lucide-react';

// ─── CSS keyframe animations injected once ───────────────────────────────────
const ANIM_CSS = `
@keyframes hero-fade-up {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hero-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.hero-anim-logo    { animation: hero-fade-up   0.8s  ease-out  0.3s  both; }
.hero-anim-title   { animation: hero-fade-up   1.0s  ease-out  0.9s  both; }
.hero-anim-sub     { animation: hero-fade-up   0.9s  ease-out  1.7s  both; }
.hero-anim-btn     { animation: hero-fade-in   0.8s  ease-out  2.5s  both; }
.hero-anim-tagline { animation: hero-fade-in   0.8s  ease-out  3.1s  both; }
.hero-anim-card    { animation: hero-fade-up   0.9s  ease-out  3.4s  both; }
.hero-anim-audio   { animation: hero-fade-in   0.6s  ease-out  3.8s  both; }
`;

const Hero = () => {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const [muted,   setMuted]   = useState(true);
  // Autoplay muted
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  const toggleAudio = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    if (!next) v.play().catch(() => {});
    setMuted(next);
  };

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: '100vh' }}>
      <style>{ANIM_CSS}</style>

      {/* ── Vídeo de fundo ─────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src="/videos/hero-bg.mp4"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
        loop
        playsInline
        muted
        preload="auto"
        aria-hidden="true"
      />

      {/* ── Overlays ───────────────────────────────────────────────────── */}
      {/* Camada escura geral */}
      <div className="absolute inset-0 bg-black/55" />
      {/* Gradiente direcional — reforça legibilidade à esquerda */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.10) 100%)' }} />
      {/* Borda inferior suave para transição com a próxima seção */}
      <div className="absolute bottom-0 left-0 right-0 h-32"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))' }} />

      {/* Linhas decorativas animadas (mantém identidade visual) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-itec-bloodRed/60 to-transparent animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-itec-bloodRed/60 to-transparent animate-pulse-slow" />
      </div>

      {/* ── Conteúdo ───────────────────────────────────────────────────── */}
      <div className="relative z-10 container-custom flex items-center" style={{ minHeight: '100vh', paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="grid md:grid-cols-2 gap-12 items-center w-full">

          {/* Coluna esquerda */}
          <div className="text-white space-y-6">

            {/* Logo — branca sobre o vídeo */}
            <div className="hero-anim-logo inline-block">
              <img
                src="/logo_itec_transparent.png"
                alt="ITEC Logo"
                className="h-20 w-auto drop-shadow-lg"
                style={{ filter: 'brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
                width={140}
                height={80}
              />
            </div>

            {/* Título principal */}
            <h1 className="hero-anim-title font-merriweather font-bold text-4xl lg:text-5xl leading-tight drop-shadow-lg">
              <span className="text-white">Formação Teológica de</span>{' '}
              <span className="text-itec-bloodRed">Excelência</span>{' '}
              <span className="text-white">para sua Vocação Cristã</span>
            </h1>

            {/* Subtítulo */}
            <p className="hero-anim-sub text-lg text-white/85 leading-relaxed max-w-lg drop-shadow">
              O ITEC oferece um curso livre de teologia, unindo tradição, inovação e formação espiritual autêntica para sua jornada ministerial.
            </p>

            {/* Botão */}
            <div className="hero-anim-btn flex flex-col sm:flex-row gap-4 pt-2">
              <Button asChild className="bg-itec-bloodRed hover:bg-itec-bloodRed/90 text-white border-2 border-transparent hover:border-itec-bloodRed hover:bg-transparent transition-all duration-300 shadow-lg shadow-itec-bloodRed/30">
                <Link to="/cursos">Conheça Nossos Cursos</Link>
              </Button>
            </div>

            {/* Tagline */}
            <div className="hero-anim-tagline">
              <p className="text-sm text-white/65 italic leading-relaxed border-l-2 border-itec-bloodRed/60 pl-3">
                "Onde a Palavra de Deus encontra a sua vocação."
              </p>
            </div>
          </div>

          {/* Coluna direita — card do curso */}
          <div className="relative hero-anim-card">
            <div className="bg-gray-900/75 backdrop-blur-md p-6 rounded-lg shadow-2xl border border-itec-bloodRed/50 transform rotate-1">
              <div className="absolute -top-3 -right-3 bg-itec-bloodRed text-white text-xs font-bold px-3 py-1 rounded-full animate-glow shadow-lg shadow-itec-bloodRed/50">
                Inscrições Abertas
              </div>
              <h2 className="font-merriweather font-bold text-itec-bloodRed text-xl mb-3">Graduação em Teologia</h2>
              <ul className="space-y-2 text-sm text-white">
                {[
                  'Duração: 3 anos (185 créditos)',
                  'Modalidade: Híbrida (Presencial e Online)',
                  'Aulas gravadas e ao vivo',
                  'Mentoria espiritual',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-itec-bloodRed/20 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-itec-bloodRed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 line-through text-sm">R$ 299,90</span>
                  <div className="text-itec-bloodRed font-bold">R$ 249,90<span className="text-xs font-normal text-white">/mês</span></div>
                </div>
                <Button asChild className="bg-itec-bloodRed hover:bg-itec-bloodRed/80 text-white shadow-md">
                  <Link to="/reservar-vaga">Matricule-se</Link>
                </Button>
              </div>
            </div>

            {/* Dots decorativos */}
            <div className="absolute -z-10 -bottom-10 -right-10 w-32 h-32 grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full bg-itec-bloodRed opacity-${(i % 3 + 4) * 10} animate-pulse-slow`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Card Matrículas Abertas — canto inferior direito ──────────── */}
      <Link
        to="/reservar-vaga"
        className="hero-anim-card absolute bottom-8 right-6 z-20 group hidden md:block"
        style={{ transform: 'rotate(3deg)' }}
      >
        <div
          className="relative px-7 py-5 rounded-2xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:rotate-0"
          style={{
            background: 'linear-gradient(135deg, #d40e28 0%, #9b0a20 45%, #5c000f 100%)',
            boxShadow: '0 12px 40px rgba(200,16,46,0.6), inset 0 1px 0 rgba(255,255,255,0.18)',
            minWidth: '220px',
          }}
        >
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.14) 0%, transparent 55%)' }} />
          <div className="absolute top-0 left-5 right-5 h-px bg-white/25 rounded-full" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-300 shrink-0" />
              <span className="text-orange-200 text-[10px] font-extrabold uppercase tracking-[.2em]">
                Novos Alunos · 2026
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-orange-300 animate-pulse ml-1" />
            </div>
            <p className="text-white font-merriweather font-extrabold text-xl uppercase leading-tight tracking-wide">
              Matrículas<br />Abertas
            </p>
            <p className="text-orange-200/90 text-xs uppercase tracking-widest font-bold">
              Início — Agosto 2026
            </p>
            <div className="flex items-center gap-1.5 pt-1 border-t border-white/15">
              <span className="text-white/80 text-xs font-bold uppercase tracking-wider">Reserve sua vaga</span>
              <ArrowRight className="h-3.5 w-3.5 text-white/80 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>

      {/* ── Controle de áudio — discreto, canto inferior esquerdo ────── */}
      <button
        onClick={toggleAudio}
        className="hero-anim-audio absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white/70 hover:text-white text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200"
        title={muted ? 'Ativar áudio' : 'Desativar áudio'}
      >
        {muted
          ? <><VolumeX className="h-3.5 w-3.5" /> <span>Ativar áudio</span></>
          : <><Volume2 className="h-3.5 w-3.5 text-itec-bloodRed" /> <span>Desativar áudio</span></>
        }
      </button>
    </section>
  );
};

export default Hero;
