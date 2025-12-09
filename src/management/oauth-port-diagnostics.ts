/**
 * OAuth Port Diagnostics Module
 *
 * Pre-flight checks for OAuth callback ports to detect conflicts
 * before users attempt authentication.
 *
 * OAuth flows require specific localhost ports for callbacks:
 * - Gemini: 8085
 * - Codex: 1455
 * - Agy: 51121
 * - Qwen: Device Code Flow (no port needed)
 */

import { getPortProcess, PortProcess, isCLIProxyProcess } from '../utils/port-utils';
import { CLIProxyProvider } from '../cliproxy/types';

/**
 * OAuth callback ports for each provider
 * Extracted from CLIProxyAPI source
 */
export const OAUTH_CALLBACK_PORTS: Record<CLIProxyProvider, number | null> = {
  gemini: 8085,
  codex: 1455,
  agy: 51121,
  qwen: null, // Device Code Flow - no callback port
  iflow: null, // Device Code Flow - no callback port
};

/**
 * OAuth flow types
 */
export type OAuthFlowType = 'authorization_code' | 'device_code';

/**
 * OAuth flow type per provider
 */
export const OAUTH_FLOW_TYPES: Record<CLIProxyProvider, OAuthFlowType> = {
  gemini: 'authorization_code',
  codex: 'authorization_code',
  agy: 'authorization_code',
  qwen: 'device_code',
  iflow: 'device_code',
};

/**
 * Port diagnostic result
 */
export interface OAuthPortDiagnostic {
  /** Provider name */
  provider: CLIProxyProvider;
  /** OAuth flow type */
  flowType: OAuthFlowType;
  /** Callback port (null for device code flow) */
  port: number | null;
  /** Port status */
  status: 'free' | 'occupied' | 'cliproxy' | 'not_applicable';
  /** Process occupying the port (if any) */
  process: PortProcess | null;
  /** Human-readable status message */
  message: string;
  /** Recommendation for fixing (if issue detected) */
  recommendation: string | null;
}

/**
 * Check OAuth port availability for a single provider
 */
export async function checkOAuthPort(provider: CLIProxyProvider): Promise<OAuthPortDiagnostic> {
  const port = OAUTH_CALLBACK_PORTS[provider];
  const flowType = OAUTH_FLOW_TYPES[provider];

  // Device code flow doesn't need callback port
  if (port === null) {
    return {
      provider,
      flowType,
      port: null,
      status: 'not_applicable',
      process: null,
      message: 'Uses Device Code Flow (no callback port needed)',
      recommendation: null,
    };
  }

  // Check if port is in use
  const portProcess = await getPortProcess(port);

  if (!portProcess) {
    return {
      provider,
      flowType,
      port,
      status: 'free',
      process: null,
      message: `Port ${port} is available`,
      recommendation: null,
    };
  }

  // Check if it's CLIProxy (expected if proxy is running)
  if (isCLIProxyProcess(portProcess)) {
    return {
      provider,
      flowType,
      port,
      status: 'cliproxy',
      process: portProcess,
      message: `Port ${port} in use by CLIProxy (expected)`,
      recommendation: null,
    };
  }

  // Port is occupied by another process
  return {
    provider,
    flowType,
    port,
    status: 'occupied',
    process: portProcess,
    message: `Port ${port} occupied by ${portProcess.processName}`,
    recommendation: `Kill process: kill ${portProcess.pid} (or close ${portProcess.processName})`,
  };
}

/**
 * Check OAuth ports for all providers
 */
export async function checkAllOAuthPorts(): Promise<OAuthPortDiagnostic[]> {
  const providers: CLIProxyProvider[] = ['gemini', 'codex', 'agy', 'qwen', 'iflow'];
  const results: OAuthPortDiagnostic[] = [];

  for (const provider of providers) {
    const diagnostic = await checkOAuthPort(provider);
    results.push(diagnostic);
  }

  return results;
}

/**
 * Check OAuth ports for providers that use Authorization Code flow only
 */
export async function checkAuthCodePorts(): Promise<OAuthPortDiagnostic[]> {
  const providers: CLIProxyProvider[] = ['gemini', 'codex', 'agy'];
  const results: OAuthPortDiagnostic[] = [];

  for (const provider of providers) {
    const diagnostic = await checkOAuthPort(provider);
    results.push(diagnostic);
  }

  return results;
}

/**
 * Get providers with port conflicts
 */
export async function getPortConflicts(): Promise<OAuthPortDiagnostic[]> {
  const allPorts = await checkAllOAuthPorts();
  return allPorts.filter((d) => d.status === 'occupied');
}

/**
 * Format OAuth port diagnostics for display
 */
export function formatOAuthPortDiagnostics(diagnostics: OAuthPortDiagnostic[]): string[] {
  const lines: string[] = [];

  for (const diag of diagnostics) {
    const providerName = diag.provider.charAt(0).toUpperCase() + diag.provider.slice(1);
    const portStr = diag.port !== null ? `(${diag.port})` : '';

    let statusIcon: string;
    switch (diag.status) {
      case 'free':
        statusIcon = '[OK]';
        break;
      case 'cliproxy':
        statusIcon = '[OK]';
        break;
      case 'occupied':
        statusIcon = '[!]';
        break;
      case 'not_applicable':
        statusIcon = '[i]';
        break;
      default:
        statusIcon = '[?]';
    }

    const label = `${providerName} ${portStr}`.padEnd(20);
    lines.push(`${statusIcon} ${label} ${diag.message}`);

    if (diag.recommendation) {
      lines.push(`                        → ${diag.recommendation}`);
    }
  }

  return lines;
}

/**
 * Pre-flight check before OAuth - returns issues or empty array if OK
 */
export async function preflightOAuthCheck(provider: CLIProxyProvider): Promise<{
  ready: boolean;
  issues: string[];
}> {
  const diagnostic = await checkOAuthPort(provider);
  const issues: string[] = [];

  if (diagnostic.status === 'occupied' && diagnostic.process) {
    issues.push(
      `OAuth callback port ${diagnostic.port} is blocked by ${diagnostic.process.processName} (PID ${diagnostic.process.pid})`
    );
    if (diagnostic.recommendation) {
      issues.push(`Fix: ${diagnostic.recommendation}`);
    }
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}

export default {
  OAUTH_CALLBACK_PORTS,
  OAUTH_FLOW_TYPES,
  checkOAuthPort,
  checkAllOAuthPorts,
  checkAuthCodePorts,
  getPortConflicts,
  formatOAuthPortDiagnostics,
  preflightOAuthCheck,
};
