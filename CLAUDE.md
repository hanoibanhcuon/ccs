# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CCS (Claude Code Switch) is a lightweight CLI wrapper enabling instant profile switching between Claude Sonnet 4.5 and GLM 4.6 models. The tool delegates to the official Claude CLI via the `--settings` flag, supporting both Unix-like systems (bash) and Windows (PowerShell).

**Primary Installation Methods** (highest priority):
- macOS/Linux: `curl -fsSL ccs.kaitran.ca/install | bash`
- Windows: `irm ccs.kaitran.ca/install | iex`

## Core Design Principles

**YAGNI** (You Aren't Gonna Need It): No features "just in case"
**KISS** (Keep It Simple): Simple bash/PowerShell, no complexity
**DRY** (Don't Repeat Yourself): One source of truth (config.json)

The tool does ONE thing: map profile names to Claude settings files. Never add features that violate these principles.

## Key Constraints

1. **NO EMOJIS in terminal output** - Users of this `ccs` project may lack encoders by default. Try to find alternatives to illustrate signals
2. **Idempotent installations** - Running install scripts multiple times must be safe
3. **Non-invasive** - Never modify `~/.claude/settings.json`
4. **Cross-platform parity** - Identical behavior on Unix/Linux/macOS/Windows
5. **Edge case handling** - Handle all scenarios gracefully (see tests/edge-cases.sh)

## Architecture

```
User: ccs [profile] [claude-args]
  ↓
Read ~/.ccs/config.json
  ↓
Lookup profile → settings file path
  ↓
Validate settings file exists
  ↓
exec claude --settings <path> [args]
```

**Key Files**:
- `ccs` (bash) / `ccs.ps1` (PowerShell): Main executable wrapper
- `installers/install.sh` / `installers/install.ps1`: Installation scripts
- `installers/uninstall.sh` / `installers/uninstall.ps1`: Removal scripts
- `VERSION`: Single source of truth for version (format: MAJOR.MINOR.PATCH)
- `.claude/`: Commands and skills for Claude Code integration

**Installation Creates**:
```
~/.ccs/
├── ccs                     # Main executable (or ccs.ps1 on Windows)
├── config.json             # Profile mappings
├── config.json.backup      # Single backup (overwrites on each install)
├── glm.settings.json       # GLM profile template
├── VERSION                 # Version file copy
├── uninstall.sh            # Uninstaller (or ccs-uninstall.ps1 on Windows)
└── .claude/                # Claude Code integration
    ├── commands/ccs.md
    └── skills/ccs-delegation/
```

## Development Commands

### Version Management
```bash
# Bump version (updates VERSION, install.sh, install.ps1)
./scripts/bump-version.sh [major|minor|patch]

# Get current version
cat VERSION
# or
./scripts/get-version.sh
```

### Testing
```bash
# Comprehensive edge case testing (Unix)
./tests/edge-cases.sh

# Comprehensive edge case testing (Windows)
./tests/edge-cases.ps1
```

### Local Development
```bash
# Test local installation from git repo
./installers/install.sh

# Test with local executable
./ccs --version
./ccs glm --help

# Clean test environment
rm -rf ~/.ccs
```

## Code Standards

### Bash (Unix Systems)
- Compatibility: bash 3.2+ (macOS default)
- Always quote variables: `"$VAR"` not `$VAR`
- Use `[[ ]]` for tests, not `[ ]`
- Use `#!/usr/bin/env bash` shebang
- Set `set -euo pipefail` for safety
- Dependencies: Only `jq` for JSON parsing

### PowerShell (Windows)
- Compatibility: PowerShell 5.1+
- Use `$ErrorActionPreference = "Stop"`
- Native JSON parsing via `ConvertFrom-Json` / `ConvertTo-Json`
- No external dependencies required

### Version Synchronization
When changing version, update ALL three locations:
1. `VERSION` file
2. `installers/install.sh` (CCS_VERSION variable)
3. `installers/install.ps1` ($CcsVersion variable)

Use `./scripts/bump-version.sh` to update all locations atomically.

## Critical Implementation Details

### Profile Detection Logic
The `ccs` wrapper uses smart detection:
- No args OR first arg starts with `-` → use default profile
- First arg doesn't start with `-` → treat as profile name
- Special flags handled BEFORE profile detection: `--version`, `-v`, `--help`, `-h`, `--install`

### Installation Modes
- **Git mode**: Running from cloned repository (symlinks executables)
- **Standalone mode**: Running via curl/irm (downloads from GitHub)

Detection: Check if `ccs` executable exists in script directory or parent.

### Idempotency Requirements
Install scripts must be safe to run multiple times:
- Check existing files before creating
- Use single backup file (no timestamps): `config.json.backup`
- Skip existing `.claude/` folder installation
- Handle both clean and existing installations

### Settings File Format
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your_api_key",
    "ANTHROPIC_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.6"
  }
}
```

All values must be strings (not booleans/objects) to prevent PowerShell crashes.

## Common Tasks

### Adding a New Feature
1. Verify it aligns with YAGNI/KISS/DRY principles
2. Implement for both bash and PowerShell
3. Test on all platforms (macOS, Linux, Windows)
4. Update tests in `tests/edge-cases.sh` and `tests/edge-cases.ps1`
5. Update relevant documentation in `docs/`

### Fixing Bugs
1. Add test case reproducing the bug
2. Fix in both bash and PowerShell versions
3. Verify fix doesn't break existing tests
4. Test on all supported platforms

### Releasing New Version
1. Run `./scripts/bump-version.sh [major|minor|patch]`
2. Review changes to VERSION, install.sh, install.ps1
3. Test installation from both git and standalone modes
4. Run full edge case test suite
5. Commit and tag: `git tag v<VERSION>`

## Testing Requirements

Before any PR, verify:
- [ ] Works on macOS (bash)
- [ ] Works on Linux (bash)
- [ ] Works on Windows (PowerShell)
- [ ] Works on Windows (Git Bash)
- [ ] Handles all edge cases in test suite
- [ ] Installation is idempotent
- [ ] No emojis in terminal output
- [ ] Version displayed correctly

## Integration with Claude Code

The `.claude/` folder contains:
- `/ccs` command: Meta-command for delegating tasks to different models
- `ccs-delegation` skill: Intelligent task delegation patterns

Install with: `ccs --install` (copies to `~/.claude/`)

## Error Handling Philosophy

- Validate early, fail fast with clear error messages
- Show available options when user makes mistake
- Suggest recovery steps (e.g., restore from backup)
- Never leave system in broken state
