import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  titulo: string;
  valor: string | number;
  delta?: string;
  deltaPositivo?: boolean;
  icone: React.ElementType;
  corFundo?: string;
  href?: string;
}

export function KpiCard({ titulo, valor, delta, deltaPositivo, icone: Icone, corFundo = 'bg-primary/10', href }: KpiCardProps) {
  const content = (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all group">
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-lg ${corFundo} flex items-center justify-center shrink-0`}>
          <Icone className="h-5 w-5 text-primary" />
        </div>
        {delta && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${deltaPositivo !== false ? 'text-green-500' : 'text-red-500'}`}>
            {deltaPositivo !== false ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">{valor}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{titulo}</p>
      </div>
    </div>
  );

  if (href) {
    return <a href={href} className="block">{content}</a>;
  }
  return content;
}
