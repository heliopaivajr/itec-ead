import { Wallet } from 'lucide-react';
import { VisaoGeralFinanceira } from '@/components/dashboard/VisaoGeralFinanceira';

// Central de Relatórios (Fase A) — entrada da Visão Geral Financeira (2e) na central.
// O componente já traz KPIs + lista + filtros + export PDF/Excel (reuso total).

export default function RelVisaoGeralFinanceira() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1F3864] dark:text-primary">Visão Geral Financeira</h1>
          <p className="text-sm text-muted-foreground">Todos os alunos com situação — filtre e exporte (PDF/Excel).</p>
        </div>
      </div>
      <VisaoGeralFinanceira />
    </div>
  );
}
