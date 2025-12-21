/**
 * OpenRouter Promo Card
 * Permanent promotional card for OpenRouter - always visible in sidebar footer
 */

import { Button } from '@/components/ui/button';
import { useOpenRouterReady } from '@/hooks/use-openrouter-models';
import { Zap } from 'lucide-react';

interface OpenRouterPromoCardProps {
  onCreateClick: () => void;
}

export function OpenRouterPromoCard({ onCreateClick }: OpenRouterPromoCardProps) {
  const { modelCount, isLoading } = useOpenRouterReady();

  return (
    <div className="p-3 border-t bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-orange-100 dark:bg-orange-900/40 rounded shrink-0">
          <img src="/icons/openrouter.svg" alt="" className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-orange-700 dark:text-orange-300">OpenRouter</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {isLoading ? '300+' : `${modelCount}+`} models available
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCreateClick}
          className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30"
        >
          <Zap className="w-3 h-3 mr-1" />
          <span className="text-xs">Add</span>
        </Button>
      </div>
    </div>
  );
}
