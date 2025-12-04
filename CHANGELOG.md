## [5.4.4-dev.1](https://github.com/kaitranntt/ccs/compare/v5.4.3...v5.4.4-dev.1) (2025-12-04)


### Bug Fixes

* **tests:** migrate test suite from mocha to bun test runner ([bd46c8d](https://github.com/kaitranntt/ccs/commit/bd46c8de1237e3a76c774b00a1c9e026f4c0cd4b))

## [5.4.3-dev.1](https://github.com/kaitranntt/ccs/compare/v5.4.3...v5.4.3-dev.1) (2025-12-04)


### Bug Fixes

* **tests:** migrate test suite from mocha to bun test runner ([bd46c8d](https://github.com/kaitranntt/ccs/commit/bd46c8de1237e3a76c774b00a1c9e026f4c0cd4b))

## [5.4.3](https://github.com/kaitranntt/ccs/compare/v5.4.2...v5.4.3) (2025-12-03)


### Bug Fixes

* **postinstall:** handle broken symlinks during npm install ([81add5a](https://github.com/kaitranntt/ccs/commit/81add5a05eeb8297ceef840071f11b6a194df707))

## [5.4.2](https://github.com/kaitranntt/ccs/compare/v5.4.1...v5.4.2) (2025-12-03)


### Bug Fixes

* **merge:** resolve conflicts between dev and main ([8347ea6](https://github.com/kaitranntt/ccs/commit/8347ea64c6b919a79f5ab63c398b6c36f012ca2d))
* **sync:** implement copy fallback for windows when symlinks unavailable ([6b3f93a](https://github.com/kaitranntt/ccs/commit/6b3f93a80a0232e8c964d73e51aa0afb0768b00f)), closes [#45](https://github.com/kaitranntt/ccs/issues/45)

## [5.4.1](https://github.com/kaitranntt/ccs/compare/v5.4.0...v5.4.1) (2025-12-03)


### Bug Fixes

* **cliproxy:** resolve windows auth browser not opening ([af4d6cf](https://github.com/kaitranntt/ccs/commit/af4d6cff89395a74e2eaf56551d3f56b95e0a6ce)), closes [#42](https://github.com/kaitranntt/ccs/issues/42)
* **doctor:** resolve windows claude cli detection failure ([cfe9ba0](https://github.com/kaitranntt/ccs/commit/cfe9ba05a4351302fbb330ca00b6025cb65a8f20)), closes [#41](https://github.com/kaitranntt/ccs/issues/41)
* **sync:** implement copy fallback for windows when symlinks unavailable ([6b3f93a](https://github.com/kaitranntt/ccs/commit/6b3f93a80a0232e8c964d73e51aa0afb0768b00f)), closes [#45](https://github.com/kaitranntt/ccs/issues/45)

# [5.4.0](https://github.com/kaitranntt/ccs/compare/v5.3.0...v5.4.0) (2025-12-02)


### Bug Fixes

* **auth:** prevent default profile from using stale glm env vars ([13d13da](https://github.com/kaitranntt/ccs/commit/13d13dab516332bc17345dc77afd44ae48bdd2aa)), closes [#37](https://github.com/kaitranntt/ccs/issues/37)
* **cliproxy:** convert windows backslashes to forward slashes in config.yaml auth-dir ([a6663cb](https://github.com/kaitranntt/ccs/commit/a6663cbd0471d1a08e8bbcdea897760b434ae937)), closes [#36](https://github.com/kaitranntt/ccs/issues/36)
* **cliproxy:** improve qwen oauth error handling ([7e0b0fe](https://github.com/kaitranntt/ccs/commit/7e0b0feca8ce2ed5d505c5bf6c84e54c6df8839e)), closes [#29](https://github.com/kaitranntt/ccs/issues/29)
* **cliproxy:** use double-dash flags for cliproxyapi auth ([#24](https://github.com/kaitranntt/ccs/issues/24)) ([4c81f28](https://github.com/kaitranntt/ccs/commit/4c81f28f0b67ef92cf74d0f5c13a5943ff0a7f00))
* **deps:** add chalk, boxen, gradient-string, listr2 as dependencies ([a214749](https://github.com/kaitranntt/ccs/commit/a214749725cfe05612e2c84cefa2ab3f619c6a2e))
* **glmt:** handle 401 errors and headers-already-sent exception ([#30](https://github.com/kaitranntt/ccs/issues/30)) ([c953382](https://github.com/kaitranntt/ccs/commit/c95338232a37981b95b785b47185ce18d6d94b7a)), closes [#26](https://github.com/kaitranntt/ccs/issues/26)
* **prompt:** improve password input handling with raw mode and buffer support ([bc56d2e](https://github.com/kaitranntt/ccs/commit/bc56d2e135532b2ae443144dd42217b26bcba951))


### Features

* **cliproxy:** add qwen code oauth provider support ([#31](https://github.com/kaitranntt/ccs/issues/31)) ([a3f1e52](https://github.com/kaitranntt/ccs/commit/a3f1e52ac68600ba0806d67aacceb6477ffa3543)), closes [#29](https://github.com/kaitranntt/ccs/issues/29)
* **cliproxy:** auto-update cliproxyapi to latest release on startup ([8873ccd](https://github.com/kaitranntt/ccs/commit/8873ccd981679e8acff8965accdc22215c6e4aa2))
* **profile:** add profile command with configuration display ([53d7a15](https://github.com/kaitranntt/ccs/commit/53d7a15c047e760723e051dc0f7be3c0dd42d087))
* **shell-completion:** add --force flag and fix zsh profile coloring ([7faed1d](https://github.com/kaitranntt/ccs/commit/7faed1d84ba29ba02bf687bae5b3458617512e67))
* **ui:** add central ui abstraction layer for cli styling ([6e49e0e](https://github.com/kaitranntt/ccs/commit/6e49e0e7e157abd4a38c98553dbe3c16473b57d9))
* **ui:** enhance auth commands with new ui layer ([6f42a65](https://github.com/kaitranntt/ccs/commit/6f42a6527b1bf02cbf29ec23525c9f27af6f0c98))
* **ui:** enhance delegation with listr2 task lists and styled output ([716193a](https://github.com/kaitranntt/ccs/commit/716193a682a1504767c7f32409a0de51278242eb))
* **ui:** enhance doctor and error manager with new ui layer ([57016f3](https://github.com/kaitranntt/ccs/commit/57016f3f765f207915161514e1827b18c0b03d5c))
* **ui:** enhance help and profile commands with new ui layer ([f3ed359](https://github.com/kaitranntt/ccs/commit/f3ed359050ce66d96c0109cf60c242bfd092114d))
* **ui:** enhance section headers with gradient and rename profile to api ([073a5e1](https://github.com/kaitranntt/ccs/commit/073a5e15ee8f895d7485864526d8946b774bb728))

# [5.3.0](https://github.com/kaitranntt/ccs/compare/v5.2.1...v5.3.0) (2025-12-01)


### Features

* **profile,shell-completion,prompt:** add profile commands and improve input handling ([#34](https://github.com/kaitranntt/ccs/issues/34)) ([7ec8cc8](https://github.com/kaitranntt/ccs/commit/7ec8cc83690a595bba9bb5f62fb3b9fa6b6a2f8f)), closes [#24](https://github.com/kaitranntt/ccs/issues/24) [#30](https://github.com/kaitranntt/ccs/issues/30) [#26](https://github.com/kaitranntt/ccs/issues/26) [#31](https://github.com/kaitranntt/ccs/issues/31) [#29](https://github.com/kaitranntt/ccs/issues/29) [#29](https://github.com/kaitranntt/ccs/issues/29)

## [5.2.1](https://github.com/kaitranntt/ccs/compare/v5.2.0...v5.2.1) (2025-12-01)


### Bug Fixes

* **cliproxy:** improve qwen oauth error handling ([#33](https://github.com/kaitranntt/ccs/issues/33)) ([1c3374f](https://github.com/kaitranntt/ccs/commit/1c3374f6a7e4440e299d49b58808c6454b4547c2)), closes [#29](https://github.com/kaitranntt/ccs/issues/29)

# [5.2.0](https://github.com/kaitranntt/ccs/compare/v5.1.1...v5.2.0) (2025-12-01)


### Features

* **release:** trigger v5.2.0 release ([7b65374](https://github.com/kaitranntt/ccs/commit/7b65374100196562a4f83705c8626fc7e6bb35d6))

## [5.1.1](https://github.com/kaitranntt/ccs/compare/v5.1.0...v5.1.1) (2025-12-01)


### Bug Fixes

* **cliproxy:** use double-dash flags for cliproxyapi auth ([9489884](https://github.com/kaitranntt/ccs/commit/94898848ea4533dcfc142e1b6c9bf939ba655537))

# [5.1.0](https://github.com/kaitranntt/ccs/compare/v5.0.2...v5.1.0) (2025-12-01)


### Bug Fixes

* **ci:** use pat token to bypass branch protection ([04af7e7](https://github.com/kaitranntt/ccs/commit/04af7e7c09edbc4207f332e7a613d92df1f2fea1))


### Features

* **release:** implement semantic versioning automation with conventional commits ([d3d9637](https://github.com/kaitranntt/ccs/commit/d3d96371def7b5b44d6133ad50d86c934cdf1ad4))

# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/)

## [5.0.0] - 2025-11-28

### Added
- **CLIProxy OAuth Profiles**: Three new zero-config profiles powered by CLIProxyAPI
  - `ccs gemini` - Google Gemini via OAuth (zero config)
  - `ccs codex` - OpenAI Codex via OAuth (zero config)
  - `ccs agy` - Antigravity (AGY) via OAuth (zero config)

- **Download-on-Demand Binary**: CLIProxyAPI binary (~15MB) downloads automatically on first use
  - Supports 6 platforms: darwin/linux/windows × amd64/arm64
  - SHA256 checksum verification
  - 3x retry with exponential backoff
  - No npm package size impact

- **OAuth Authentication System** (`src/cliproxy/auth-handler.ts`):
  - Browser-based OAuth flow with automatic token storage
  - Headless mode fallback (`ccs gemini --auth --headless`)
  - Token storage in `~/.ccs/cliproxy-auth/<provider>/`
  - 2-minute OAuth timeout protection

- **CLIProxy Diagnostics** in `ccs doctor`:
  - Binary installation status + version
  - Config file validation
  - OAuth status per provider (gemini/codex/agy)
  - Port 8317 availability check

- **Enhanced Error Messages** (`src/utils/error-manager.ts`):
  - OAuth timeout troubleshooting
  - Port conflict resolution
  - Binary download failure with manual URL

- **New CLIProxy Module** (`src/cliproxy/`):
  - `binary-manager.ts` - Download, verify, extract binary
  - `platform-detector.ts` - OS/arch detection for 6 platforms
  - `cliproxy-executor.ts` - Spawn/kill proxy pattern
  - `config-generator.ts` - Generate config.yaml per provider
  - `auth-handler.ts` - OAuth token management
  - `types.ts` - TypeScript type definitions
  - `index.ts` - Central exports

### Changed
- **Profile Detection**: New priority order
  1. CLIProxy profiles (gemini, codex, agy)
  2. Settings-based profiles (glm, glmt, kimi)
  3. Account-based profiles (work, personal)
  4. Default Claude CLI
- **Help Text**: Updated with new OAuth profiles (alphabetically sorted)
- **Profile Detector**: Added `cliproxy` profile type

### Technical Details
- **Binary Version**: CLIProxyAPI v6.5.27
- **Default Port**: 8317 (TCP polling for readiness, no PROXY_READY signal)
- **Model Mappings**:
  - Gemini: gemini-2.0-flash (opus: thinking-exp, haiku: flash-lite)
  - Codex: gpt-4o (opus: o1, haiku: gpt-4o-mini)
  - Antigravity: agy (sonnet: agy-pro, haiku: agy-turbo)
- **Storage**:
  - Binary: `~/.ccs/bin/cliproxyapi`
  - Tokens: `~/.ccs/cliproxy-auth/<provider>/`
  - Config: `~/.ccs/cliproxy.config.yaml`

### Migration
- **No breaking changes**: All existing profiles (glm, glmt, kimi, accounts) work unchanged
- **Zero configuration**: OAuth profiles work out-of-box after browser login
- **Backward compatible**: v4.x commands and workflows unchanged

---

## [4.5.0] - 2025-11-27 (Phase 02 Complete)

### Changed
- **Modular Command Architecture**: Complete refactoring of command handling system
  - Main entry point (src/ccs.ts) reduced from 1,071 to 593 lines (**44.6% reduction**)
  - 6 command handlers extracted to dedicated modules in `src/commands/`
  - Enhanced maintainability through single responsibility principle
  - Command handlers can now be developed and tested independently

### Added
- **Modular Command Handlers** (`src/commands/`):
  - `version-command.ts` (3.0KB) - Version display functionality
  - `help-command.ts` (4.9KB) - Comprehensive help system
  - `install-command.ts` (957B) - Installation/uninstallation workflows
  - `doctor-command.ts` (415B) - System diagnostics
  - `sync-command.ts` (1.0KB) - Configuration synchronization
  - `shell-completion-command.ts` (2.1KB) - Shell completion management

- **New Utility Modules** (`src/utils/`):
  - `shell-executor.ts` (1.5KB) - Cross-platform shell command execution
  - `package-manager-detector.ts` (3.8KB) - Package manager detection (npm, yarn, pnpm, bun)

- **TypeScript Type System**:
  - `src/types/` directory with comprehensive type definitions
  - Standardized `CommandHandler` interface for all commands
  - 100% TypeScript coverage across all new modules

### Improved
- **Maintainability**: Each command now has focused, dedicated module
- **Testing Independence**: Command handlers can be unit tested in isolation
- **Development Workflow**: Multiple developers can work on different commands simultaneously
- **Code Navigation**: Developers can quickly locate specific command logic
- **Future Extension**: New commands can be added without modifying main orchestrator

### Technical Details
- **Zero Breaking Changes**: All existing functionality preserved
- **Performance**: No degradation, minor improvement due to smaller main file
- **Quality Gates**: All Phase 01 ESLint strictness rules maintained
- **Type Safety**: Comprehensive TypeScript coverage with zero `any` types
- **Interface Consistency**: All commands follow standardized `CommandHandler` interface
