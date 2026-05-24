import { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, RotateCcw } from 'lucide-react';

const videos = [
  { src: '/videos/v01.mp4', label: 'Matrículas Abertas',     tag: '🎓 Inscreva-se',  color: 'from-red-900/70'    },
  { src: '/videos/v02.mp4', label: 'Testemunho',             tag: '❤️ Depoimento',   color: 'from-purple-900/70' },
  { src: '/videos/v03.mp4', label: 'Curso para Mulheres',    tag: '👩‍🎓 Ministério', color: 'from-rose-900/70'   },
  { src: '/videos/v04.mp4', label: 'Sala de Aula',           tag: '📚 Ensino',        color: 'from-blue-900/70'   },
  { src: '/videos/v05.mp4', label: 'Chamada para Matrícula', tag: '🔔 Não perca!',    color: 'from-amber-900/70'  },
];

// ─── Card individual ──────────────────────────────────────────────────────────
function VideoCard({
  video, index, active, sectionVisible, globalMuted,
  onActivate, onToggleMute, onEnded,
}: {
  video: typeof videos[0];
  index: number;
  active: boolean;
  sectionVisible: boolean;
  globalMuted: boolean;
  onActivate: (i: number) => void;
  onToggleMute: () => void;
  onEnded: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [ended, setEnded]       = useState(false);

  // Play/pause conforme ativo + visível
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (sectionVisible && active) {
      v.muted = globalMuted;
      v.currentTime = 0;
      setEnded(false);
      setProgress(0);
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
      setProgress(0);
      setEnded(false);
    }
  }, [sectionVisible, active]);

  // Sync muted sem reiniciar
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = globalMuted;
  }, [globalMuted]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }, []);

  const handleEnded = useCallback(() => {
    setEnded(true);
    onEnded();
  }, [onEnded]);

  const handleReplay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    setEnded(false);
    setProgress(0);
    v.play().catch(() => {});
  }, []);

  return (
    <div
      onClick={() => onActivate(index)}
      className={`
        relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer select-none
        transition-all duration-500 ease-out group
        ${active
          ? 'w-[200px] sm:w-[240px] scale-105 z-10 shadow-2xl shadow-primary/40'
          : 'w-[160px] sm:w-[185px] scale-100 opacity-55 hover:opacity-80 hover:scale-[1.02]'
        }
      `}
      style={{ aspectRatio: '9/16' }}
    >
      {/* Vídeo — sem loop, avança ao terminar */}
      <video
        ref={videoRef}
        src={video.src}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Overlay gradiente */}
      <div className={`absolute inset-0 bg-gradient-to-t ${video.color} to-transparent transition-opacity duration-300 ${active ? 'opacity-20' : 'opacity-55'}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

      {/* Tag topo esquerdo */}
      <div className="absolute top-3 left-3">
        <span className="text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/20">
          {video.tag}
        </span>
      </div>

      {/* Botão som — card ativo */}
      {active && !ended && (
        <button
          onClick={e => { e.stopPropagation(); onToggleMute(); }}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white hover:bg-primary transition-all z-20"
          title={globalMuted ? 'Ativar som' : 'Silenciar'}
        >
          {globalMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      )}

      {/* Botão replay quando terminou */}
      {active && ended && (
        <button
          onClick={handleReplay}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-sm z-20"
        >
          <div className="h-12 w-12 rounded-full bg-primary/80 flex items-center justify-center">
            <RotateCcw className="h-5 w-5 text-white" />
          </div>
          <span className="text-white text-xs font-bold uppercase tracking-wider">Assistir novamente</span>
        </button>
      )}

      {/* Barra de progresso — só no card ativo */}
      {active && !ended && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
          <div
            className="h-full bg-primary transition-none rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Rodapé título + equalizer */}
      <div className="absolute bottom-3 left-0 right-0 px-3">
        <p className="text-white font-bold text-xs leading-tight drop-shadow">{video.label}</p>
        {active && !globalMuted && !ended && (
          <div className="flex items-end gap-0.5 mt-1.5 h-4">
            {[3, 6, 4, 7, 5, 3, 6].map((h, i) => (
              <div key={i} className="w-[3px] bg-primary rounded-full"
                style={{ height: `${h}px`, animation: `eq ${0.4 + i * 0.07}s ease-in-out infinite alternate` }} />
            ))}
          </div>
        )}
      </div>

      {/* Anel brilhante ativo */}
      {active && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/70 pointer-events-none" />
      )}

      {/* Hint hover nos inativos */}
      {!active && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <ChevronRight className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Seção principal ──────────────────────────────────────────────────────────
export default function VideoReel() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const [visible,   setVisible]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted,     setMuted]     = useState(true);

  // IntersectionObserver — inicia ao entrar na tela
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Avança para o próximo ao terminar o vídeo
  const handleVideoEnded = useCallback(() => {
    setActiveIdx(i => (i + 1) % videos.length);
  }, []);

  const goTo = useCallback((idx: number) => {
    setActiveIdx(idx);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 260 : -260, behavior: 'smooth' });
  };

  // Centraliza o card ativo no scroll
  useEffect(() => {
    const rail = scrollRef.current;
    if (!rail) return;
    const card = rail.children[activeIdx] as HTMLElement;
    if (!card) return;
    const offset = card.offsetLeft - rail.offsetWidth / 2 + card.offsetWidth / 2;
    rail.scrollTo({ left: offset, behavior: 'smooth' });
  }, [activeIdx]);

  return (
    <section ref={sectionRef} className="py-20 bg-[#0a0a0a] overflow-hidden">
      <style>{`
        @keyframes eq {
          from { transform: scaleY(1); }
          to   { transform: scaleY(2.5); }
        }
      `}</style>

      <div className="container-custom">

        {/* Cabeçalho */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-[.2em] mb-2">ITEC em vídeo</p>
            <h2 className="font-merriweather font-bold text-2xl md:text-3xl text-white">
              Conheça o ITEC de perto
            </h2>
            <p className="text-white/35 text-sm mt-1 flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${visible ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
              {visible
                ? `Vídeo ${activeIdx + 1} de ${videos.length} · clique no 🔊 para ouvir`
                : 'Role para ver os vídeos'}
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => goTo(Math.max(0, activeIdx - 1))}
              className="h-10 w-10 rounded-full border border-white/20 bg-white/5 hover:bg-primary/80 hover:border-primary text-white flex items-center justify-center transition-all">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => goTo((activeIdx + 1) % videos.length)}
              className="h-10 w-10 rounded-full border border-white/20 bg-white/5 hover:bg-primary/80 hover:border-primary text-white flex items-center justify-center transition-all">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Trilho */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {videos.map((v, i) => (
            <VideoCard
              key={v.src}
              video={v}
              index={i}
              active={activeIdx === i}
              sectionVisible={visible}
              globalMuted={muted}
              onActivate={goTo}
              onToggleMute={() => setMuted(m => !m)}
              onEnded={handleVideoEnded}
            />
          ))}

          {/* Card CTA */}
          <a href="/cursos"
            className="flex-shrink-0 rounded-2xl border-2 border-dashed border-white/15 hover:border-primary/50 flex flex-col items-center justify-center gap-3 text-white/35 hover:text-primary transition-all duration-300 w-[160px] sm:w-[185px]"
            style={{ aspectRatio: '9/16' }}>
            <div className="h-12 w-12 rounded-full border-2 border-current flex items-center justify-center">
              <ChevronRight className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-center px-3">
              Ver nossos cursos
            </span>
          </a>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {videos.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIdx === i ? 'w-8 bg-primary' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
