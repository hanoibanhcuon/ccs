/**
 * Profile Hook Injector
 *
 * Injects WebSearch hooks into per-profile settings files.
 * This replaces the global ~/.claude/settings.json approach.
 *
 * @module utils/websearch/profile-hook-injector
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { info, warn } from '../ui';
import { getWebSearchHookConfig, getHookPath } from './hook-config';
import { getWebSearchConfig } from '../../config/unified-config-loader';
import { removeHookConfig } from './hook-config';

// CCS directory
const CCS_DIR = path.join(os.homedir(), '.ccs');

// Migration marker file
const MIGRATION_MARKER = path.join(CCS_DIR, '.hook-migrated');

/**
 * Check if CCS WebSearch hook exists in settings
 */
function hasCcsHook(settings: Record<string, unknown>): boolean {
  const hooks = settings.hooks as Record<string, unknown[]> | undefined;
  if (!hooks?.PreToolUse) return false;

  return hooks.PreToolUse.some((h: unknown) => {
    const hook = h as Record<string, unknown>;
    if (hook.matcher !== 'WebSearch') return false;

    const hookArray = hook.hooks as Array<Record<string, unknown>> | undefined;
    if (!hookArray?.[0]?.command) return false;

    const command = hookArray[0].command as string;
    return command.includes('.ccs/hooks/websearch-transformer');
  });
}

/**
 * Migrate CCS hook from global settings to profile settings (one-time)
 */
function migrateGlobalHook(): void {
  if (fs.existsSync(MIGRATION_MARKER)) {
    return; // Already migrated
  }

  try {
    const removed = removeHookConfig();
    if (removed && process.env.CCS_DEBUG) {
      console.error(info('Migrated WebSearch hook from global settings'));
    }
    // Create marker file
    fs.writeFileSync(MIGRATION_MARKER, new Date().toISOString(), 'utf8');
  } catch (error) {
    if (process.env.CCS_DEBUG) {
      console.error(warn(`Migration failed: ${(error as Error).message}`));
    }
  }
}

/**
 * Ensure WebSearch hook is configured in profile's settings file
 *
 * @param profileName - Name of the profile (e.g., 'agy', 'gemini', 'glm')
 * @returns true if hook is configured (existing or newly added)
 */
export function ensureProfileHooks(profileName: string): boolean {
  try {
    const wsConfig = getWebSearchConfig();

    // Skip if WebSearch is disabled
    if (!wsConfig.enabled) {
      return false;
    }

    // One-time migration from global settings
    migrateGlobalHook();

    const settingsPath = path.join(CCS_DIR, `${profileName}.settings.json`);

    // Read existing settings or create empty
    let settings: Record<string, unknown> = {};
    if (fs.existsSync(settingsPath)) {
      try {
        const content = fs.readFileSync(settingsPath, 'utf8');
        settings = JSON.parse(content);
      } catch {
        if (process.env.CCS_DEBUG) {
          console.error(warn(`Malformed ${profileName}.settings.json - creating fresh hooks`));
        }
        // Continue with empty settings, will add hooks
      }
    }

    // Check if CCS hook already present
    if (hasCcsHook(settings)) {
      // Update timeout if needed
      return updateHookTimeoutIfNeeded(settings, settingsPath);
    }

    // Get hook config
    const hookConfig = getWebSearchHookConfig();

    // Ensure hooks structure exists
    if (!settings.hooks) {
      settings.hooks = {};
    }

    const settingsHooks = settings.hooks as Record<string, unknown[]>;
    if (!settingsHooks.PreToolUse) {
      settingsHooks.PreToolUse = [];
    }

    // Add CCS hook
    const preToolUseHooks = hookConfig.PreToolUse as unknown[];
    settingsHooks.PreToolUse.push(...preToolUseHooks);

    // Write updated settings
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    if (process.env.CCS_DEBUG) {
      console.error(info(`Added WebSearch hook to ${profileName}.settings.json`));
    }

    return true;
  } catch (error) {
    if (process.env.CCS_DEBUG) {
      console.error(warn(`Failed to inject hook: ${(error as Error).message}`));
    }
    return false;
  }
}

/**
 * Update hook timeout if it differs from current config
 */
function updateHookTimeoutIfNeeded(
  settings: Record<string, unknown>,
  settingsPath: string
): boolean {
  try {
    const hooks = settings.hooks as Record<string, unknown[]>;
    const hookConfig = getWebSearchHookConfig();
    const expectedHookPath = getHookPath();
    const expectedCommand = `node "${expectedHookPath}"`;
    const expectedHooks = (hookConfig.PreToolUse as Array<Record<string, unknown>>)[0]
      .hooks as Array<Record<string, unknown>>;
    const expectedTimeout = expectedHooks[0].timeout as number;

    let needsUpdate = false;

    for (const h of hooks.PreToolUse) {
      const hook = h as Record<string, unknown>;
      if (hook.matcher !== 'WebSearch') continue;

      const hookArray = hook.hooks as Array<Record<string, unknown>>;
      if (!hookArray?.[0]?.command) continue;

      const command = hookArray[0].command as string;
      if (!command.includes('.ccs/hooks/websearch-transformer')) continue;

      // Found CCS hook - check if needs update
      if (hookArray[0].command !== expectedCommand) {
        hookArray[0].command = expectedCommand;
        needsUpdate = true;
      }

      if (hookArray[0].timeout !== expectedTimeout) {
        hookArray[0].timeout = expectedTimeout;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
      if (process.env.CCS_DEBUG) {
        console.error(info('Updated WebSearch hook timeout in profile settings'));
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Remove migration marker (called during uninstall)
 */
export function removeMigrationMarker(): void {
  try {
    if (fs.existsSync(MIGRATION_MARKER)) {
      fs.unlinkSync(MIGRATION_MARKER);
    }
  } catch {
    // Ignore errors
  }
}
