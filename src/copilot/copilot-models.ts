/**
 * Copilot Model Catalog
 *
 * Manages available models from copilot-api.
 */

import * as http from 'http';
import { CopilotModel } from './types';

/**
 * Default models available through copilot-api.
 * Used as fallback when API is not reachable.
 */
export const DEFAULT_COPILOT_MODELS: CopilotModel[] = [
  {
    id: 'claude-opus-4-5-20250514',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    isDefault: true,
  },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai' },
  { id: 'o3', name: 'O3', provider: 'openai' },
  { id: 'o4-mini', name: 'O4 Mini', provider: 'openai' },
];

/**
 * Fetch available models from running copilot-api daemon.
 *
 * @param port The port copilot-api is running on
 * @returns List of available models
 */
export async function fetchModelsFromDaemon(port: number): Promise<CopilotModel[]> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path: '/v1/models',
        method: 'GET',
        timeout: 5000,
      },
      (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data) as { data?: Array<{ id: string }> };
            if (response.data && Array.isArray(response.data)) {
              const models: CopilotModel[] = response.data.map((m) => ({
                id: m.id,
                name: formatModelName(m.id),
                provider: m.id.includes('claude') ? 'anthropic' : 'openai',
                isDefault: m.id === 'claude-opus-4-5-20250514',
              }));
              resolve(models.length > 0 ? models : DEFAULT_COPILOT_MODELS);
            } else {
              resolve(DEFAULT_COPILOT_MODELS);
            }
          } catch {
            resolve(DEFAULT_COPILOT_MODELS);
          }
        });
      }
    );

    req.on('error', () => {
      resolve(DEFAULT_COPILOT_MODELS);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(DEFAULT_COPILOT_MODELS);
    });

    req.end();
  });
}

/**
 * Get available models (from daemon or defaults).
 */
export async function getAvailableModels(port: number): Promise<CopilotModel[]> {
  return fetchModelsFromDaemon(port);
}

/**
 * Get the default model.
 */
export function getDefaultModel(): string {
  return 'claude-opus-4-5-20250514';
}

/**
 * Format model ID to human-readable name.
 */
function formatModelName(modelId: string): string {
  // Convert model IDs to readable names
  const nameMap: Record<string, string> = {
    'claude-opus-4-5-20250514': 'Claude Opus 4.5',
    'claude-sonnet-4-20250514': 'Claude Sonnet 4',
    'gpt-4.1': 'GPT-4.1',
    'gpt-4.1-mini': 'GPT-4.1 Mini',
    o3: 'O3',
    'o4-mini': 'O4 Mini',
  };

  return nameMap[modelId] || modelId;
}
