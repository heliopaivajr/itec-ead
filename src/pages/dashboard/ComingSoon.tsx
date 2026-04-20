import React from 'react';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
}

export default function ComingSoon({ title, description, icon: Icon = Construction }: ComingSoonProps) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          {description ?? 'Esta seção está em desenvolvimento e estará disponível em breve.'}
        </p>
      </div>
      <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm text-primary font-medium">Em desenvolvimento</span>
      </div>
    </div>
  );
}
