/**
 * OpenRouter Quick Start Card
 * Prominent CTA for new users to create OpenRouter profile
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOpenRouterReady } from '@/hooks/use-openrouter-models';
import { Sparkles, ExternalLink, ArrowRight, Zap } from 'lucide-react';

interface OpenRouterQuickStartProps {
  onOpenRouterClick: () => void;
  onCustomClick: () => void;
}

export function OpenRouterQuickStart({
  onOpenRouterClick,
  onCustomClick,
}: OpenRouterQuickStartProps) {
  const { modelCount, isLoading } = useOpenRouterReady();

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/20 p-8">
      <div className="max-w-lg w-full space-y-6">
        {/* Main OpenRouter Card */}
        <Card className="border-orange-200 dark:border-orange-800/50 bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <img src="/icons/openrouter.svg" alt="OpenRouter" className="w-6 h-6" />
              </div>
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
              >
                Recommended
              </Badge>
            </div>
            <CardTitle className="text-xl">Start with OpenRouter</CardTitle>
            <CardDescription className="text-base">
              Access {isLoading ? '300+' : `${modelCount}+`} models from OpenAI, Anthropic, Google,
              Meta and more - all through one API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Key Features */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>One API, all providers</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Model tier mapping</span>
              </div>
            </div>

            <Button
              onClick={onOpenRouterClick}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              size="lg"
            >
              Create OpenRouter Profile
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Get your API key at{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline inline-flex items-center gap-1"
              >
                openrouter.ai/keys
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        {/* Custom Option */}
        <Button variant="outline" onClick={onCustomClick} className="w-full">
          Create Custom API Profile
        </Button>
      </div>
    </div>
  );
}
