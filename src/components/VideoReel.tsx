import React, { useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Play } from 'lucide-react';

const videos = [
  {
    src: '/videos/v01.mp4',
    label: 'Matrículas Abertas',
    tag: '🎓 Inscreva-se',
    color: 'from-red-900/80 to-black/90',
  },
  {
    src: '/videos/v02.mp4',
    label: 'Testemunho',
    tag: '❤️ Depoimento',
    color: 'from-purple-900/80 to-black/90',
  },
  {
    src: '/videos/v03.mp4',
    label: 'Curso para Mulheres',
    tag: '👩‍🎓 Ministério',
    color: 'from-rose-900/80 to-black/90',
  },
  {
    src: '/videos/v04.mp4',
    label: 'Sala de Aula',
    tag: '📚 Ensino',
    color: 'from-blue-900/80 to-black/90',
  },
  {
    src: '/videos/v05.mp4',
    label: 'Chamada para Matrícula',
    tag: '🔔 Não perca!',
    color: 'from-amber-900/80 to-black/90',
  },
];

function VideoCard({
  video,
  index,
  active,
  onActivate,
}: {
  video: typeof videos[0];
  index: number;
  active: boolean;
  onActivate: (i: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  const handleMouseEnter = useCallback(() => {
    onActivate(index);
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = true;
    setMuted(true);
    v.play().then(() => setPlaying(true)).catch(() => {});
  }, [index, onActivate]);

  const handleMouseLeave = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setPlaying(false);
    setMuted(true);
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  return (
    <div
      className={`
        relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-500 ease-out group
        ${active
          ? 'w-[200px] sm:w-[230px] scale-105 z-10 shadow-2xl shadow-primary/40 ring-2 ring-primary/60'
          : 'w-[160px] sm:w-[185px] scale-100 opacity-70 hover:opacity-90'
        }
      `}
      style={{ aspectRatio: '9/16' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Vídeo */}
      <video
        ref={videoRef}
        src={video.src}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        muted
        preload="metadata"
        onCanPlay={() => setReady(true)}
      />

      {/* Overlay gradiente */}
      <div className={`absolute inset-0 bg-gradient-to-t ${video.color} opacity-60 transition-opacity duration-300 ${active && playing ? 'opacity-20' : 'opacity-70'}`} />

      {/* Thumbnail play icon quando parado */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-primary/80 group-hover:border-primary transition-all duration-300">
            <Play className="h-6 w-6 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Tag topo */}
      <div className="absolute top-3 left-3">
        <span className="text-[10px] font-bold bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/20">
          {video.tag}
        </span>
      </div>

      {/* Controle mudo — só quando ativo e tocando */}
      {active && playing && (
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-primary/80 transition-all"
        >
          {muted
            ? <VolumeX className="h-3.5 w-3.5" />
            : <Volume2 className="h-3.5 w-3.5" />
          }
        </button>
      )}

      {/* Label rodapé */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
        <p className="text-white font-bold text-xs leading-tight">{video.label}</p>
        {active && playing && !muted && (
          <div className="flex items-center gap-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-primary rounded-full animate-bounce"
                style={{ height: `${8 + Math.random() * 10}px`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Borda brilhante quando ativo */}
      {active && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/70 pointer-events-none" />
      )}
    </div>
  );
}

export default function VideoReel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 260 : -260, behavior: 'smooth' });
  };

  return (
    <section className="py-20 bg-[#0a0a0a] overflow-hidden">
      <div className="container-custom">

        {/* Cabeçalho estilo Netflix */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-[.2em] mb-2">
              ITEC em vídeo
            </p>
            <h2 className="font-merriweather font-bold text-2xl md:text-3xl text-white">
              Conheça o ITEC de perto
            </h2>
            <p className="text-white/40 text-sm mt-1">
              Passe o mouse para assistir · clique no 🔊 para ouvir
            </p>
          </div>

          {/* Setas navegação */}
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="h-10 w-10 rounded-full border border-white/20 bg-white/5 hover:bg-primary/80 hover:border-primary text-white flex items-center justify-center transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="h-10 w-10 rounded-full border border-white/20 bg-white/5 hover:bg-primary/80 hover:border-primary text-white flex items-center justify-center transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Trilho de vídeos */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Fading nas bordas */}
          {videos.map((v, i) => (
            <VideoCard
              key={v.src}
              video={v}
              index={i}
              active={activeIdx === i}
              onActivate={setActiveIdx}
            />
          ))}

          {/* Card CTA final */}
          <a
            href="/cursos"
            className="flex-shrink-0 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/60 flex flex-col items-center justify-center gap-3 text-white/40 hover:text-primary transition-all duration-300 w-[160px] sm:w-[185px]"
            style={{ aspectRatio: '9/16' }}
          >
            <div className="h-12 w-12 rounded-full border-2 border-current flex items-center justify-center">
              <ChevronRight className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-center px-3">
              Ver todos os cursos
            </span>
          </a>
        </div>

        {/* Indicadores de posição */}
        <div className="flex justify-center gap-1.5 mt-6">
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                activeIdx === i ? 'w-6 bg-primary' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
