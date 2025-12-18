/**
 * Copilot Executor
 *
 * Main execution flow for running Claude Code with copilot-api proxy.
 * Similar to CLIProxy executor but for GitHub Copilot.
 */

import { spawn } from 'child_process';
import { CopilotConfig } from '../config/unified-config-types';
import { checkAuthStatus, isCopilotApiInstalled } from './copilot-auth';
import { isDaemonRunning, startDaemon } from './copilot-daemon';
import { CopilotStatus } from './types';

/**
 * Get full copilot status (auth + daemon).
 */
export async function getCopilotStatus(config: CopilotConfig): Promise<CopilotStatus> {
  const [auth, daemonRunning] = await Promise.all([
    checkAuthStatus(),
    isDaemonRunning(config.port),
  ]);

  return {
    auth,
    daemon: {
      running: daemonRunning,
      port: config.port,
    },
  };
}

/**
 * Generate environment variables for Claude Code to use copilot-api.
 */
export function generateCopilotEnv(config: CopilotConfig): Record<string, string> {
  return {
    ANTHROPIC_BASE_URL: `http://localhost:${config.port}`,
    ANTHROPIC_AUTH_TOKEN: 'dummy', // copilot-api handles auth internally
    ANTHROPIC_MODEL: config.model,
    ANTHROPIC_DEFAULT_SONNET_MODEL: config.model,
    ANTHROPIC_SMALL_FAST_MODEL: config.model,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: config.model,
    // Disable non-essential traffic to avoid rate limiting
    DISABLE_NON_ESSENTIAL_MODEL_CALLS: '1',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
  };
}

/**
 * Execute Claude Code with copilot-api proxy.
 *
 * @param config Copilot configuration
 * @param claudeArgs Arguments to pass to Claude CLI
 * @returns Exit code
 */
export async function executeCopilotProfile(
  config: CopilotConfig,
  claudeArgs: string[]
): Promise<number> {
  // Check if copilot-api is installed
  if (!isCopilotApiInstalled()) {
    console.error('[X] copilot-api is not installed.');
    console.error('');
    console.error('Install with: npm install -g copilot-api');
    console.error('Or run via npx: npx copilot-api auth');
    return 1;
  }

  // Check authentication
  const authStatus = await checkAuthStatus();
  if (!authStatus.authenticated) {
    console.error('[X] Not authenticated with GitHub.');
    console.error('');
    console.error('Run: npx copilot-api auth');
    console.error('Or:  ccs copilot auth');
    return 1;
  }

  // Check if daemon is running or needs to be started
  let daemonRunning = await isDaemonRunning(config.port);

  if (!daemonRunning) {
    if (config.auto_start) {
      console.log('[i] Starting copilot-api daemon...');
      const result = await startDaemon(config);
      if (!result.success) {
        console.error(`[X] Failed to start daemon: ${result.error}`);
        return 1;
      }
      console.log(`[OK] Daemon started on port ${config.port}`);
      daemonRunning = true;
    } else {
      console.error('[X] copilot-api daemon is not running.');
      console.error('');
      console.error('Start the daemon manually:');
      console.error(`  npx copilot-api start --port ${config.port}`);
      console.error('');
      console.error('Or enable auto_start in config:');
      console.error('  ccs config  (then enable auto_start in Copilot section)');
      return 1;
    }
  }

  // Generate environment for Claude
  const copilotEnv = generateCopilotEnv(config);

  // Merge with current environment
  const env = {
    ...process.env,
    ...copilotEnv,
  };

  console.log(`[i] Using GitHub Copilot proxy (model: ${config.model})`);
  console.log('');

  // Spawn Claude CLI
  return new Promise((resolve) => {
    const proc = spawn('claude', claudeArgs, {
      stdio: 'inherit',
      env,
      shell: process.platform === 'win32',
    });

    proc.on('close', (code) => {
      resolve(code ?? 0);
    });

    proc.on('error', (err) => {
      console.error(`[X] Failed to start Claude: ${err.message}`);
      resolve(1);
    });
  });
}
