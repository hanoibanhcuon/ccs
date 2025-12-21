/**
 * Provider Presets Configuration
 * Pre-configured templates for common API providers
 */

export interface ProviderPreset {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  defaultProfileName: string;
  badge?: string;
  featured?: boolean;
  icon?: string;
  defaultModel?: string;
  requiresApiKey: boolean;
  apiKeyPlaceholder: string;
  apiKeyHint?: string;
}

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '349+ models from OpenAI, Anthropic, Google, Meta',
    baseUrl: OPENROUTER_BASE_URL,
    defaultProfileName: 'openrouter',
    badge: '349+ models',
    featured: true,
    icon: '/icons/openrouter.svg',
    defaultModel: 'anthropic/claude-sonnet-4',
    requiresApiKey: true,
    apiKeyPlaceholder: 'sk-or-...',
    apiKeyHint: 'Get your API key at openrouter.ai/keys',
  },
  {
    id: 'glm',
    name: 'GLM',
    description: 'Claude via Z.AI (GitHub Copilot)',
    baseUrl: 'https://api.z.ai/api/anthropic',
    defaultProfileName: 'glm',
    badge: 'Free',
    defaultModel: 'glm-4.6',
    requiresApiKey: true,
    apiKeyPlaceholder: 'ghp_...',
    apiKeyHint: 'Get your API key from Z.AI',
  },
  {
    id: 'glmt',
    name: 'GLMT',
    description: 'GLM with Thinking mode support',
    baseUrl: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
    defaultProfileName: 'glmt',
    badge: 'Thinking',
    defaultModel: 'glm-4.6',
    requiresApiKey: true,
    apiKeyPlaceholder: 'ghp_...',
    apiKeyHint: 'Same API key as GLM',
  },
  {
    id: 'kimi',
    name: 'Kimi',
    description: 'Moonshot AI - Fast reasoning model',
    baseUrl: 'https://api.kimi.com/coding/',
    defaultProfileName: 'kimi',
    badge: 'Reasoning',
    defaultModel: 'kimi-k2-thinking-turbo',
    requiresApiKey: true,
    apiKeyPlaceholder: 'sk-...',
    apiKeyHint: 'Get your API key from Moonshot AI',
  },
];

/** Get preset by ID */
export function getPresetById(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}

/** Check if a URL matches a known preset */
export function detectPresetFromUrl(baseUrl: string): ProviderPreset | undefined {
  const normalizedUrl = baseUrl.toLowerCase().trim();
  return PROVIDER_PRESETS.find((p) => normalizedUrl.includes(p.baseUrl.toLowerCase()));
}
