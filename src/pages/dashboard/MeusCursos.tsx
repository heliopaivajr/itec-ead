import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BookOpen, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DashboardContext } from '../Dashboard';

interface Matricula {
  id: string;
  curso_id: string;
  status: string;
  created_at: string;
}

const courseInfo: Record<string, { nome: string; duracao: string; horario: string; cor: string }> = {
  'teologia-livre': {
    nome: 'Teologia Livre',
    duracao: '3 anos / 6 módulos',
    horario: 'Seg, Qua e Sex — 18h45 às 22h',
    cor: 'from-red-500/20 to-card',
  },
  'seteb': {
    nome: 'SETEB — Curso Básico de Teologia',
    duracao: '3 anos',
    horario: 'Quintas-feiras — 19h às 20h',
    cor: 'from-blue-500/20 to-card',
  },
  'ministerial-mulheres': {
    nome: 'Ministerial para Mulheres',
    duracao: 'Anual',
    horario: 'Quintas-feiras — 19h às 22h',
    cor: 'from-purple-500/20 to-card',
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ativo:      { label: 'Ativo',      color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  pendente:   { label: 'Pendente',   color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  trancado:   { label: 'Trancado',   color: 'bg-muted text-muted-foreground border-border' },
  concluido:  { label: 'Concluído',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

export default function MeusCursos() {
  const { profile } = useOutletContext<DashboardContext>();
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('matriculas')
      .select('*')
      .eq('aluno_id', profile.id)
      .then(({ data }) => {
        setMatriculas(data ?? []);
        setLoading(false);
      });
  }, [profile.id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh] text-muted-foreground animate-pulse">
        Carregando cursos...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Meus Cursos</h1>
        <p className="text-muted-foreground mt-1">Acompanhe seus cursos e progresso acadêmico</p>
      </div>

      {matriculas.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Você não está matriculado em nenhum curso</p>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse a página de cursos e solicite sua matrícula.
            </p>
          </div>
          <a
            href="/cursos"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
          >
            Ver cursos disponíveis <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matriculas.map(m => {
            const info = courseInfo[m.curso_id] ?? { nome: m.curso_id, duracao: '—', horario: '—', cor: 'from-muted/20 to-card' };
            const status = statusConfig[m.status] ?? { label: m.status, color: 'bg-muted text-muted-foreground border-border' };
            return (
              <div key={m.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all">
                <div className={`bg-gradient-to-r ${info.cor} p-5 border-b border-border`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">{info.nome}</h3>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{info.horario}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{info.duracao}</p>
                  <p className="text-xs text-muted-foreground pt-1">
                    Matriculado em {new Date(m.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
