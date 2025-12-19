/**
 * Auth Commands Type Definitions
 *
 * Shared interfaces for auth command modules.
 */

import ProfileRegistry from '../profile-registry';
import { InstanceManager } from '../../management/instance-manager';

/**
 * Command arguments parsed from CLI
 */
export interface AuthCommandArgs {
  profileName?: string;
  force?: boolean;
  verbose?: boolean;
  json?: boolean;
  yes?: boolean;
}

/**
 * Profile output for JSON mode
 */
export interface ProfileOutput {
  name: string;
  type: string;
  is_default: boolean;
  created: string;
  last_used: string | null;
  instance_path?: string;
  session_count?: number;
}

/**
 * List output for JSON mode
 */
export interface ListOutput {
  version: string;
  profiles: ProfileOutput[];
}

/**
 * Shared context passed to command handlers
 */
export interface CommandContext {
  registry: ProfileRegistry;
  instanceMgr: InstanceManager;
  version: string;
}

/**
 * Parse command arguments from raw args array
 */
export function parseArgs(args: string[]): AuthCommandArgs {
  const profileName = args.find((arg) => !arg.startsWith('--'));
  return {
    profileName,
    force: args.includes('--force'),
    verbose: args.includes('--verbose'),
    json: args.includes('--json'),
    yes: args.includes('--yes') || args.includes('-y'),
  };
}

/**
 * Format relative time (e.g., "2h ago", "1d ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
