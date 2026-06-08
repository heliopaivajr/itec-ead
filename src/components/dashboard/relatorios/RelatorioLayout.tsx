import React from 'react';
import { Printer, FileText, FileSpreadsheet, File, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RelatorioLayoutProps {
  titulo: string;
  subtitulo?: string;
  filtros?: React.ReactNode;
  children: React.ReactNode;
  onPrint: () => void;
  onExportPDF: () => void;
  onExportExcel?: () => void;
  onExportCSV?: () => void;
  loading?: boolean;
  hideExport?: boolean;
}

export function RelatorioLayout({
  titulo,
  subtitulo,
  filtros,
  children,
  onPrint,
  onExportPDF,
  onExportExcel,
  onExportCSV,
  loading = false,
  hideExport = false,
}: RelatorioLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <div className="no-print">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/relatorios')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Relatórios
        </Button>
      </div>

      {/* Header com botões de ação */}
      <div className="no-print flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{titulo}</h1>
          {subtitulo && (
            <p className="text-sm text-muted-foreground mt-1">{subtitulo}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            disabled={loading}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={loading}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          {!hideExport && onExportExcel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportExcel}
              disabled={loading}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          )}
          {!hideExport && onExportCSV && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCSV}
              disabled={loading}
            >
              <File className="h-4 w-4 mr-2" />
              CSV
            </Button>
          )}
        </div>
      </div>

      {/* Área de filtros */}
      {filtros && <div className="no-print">{filtros}</div>}

      {/* Conteúdo principal do relatório */}
      <div className="print-container">
        {/* Header para impressão */}
        <div className="relatorio-header hidden print:block">
          <img
            src="/logo_itec.png"
            alt="ITEC"
            className="relatorio-logo"
          />
          <h1>{titulo}</h1>
          {subtitulo && <p>{subtitulo}</p>}
          <p>
            Emitido em: {new Date().toLocaleDateString('pt-BR')} às{' '}
            {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>

        {/* Conteúdo do relatório */}
        {children}
      </div>
    </div>
  );
}
