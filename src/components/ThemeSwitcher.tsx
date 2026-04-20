import React from 'react';
import { Moon, Sun, BookOpen } from 'lucide-react';
import { useThemeMode, type ThemeMode } from '@/hooks/use-theme-mode';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const themes: { value: ThemeMode; icon: React.ElementType; label: string }[] = [
  { value: 'dark',  icon: Moon,     label: 'Escuro'    },
  { value: 'light', icon: Sun,      label: 'Claro'     },
  { value: 'sepia', icon: BookOpen, label: 'Leitura'   },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeMode();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted">
      {themes.map(({ value, icon: Icon, label }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md transition-colors ${
                theme === value
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
              onClick={() => setTheme(value)}
              aria-label={label}
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
