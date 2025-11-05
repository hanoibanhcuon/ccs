#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { showError, colors } = require('./helpers');
const { detectClaudeCli, showClaudeNotFoundError } = require('./claude-detector');
const { getSettingsPath } = require('./config-manager');

// Version (sync with package.json)
const CCS_VERSION = require('../package.json').version;

// Helper: Get spawn options for claude execution
// On Windows, .cmd/.bat/.ps1 files need shell: true
function getSpawnOptions(claudePath) {
  const isWindows = process.platform === 'win32';
  const needsShell = isWindows && /\.(cmd|bat|ps1)$/i.test(claudePath);

  return {
    stdio: 'inherit',
    shell: needsShell,
    windowsHide: true  // Hide the console window on Windows
  };
}

// Helper: Escape arguments for shell execution to prevent security vulnerabilities
function escapeShellArg(arg) {
  if (process.platform !== 'win32') {
    // Unix-like systems: escape single quotes and wrap in single quotes
    return "'" + arg.replace(/'/g, "'\"'\"'") + "'";
  } else {
    // Windows: escape double quotes and wrap in double quotes
    return '"' + arg.replace(/"/g, '""') + '"';
  }
}

// Special command handlers
function handleVersionCommand() {
  console.log(`CCS (Claude Code Switch) version ${CCS_VERSION}`);

  // Show install location
  const installLocation = process.argv[1];
  if (installLocation) {
    console.log(`Installed at: ${installLocation}`);
  }

  console.log('https://github.com/kaitranntt/ccs');
  process.exit(0);
}

function handleHelpCommand(remainingArgs) {
  const claudeCli = detectClaudeCli();

  // Check if claude was found
  if (!claudeCli) {
    showClaudeNotFoundError();
    process.exit(1);
  }

  // Execute claude --help
  const spawnOpts = getSpawnOptions(claudeCli);
  let claudeArgs, child;

  if (spawnOpts.shell) {
    // When shell is required, escape arguments properly
    claudeArgs = [claudeCli, '--help', ...remainingArgs].map(escapeShellArg).join(' ');
    child = spawn(claudeArgs, spawnOpts);
  } else {
    // When no shell needed, use arguments array directly
    claudeArgs = ['--help', ...remainingArgs];
    child = spawn(claudeCli, claudeArgs, spawnOpts);
  }

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code || 0);
    }
  });

  child.on('error', (err) => {
    showClaudeNotFoundError();
    process.exit(1);
  });
}

function handleInstallCommand() {
  // Implementation for --install (copy commands/skills to ~/.claude)
  console.log('[Installing CCS Commands and Skills]');
  console.log('Feature not yet implemented in Node.js standalone');
  console.log('Use traditional installer for now:');
  console.log(process.platform === 'win32'
    ? '  irm ccs.kaitran.ca/install | iex'
    : '  curl -fsSL ccs.kaitran.ca/install | bash');
  process.exit(0);
}

function handleUninstallCommand() {
  // Implementation for --uninstall (remove commands/skills from ~/.claude)
  console.log('[Uninstalling CCS Commands and Skills]');
  console.log('Feature not yet implemented in Node.js standalone');
  console.log('Use traditional uninstaller for now');
  process.exit(0);
}

// Smart profile detection
function detectProfile(args) {
  if (args.length === 0 || args[0].startsWith('-')) {
    // No args or first arg is a flag → use default profile
    return { profile: 'default', remainingArgs: args };
  } else {
    // First arg doesn't start with '-' → treat as profile name
    return { profile: args[0], remainingArgs: args.slice(1) };
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  // Special case: version command (check BEFORE profile detection)
  const firstArg = args[0];
  if (firstArg === 'version' || firstArg === '--version' || firstArg === '-v') {
    handleVersionCommand();
  }

  // Special case: help command
  if (firstArg === '--help' || firstArg === '-h' || firstArg === 'help') {
    const remainingArgs = args.slice(1);
    handleHelpCommand(remainingArgs);
    return;
  }

  // Special case: install command
  if (firstArg === '--install') {
    handleInstallCommand();
    return;
  }

  // Special case: uninstall command
  if (firstArg === '--uninstall') {
    handleUninstallCommand();
    return;
  }

  // Detect profile
  const { profile, remainingArgs } = detectProfile(args);

  // Special case: "default" profile just runs claude directly
  if (profile === 'default') {
    const claudeCli = detectClaudeCli();

    // Check if claude was found
    if (!claudeCli) {
      showClaudeNotFoundError();
      process.exit(1);
    }

    // Execute claude with args
    const spawnOpts = getSpawnOptions(claudeCli);
    let claudeArgs, child;

    if (spawnOpts.shell) {
      // When shell is required, escape arguments properly
      claudeArgs = [claudeCli, ...remainingArgs].map(escapeShellArg).join(' ');
      child = spawn(claudeArgs, spawnOpts);
    } else {
      // When no shell needed, use arguments array directly
      claudeArgs = remainingArgs;
      child = spawn(claudeCli, claudeArgs, spawnOpts);
    }

    child.on('exit', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
      } else {
        process.exit(code || 0);
      }
    });

    child.on('error', (err) => {
      showClaudeNotFoundError();
      process.exit(1);
    });

    return;
  }

  // Get settings path for profile
  const settingsPath = getSettingsPath(profile);

  // Detect Claude CLI
  const claudeCli = detectClaudeCli();

  // Check if claude was found
  if (!claudeCli) {
    showClaudeNotFoundError();
    process.exit(1);
  }

  // Execute claude with --settings
  const claudeArgsList = ['--settings', settingsPath, ...remainingArgs];
  const spawnOpts = getSpawnOptions(claudeCli);
  let claudeArgs, child;

  if (spawnOpts.shell) {
    // When shell is required, escape arguments properly
    claudeArgs = [claudeCli, ...claudeArgsList].map(escapeShellArg).join(' ');
    child = spawn(claudeArgs, spawnOpts);
  } else {
    // When no shell needed, use arguments array directly
    claudeArgs = claudeArgsList;
    child = spawn(claudeCli, claudeArgs, spawnOpts);
  }

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code || 0);
    }
  });

  child.on('error', (err) => {
    showClaudeNotFoundError();
    process.exit(1);
  });
}

// Run main
main();