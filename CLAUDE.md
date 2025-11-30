# CLAUDE.md

AI-facing guidance for Claude Code when working with this repository.

## Core Function

CLI wrapper for instant switching between multiple Claude accounts and alternative models (GLM, GLMT, Kimi). See README.md for user documentation.

## Design Principles (ENFORCE STRICTLY)

- **YAGNI**: No features "just in case"
- **KISS**: Simple bash/PowerShell/Node.js only
- **DRY**: One source of truth (config.json)
- **CLI-First**: All features must have CLI interface

## TypeScript Quality Gates

**The npm package is 100% TypeScript. Quality gates MUST pass before publish.**

**Package Manager: bun** - 10-25x faster than npm
```bash
bun install          # Install dependencies (creates bun.lockb)
bun run build        # Compile src/ → dist/
bun run validate     # Full validation: typecheck + lint:fix + format:check + test
```

**Fix issues before committing:**
```bash
bun run lint:fix     # Auto-fix lint issues
bun run format       # Auto-fix formatting
```

**Automatic enforcement:**
- `prepublishOnly` / `prepack` runs `validate` + `sync-version.js`
- CI/CD runs `bun run validate` on every PR

**File structure:**
- `src/` - TypeScript source (55 modules)
- `dist/` - Compiled JavaScript (npm package)
- `lib/` - Native shell scripts (bash, PowerShell)

**Linting rules (eslint.config.mjs) - ALL errors:**
- `@typescript-eslint/no-unused-vars` - error (ignore `_` prefix)
- `@typescript-eslint/no-explicit-any` - error
- `@typescript-eslint/no-non-null-assertion` - error
- `prefer-const`, `no-var`, `eqeqeq` - error

**Type safety (tsconfig.json):**
- `strict: true` with all strict flags enabled
- `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` - enabled
- Avoid `any` types - use proper typing or `unknown`
- Avoid `@ts-ignore` - fix the type error properly

## Critical Constraints (NEVER VIOLATE)

1. **NO EMOJIS** - ASCII only: [OK], [!], [X], [i]
2. **TTY-aware colors** - Respect NO_COLOR env var
3. **Non-invasive** - NEVER modify `~/.claude/settings.json`
4. **Cross-platform parity** - bash/PowerShell/Node.js must behave identically
5. **CLI documentation** - ALL changes MUST update `--help` in src/ccs.ts, lib/ccs, lib/ccs.ps1
6. **Idempotent** - All install operations safe to run multiple times

## Key Technical Details

### Profile Mechanisms (Priority Order)

1. **CLIProxy hardcoded**: gemini, codex, agy → OAuth-based, zero config
2. **CLIProxy variants**: `config.cliproxy` section → user-defined providers
3. **Settings-based**: `config.profiles` section → GLM, GLMT, Kimi
4. **Account-based**: `profiles.json` → isolated instances via `CLAUDE_CONFIG_DIR`

### Settings Format (CRITICAL)

All env values MUST be strings (not booleans/objects) to prevent PowerShell crashes.

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.example.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your-api-key",
    "ANTHROPIC_MODEL": "model-name"
  }
}
```

### Shared Data Architecture

Symlinked from `~/.ccs/shared/`: commands/, skills/, agents/
Profile-specific: settings.json, sessions/, todolists/, logs/
Windows fallback: Copies if symlinks unavailable

## Code Standards (REQUIRED)

### Architecture
- `lib/ccs`, `lib/ccs.ps1` - Bootstrap scripts (delegate to Node.js via npx)
- `src/*.ts` → `dist/*.js` - Main implementation (TypeScript)

### Bash (lib/*.sh)
- bash 3.2+, `set -euo pipefail`, quote all vars `"$VAR"`, `[[ ]]` tests
- NO external dependencies

### PowerShell (lib/*.ps1)
- PowerShell 5.1+, `$ErrorActionPreference = "Stop"`
- Native JSON only, no external dependencies

### TypeScript (src/*.ts)
- Node.js 14+, Bun 1.0+, TypeScript 5.3, strict mode
- `child_process.spawn`, handle SIGINT/SIGTERM
- Run `bun run validate` before committing

### Terminal Output (ENFORCE)
- ASCII only: [OK], [!], [X], [i] (NO emojis)
- TTY detect before colors, respect NO_COLOR
- Box borders for errors: ╔═╗║╚╝

## Development Workflows

### Testing (REQUIRED before PR)
```bash
bun run test              # All tests
bun run test:npm          # npm package tests
bun run test:native       # Native install tests
bun run test:unit         # Unit tests
```

### Version Management
```bash
./scripts/bump-version.sh [major|minor|patch]  # Updates VERSION, sync-version.js
```

### Local Development
```bash
./scripts/dev-install.sh       # Build, pack, install globally
rm -rf ~/.ccs                  # Clean environment
```

## Development Tasks (FOLLOW STRICTLY)

### New Feature Checklist
1. Verify YAGNI/KISS/DRY alignment - reject if doesn't align
2. Implement in TypeScript (`src/*.ts`)
3. **REQUIRED**: Update `--help` in src/ccs.ts, lib/ccs, lib/ccs.ps1
4. Add unit tests (`tests/unit/**/*.test.js`)
5. Run `bun run validate`
6. Update README.md if user-facing

### Bug Fix Checklist
1. Add regression test first
2. Fix in TypeScript (or native scripts if bootstrap-related)
3. Run `bun run validate`

## Pre-PR Checklist (MANDATORY)

- [ ] `bun run validate` passes (typecheck + lint:fix + format:check + tests)
- [ ] `--help` updated and consistent across src/ccs.ts, lib/ccs, lib/ccs.ps1
- [ ] ASCII only (NO emojis), NO_COLOR respected
- [ ] Idempotent install, concurrent sessions work, instance isolation maintained

## Error Handling Principles

- Validate early, fail fast with clear messages
- Show available options on mistakes
- Never leave broken state
