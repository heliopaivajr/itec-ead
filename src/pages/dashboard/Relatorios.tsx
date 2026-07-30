import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Users, CheckSquare, BookOpen, DollarSign, AlertCircle,
  GraduationCap, Search, UserSquare, Wallet, LayoutGrid, ScrollText,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Central de Relatórios (Fase A) — organizada em 3 categorias + busca. Traz os
// geradores que já existem (dossiê/extrato/visão geral/declaração) para cá, além
// dos R01–R06. Diretriz 8.10: acesso fácil, tudo imprimível. navy #1F3864 / dourado #BF9000.

type Categoria = 'academicos' | 'financeiros' | 'gestao';

interface RelatorioCard {
  id: string;
  titulo: string;
  descricao: string;
  icon: React.ElementType;
  rota: string;
  categoria: Categoria;
  novo?: boolean;   // entrada nova na central (gerador que já existia em outra tela)
}

const RELATORIOS: RelatorioCard[] = [
  // 📚 Acadêmicos
  { id: 'R01', titulo: 'Alunos por Turma', descricao: 'Lista completa de alunos matriculados em cada turma', icon: Users, rota: '/dashboard/relatorios/alunos-turma', categoria: 'academicos' },
  { id: 'R02', titulo: 'Lista de Presença', descricao: 'Controle de presença por disciplina e período', icon: CheckSquare, rota: '/dashboard/relatorios/lista-presenca', categoria: 'academicos' },
  { id: 'R03', titulo: 'Disciplinas por Aluno', descricao: 'Disciplinas cursadas, em andamento e pendentes', icon: BookOpen, rota: '/dashboard/relatorios/disciplinas-aluno', categoria: 'academicos' },
  { id: 'R06', titulo: 'Histórico Acadêmico', descricao: 'Histórico completo individual do aluno (PDF + Excel)', icon: GraduationCap, rota: '/dashboard/relatorios/historico-academico', categoria: 'academicos' },
  { id: 'POR_ALUNO', titulo: 'Relatórios por Aluno', descricao: 'Dossiê completo, extrato financeiro e declaração de matrícula — escolha o aluno', icon: UserSquare, rota: '/dashboard/relatorios/por-aluno', categoria: 'academicos', novo: true },

  // 💰 Financeiros
  { id: 'R04', titulo: 'Situação Financeira', descricao: 'Status de pagamento e mensalidades dos alunos', icon: DollarSign, rota: '/dashboard/relatorios/situacao-financeira', categoria: 'financeiros' },
  { id: 'R05', titulo: 'Alunos Inadimplentes', descricao: 'Listagem de alunos com pagamentos em atraso', icon: AlertCircle, rota: '/dashboard/relatorios/inadimplentes', categoria: 'financeiros' },
  { id: 'VISAO_GERAL', titulo: 'Visão Geral Financeira', descricao: 'Todos os alunos com situação (em dia/atrasado/suspenso) — PDF + Excel', icon: Wallet, rota: '/dashboard/relatorios/visao-geral-financeira', categoria: 'financeiros', novo: true },
  { id: 'EXTRATO', titulo: 'Extrato do Aluno', descricao: 'Extrato financeiro de um aluno (mensalidades pagas/em aberto)', icon: ScrollText, rota: '/dashboard/relatorios/por-aluno', categoria: 'financeiros', novo: true },

  // 🏫 Gestão
  { id: 'R01_G', titulo: 'Alunos por Turma', descricao: 'Visão de gestão: alunos matriculados por turma', icon: LayoutGrid, rota: '/dashboard/relatorios/alunos-turma', categoria: 'gestao' },
];

const CATEGORIAS: { id: Categoria; label: string; emoji: string }[] = [
  { id: 'academicos',  label: 'Acadêmicos',  emoji: '📚' },
  { id: 'financeiros', label: 'Financeiros', emoji: '💰' },
  { id: 'gestao',      label: 'Gestão',      emoji: '🏫' },
];

export default function Relatorios() {
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return RELATORIOS;
    return RELATORIOS.filter(r => r.titulo.toLowerCase().includes(q) || r.descricao.toLowerCase().includes(q));
  }, [busca]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-[12rem]">
          <h1 className="text-2xl font-bold text-[#1F3864] dark:text-primary">Central de Relatórios</h1>
          <p className="text-sm text-muted-foreground">Acadêmicos, financeiros e de gestão — todos com PDF e Excel.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar relatório…" className="pl-9 bg-background" />
        </div>
      </div>

      {/* Categorias */}
      {CATEGORIAS.map(cat => {
        const doCat = filtrados.filter(r => r.categoria === cat.id);
        if (doCat.length === 0) return null;
        return (
          <div key={cat.id} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {cat.emoji} {cat.label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {doCat.map(rel => {
                const Icon = rel.icon;
                return (
                  <Link key={`${cat.id}-${rel.id}`} to={rel.rota}>
                    <Card className="p-5 hover:bg-accent/50 transition-colors cursor-pointer group h-full">
                      <div className="flex items-start gap-4">
                        <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold group-hover:text-primary transition-colors">{rel.titulo}</h3>
                            {rel.novo && <span className="text-[10px] font-semibold rounded-full bg-[#BF9000]/15 text-[#BF9000] px-1.5 py-0.5">novo</span>}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{rel.descricao}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtrados.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          Nenhum relatório encontrado para “{busca}”.
        </div>
      )}
    </div>
  );
}
