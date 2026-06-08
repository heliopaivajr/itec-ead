import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  CheckSquare,
  BookOpen,
  DollarSign,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RelatorioCard {
  id: string;
  titulo: string;
  descricao: string;
  icon: React.ElementType;
  rota: string;
}

const RELATORIOS: RelatorioCard[] = [
  {
    id: 'R01',
    titulo: 'Alunos por Turma',
    descricao: 'Lista completa de alunos matriculados em cada turma',
    icon: Users,
    rota: '/dashboard/relatorios/alunos-turma',
  },
  {
    id: 'R02',
    titulo: 'Lista de Presença',
    descricao: 'Controle de presença por disciplina e período',
    icon: CheckSquare,
    rota: '/dashboard/relatorios/lista-presenca',
  },
  {
    id: 'R03',
    titulo: 'Disciplinas por Aluno',
    descricao: 'Disciplinas cursadas, em andamento e pendentes',
    icon: BookOpen,
    rota: '/dashboard/relatorios/disciplinas-aluno',
  },
  {
    id: 'R04',
    titulo: 'Situação Financeira',
    descricao: 'Status de pagamento e mensalidades dos alunos',
    icon: DollarSign,
    rota: '/dashboard/relatorios/situacao-financeira',
  },
  {
    id: 'R05',
    titulo: 'Alunos Inadimplentes',
    descricao: 'Listagem de alunos com pagamentos em atraso',
    icon: AlertCircle,
    rota: '/dashboard/relatorios/inadimplentes',
  },
  {
    id: 'R06',
    titulo: 'Histórico Acadêmico',
    descricao: 'Histórico completo individual do aluno',
    icon: GraduationCap,
    rota: '/dashboard/relatorios/historico-academico',
  },
];

export default function Relatorios() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Escolha um relatório abaixo para gerar
          </p>
        </div>
      </div>

      {/* Grid de relatórios */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RELATORIOS.map((rel) => {
          const Icon = rel.icon;
          return (
            <Link key={rel.id} to={rel.rota}>
              <Card className="p-6 hover:bg-accent/50 transition-colors cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {rel.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {rel.descricao}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
