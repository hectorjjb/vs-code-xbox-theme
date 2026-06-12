# Changelog

All notable changes to the **Xbox Theme** will be documented in this file.

The format is based on [Keep a Changelog 1.1](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] — 2026-06-11

### Added

- **XBOX (Original 2001) theme** — a dark variant inspired by the matte-black original console and its translucent neon-green "jewel" logo (`#9bf00b`), completing the four-generation console set.
- **XBOX High Contrast Dark** and **XBOX High Contrast Light** themes — accessibility-focused variants with pure black/white backgrounds, contrast borders (`contrastBorder` / `contrastActiveBorder`), and an accessible green accent (`#2ecc40`, ~9.8:1 contrast both ways).
- Build pipeline now supports an `extends` field in `src/themes/*.json`, so derived variants are thin override files instead of full duplicates.
- Generated `name` fields on every `tokenColors` rule (derived from scope), so the shipped theme files are self-documenting.
- Theme labels now include console release years (e.g. **XBOX 360 (2005)**, **XBOX ONE (2013)**, **XBOX Series X (2020)**).

### Changed

- README now showcases all six themes with a full screenshot each, in console-generation order.
- Replaced the retired shields.io `visual-studio-marketplace` badges (version/installs/rating) with `vsmarketplacebadges.dev` equivalents, and added a GitHub stars badge.
- Slimmed the published `.vsix` by excluding screenshot images (only the extension icon ships).

### Fixed

- Color-key parity between the light and dark base themes.
- Accessibility: forced dark text on every green background (buttons, badges, picker selection, status bar, chat avatars, etc.) and fixed the fuzzy-match bold-highlight contrast on focused rows across all themes (now WCAG AA/AAA). Toned down the high-contrast lime from `#3ff23f` to `#2ecc40`.

## [0.6.3] — 2026-06-11

### Changed
- Updated the extension icon to the green Xbox sphere logo.

## [0.6.2] — 2026-06-10

### Changed
- Tuned terminal ANSI palette for XBOX ONE and XBOX Series X: `ansiGreen` now uses each variant's canonical Xbox green (Xbox green `#107c10` / controller lime `#7fc83a`), `ansiYellow` uses Xbox yellow (`#ffd800` / `#ffe34a`), and `ansiBrightBlue` upgraded to Xbox blue `#0078d4`. Affects generic terminal output (git, npm, ls --color); Copilot CLI emits truecolor and is unaffected.

## [0.6.1] — 2026-06-10

### Fixed
- README images now use absolute `raw.githubusercontent.com` URLs so they render on the VS Marketplace listing.

## [0.6.0] — 2026-06-10

### Added

- **XBOX Series X theme** — new dark variant celebrating the Xbox 25th Anniversary, inspired by the translucent OG Xbox green hardware (2001). Neutral warm grays with a soft controller-lime accent (`#7fc83a`), dark text on every lime surface, and Xbox-yellow (`#ffd800`) activity-bar badges. Built from the same `src/themes/` source pipeline as the other variants; selectable as **XBOX Series X** in the theme picker.
- `docs/xbox-console-generations.png` — console-generations reference image used in the README and as the long-term roadmap for the four-theme set (XBOX, XBOX 360, XBOX ONE, XBOX Series X).

### Changed

- Renamed contributed theme labels and underlying file artifacts to align with Xbox console generations. **Note**: file paths in `themes/` changed — users who selected the previous labels (`Xbox Dark`, `Xbox Light`) may need to reselect from the Color Theme picker after upgrading.
  - `Xbox Dark` → **XBOX ONE** (`themes/xbox-dark.color-theme.json` → `themes/xbox-one.color-theme.json`)
  - `Xbox Light` → **XBOX 360** (`themes/xbox-light.color-theme.json` → `themes/xbox-360.color-theme.json`)
  - new: **XBOX Series X** (`themes/xbox-series-x.color-theme.json`)
- Source files in `src/themes/` renamed to match: `dark.json` → `one.json`, `light.json` → `xbox360.json`, plus new `seriesX.json`. Palette variant keys in `src/palette.json` renamed correspondingly (`dark` → `one`, `light` → `xbox360`, new `seriesX`).
- Activity-bar badges across all three themes now use Xbox-yellow (`#ffd800`) with black text for maximum legibility.

### Planned

- **XBOX theme** — a fourth variant inspired by the original 2001 console to complete the four-generation set.

## [0.5.0] — 2026-06-10

### Added

#### Build pipeline & DX

- Single-source build pipeline: `src/palette.json` (named color roles per theme), `src/semantic.json` (shared `semanticTokenColors`), `src/themes/{dark,light}.json` (theme source using `$role` palette tokens).
- `scripts/build-themes.mjs` — resolves `$role` tokens against the per-theme palette and writes the committed `themes/*.color-theme.json` artifacts.
- `scripts/validate-themes.mjs` — zero-dep validator: strict `JSON.parse`, structural check, hex-color check, dark↔light color-key parity, no duplicate `tokenColors` scopes.
- npm scripts: `build`, `validate`, `test` (build + validate), `package`, `publish:vsce`, `publish:ovsx`; `prepublishOnly` runs `test`.
- GitHub Actions CI workflow (`.github/workflows/ci.yml`): build, validate, fail-on-drift between `src/` and committed `themes/`, dry-pack with `vsce`.
- Dependabot config (`.github/dependabot.yml`): weekly updates for npm + github-actions.
- `.gitignore` (was missing).

#### Color coverage

- Coverage for modern VS Code UI surfaces in both themes: command center, sticky scroll (editor + panel + sidebar + terminal), inlay hints, ghost text / inline suggestions, bracket pair guides, chat & inline chat, agents, inline edit, testing, terminal command decorations, profile badge, multi-diff editor, banner, merge editor, SCM graph, action bar, toolbar, comments view, ports, welcome page, editor watermark, debug view, keybinding table, tree table, notebook expansions, settings editor.
- `semanticHighlighting: true` + baseline `semanticTokenColors` block mapped to the Xbox palette.
- 63 additional color keys for previously-uncovered VS Code surfaces: `radio.*`, `notebook.{editorBackground,cellBorderColor,focusedEditorBorder}`, `debugConsole.{error,info,warning,source}Foreground`, `keybindingLabel.*`, `activityBarTop.*`, `extensionButton.*`, `welcomePage.{button,tileShadow}*`, `activityErrorBadge.*`, `activityWarningBadge.*`, `panelTitleBadge.*`, `diffEditorGutter.*`, `diffEditorOverview.*`, `statusBarItem.remoteHover*`, `tab.{hover,unfocusedHover}Foreground`, etc.
- Restored light theme parity for `charts.*` and most TextMate scopes previously only in dark.

#### Tier 1 brand experiment — Xbox green markers

- `focusBorder`, `sash.hoverBorder` → `$greenNeon` (#9bf00b) on dark — focus rings now pop instead of blending in.
- `panelTitle.activeBorder` → `$green`, `panelTitle.activeForeground` → `$greenNeon` — active panel tab marker.
- `textLink.activeForeground`, `editorLink.activeForeground` → `$greenNeon` — link hover treatment.
- `list.focusOutline` set explicitly to remove fallback ambiguity (unified single-color focused-row border).
- `titleBar.activeForeground` brightened to `$fg` on dark (was `$fgDim`).

### Changed

- Bumped `engines.vscode` from `^1.44.0` to `^1.90.0`.
- Removed duplicate TextMate scope rules in both theme files.
- Filled-in partial color groups: `statusBarItem.*`, `diffEditor.unchangedRegion*`, `menu.*`, `tab.selected*`, `quickInput.*`, `editorGroup.dropInto*`, `editorBracketHighlight.unexpectedBracket.foreground`.
- All hex values in built themes are now normalized to lowercase (cosmetic only — semantically identical).

### Fixed

- `entity.other.attribute-name` was `#FFFFFF77` (47% alpha white, barely legible). Now `$blue #66d9ef italic`, matching the cyan-italic family used for `storage.type` / `support.type`. HTML/JSX/CSS attribute names are readable again.
- `badge.background` was `#ffffff3d` (24% alpha white, unpredictable contrast). Now `$bgAlt #3b3c35` (solid neutral).
- `tab.selectedBorderTop` was `$green` (drew a darker green strip on top of every active tab, fighting the `$greenNeon` bottom underline). Now `$transparent` — active tab is marked only by the neon underline.
- `list.dropBetweenBackground` was `$green` (drew a darker line between Explorer rows that visually competed with the focus outline). Now `$greenNeon` for consistency.

### Removed

- Dead `themes/palette.css` file (superseded by `src/palette.json`).

## [0.4.0] — 2026-06-10

### Added

- Registered **Xbox Light** in the extension manifest so it is selectable from the Color Theme picker.
- Marketplace metadata: `galleryBanner` (Xbox green), badges, `qna`, `sponsor`, `extensionKind`, expanded `keywords`.
- `.vscodeignore` so dev-only files are excluded from the published `.vsix`.
- Modern README with badges, install instructions, dark + light screenshots, recommended settings, and palette table.
- Changelog adopts the Keep a Changelog format.

### Changed

- Bumped `engines.vscode` from `^1.44.0` to `^1.74.0` (covers >99% of installed VS Code).
- Renamed contributed labels: `Xbox Dark Theme` → `Xbox Dark`, added `Xbox Light`.
- Moved `xbox_one.png` into `images/` and updated the `icon` path.
- Updated `description` to mention both dark and light themes.

### Fixed

- Removed trailing comma at the end of the `colors` block in `themes/xbox-dark.color-theme.json` (would have broken strict `JSON.parse`).
- Removed inaccurate "coming soon" line for the light theme in the README (it has existed for a long time).

## [0.3.8] — 2022-09-06

### Added

- Chart colors for the dark theme (`charts.*`).

### Fixed

- Editor theme additions.

[Unreleased]: https://github.com/hectorjjb/vs-code-xbox-theme/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/hectorjjb/vs-code-xbox-theme/compare/v0.3.8...v0.4.0
[0.3.8]: https://github.com/hectorjjb/vs-code-xbox-theme/releases/tag/v0.3.8
