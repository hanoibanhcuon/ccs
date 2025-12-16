/**
 * MCP Manager - Manages MCP server configuration for CCS
 *
 * Ensures web-search-prime MCP is available for third-party profiles
 * that cannot use Claude's native WebSearch tool.
 *
 * WebSearch is a server-side tool executed by Anthropic's API.
 * Third-party providers (gemini, agy, codex, qwen) don't have access.
 * This manager auto-configures MCP web-search as a fallback.
 *
 * @module utils/mcp-manager
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { info, warn } from './ui';
import { getWebSearchConfig } from '../config/unified-config-loader';

// MCP configuration file path
const MCP_CONFIG_PATH = path.join(os.homedir(), '.claude', '.mcp.json');

/**
 * MCP server configuration interface
 */
interface McpServerConfig {
  type: 'http' | 'stdio';
  url?: string;
  headers?: Record<string, string>;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * MCP configuration file structure
 */
interface McpConfig {
  mcpServers?: Record<string, McpServerConfig>;
  [key: string]: unknown;
}

/**
 * Default web-search-prime MCP configuration (primary)
 * HTTP-based, requires z.ai coding plan subscription
 */
const WEB_SEARCH_PRIME_CONFIG: McpServerConfig = {
  type: 'http',
  url: 'https://api.z.ai/api/mcp/web_search_prime/mcp',
  headers: {},
};

/**
 * Brave Search MCP configuration (secondary fallback)
 * Requires BRAVE_API_KEY env var
 * Free tier: 15k queries/month, 1 query/sec
 * Package: @modelcontextprotocol/server-brave-search
 */
const BRAVE_SEARCH_CONFIG: McpServerConfig = {
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-brave-search'],
  env: {},
};

/**
 * Tavily MCP configuration (tertiary fallback)
 * Requires TAVILY_API_KEY env var
 * AI-optimized search, paid service
 * Package: @tavily/mcp-server (official)
 */
const TAVILY_CONFIG: McpServerConfig = {
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@tavily/mcp-server'],
  env: {},
};

/**
 * Ensure MCP web-search is configured for third-party profiles
 *
 * Called before spawning Claude CLI for CLIProxy profiles.
 * Respects user configuration from ~/.ccs/config.yaml:
 *   - enabled: false → skip auto-config
 *   - provider: specific → add only that provider
 *   - fallback: false → don't add fallback providers
 *
 * Multi-tier MCP fallback chain:
 *   1. web-search-prime (primary, requires z.ai subscription)
 *   2. brave-search (if BRAVE_API_KEY set)
 *   3. tavily (if TAVILY_API_KEY set)
 *
 * Only adds MCPs if no web search MCP is already configured.
 *
 * @returns true if web search MCP is available, false on error
 */
export function ensureMcpWebSearch(): boolean {
  try {
    // Check user configuration
    const wsConfig = getWebSearchConfig();

    // If disabled by user, skip auto-configuration
    if (!wsConfig.enabled) {
      if (process.env.CCS_DEBUG) {
        console.error(info('WebSearch auto-config disabled by user'));
      }
      return false;
    }

    let config: McpConfig = { mcpServers: {} };

    // Read existing config if present
    if (fs.existsSync(MCP_CONFIG_PATH)) {
      const content = fs.readFileSync(MCP_CONFIG_PATH, 'utf8');
      try {
        config = JSON.parse(content);
      } catch {
        // Malformed JSON - start fresh but preserve file as backup
        if (process.env.CCS_DEBUG) {
          console.error(warn('Malformed .mcp.json - starting fresh'));
        }
        config = { mcpServers: {} };
      }
    }

    // Initialize mcpServers if missing
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Check if any web search MCP already configured (case-insensitive)
    const hasWebSearch = Object.keys(config.mcpServers).some((key) => {
      const lowerKey = key.toLowerCase();
      return (
        lowerKey.includes('web-search') ||
        lowerKey.includes('websearch') ||
        lowerKey.includes('tavily') ||
        lowerKey.includes('brave')
      );
    });

    if (hasWebSearch) {
      if (process.env.CCS_DEBUG) {
        console.error(info('MCP web-search already configured'));
      }
      return true;
    }

    // Track what we add for logging
    const addedMcps: string[] = [];

    // Helper to add a specific provider
    const addProvider = (provider: 'web-search-prime' | 'brave' | 'tavily'): boolean => {
      // mcpServers is guaranteed to exist here (initialized above)
      const servers = config.mcpServers as Record<string, McpServerConfig>;

      if (provider === 'web-search-prime') {
        const webSearchPrimeConfig = { ...WEB_SEARCH_PRIME_CONFIG };
        // Use configurable URL if provided
        if (wsConfig.webSearchPrimeUrl) {
          webSearchPrimeConfig.url = wsConfig.webSearchPrimeUrl;
        }
        servers['web-search-prime'] = webSearchPrimeConfig;
        addedMcps.push('web-search-prime');
        return true;
      }

      if (provider === 'brave') {
        const braveApiKey = process.env.BRAVE_API_KEY;
        if (braveApiKey) {
          const braveConfig = { ...BRAVE_SEARCH_CONFIG };
          braveConfig.env = { BRAVE_API_KEY: braveApiKey };
          servers['brave-search'] = braveConfig;
          addedMcps.push('brave-search');
          return true;
        }
        return false;
      }

      if (provider === 'tavily') {
        const tavilyApiKey = process.env.TAVILY_API_KEY;
        if (tavilyApiKey) {
          const tavilyConfig = { ...TAVILY_CONFIG };
          tavilyConfig.env = { TAVILY_API_KEY: tavilyApiKey };
          servers['tavily'] = tavilyConfig;
          addedMcps.push('tavily');
          return true;
        }
        return false;
      }

      return false;
    };

    // Apply user's provider preference
    if (wsConfig.provider === 'auto') {
      // Auto mode: add all available providers
      addProvider('web-search-prime');
      if (wsConfig.fallback) {
        addProvider('brave');
        addProvider('tavily');
      }
    } else {
      // Specific provider requested
      const added = addProvider(wsConfig.provider);
      if (!added && wsConfig.fallback) {
        // Fallback if preferred provider not available
        if (process.env.CCS_DEBUG) {
          console.error(
            warn(`Preferred provider ${wsConfig.provider} not available, using fallback`)
          );
        }
        addProvider('web-search-prime');
        addProvider('brave');
        addProvider('tavily');
      }
    }

    // If nothing was added, return false
    if (addedMcps.length === 0) {
      if (process.env.CCS_DEBUG) {
        console.error(warn('No web search MCP could be configured'));
      }
      return false;
    }

    // Ensure ~/.claude directory exists
    const claudeDir = path.dirname(MCP_CONFIG_PATH);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true, mode: 0o700 });
    }

    // Write config with proper formatting
    fs.writeFileSync(MCP_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');

    if (process.env.CCS_DEBUG) {
      console.error(info(`Added MCP servers for web search: ${addedMcps.join(', ')}`));
    }

    return true;
  } catch (error) {
    if (process.env.CCS_DEBUG) {
      console.error(warn(`Failed to configure MCP: ${(error as Error).message}`));
    }
    return false;
  }
}

/**
 * Check if MCP web-search is configured
 *
 * @returns true if any web search MCP is present
 */
export function hasMcpWebSearch(): boolean {
  try {
    if (!fs.existsSync(MCP_CONFIG_PATH)) {
      return false;
    }

    const content = fs.readFileSync(MCP_CONFIG_PATH, 'utf8');
    const config: McpConfig = JSON.parse(content);

    if (!config.mcpServers) {
      return false;
    }

    // Case-insensitive check for web search MCP
    return Object.keys(config.mcpServers).some((key) => {
      const lowerKey = key.toLowerCase();
      return (
        lowerKey.includes('web-search') ||
        lowerKey.includes('websearch') ||
        lowerKey.includes('tavily') ||
        lowerKey.includes('brave')
      );
    });
  } catch {
    return false;
  }
}

/**
 * Get path to MCP config file
 *
 * @returns absolute path to .mcp.json
 */
export function getMcpConfigPath(): string {
  return MCP_CONFIG_PATH;
}

// CCS hooks directory
const CCS_HOOKS_DIR = path.join(os.homedir(), '.ccs', 'hooks');
// Legacy hook for simple MCP redirect (deprecated)
const BLOCK_WEBSEARCH_HOOK = 'block-websearch.cjs';
// New hybrid hook: Gemini CLI first, MCP fallback
const GEMINI_TRANSFORMER_HOOK = 'websearch-gemini-transformer.cjs';
// Default hook timeout in seconds (Gemini CLI needs time)
const HOOK_TIMEOUT_SECONDS = 60;
// Path to Claude settings.json
const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');

/**
 * Install WebSearch transformer hook to ~/.ccs/hooks/
 *
 * This hook intercepts WebSearch and:
 *   1. Tries Gemini CLI with google_web_search (no API key needed)
 *   2. Falls back to MCP redirect if Gemini fails
 *
 * This is the ultimate solution for third-party profiles.
 *
 * @param options - Installation options
 * @param options.legacy - Install legacy block-websearch.cjs instead (default: false)
 * @returns true if hook installed successfully
 */
export function installWebSearchHook(options?: { legacy?: boolean }): boolean {
  try {
    // Ensure hooks directory exists
    if (!fs.existsSync(CCS_HOOKS_DIR)) {
      fs.mkdirSync(CCS_HOOKS_DIR, { recursive: true, mode: 0o700 });
    }

    // Determine which hook to install
    const hookFileName = options?.legacy ? BLOCK_WEBSEARCH_HOOK : GEMINI_TRANSFORMER_HOOK;
    const hookPath = path.join(CCS_HOOKS_DIR, hookFileName);

    // Find the bundled hook script
    // In npm package: node_modules/ccs/lib/hooks/
    // In development: lib/hooks/
    const possiblePaths = [
      path.join(__dirname, '..', '..', 'lib', 'hooks', hookFileName),
      path.join(__dirname, '..', 'lib', 'hooks', hookFileName),
    ];

    let sourcePath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        sourcePath = p;
        break;
      }
    }

    if (!sourcePath) {
      if (process.env.CCS_DEBUG) {
        console.error(warn(`WebSearch hook source not found: ${hookFileName}`));
      }
      return false;
    }

    // Copy hook to ~/.ccs/hooks/
    fs.copyFileSync(sourcePath, hookPath);
    fs.chmodSync(hookPath, 0o755);

    // Also install the legacy hook for backward compatibility
    if (!options?.legacy) {
      const legacyHookPath = path.join(CCS_HOOKS_DIR, BLOCK_WEBSEARCH_HOOK);
      const legacySourcePaths = [
        path.join(__dirname, '..', '..', 'lib', 'hooks', BLOCK_WEBSEARCH_HOOK),
        path.join(__dirname, '..', 'lib', 'hooks', BLOCK_WEBSEARCH_HOOK),
      ];

      for (const p of legacySourcePaths) {
        if (fs.existsSync(p)) {
          fs.copyFileSync(p, legacyHookPath);
          fs.chmodSync(legacyHookPath, 0o755);
          break;
        }
      }
    }

    if (process.env.CCS_DEBUG) {
      console.error(info(`Installed WebSearch hook: ${hookPath}`));
    }

    // Also ensure the hook is configured in settings.json
    // This is called after the hook file is installed
    ensureWebSearchHookConfigInternal();

    return true;
  } catch (error) {
    if (process.env.CCS_DEBUG) {
      console.error(warn(`Failed to install WebSearch hook: ${(error as Error).message}`));
    }
    return false;
  }
}

/**
 * Get WebSearch hook configuration for settings.json
 *
 * Returns config for the Gemini transformer hook (default) or legacy hook.
 *
 * @param options - Configuration options
 * @param options.legacy - Use legacy block-websearch.cjs instead (default: false)
 * @returns hook configuration object for settings.json
 */
export function getWebSearchHookConfig(options?: { legacy?: boolean }): Record<string, unknown> {
  const hookFileName = options?.legacy ? BLOCK_WEBSEARCH_HOOK : GEMINI_TRANSFORMER_HOOK;
  const hookPath = path.join(CCS_HOOKS_DIR, hookFileName);
  // Legacy hook only needs 5s, Gemini hook needs 60s for CLI execution
  const timeout = options?.legacy ? 5 : HOOK_TIMEOUT_SECONDS;

  return {
    PreToolUse: [
      {
        matcher: 'WebSearch',
        hooks: [
          {
            type: 'command',
            command: `node "${hookPath}"`,
            timeout: timeout,
          },
        ],
      },
    ],
  };
}

/**
 * Check if WebSearch hook is installed
 *
 * Checks for both the new Gemini transformer and legacy block hook.
 *
 * @returns true if any WebSearch hook exists
 */
export function hasWebSearchHook(): boolean {
  const geminiHookPath = path.join(CCS_HOOKS_DIR, GEMINI_TRANSFORMER_HOOK);
  const legacyHookPath = path.join(CCS_HOOKS_DIR, BLOCK_WEBSEARCH_HOOK);
  return fs.existsSync(geminiHookPath) || fs.existsSync(legacyHookPath);
}

/**
 * Get information about installed WebSearch hooks
 *
 * @returns Object with hook status details
 */
export function getWebSearchHookStatus(): {
  installed: boolean;
  geminiTransformer: boolean;
  legacyBlock: boolean;
  activePath: string | null;
} {
  const geminiHookPath = path.join(CCS_HOOKS_DIR, GEMINI_TRANSFORMER_HOOK);
  const legacyHookPath = path.join(CCS_HOOKS_DIR, BLOCK_WEBSEARCH_HOOK);
  const hasGemini = fs.existsSync(geminiHookPath);
  const hasLegacy = fs.existsSync(legacyHookPath);

  return {
    installed: hasGemini || hasLegacy,
    geminiTransformer: hasGemini,
    legacyBlock: hasLegacy,
    // Gemini transformer takes priority
    activePath: hasGemini ? geminiHookPath : hasLegacy ? legacyHookPath : null,
  };
}

/**
 * Get environment variables for WebSearch hook configuration.
 *
 * These env vars are read by the websearch-gemini-transformer.cjs hook
 * to control its behavior without requiring file I/O.
 *
 * @returns Record of environment variables to set before spawning Claude
 */
export function getWebSearchHookEnv(): Record<string, string> {
  const wsConfig = getWebSearchConfig();
  const env: Record<string, string> = {};

  // Skip hook entirely if disabled
  if (!wsConfig.enabled) {
    env.CCS_WEBSEARCH_SKIP = '1';
    return env;
  }

  // Skip Gemini CLI if specifically disabled
  if (!wsConfig.gemini.enabled) {
    env.CCS_GEMINI_SKIP = '1';
  }

  // Set Gemini timeout
  if (wsConfig.gemini.timeout) {
    env.CCS_GEMINI_TIMEOUT = String(wsConfig.gemini.timeout);
  }

  return env;
}

/**
 * Ensure WebSearch hook is configured in ~/.claude/settings.json
 *
 * Merges the hook configuration into existing settings.json without
 * overwriting other settings. Only adds if not already present.
 *
 * This is an internal function called by installWebSearchHook.
 *
 * @returns true if hook config is present (already existed or was added)
 */
function ensureWebSearchHookConfigInternal(): boolean {
  try {
    const wsConfig = getWebSearchConfig();

    // Skip if disabled
    if (!wsConfig.enabled) {
      return false;
    }

    // Read existing settings or start fresh
    let settings: Record<string, unknown> = {};
    if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
      try {
        const content = fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf8');
        settings = JSON.parse(content);
      } catch {
        // Malformed JSON - start fresh
        if (process.env.CCS_DEBUG) {
          console.error(warn('Malformed settings.json - will merge carefully'));
        }
      }
    }

    // Check if WebSearch hook already configured
    const hooks = settings.hooks as Record<string, unknown[]> | undefined;
    if (hooks?.PreToolUse) {
      const hasWebSearchHook = hooks.PreToolUse.some((h: unknown) => {
        const hook = h as Record<string, unknown>;
        return hook.matcher === 'WebSearch';
      });

      if (hasWebSearchHook) {
        if (process.env.CCS_DEBUG) {
          console.error(info('WebSearch hook already configured in settings.json'));
        }
        return true;
      }
    }

    // Get hook config
    const hookConfig = getWebSearchHookConfig();

    // Merge hook config into settings
    if (!settings.hooks) {
      settings.hooks = {};
    }

    const settingsHooks = settings.hooks as Record<string, unknown[]>;
    if (!settingsHooks.PreToolUse) {
      settingsHooks.PreToolUse = [];
    }

    // Add our hook config
    const preToolUseHooks = hookConfig.PreToolUse as unknown[];
    settingsHooks.PreToolUse.push(...preToolUseHooks);

    // Ensure ~/.claude directory exists
    const claudeDir = path.dirname(CLAUDE_SETTINGS_PATH);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true, mode: 0o700 });
    }

    // Write updated settings
    fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');

    if (process.env.CCS_DEBUG) {
      console.error(info('Added WebSearch hook to settings.json'));
    }

    return true;
  } catch (error) {
    if (process.env.CCS_DEBUG) {
      console.error(warn(`Failed to configure WebSearch hook: ${(error as Error).message}`));
    }
    return false;
  }
}
