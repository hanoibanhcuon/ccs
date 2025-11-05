'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { showError, expandPath, validateProfileName } = require('./helpers');

// Get config file path
function getConfigPath() {
  return process.env.CCS_CONFIG || path.join(os.homedir(), '.ccs', 'config.json');
}

// Read and parse config
function readConfig() {
  const configPath = getConfigPath();

  // Check config exists
  if (!fs.existsSync(configPath)) {
    const isWindows = process.platform === 'win32';
    showError(`Config file not found: ${configPath}

Solutions:
  1. Reinstall CCS (auto-creates config):
     npm install -g @kaitranntt/ccs --force

  2. Or use traditional installer:
     ${isWindows ? 'irm ccs.kaitran.ca/install | iex' : 'curl -fsSL ccs.kaitran.ca/install | bash'}

  3. Or create manually:
     mkdir -p ~/.ccs
     cat > ~/.ccs/config.json << 'EOF'
{
  "profiles": {
    "glm": "~/.ccs/glm.settings.json",
    "default": "~/.claude/settings.json"
  }
}
EOF

  Note: If you installed with npm --ignore-scripts, configs weren't created.
        Reinstall without that flag: npm install -g @kaitranntt/ccs --force`);
    process.exit(1);
  }

  // Read and parse JSON
  let config;
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configContent);
  } catch (e) {
    const isWindows = process.platform === 'win32';
    showError(`Invalid JSON in ${configPath}

Fix the JSON syntax or reinstall:
  ${isWindows ? 'irm ccs.kaitran.ca/install | iex' : 'curl -fsSL ccs.kaitran.ca/install | bash'}`);
    process.exit(1);
  }

  // Validate config has profiles object
  if (!config.profiles || typeof config.profiles !== 'object') {
    const isWindows = process.platform === 'win32';
    showError(`Config must have 'profiles' object

See config.example.json for correct format
Or reinstall:
  ${isWindows ? 'irm ccs.kaitran.ca/install | iex' : 'curl -fsSL ccs.kaitran.ca/install | bash'}`);
    process.exit(1);
  }

  return config;
}

// Get settings path for profile
function getSettingsPath(profile) {
  const config = readConfig();

  // Validate profile name
  if (!validateProfileName(profile)) {
    showError(`Invalid profile name: ${profile}

Use only alphanumeric characters, dash, or underscore.`);
    process.exit(1);
  }

  // Get settings path
  const settingsPath = config.profiles[profile];

  if (!settingsPath) {
    const availableProfiles = Object.keys(config.profiles).map(p => `  - ${p}`).join('\n');
    showError(`Profile '${profile}' not found in ${getConfigPath()}

Available profiles:
${availableProfiles}`);
    process.exit(1);
  }

  // Expand path
  const expandedPath = expandPath(settingsPath);

  // Validate settings file exists
  if (!fs.existsSync(expandedPath)) {
    const isWindows = process.platform === 'win32';
    showError(`Settings file not found: ${expandedPath}

Solutions:
  1. Create the settings file for profile '${profile}'
  2. Update the path in ${getConfigPath()}
  3. Or reinstall: ${isWindows ? 'irm ccs.kaitran.ca/install | iex' : 'curl -fsSL ccs.kaitran.ca/install | bash'}`);
    process.exit(1);
  }

  // Validate settings file is valid JSON
  try {
    const settingsContent = fs.readFileSync(expandedPath, 'utf8');
    JSON.parse(settingsContent);
  } catch (e) {
    showError(`Invalid JSON in ${expandedPath}

Details: ${e.message}

Solutions:
  1. Validate JSON at https://jsonlint.com
  2. Or reset to template: echo '{"env":{}}' > ${expandedPath}
  3. Or reinstall CCS`);
    process.exit(1);
  }

  return expandedPath;
}

module.exports = {
  getConfigPath,
  readConfig,
  getSettingsPath
};