/**
 * Device Code Handler
 *
 * Manages device code display prompts during OAuth Device Code flow.
 * Parses CLIProxyAPI stdout for device codes and broadcasts via WebSocket
 * to both CLI terminal and Web UI (ccs config).
 *
 * Similar pattern to project-selection-handler.ts but for device code flows
 * (GitHub Copilot, Qwen, etc.)
 */

import { EventEmitter } from 'events';

/**
 * Device code prompt data sent to UI
 */
export interface DeviceCodePrompt {
  sessionId: string;
  provider: string;
  userCode: string;
  verificationUrl: string;
  expiresAt: number;
}

/**
 * Active device code session with completion resolver
 */
interface ActiveSession {
  prompt: DeviceCodePrompt;
  resolve: (success: boolean) => void;
  timeout: NodeJS.Timeout;
}

// Global event emitter for device code events
export const deviceCodeEvents = new EventEmitter();

// Active sessions by session ID
const activeSessions = new Map<string, ActiveSession>();

// Default timeout for device code (15 minutes - GitHub's default)
const DEVICE_CODE_TIMEOUT_MS = 900000;

/**
 * Parse device/user code from CLIProxy output
 *
 * Supports various formats:
 * - "Enter code: XXXX-YYYY"
 * - "code XXXX-YYYY"
 * - "user code: XXXX-YYYY"
 * - "code \"XXXX-YYYY\""
 */
export function parseDeviceCode(output: string): string | null {
  const codeMatch = output.match(
    /(?:enter\s+)?(?:user\s+)?code[:\s]+["']?([A-Z0-9]{4,8}[-\s]?[A-Z0-9]{4,8})["']?/i
  );
  return codeMatch ? codeMatch[1].toUpperCase() : null;
}

/**
 * Parse verification URL from CLIProxy output
 */
export function parseVerificationUrl(output: string): string | null {
  const urlMatch = output.match(/(https?:\/\/[^\s]+device[^\s]*)/i);
  return urlMatch ? urlMatch[1] : null;
}

/**
 * Register a device code session and emit event for UI broadcast
 *
 * @param prompt - Device code prompt data
 * @returns Promise that resolves when auth completes or times out
 */
export function registerDeviceCode(prompt: DeviceCodePrompt): Promise<boolean> {
  return new Promise((resolve) => {
    // Set timeout for session expiry
    const timeout = setTimeout(() => {
      const session = activeSessions.get(prompt.sessionId);
      if (session) {
        activeSessions.delete(prompt.sessionId);
        deviceCodeEvents.emit('deviceCode:expired', prompt.sessionId);
        resolve(false);
      }
    }, DEVICE_CODE_TIMEOUT_MS);

    // Store active session
    activeSessions.set(prompt.sessionId, {
      prompt,
      resolve,
      timeout,
    });

    // Emit event for WebSocket broadcast to UI
    deviceCodeEvents.emit('deviceCode:received', prompt);
  });
}

/**
 * Mark device code session as completed (auth successful)
 */
export function completeDeviceCode(sessionId: string): boolean {
  const session = activeSessions.get(sessionId);

  if (!session) {
    return false;
  }

  clearTimeout(session.timeout);
  activeSessions.delete(sessionId);

  session.resolve(true);
  deviceCodeEvents.emit('deviceCode:completed', sessionId);

  return true;
}

/**
 * Mark device code session as failed
 */
export function failDeviceCode(sessionId: string, error?: string): boolean {
  const session = activeSessions.get(sessionId);

  if (!session) {
    return false;
  }

  clearTimeout(session.timeout);
  activeSessions.delete(sessionId);

  session.resolve(false);
  deviceCodeEvents.emit('deviceCode:failed', { sessionId, error });

  return true;
}

/**
 * Get active device code prompt
 */
export function getActiveDeviceCode(sessionId: string): DeviceCodePrompt | null {
  const session = activeSessions.get(sessionId);
  return session ? session.prompt : null;
}

/**
 * Check if there's an active device code session
 */
export function hasActiveDeviceCode(sessionId: string): boolean {
  return activeSessions.has(sessionId);
}

/**
 * Get all active device code sessions (for debugging/status)
 */
export function getAllActiveDeviceCodes(): DeviceCodePrompt[] {
  return Array.from(activeSessions.values()).map((s) => s.prompt);
}

export default {
  parseDeviceCode,
  parseVerificationUrl,
  registerDeviceCode,
  completeDeviceCode,
  failDeviceCode,
  getActiveDeviceCode,
  hasActiveDeviceCode,
  getAllActiveDeviceCodes,
  deviceCodeEvents,
};
