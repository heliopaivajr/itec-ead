import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface RelatorioEmBreveProps {
  codigo: string;
  titulo: string;
  descricao: string;
}

export default function RelatorioEmBreve({ codigo, titulo, descricao }: RelatorioEmBreveProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-6">
      {/* Botão Voltar */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/dashboard/relatorios')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Relatórios
      </Button>

      {/* Card de Em Breve */}
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{codigo} — {titulo}</h2>
            <p className="text-sm text-muted-foreground">{descricao}</p>
          </div>

          <div className="pt-4 border-t">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-sm font-medium">Relatório em desenvolvimento</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Este relatório estará disponível em breve.
            <br />
            Sprint Relatórios — Fase 2
          </p>

          <Button
            onClick={() => navigate('/dashboard/relatorios')}
            className="w-full"
          >
            Voltar para Relatórios
          </Button>
        </Card>
      </div>
    </div>
  );
}
