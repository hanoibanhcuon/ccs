/**
 * Copilot Module Index
 *
 * Central exports for GitHub Copilot integration via copilot-api.
 */

// Types
export * from './types';

// Auth
export {
  isCopilotApiInstalled,
  checkAuthStatus,
  startAuthFlow,
  getCopilotDebugInfo,
} from './copilot-auth';

// Daemon
export { isDaemonRunning, getDaemonStatus, startDaemon, stopDaemon } from './copilot-daemon';

// Models
export {
  DEFAULT_COPILOT_MODELS,
  fetchModelsFromDaemon,
  getAvailableModels,
  getDefaultModel,
} from './copilot-models';

// Executor
export { getCopilotStatus, generateCopilotEnv, executeCopilotProfile } from './copilot-executor';
