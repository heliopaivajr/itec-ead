import { useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ComingSoonPageProps {
  titulo: string;
  descricao?: string;
  previsao?: string;
  icone?: LucideIcon;
}

export default function ComingSoonPage({
  titulo,
  descricao,
  previsao,
  icone: Icone = Clock,
}: ComingSoonPageProps) {
  const navigate = useNavigate();

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="max-w-md w-full space-y-6">

        {/* Ícone */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Icone className="h-10 w-10 text-primary opacity-80" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-2xl font-merriweather font-bold text-primary">
            {titulo}
          </h1>
          {descricao && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {descricao}
            </p>
          )}
        </div>

        {/* Badge de previsão */}
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-600 border-yellow-400/30 gap-1.5 px-3 py-1 text-xs"
          >
            <Clock className="h-3 w-3" />
            Em desenvolvimento{previsao ? ` · ${previsao}` : ''}
          </Badge>
        </div>

        {/* Separador */}
        <div className="border-t border-border" />

        {/* Botão voltar */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>

      </div>
    </div>
  );
}
