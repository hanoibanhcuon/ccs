#!/usr/bin/env node
/**
 * CCS WebSearch Gemini Transformer Hook
 *
 * Intercepts Claude's WebSearch tool and executes search via Gemini CLI.
 * This is the ultimate solution for third-party providers that lack
 * native WebSearch (gemini, agy, codex, qwen profiles).
 *
 * Strategy: Execute-and-Deny Pattern
 *   1. Intercept WebSearch PreToolUse event
 *   2. Execute `gemini -p` with google_web_search tool
 *   3. Return deny with search results in permissionDecisionReason
 *   4. Claude receives results as feedback, continues conversation
 *
 * If Gemini CLI fails, falls back to MCP redirect.
 *
 * Usage:
 *   Configured in ~/.claude/settings.json:
 *   {
 *     "hooks": {
 *       "PreToolUse": [{
 *         "matcher": "WebSearch",
 *         "hooks": [{
 *           "type": "command",
 *           "command": "node ~/.ccs/hooks/websearch-gemini-transformer.cjs",
 *           "timeout": 60
 *         }]
 *       }]
 *     }
 *   }
 *
 * Environment variables:
 *   CCS_DEBUG=1           - Enable debug output
 *   CCS_WEBSEARCH_SKIP=1  - Skip this hook entirely (allow WebSearch)
 *   CCS_GEMINI_SKIP=1     - Skip Gemini CLI, use MCP fallback only
 *   CCS_GEMINI_TIMEOUT=55 - Gemini CLI timeout in seconds (default: 55)
 *
 * Exit codes:
 *   0 - Allow tool (pass-through) or deny with results
 *   2 - Block tool (deny with message)
 *
 * @module hooks/websearch-gemini-transformer
 */

const { spawnSync } = require('child_process');

// Minimum response length to consider valid (prevent false positives from error messages)
const MIN_VALID_RESPONSE_LENGTH = 20;

// Read input from stdin
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  processHook();
});

// Handle stdin not being available
process.stdin.on('error', () => {
  process.exit(0);
});

/**
 * Main hook processing logic
 */
function processHook() {
  try {
    // Skip if disabled
    if (process.env.CCS_WEBSEARCH_SKIP === '1') {
      process.exit(0);
    }

    const data = JSON.parse(input);

    // Only handle WebSearch tool
    if (data.tool_name !== 'WebSearch') {
      process.exit(0);
    }

    const query = data.tool_input?.query || '';

    if (!query) {
      // No query provided - allow native handling (will fail anyway)
      process.exit(0);
    }

    // Check if Gemini CLI is specifically disabled - skip straight to MCP
    if (process.env.CCS_GEMINI_SKIP === '1') {
      if (process.env.CCS_DEBUG) {
        console.error('[CCS Hook] Gemini CLI disabled, using MCP fallback');
      }
      outputMcpFallback(query, 'Gemini CLI disabled by configuration');
      return;
    }

    // Try Gemini CLI first
    const geminiResult = tryGeminiSearch(query);

    if (geminiResult.success) {
      // Success! Return results via deny with reason
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: formatGeminiResults(query, geminiResult.content),
        },
      };

      console.log(JSON.stringify(output));
      process.exit(0);
    }

    // Gemini failed - fall back to MCP redirect
    if (process.env.CCS_DEBUG) {
      console.error(`[CCS Hook] Gemini failed: ${geminiResult.error}, falling back to MCP`);
    }

    outputMcpFallback(query, geminiResult.error);
  } catch (err) {
    // Don't block on parse errors - allow tool to proceed
    if (process.env.CCS_DEBUG) {
      console.error('[CCS Hook] Parse error:', err.message);
    }
    process.exit(0);
  }
}

/**
 * Try to execute search via Gemini CLI
 *
 * @param {string} query - Search query
 * @returns {{ success: boolean, content?: string, error?: string }}
 */
function tryGeminiSearch(query) {
  try {
    // Get timeout from env or default to 55 seconds (under 60s hook timeout)
    const timeoutSec = parseInt(process.env.CCS_GEMINI_TIMEOUT || '55', 10);
    const timeoutMs = timeoutSec * 1000;

    // Build prompt for Gemini with explicit instruction to use web search
    const prompt = buildGeminiPrompt(query);

    if (process.env.CCS_DEBUG) {
      console.error(`[CCS Hook] Executing: gemini -p "${prompt.substring(0, 100)}..."`);
    }

    // Execute gemini CLI using spawnSync to avoid shell injection
    // Note: gemini CLI uses OAuth auth, no API key needed
    const spawnResult = spawnSync('gemini', ['-p', prompt], {
      encoding: 'utf8',
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 2, // 2MB buffer for large responses
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Handle spawn errors
    if (spawnResult.error) {
      throw spawnResult.error;
    }

    // Check for non-zero exit code
    if (spawnResult.status !== 0) {
      return {
        success: false,
        error: `Gemini CLI exited with code ${spawnResult.status}: ${(spawnResult.stderr || '').substring(0, 200)}`,
      };
    }

    const result = spawnResult.stdout || '';
    const trimmedResult = result.trim();

    // Check if result looks like an error or empty
    if (!trimmedResult || trimmedResult.length < MIN_VALID_RESPONSE_LENGTH) {
      return {
        success: false,
        error: 'Empty or too short response from Gemini',
      };
    }

    // Check for common error patterns
    const lowerResult = trimmedResult.toLowerCase();
    if (
      lowerResult.includes('error:') ||
      lowerResult.includes('failed to') ||
      lowerResult.includes('unable to') ||
      lowerResult.includes('authentication required')
    ) {
      return {
        success: false,
        error: `Gemini returned error: ${trimmedResult.substring(0, 100)}`,
      };
    }

    return {
      success: true,
      content: trimmedResult,
    };
  } catch (err) {
    // Handle different error types
    if (err.killed) {
      return {
        success: false,
        error: 'Gemini CLI timed out',
      };
    }

    if (err.code === 'ENOENT') {
      return {
        success: false,
        error: 'Gemini CLI not found (not installed or not in PATH)',
      };
    }

    // Check stderr for more details
    if (err.stderr) {
      return {
        success: false,
        error: `Gemini CLI error: ${err.stderr.substring(0, 200)}`,
      };
    }

    return {
      success: false,
      error: err.message || 'Unknown error executing Gemini CLI',
    };
  }
}

/**
 * Build the prompt for Gemini CLI
 * Instructs Gemini to use google_web_search tool for the query
 *
 * @param {string} query - Original search query
 * @returns {string} Formatted prompt
 */
function buildGeminiPrompt(query) {
  return [
    `Search the web for: ${query}`,
    '',
    'Instructions:',
    '1. Use the google_web_search tool to find current information',
    '2. Provide a comprehensive summary of the search results',
    '3. Include relevant URLs/sources when available',
    '4. Be concise but thorough',
    '5. Focus on factual, up-to-date information',
  ].join('\n');
}

/**
 * Format Gemini search results for Claude
 *
 * @param {string} query - Original query
 * @param {string} content - Gemini response content
 * @returns {string} Formatted message for Claude
 */
function formatGeminiResults(query, content) {
  return [
    '[WebSearch Results via Gemini]',
    '',
    `Query: "${query}"`,
    '',
    '---',
    '',
    content,
    '',
    '---',
    '',
    'Search completed successfully. You can use this information to answer the user\'s question.',
    'If you need more specific information, you can search again with a refined query.',
  ].join('\n');
}

/**
 * Get MCP fallback message when Gemini fails
 *
 * @param {string} query - Original query
 * @param {string} error - Error message from Gemini attempt
 * @returns {string} Message directing Claude to use MCP
 */
function getMcpFallbackMessage(query, error) {
  return [
    '[WebSearch Unavailable - Use MCP Fallback]',
    '',
    `Gemini CLI failed: ${error || 'Unknown error'}`,
    '',
    'The native WebSearch tool is not available with your current provider.',
    'Please use one of the following MCP tools instead:',
    '',
    '1. mcp__web-search-prime__webSearchPrime (requires z.ai subscription)',
    '2. mcp__brave-search__brave_web_search (if configured)',
    '3. mcp__tavily__search (if configured)',
    '',
    `Use the same query: "${query}"`,
    '',
    'Example:',
    '```',
    'mcp__web-search-prime__webSearchPrime',
    `search_query: "${query}"`,
    '```',
  ].join('\n');
}

/**
 * Output MCP fallback response and exit
 *
 * @param {string} query - Original query
 * @param {string} error - Error message
 */
function outputMcpFallback(query, error) {
  const output = {
    decision: 'block',
    reason: 'WebSearch unavailable - use MCP fallback',
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: getMcpFallbackMessage(query, error),
    },
  };

  console.log(JSON.stringify(output));
  process.exit(2);
}
