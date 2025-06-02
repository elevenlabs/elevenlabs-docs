import { cn } from '@/lib/utils';

import { Button } from './button';

interface SuggestionItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  className?: string;
}

export function SuggestionItem({ onClick, icon, label, className }: SuggestionItemProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'flex h-auto min-h-[32px] items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}
