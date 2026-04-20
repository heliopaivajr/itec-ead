import React, { useEffect, useState } from 'react';
import { Search, Download, Mail, Phone, User, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  curso_interesse: string;
  interesse: string;
  created_at: string;
}

const courseLabel: Record<string, string> = {
  'teologia-livre': 'Teologia Livre',
  'seteb': 'SETEB',
  'ministerial-mulheres': 'Ministerial Mulheres',
};

const courseColor: Record<string, string> = {
  'teologia-livre': 'bg-red-500/20 text-red-400 border-red-500/30',
  'seteb': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'ministerial-mulheres': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const interesseLabel: Record<string, string> = {
  candidato: 'Candidato',
  informacoes: 'Informações',
  outro: 'Outro',
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('leads_cursos')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLeads(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = leads.filter(l =>
    l.nome?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.telefone?.includes(search)
  );

  const exportCsv = () => {
    const header = 'Nome,E-mail,Telefone,Curso,Interesse,Data\n';
    const rows = leads.map(l =>
      `"${l.nome}","${l.email}","${l.telefone}","${courseLabel[l.curso_interesse] ?? l.curso_interesse}","${interesseLabel[l.interesse] ?? l.interesse}","${new Date(l.created_at).toLocaleDateString('pt-BR')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-itec-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-primary">Leads de Cursos</h1>
          <p className="text-muted-foreground mt-1">Interessados que baixaram a grade curricular</p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground/70 hover:text-primary hover:border-primary/40 transition-all"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de leads', value: leads.length },
          { label: 'Candidatos', value: leads.filter(l => l.interesse === 'candidato').length },
          { label: 'Teologia Livre', value: leads.filter(l => l.curso_interesse === 'teologia-livre').length },
          { label: 'SETEB', value: leads.filter(l => l.curso_interesse === 'seteb').length },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone..."
          className="pl-9 bg-background border-border text-foreground"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground animate-pulse">
            Carregando leads...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
            <User className="h-10 w-10 opacity-30" />
            <p>{search ? 'Nenhum resultado para a busca.' : 'Nenhum lead cadastrado ainda.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Curso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interesse</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => (
                  <tr key={lead.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/5'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{lead.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{lead.telefone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${courseColor[lead.curso_interesse] ?? 'bg-muted text-muted-foreground border-border'}`}>
                        {courseLabel[lead.curso_interesse] ?? lead.curso_interesse}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground capitalize">
                        {interesseLabel[lead.interesse] ?? lead.interesse}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Exibindo {filtered.length} de {leads.length} leads
        </p>
      )}
    </div>
  );
}
